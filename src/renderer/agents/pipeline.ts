/**
 * pipeline.ts — Manager Agent
 *
 * Orchestrates the full multi-agent pipeline:
 *   1. Design Agent       → global font, colors, theme
 *   2. Storyboard Agent   → scene blueprints (which scenes, which visual sections)
 *   3. Per-scene loop     → generates whole scene with animations.
 *   4. Verifier Agent     → single-pass syntax review + auto-patch
 *   5. Write to disk      → src/renderer/scenes/VideoComposition.tsx
 *
 * Public API: runTSXPipeline() — signature is IDENTICAL to before.
 * BasicGenerator and SaaSGenerator do not need any changes.
 */

import { callLLM, getStoredConfig, sanitizeCompositionCode } from "./llmClient";
import type {
  PipelineState,
  SceneBlueprint,
  SceneCode,
  DesignTokens,
  AgentConfig,
} from "./types";
import { detectSiteKeyFromPrompt, loadDesignSpec } from "./designSpecLoader";
import { runDesignAgent } from "./subagents/designAgent";
import {
  runStoryboardAgent,
  runStoryboardClientInterview,
} from "./subagents/storyboardAgent";
import { runSceneCreatorAgent } from "./subagents/sceneCreator";
import { runVerifierAgent, runRepairAgent } from "./subagents/verifierAgent";
import { runStaticChecks } from "./staticChecks";
import { ClientInterViewAnswers } from "./subagents/storyboardAgent";

export { sanitizeCompositionCode };

export interface resultProps {
  designTokens: DesignTokens;
  blueprints: SceneBlueprint[];
  sceneCodes: SceneCode[];
  assembled: string;
  finalCode: string;
}

export interface RepoStageApproval {
  confirmed: boolean;
  repoContext?: string;
}

export interface RunPipelineOptions {
  interviewAnswers?: ClientInterViewAnswers[];
  skipRepoGate?: boolean;
}

const REPO_CONTEXT_MAX_CHARS = 150_000;
const REPO_SCENE_CONTEXT_CHARS = 6_000;

const truncate = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[...context truncated to fit model window...]`;
};

let resumeResolver: ((data?: any) => void) | null = null;

export function approveCurrentStage(data?: any) {
  if (resumeResolver) {
    resumeResolver(data);
    resumeResolver = null;
  }
}

function waitForApproval(): Promise<any> {
  return new Promise((resolve) => {
    resumeResolver = resolve;
  });
}

// ─── Utility: strip import lines from agent output ────────────────────────────
export function stripAllImports(code: string): string {
  if (!code) return "";
  return code
    .replace(/^import\s+[\s\S]*?;/gm, "")
    .replace(/^import\s+.*?from\s+['"].*?['"];?/gm, "")
    .trim();
}

// ─── Assembler helpers ────────────────────────────────────────────────────────

/**
 * Builds the canonical import header for the assembled file.
 * Scenes are self-contained: only react + remotion are provided.
 */
function buildImportsHeader(): string {
  const lines: string[] = [
    `import React from 'react';`,
    `import { Series, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, AbsoluteFill } from 'remotion';`,
    `import type { CSSProperties } from 'react';`,
  ];
  return lines.join("\n");
}

/**
 * Builds the master VideoComposition component wrapping all scenes in Series.
 */
function buildMasterComposition(
  blueprints: SceneBlueprint[],
  sceneCodes: SceneCode[],
  designTokens: DesignTokens,
): string {
  const sequences = sceneCodes
    .map((sc, i) => {
      const sceneName = `Scene${i + 1}`;
      const duration = blueprints[i]?.durationInFrames ?? 150;
      return `        <Series.Sequence durationInFrames={${duration}}>\n          <${sceneName} />\n        </Series.Sequence>`;
    })
    .join("\n");

  return `export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) => {
  const bgColor = bgSelection?.color || '${designTokens.backgroundColor}';
  const bgType = bgSelection?.type || 'color';

  let backdropStyle: React.CSSProperties = { backgroundColor: bgColor };
  if (bgType === 'gradient' && bgSelection?.gradient) {
    backdropStyle = { background: bgSelection.gradient };
  } else if (bgType === 'image' && bgSelection?.imageUrl) {
    backdropStyle = { backgroundImage: \`url(\${bgSelection.imageUrl})\`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }

  return (
    <div className="w-full h-full text-white relative overflow-hidden">
      <div style={backdropStyle} className="absolute inset-0 pointer-events-none z-0" />
      <div className="relative z-10 w-full h-full">
        <Series>
${sequences}
        </Series>
      </div>
    </div>
  );
};

export default VideoComposition;`;
}

/**
 * Assembles all SceneCode objects into a single VideoComposition.tsx string.
 */
async function assembleVideoComposition(
  config: AgentConfig,
  blueprints: SceneBlueprint[],
  sceneCodes: SceneCode[],
  designTokens: DesignTokens,
): Promise<string> {
  const importsHeader = buildImportsHeader();

  const masterComposition = buildMasterComposition(
    blueprints,
    sceneCodes,
    designTokens,
  );

  return [
    "// AUTO-GENERATED by Kinetic Multi-Agent Pipeline — DO NOT EDIT MANUALLY",
    importsHeader,
    "",
    ...sceneCodes.map((sc) => sc.sceneCode),
    "",
    masterComposition,
  ].join("\n");
}

// ─── Scene Code Normalization ────────────────────────────────────────────────

function isValidSceneCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  return /export\s|<[A-Za-z]/.test(trimmed);
}

function normalizeSceneExportName(code: string, sceneName: string): string {
  const exportMatch = code.match(
    /export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/,
  );
  if (exportMatch) {
    const current = exportMatch[1];
    if (current === sceneName) return code;
    return code.replace(exportMatch[0], `export const ${sceneName}`);
  }
  const defaultMatch = code.match(/export\s+default\s+(?:function\s+)?([A-Za-z_$][\w$]*)?/);
  if (defaultMatch && defaultMatch[1]) {
    return code.replace(defaultMatch[0], `export const ${sceneName}`);
  }
  return `export const ${sceneName}: React.FC = () => (\n<>\n${code}\n</>\n);`;
}

function makePlaceholderScene(sceneName: string, purpose: string): string {
  const label = purpose.replace(/[<>`{}]/g, "").trim().slice(0, 60) || "Scene";
  return `export const ${sceneName}: React.FC = () => (
  <div style={{ width: '100%', height: '100%', backgroundColor: '#0b0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: 28 }}>{label}</div>
  </div>
);`;
}

// ─── Composition Validation ──────────────────────────────────────────────────

async function collectValidationIssues(code: string): Promise<{
  issues: string[];
  typecheckRan: boolean;
}> {
  const issues: string[] = [];
  let typecheckRan = false;

  try {
    for (const check of runStaticChecks(code)) {
      issues.push(
        `Static check${check.line ? ` (line ${check.line})` : ""}: ${check.message}`,
      );
    }
  } catch (err) {
    console.warn("[Manager] Static checks crashed:", err);
  }

  try {
    if (!window.electronAPI?.writeFile || !window.electronAPI?.verifyTypecheck) {
      console.warn("[Manager] electronAPI bridge missing — skipping compiler pass");
      return { issues, typecheckRan };
    }
    await window.electronAPI.writeFile(
      "src/renderer/scenes/VideoComposition.tsx",
      code,
    );
    const result = await window.electronAPI.verifyTypecheck();
    if (!result.ran) {
      console.warn("[Manager] TypeScript check could not run — skipping compiler errors");
      return { issues, typecheckRan };
    }
    typecheckRan = true;
    for (const err of result.errors) {
      issues.push(`TypeScript (line ${err.line}): ${err.message}`);
    }
  } catch (err) {
    console.warn("[Manager] Compiler pass crashed/skipped:", err);
  }

  return { issues, typecheckRan };
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
/**
 * runTSXPipeline — the Manager Agent.
 *
 * Public signature is IDENTICAL to the old pipeline — no changes needed
 * in BasicGenerator.tsx or SaaSGenerator.tsx.
 */
export async function runTSXPipeline(
  prompt: string,
  narration: string = "",
  onState: (state: PipelineState) => void,
  options: RunPipelineOptions = {},
): Promise<resultProps | null | ""> {
  const config = getStoredConfig();
  if (!config) {
    onState({
      status: "error",
      progress: 0,
      error: "No API key or provider configured in Settings.",
    });
    return "";
  }

  // ── Step 0: Repo Scan Gate (SaaS flow) ───────────────────────────────────
  let repoContext = "";
  if (!options.skipRepoGate) {
    onState({ status: "repoScan", progress: 0 });
    console.log("[Manager] Repo Scan stage — waiting for scan or skip...");
    const repoApproval: RepoStageApproval | undefined = await waitForApproval();
    if (repoApproval?.confirmed && repoApproval.repoContext) {
      repoContext = truncate(repoApproval.repoContext, REPO_CONTEXT_MAX_CHARS);
      console.log(
        `[Manager] Repo context approved (${repoContext.length} chars).`,
      );
    } else {
      console.log("[Manager] Repo scan skipped — continuing without context.");
    }
  }

  const enrichedPrompt = repoContext
    ? `${prompt}\n\n[Scanned Product Codebase Context]\n${repoContext}`
    : prompt;
  const sceneLevelContext = repoContext
    ? `\n\n[Scanned Codebase Context]\n${truncate(repoContext, REPO_SCENE_CONTEXT_CHARS)}`
    : "";

  // ── Step 1: Design Agent ──────────────────────────────────────────────────
  onState({ status: "designing", progress: repoContext ? 0.02 : 0.03 });
  console.log("[Manager] Design Agent starting...");

  let designTokens: DesignTokens;
  try {
    // Check if the prompt references a known brand (Stripe, Vercel, etc.)
    const siteKey = detectSiteKeyFromPrompt(prompt);
    let seedColors: Partial<DesignTokens> | undefined;

    if (siteKey) {
      console.log(
        ` [Manager] Detected brand: ${siteKey} — loading design spec...`,
      );
      const spec = await loadDesignSpec(siteKey);
      seedColors = {
        primaryColor: spec.colors.primary,
        backgroundColor: spec.colors.canvas,
        surfaceColor: spec.colors.surface1,
        textColor: spec.colors.textPrimary,
        accentColor: spec.colors.surface2,
      };
    }

    designTokens = await runDesignAgent(config, prompt, seedColors);
    console.log(" [Manager] Design tokens:", designTokens);
  } catch (err) {
    console.warn("[Manager] Design Agent threw, using defaults:", err);
    designTokens = {
      fontFamily: "Inter",
      primaryColor: "#6366f1",
      backgroundColor: "#09090b",
      accentColor: "#a78bfa",
      textColor: "#f4f4f5",
      surfaceColor: "#18181b",
      theme: "dark",
    };
  }

  await waitForApproval();

  // ── Step 2.1 : Interview ──────────────────────────
  console.log("[Manager] Conducting Interview");
  const { questions } = await runStoryboardClientInterview(config, prompt);
  onState({ status: "interviewing", progress: 0.2, questions });

  const approvedInterviewAnswers: ClientInterViewAnswers[] =
    (await waitForApproval()) || [];

  // ── Step 2: Storyboard Agent ──────────────────────────────────────────────
  console.log("[Manager] Storyboard Agent starting...");

  let blueprints: SceneBlueprint[];
  try {
    blueprints = await runStoryboardAgent(
      config,
      enrichedPrompt,
      approvedInterviewAnswers,
      designTokens,
    );
    onState({ status: "storyboarding", progress: 0.3, blueprints });
    console.log(`[Manager] Storyboard: ${blueprints.length} scenes planned`);
    blueprints.forEach((bp) =>
      console.log(
        `   Scene "${bp.id}": ${bp.componentList.join(", ")} (${bp.durationInFrames}f)`,
      ),
    );
  } catch (err) {
    console.warn("[Manager] Storyboard Agent threw, using defaults:", err);
    blueprints = [
      {
        id: "scene1",
        purpose: prompt,
        durationInFrames: 150,
        componentList: [],
      },
    ];
  }
  // ── Step 3: Per-scene Creator ─────────────────────────────────
  onState({ status: "sceneCreation", progress: 0.5 });
  console.log("[Manager] Creating scenes...");

  const scenePromise = blueprints.map(async (bp, i) => {
    const prompt = `${bp.purpose}\n It should be ${bp.durationInFrames} long in frames${sceneLevelContext}`;
    const result = await runSceneCreatorAgent(
      config,
      prompt,
      undefined,
      `Scene${i + 1}`,
    );
    const send: SceneCode = {
      blueprintId: bp.id,
      durationInFrames: bp.durationInFrames,
      sceneCode: result,
    };
    return send;
  });

  const rawSceneCodes: SceneCode[] = await Promise.all(scenePromise);

  if (!rawSceneCodes.some((sc) => isValidSceneCode(sc.sceneCode))) {
    console.error("[Manager] All scenes came back invalid/empty — aborting before assembly.");
    onState({
      status: "error",
      progress: 0.8,
      error:
        "The AI failed to produce valid scene code. Check your model/provider in Settings and try again.",
    });
    return "";
  }

  const sceneCodes: SceneCode[] = rawSceneCodes.map((sc, i) => {
    const sceneName = `Scene${i + 1}`;
    const code = isValidSceneCode(sc.sceneCode)
      ? normalizeSceneExportName(stripAllImports(sc.sceneCode), sceneName)
      : makePlaceholderScene(sceneName, blueprints[i]?.purpose || "");
    if (code !== sc.sceneCode) {
      console.warn(`[Manager] Normalized ${sceneName} (was ${sc.sceneCode.slice(0, 40)}...)`);
    }
    return { ...sc, sceneCode: code };
  });
  onState({ status: "sceneCreation", progress: 0.8, sceneCodes });

  // ── Step 4: Assembler ─────────────────────────────────────────────────────
  onState({ status: "assembling", progress: 0.85, sceneCodes });
  console.log("🔨 [Manager] Assembling VideoComposition.tsx...");

  const assembled = await assembleVideoComposition(
    config,
    blueprints,
    sceneCodes,
    designTokens,
  );

  let finalCode = assembled;

  // ── Step 5: Verify (static + TypeScript) → repair loop ───────────────────
  onState({ status: "verifying", progress: 0.9, assembled });
  try {
    let candidate = assembled;
    const firstPass = await collectValidationIssues(candidate);
    let issues = firstPass.issues;
    let typecheckRan = firstPass.typecheckRan;

    for (let round = 0; issues.length > 0 && round < 2; round++) {
      console.log(
        `[Manager] ${issues.length} validation issue(s) — repair round ${round + 1}/2...`,
      );
      const repaired = await runRepairAgent(config, candidate, issues);
      if (repaired === candidate) break;
      candidate = repaired;
      const next = await collectValidationIssues(candidate);
      issues = next.issues;
      typecheckRan = typecheckRan || next.typecheckRan;
    }

    if (typecheckRan && issues.some((i) => i.startsWith("TypeScript"))) {
      console.error(
        `[Manager] Composition still has compiler errors after repairs (${issues.length} issue(s)).`,
      );
      try {
        if (window.electronAPI?.writeFile) {
          await window.electronAPI.writeFile(
            "src/renderer/scenes/VideoComposition.tsx",
            candidate,
          );
        }
      } catch {
        // ignore secondary write failure — error state is what matters
      }
      onState({
        status: "error",
        progress: 1.0,
        error:
          "The AI outputted errored code. The video composition failed validation and could not be auto-repaired.",
      });
      return "";
    }

    finalCode = candidate;

    try {
      const polished = await runVerifierAgent(config, finalCode);
      finalCode = polished
        .replace(/^```[a-z]*\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
    } catch {
      console.warn("[Manager] LLM polish pass skipped.");
    }
  } catch (err) {
    console.warn("[Manager] Verification crashed, using assembled code as-is:", err);
    finalCode = assembled;
  }

  // ── Step 6: Write to disk ─────────────────────────────────────────────────
  try {
    if (window.electronAPI?.writeFile) {
      await window.electronAPI.writeFile(
        "src/renderer/scenes/VideoComposition.tsx",
        finalCode,
      );
      console.log("[Manager] VideoComposition.tsx written to disk.");
    }
  } catch (err) {
    console.error("[Manager] Failed writing VideoComposition.tsx:", err);
    onState({
      status: "error",
      progress: 1.0,
      error: "The AI outputted errored code — the video composition could not be saved.",
    });
    return "";
  }

  onState({
    status: "done",
    progress: 1.0,
    sceneCodes,
    assembled,
    finalCode,
  });
  console.log("[Manager] Pipeline complete!");
  const finalOutput: resultProps = {
    designTokens,
    blueprints,
    sceneCodes,
    assembled,
    finalCode,
  };
  return finalOutput;
}

export const runPipeline = runTSXPipeline;
