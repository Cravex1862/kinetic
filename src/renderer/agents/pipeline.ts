/**
 * pipeline.ts — Manager Agent
 *
 * Orchestrates the full multi-agent pipeline:
 *   1. Design Agent       → global font, colors, theme
 *   2. Storyboard Agent   → scene blueprints (which scenes, which primitives)
 *   3. Per-scene loop:
 *        Per-component loop (sequential):
 *          a. Component Creator Agent → raw JSX for one primitive
 *          b. Animator Agent         → animated JSX wrapping that primitive
 *   4. Assembler (pure TS) → stitches all scenes into VideoComposition.tsx
 *   5. Verifier Agent     → single-pass syntax review + auto-patch
 *   6. Write to disk      → src/renderer/scenes/VideoComposition.tsx
 *
 * Public API: runTSXPipeline() — signature is IDENTICAL to before.
 * BasicGenerator and SaaSGenerator do not need any changes.
 */

import { getStoredConfig, sanitizeCompositionCode } from './llmClient';
import type { PipelineState, SceneBlueprint, SceneCode, ComponentCode, DesignTokens, AgentConfig } from './types';
import { detectSiteKeyFromPrompt, loadDesignSpec } from './designSpecLoader';
import { PRIMITIVE_SDK_MAP, TRANSITION_WRAPPER_NAMES } from './primitiveRegistry';
import { runDesignAgent } from './subagents/designAgent';
import { runStoryboardAgent } from './subagents/storyboardAgent';
import { runComponentCreatorAgent } from './subagents/sceneCreator';
import { runAnimatorAgent } from './subagents/animatorAgent';
import { runVerifierAgent } from './subagents/verifierAgent';

export { sanitizeCompositionCode };

// ─── Utility: strip import lines from agent output ────────────────────────────
export function stripAllImports(code: string): string {
    if (!code) return '';
    return code
        .replace(/^import\s+[\s\S]*?;/gm, '')
        .replace(/^import\s+.*?from\s+['"].*?['"];?/gm, '')
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
    return TRANSITION_WRAPPER_NAMES.filter(name =>
        new RegExp(`<${name}[\\s/>]`).test(allAnimatedJSX)
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
    usedTransitions: string[]
): string {
    const lines: string[] = [
        `import React from 'react';`,
        `import { Series, useCurrentFrame } from 'remotion';`,
    ];

    // Group primitives by SDK
    const bySDK = groupBySDK(usedPrimitives);
    for (const [sdk, names] of bySDK.entries()) {
        const unique = [...new Set(names)].sort();
        lines.push(`import { ${unique.join(', ')} } from ${sdk};`);
    }

    // TransitionSDK import (if any wrappers were used)
    if (usedTransitions.length > 0) {
        const unique = [...new Set(usedTransitions)].sort();
        lines.push(`import { ${unique.join(', ')} } from '../primitives/TransitionSDK';`);
    }

    return lines.join('\n');
}

import { runLayoutAssemblerAgent } from './subagents/layoutAssemblerAgent';

/**
 * Builds a single named Scene component by calling runLayoutAssemblerAgent.
 */
async function buildSceneComponent(
    config: AgentConfig,
    sceneCode: SceneCode,
    blueprint: SceneBlueprint,
    sceneIndex: number,
    designTokens: DesignTokens
): Promise<string> {
    const sceneName = `Scene${sceneIndex + 1}`;

    // Call the AI Layout Assembler Subagent to arrange components into a layout tree
    let innerSceneTSX = await runLayoutAssemblerAgent(
        config,
        sceneCode.components,
        blueprint.purpose,
        designTokens
    );

    innerSceneTSX = stripAllImports(innerSceneTSX);

    return `const ${sceneName}: React.FC = () => {
  const primaryColor = '${designTokens.primaryColor}';
  const secondaryColor = '${designTokens.secondaryColor || '#a78bfa'}';
  const accentColor = '${designTokens.accentColor}';
  const semanticColor = '${designTokens.semanticColor || '#3b82f6'}';
  const errorColor = '${designTokens.errorColor || '#ef4444'}';
  const successColor = '${designTokens.successColor || '#22c55e'}';
  const neutralColor = '${designTokens.neutralColor || '#64748b'}';
  const surfaceColor = '${designTokens.surfaceColor}';
  const backgroundColor = '${designTokens.backgroundColor}';
  const textColor = '${designTokens.textColor}';
  const fontFamily = '${designTokens.fontFamily}, Inter, sans-serif';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: backgroundColor,
        fontFamily: fontFamily,
        overflow: 'hidden',
      }}
    >
${innerSceneTSX}
    </div>
  );
};`;
}

/**
 * Builds the master VideoComposition component wrapping all scenes in Series.
 */
function buildMasterComposition(
    blueprints: SceneBlueprint[],
    sceneCodes: SceneCode[],
    designTokens: DesignTokens
): string {
    const sequences = sceneCodes.map((sc, i) => {
        const sceneName = `Scene${i + 1}`;
        const duration = blueprints[i]?.durationInFrames ?? 150;
        return `        <Series.Sequence durationInFrames={${duration}}>\n          <${sceneName} />\n        </Series.Sequence>`;
    }).join('\n');

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
    designTokens: DesignTokens
): Promise<string> {
    const allAnimatedJSX = sceneCodes
        .flatMap(sc => sc.components.map(c => c.animatedJSX))
        .join('\n');

    const usedPrimitives = detectUsedPrimitives(allAnimatedJSX);
    const usedTransitions = detectUsedTransitions(allAnimatedJSX);

    const importsHeader = buildImportsHeader(usedPrimitives, usedTransitions);

    // Assemble each scene using runLayoutAssemblerAgent
    const sceneComponents: string[] = [];
    for (let i = 0; i < sceneCodes.length; i++) {
        const comp = await buildSceneComponent(config, sceneCodes[i], blueprints[i], i, designTokens);
        sceneComponents.push(comp);
    }

    const masterComposition = buildMasterComposition(blueprints, sceneCodes, designTokens);

    return [
        '// AUTO-GENERATED by Kinetic Multi-Agent Pipeline — DO NOT EDIT MANUALLY',
        importsHeader,
        '',
        ...sceneComponents,
        '',
        masterComposition,
    ].join('\n');
}

// ─── Progress Calculator ──────────────────────────────────────────────────────
/**
 * Calculates smooth progress values across the full pipeline.
 * Design (0.02–0.08) → Storyboard (0.08–0.15) → Components (0.15–0.80) → Assemble → Verify → Done
 */
function calcComponentProgress(
    sceneIdx: number,
    compIdx: number,
    totalScenes: number,
    totalComponents: number,
    phase: 'building' | 'animating'
): number {
    const COMPONENT_RANGE = 0.65; // 15% to 80%
    const COMPONENT_START = 0.15;

    const overallCompIdx = sceneIdx * 10 + compIdx; // rough ordering
    const baseProgress = COMPONENT_START + (overallCompIdx / Math.max(totalComponents, 1)) * COMPONENT_RANGE;
    const phaseOffset = phase === 'animating' ? (COMPONENT_RANGE / (totalComponents * 2)) : 0;
    return Math.min(0.80, baseProgress + phaseOffset);
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
    narration: string = '',
    onState: (state: PipelineState) => void,
    projectTitle?: string,
    savePath?: string | unknown,
    onCheckpoint?: unknown,
    resumeState?: unknown
): Promise<string> {
    const config = getStoredConfig();
    if (!config) {
        onState({ status: 'error', progress: 0, error: 'No API key or provider configured in Settings.' });
        return '';
    }

    // ── Step 1: Design Agent ──────────────────────────────────────────────────
    onState({ status: 'designing', progress: 0.02 });
    console.log('🎨 [Manager] Design Agent starting...');

    let designTokens: DesignTokens;
    try {
        // Check if the prompt references a known brand (Stripe, Vercel, etc.)
        const siteKey = detectSiteKeyFromPrompt(prompt);
        let seedColors: Partial<DesignTokens> | undefined;

        if (siteKey) {
            console.log(`🎯 [Manager] Detected brand: ${siteKey} — loading design spec...`);
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
        console.log('✅ [Manager] Design tokens:', designTokens);
    } catch (err) {
        console.warn('[Manager] Design Agent threw, using defaults:', err);
        designTokens = {
            fontFamily: 'Inter',
            primaryColor: '#6366f1',
            backgroundColor: '#09090b',
            accentColor: '#a78bfa',
            textColor: '#f4f4f5',
            surfaceColor: '#18181b',
            theme: 'dark',
        };
    }

    // ── Step 2: Storyboard Agent ──────────────────────────────────────────────
    onState({ status: 'storyboarding', progress: 0.08 });
    console.log('🎬 [Manager] Storyboard Agent starting...');

    let blueprints: SceneBlueprint[];
    try {
        blueprints = await runStoryboardAgent(config, prompt, narration, designTokens, 3);
        console.log(`✅ [Manager] Storyboard: ${blueprints.length} scenes planned`);
        blueprints.forEach(bp =>
            console.log(`   Scene "${bp.id}": ${bp.componentList.join(', ')} (${bp.durationInFrames}f)`)
        );
    } catch (err) {
        console.warn('[Manager] Storyboard Agent threw, using defaults:', err);
        blueprints = [
            { id: 'scene1', purpose: prompt, durationInFrames: 150, componentList: ['MockWindow'] },
        ];
    }

    // ── Step 3: Per-scene, per-component loop ─────────────────────────────────
    const totalComponents = blueprints.reduce((acc, bp) => acc + bp.componentList.length, 0);
    const sceneCodes: SceneCode[] = [];
    let globalCompIdx = 0;

    for (let sceneIdx = 0; sceneIdx < blueprints.length; sceneIdx++) {
        const blueprint = blueprints[sceneIdx];
        const components: ComponentCode[] = [];

        for (let compIdx = 0; compIdx < blueprint.componentList.length; compIdx++) {
            const primitiveName = blueprint.componentList[compIdx];
            const isBackground = compIdx === 0 && blueprint.componentList.length > 1;
            // Stagger delay hint: each component in a scene enters slightly later
            const delayHint = compIdx * 12;

            // ── Component Creator ─────────────────────────────────────────────
            onState({
                status: 'component-building',
                progress: calcComponentProgress(sceneIdx, globalCompIdx, blueprints.length, totalComponents, 'building'),
                currentScene: blueprint.id,
                currentComponent: primitiveName,
            });
            console.log(`🔧 [Manager] Building ${primitiveName} for ${blueprint.id}...`);

            let rawJSX = `<${primitiveName} />`;
            try {
                rawJSX = await runComponentCreatorAgent(
                    config,
                    primitiveName,
                    designTokens,
                    blueprint.purpose,
                    isBackground
                );
            } catch (err) {
                console.warn(`[Manager] ComponentCreator failed for ${primitiveName}:`, err);
            }

            // ── Animator ──────────────────────────────────────────────────────
            onState({
                status: 'animating',
                progress: calcComponentProgress(sceneIdx, globalCompIdx, blueprints.length, totalComponents, 'animating'),
                currentScene: blueprint.id,
                currentComponent: primitiveName,
            });
            console.log(`✨ [Manager] Animating ${primitiveName} for ${blueprint.id}...`);

            let animatedJSX = rawJSX;
            try {
                animatedJSX = await runAnimatorAgent(
                    config,
                    rawJSX,
                    primitiveName,
                    designTokens,
                    delayHint,
                    blueprint.purpose
                );
            } catch (err) {
                console.warn(`[Manager] Animator failed for ${primitiveName}:`, err);
                // Safe fallback: SpringEnter with the raw JSX
                animatedJSX = `<SpringEnter delay={${delayHint}}>\n  ${rawJSX}\n</SpringEnter>`;
            }

            components.push({ primitiveName, rawJSX, animatedJSX });
            globalCompIdx++;
        }

        sceneCodes.push({
            blueprintId: blueprint.id,
            durationInFrames: blueprint.durationInFrames,
            components,
        });
    }

    // ── Step 4: Assembler ─────────────────────────────────────────────────────
    onState({ status: 'assembling', progress: 0.85 });
    console.log('🔨 [Manager] Assembling VideoComposition.tsx...');

    const assembled = await assembleVideoComposition(config, blueprints, sceneCodes, designTokens);

    // ── Step 5: Verifier Agent ────────────────────────────────────────────────
    onState({ status: 'verifying', progress: 0.92 });
    console.log('🔍 [Manager] Verifier Agent reviewing code...');

    let finalCode = assembled;
    try {
        finalCode = await runVerifierAgent(config, assembled);
    } catch (err) {
        console.warn('[Manager] Verifier threw, using assembled code as-is:', err);
        finalCode = assembled;
    }

    // ── Step 6: Write to disk ─────────────────────────────────────────────────
    if (window.electronAPI?.writeFile) {
        await window.electronAPI.writeFile(
            'src/renderer/scenes/VideoComposition.tsx',
            finalCode
        );
        console.log('💾 [Manager] VideoComposition.tsx written to disk.');
    }

    onState({ status: 'done', progress: 1.0 });
    console.log('🎉 [Manager] Pipeline complete!');
    return finalCode;
}

export const runPipeline = runTSXPipeline;
