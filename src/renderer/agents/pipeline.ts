/**
 * pipeline.ts — Manager Agent
 *
 * Orchestrates the full multi-agent pipeline:
 *   1. Design Agent       → global font, colors, theme
 *   2. Storyboard Agent   → scene blueprints (which scenes, which primitives)
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
  SceneOutput,
  DesignTokens,
  AgentConfig,
} from "./types";
import { detectSiteKeyFromPrompt, loadDesignSpec } from "./designSpecLoader";
import {
  PRIMITIVE_SDK_MAP,
  TRANSITION_WRAPPER_NAMES,
} from "./primitiveRegistry";
import { runDesignAgent } from "./subagents/designAgent";
import {
  runStoryboardAgent,
  runStoryboardClientInterview,
} from "./subagents/storyboardAgent";
import { runSceneCreatorAgent } from "./subagents/sceneCreator";
import { runVerifierAgent } from "./subagents/verifierAgent";
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
 * Detects which primitive component names appear in a block of JSX code.
 * Used to figure out which SDK imports to add to the header.
 */
function detectUsedPrimitives(allAnimatedJSX: string): string[] {
  const used: string[] = [];
  for (const name of Object.keys(PRIMITIVE_SDK_MAP)) {
    // Look for <ComponentName or <ComponentName> or <ComponentName\n
    if (new RegExp(`<${name}[\\s/>]`).test(allAnimatedJSX)) {
      used.push(name);
    }
  }
  return used;
}

/**
 * Detects which TransitionSDK wrappers appear in the animated JSX.
 */
function detectUsedTransitions(allAnimatedJSX: string): string[] {
  return TRANSITION_WRAPPER_NAMES.filter((name) =>
    new RegExp(`<${name}[\\s/>]`).test(allAnimatedJSX),
  );
}

/**
 * Groups component names by their SDK, returning a map of SDK path → component names.
 */
function groupBySDK(componentNames: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const name of componentNames) {
    const sdk = PRIMITIVE_SDK_MAP[name];
    if (!sdk) continue;
    if (!map.has(sdk)) map.set(sdk, []);
    map.get(sdk)!.push(name);
  }
  return map;
}

/**
 * Builds the canonical import header for the assembled file.
 * Only imports what's actually used — no dead imports.
 */
function buildImportsHeader(
  usedPrimitives: string[],
  usedTransitions: string[],
): string {
  const lines: string[] = [
    `import React from 'react';`,
    `import { Series, useCurrentFrame } from 'remotion';`,
  ];

  // Group primitives by SDK
  const bySDK = groupBySDK(usedPrimitives);
  for (const [sdk, names] of bySDK.entries()) {
    const unique = [...new Set(names)].sort();
    lines.push(`import { ${unique.join(", ")} } from ${sdk};`);
  }

  // TransitionSDK import (if any wrappers were used)
  if (usedTransitions.length > 0) {
    const unique = [...new Set(usedTransitions)].sort();
    lines.push(
      `import { ${unique.join(", ")} } from '../primitives/TransitionSDK';`,
    );
  }

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
  const allAnimatedJSX = sceneCodes
    .map((scene) => {
      return `${scene.sceneCode}\n`;
    })
    .join(`\n`);

  const usedPrimitives = detectUsedPrimitives(allAnimatedJSX);
  const usedTransitions = detectUsedTransitions(allAnimatedJSX);

  const importsHeader = buildImportsHeader(usedPrimitives, usedTransitions);

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
      narration,
      approvedInterviewAnswers,
      designTokens,
      3,
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
        componentList: ["MockWindow"],
      },
    ];
  }
  // ── Step 3: Per-scene Creator ─────────────────────────────────
  onState({ status: "sceneCreation", progress: 0.5 });
  console.log("[Manager] Creating scenes...");

  const scenePromise = blueprints.map(async (bp) => {
    const prompt = `${bp.purpose}\n It should be ${bp.durationInFrames} long in frames${sceneLevelContext}`;
    const result = await runSceneCreatorAgent(
      config,
      bp.componentList,
      designTokens,
      prompt,
      undefined,
      bp.id,
    );
    const send: SceneCode = {
      blueprintId: bp.id,
      durationInFrames: bp.durationInFrames,
      sceneCode: result,
    };
    return send;
  });

  const sceneCodes: SceneCode[] = await Promise.all(scenePromise);
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

  // ── Step 5: Verifier Agent ────────────────────────────────────────────────
  onState({ status: "verifying", progress: 0.92, assembled, finalCode });
  try {
    finalCode = await runVerifierAgent(config, assembled);
  } catch (err) {
    console.warn("[Manager] Verifier threw, using assembled code as-is:", err);
    finalCode = assembled;
  }

  // ── Step 6: Write to disk ─────────────────────────────────────────────────
  if (window.electronAPI?.writeFile) {
    await window.electronAPI.writeFile(
      "src/renderer/scenes/VideoComposition.tsx",
      finalCode,
    );
    console.log("[Manager] VideoComposition.tsx written to disk.");
  }

  const sceneOutputs: SceneOutput[] = blueprints.map((bp) => {
    return {
      sceneId: bp.id,
      description: bp.purpose,
      duration: bp.durationInFrames,
      components: [],
      keyframes: [],
      narration: narration || "",
      captions: [],
    };
  });

  onState({
    status: "done",
    progress: 1.0,
    output: sceneOutputs,
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
