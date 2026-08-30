import { callLLM, LLMClientFactory } from "@/renderer/agents/llmClient";
import type { AgentConfig, Provider } from "@/renderer/agents/types";
import { PipelineState } from "@/renderer/agents/types";
import { sceneExportName, stripAllImports, writeComposition } from "@/renderer/agents/compositionStore";
import type { FontSettings } from "@/renderer/components/BrandStylingPanel";

export type LogoPipelineCallback = (state: PipelineState) => void;

// ─── Style Presets ───────────────────────────────────────────

export interface LogoStylePreset {
  id: string;
  label: string;
  description: string;
}

export const LOGO_STYLE_PRESETS: LogoStylePreset[] = [
  { id: 'custom', label: 'Custom', description: 'Fully custom animation based entirely on your prompt instructions' },
  { id: '3d-spin', label: '3D Spin Reveal', description: 'Logo spins in from a 3D rotation with dramatic perspective depth and shadow trails' },
  { id: 'particle-burst', label: 'Particle Burst', description: 'Logo assembles from hundreds of scattered particles with spring physics convergence' },
  { id: 'stroke-draw', label: 'Stroke Draw-In', description: 'Pencil line-by-line drawing effect that clarifies into full color' },
  { id: 'neon-glow', label: 'Neon Glow Pulse', description: 'Logo emerges from darkness with pulsing neon glow halos and volumetric light bleed' },
  { id: 'bounce-drop', label: 'Bounce Drop', description: 'Logo drops from above with realistic elastic bounce and squash-stretch deformation' },
  { id: 'scale-fade', label: 'Scale & Fade', description: 'Logo scales up from the center with a smooth opacity fade-in and depth-of-field blur' },
  { id: 'glitch-reveal', label: 'Glitch Reveal', description: 'Logo glitches into view with chromatic aberration, scan lines, and digital distortion' },
  { id: 'shatter-reform', label: 'Shatter & Reform', description: 'Logo shatters into 4 geometric pieces that snap together with spring physics' },
  { id: 'cinematic-zoom', label: 'Cinematic Zoom', description: 'Camera zooms through layered space to reveal the logo with parallax and motion blur' },
];

// ─── Multimodal Detection ────────────────────────────────────

export function isMultimodalCapable(provider: Provider, model?: string): boolean {
  const m = (model || '').toLowerCase();
  if (provider === 'google') return true;
  if (provider === 'openai') return m.includes('gpt-4') || m.includes('o1') || m.includes('o3') || m.includes('o4');
  if (provider === 'anthropic') return m.includes('claude-3') || m.includes('claude-4');
  if (provider === 'hackclub') return true;
  return false;
}

export function isSvgFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.svg');
}

async function readSvgTextFromBlobUrl(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  return await response.text();
}

// ─── Stage 1: Logo Animator Agent ────────────────────────────
//     Combined code generation + animation in a single focused call.
//     Produces the complete animated Scene1 component in one shot.

interface LogoBrandConfig {
  fonts: Record<string, FontSettings>;
  colors: Record<string, string>;
  bgSelection: Record<string, unknown>;
}

async function runLogoAnimatorAgent(
  config: AgentConfig,
  prompt: string,
  stylePreset: LogoStylePreset,
  logoData: { svgText?: string; fileName: string },
  brandConfig: LogoBrandConfig
): Promise<{ tsxCode?: string; error?: string }> {
  if (!isSvgFile(logoData.fileName)) {
    return { error: `Only SVG files are supported. Received: ${logoData.fileName}` };
  }
  if (!logoData.svgText) {
    return { error: "SVG source is empty. Please upload a valid .svg file." };
  }

  const logoSection = `
LOGO FORMAT: SVG (inline source code provided below) — SVG ONLY MODE
You MUST embed this SVG markup directly inline in your component JSX and animate individual paths, groups, circles, rects, etc.
Do NOT use <Img> for SVG logos — render the SVG elements directly so you can animate each path.

SVG SOURCE:
${logoData.svgText}`;

  const flubberSection = `
═══════════════════════════════════════════════════
VECTOR MORPH TOOLBOX (flubber — PRE-IMPORTED for this SVG logo):
═══════════════════════════════════════════════════
The 'flubber' library is installed and already available as \`* as flubber\`.
Use it for true SVG shape morphing: dots melting into the logo mark, icon-to-icon transitions, blob-to-logo reveals.

USAGE PATTERN:
  // Build the interpolator ONCE (memoized so it is not recreated every frame):
  const morph = useMemo(
    () => flubber.interpolate('M ...fromPathD...', 'M ...toPathD...', { maxSegmentLength: 2 }),
    []
  );
  // Drive it each frame with clamped eased progress:
  const t = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  <path d={morph(t)} fill="brandColor" />

KEY HELPERS:
  - flubber.interpolate(fromPathD, toPathD, opts) — SVG path string to SVG path string
  - flubber.toCircle(pathD, cx, cy, r) / flubber.toRectangle(pathD, x, y, w, h) — collapse any shape into a primitive
  - flubber.fromTo(a, b, opts) — accepts more input types than interpolate
  - flubber.separate(compoundPathD) — split a compound path into individual shapes before morphing

RULES: morph progress MUST stay within [0, 1] (always clamp); both path strings must come from the SVG SOURCE above
(or primitives created via toCircle/toRectangle); use maxSegmentLength: 2 for smooth curves; memoize interpolators.`;

  // Compact brand config for the prompt
  const fontSummary = Object.entries(brandConfig.fonts)
    .map(([role, settings]: [string, FontSettings]) =>
      `${role}: ${settings.fontFamily || 'Inter'} ${settings.size || 16}px ${settings.bold ? 'bold' : ''} ${settings.color || '#fff'}`
    ).join('\n');

  const colorSummary = Object.entries(brandConfig.colors)
    .map(([name, hex]) => `${name}: ${hex}`)
    .join(', ');

  const isCustomStyle = stylePreset.id === 'custom';

  const styleInstruction = isCustomStyle
    ? `ANIMATION STYLE: Custom (strictly build the animation based on the user's prompt without enforcing any preset style framework)`
    : `SELECTED ANIMATION STYLE: "${stylePreset.label}"\nStyle Guide: ${stylePreset.description}\nFollow the user's creative prompt while using "${stylePreset.label}" as the animation foundation.`;

  const systemPrompt = `You are an elite Logo Motion Graphics Animator building cinematic 5-second logo reveal animations in Remotion React.

${styleInstruction}
${logoSection}

BRAND PALETTE:
${colorSummary}

BRAND TYPOGRAPHY:
${fontSummary}

═══════════════════════════════════════════════════
TIMING STRUCTURE (STRICTLY 150 FRAMES @ 30 FPS = 5 SECONDS):
═══════════════════════════════════════════════════
Phase 1 — BUILD-UP (frames 0–60):
  Logo entrance, reveal animation, initial motion effects.
  Use spring() with high stiffness for snappy entrances.

Phase 2 — HERO (frames 60–120):
  Logo fully visible. Add ambient living motion:
  subtle floating, glow pulsing, particle drifting, gentle rotation oscillation.
  Use Math.sin(frame / N) patterns for organic perpetual motion.

Phase 3 — SETTLE (frames 120–150):
  Ease to final resting state. Reduce all secondary motion.
  Logo holds perfectly still at frame 150.

═══════════════════════════════════════════════════
COMPONENT RULES:
═══════════════════════════════════════════════════
- Export as: export const Scene1: React.FC = () => { ... };
- Call useCurrentFrame() and useVideoConfig() at the TOP of the component.
- ALWAYS set backgroundColor: 'transparent' on the outermost wrapper div.
- Use AbsoluteFill from remotion for full-frame positioning.

═══════════════════════════════════════════════════
ANIMATION TOOLBOX (HYBRID APPROACH):
═══════════════════════════════════════════════════
For smooth transitions (position, scale, rotation, opacity, color):
  spring({ frame, fps: 30, config: { damping: 14, stiffness: 100, mass: 0.8 } })
  interpolate(frame, [inputRange], [outputRange], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

For special effects (particles, glows, scan lines, chromatic aberration):
  Use raw math with interpolate():
  - Glow pulse: interpolate(frame % 30, [0, 15, 30], [0.3, 1, 0.3])
  - Floating orbs: Math.sin(frame / 25) * 20 for X, Math.cos(frame / 18) * 15 for Y
  - Particle scatter: Map over an array of particle objects with randomized positions and spring-driven convergence
   - Chromatic split: Render 3 copies of the logo offset by interpolated RGB channel shifts
${flubberSection}
═══════════════════════════════════════════════════
VISUAL QUALITY STANDARDS:
═══════════════════════════════════════════════════
1. LAYERED SHADOWS: boxShadow with 3+ shadow layers for depth
2. GLOW HALOS: Ambient colored glow rings around the logo using radial gradients or box-shadow spread
3. 3D PERSPECTIVE: perspective(1200px) with rotateX/Y for cinematic depth
4. AMBIENT PARTICLES: Floating dots, light streaks, bokeh orbs in the background
5. GRADIENT ACCENTS: Use brand Primary and Secondary colors for gradient fills and glow tints
6. BACKDROP BLUR: backdropFilter: 'blur(20px) saturate(160%)' for glassmorphic panels behind the logo

═══════════════════════════════════════════════════
CRITICAL WARNINGS:
═══════════════════════════════════════════════════
- NEVER exceed 150 frames total. All interpolate inputRanges must stay within [0, 150].
- NEVER use function-as-children inside <Sequence>. Pass direct JSX only.
- NEVER place hooks inside conditions, loops, or callbacks.
- All interpolate() calls MUST have matching inputRange and outputRange array lengths.
- The logo is the HERO. Everything else (particles, glows, orbs) is supporting atmosphere.

OUTPUT: Return ONLY the raw TSX component code. No markdown fences, no explanations, no imports.`;

  const userPrompt = isCustomStyle
    ? `Animation prompt from user: "${prompt}"\n\nGenerate a complete 5-second (150-frame) logo animation based strictly on the user's prompt.`
    : `Animation prompt from user: "${prompt}"\n\nGenerate the complete, production-quality Scene1 component for a 5-second (150-frame) "${stylePreset.label}" logo reveal animation. Make it cinematic.`;

  console.log('[LogoPipeline] SVG-only mode — embedding SVG source in prompt');
  const response = await callLLM(config, systemPrompt, userPrompt);
  if (response.error) return { error: response.error };
  const cleaned = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
  return { tsxCode: cleaned };
}

// ─── Stage 2: Logo Verifier Agent ────────────────────────────
//     Combined syntax + motion verification in a single pass.
//     Runs up to 2 correction attempts to fix broken code.

async function runLogoVerifierAgent(
  config: AgentConfig,
  code: string
): Promise<{ verifiedCode: string; error?: string }> {
  let currentCode = code;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const systemPrompt = `You are a strict Remotion TSX Code Verifier specialized in logo animation scenes.

VERIFY AND FIX ALL OF THE FOLLOWING:

SYNTAX CHECKS:
1. Component MUST be exported as: export const Scene1: React.FC = () => { ... };
2. All JSX tags properly opened and closed. No dangling brackets.
3. All interpolate() calls have matching inputRange/outputRange array lengths.
4. All spring() calls include fps parameter (use fps from useVideoConfig() or hardcode 30).
5. useCurrentFrame() and useVideoConfig() called at component top level only — never inside conditions or loops.
6. No import statements — imports are injected separately.

MOTION CHECKS:
7. Component uses useCurrentFrame() for animation timing.
8. Animation frames stay within [0, 150] range. No references beyond 150.
9. Contains at least one spring() or interpolate() call for motion.
10. No function-as-children inside <Sequence> tags. Use direct JSX.

STYLE CHECKS:
11. Outermost div has backgroundColor: 'transparent'.
12. Logo element is centered (flex + items-center + justify-center, or absolute positioning with transform).

FLUBBER CHECKS (only if flubber is used):
13. Interpolators are created inside useMemo with stable dependency arrays, not recreated inline per frame.
14. Morph progress values are clamped within [0, 1] via interpolate with extrapolate clamping.
15. Both source and target path arguments are non-empty valid SVG path data strings.

If the code has errors, FIX THEM and return the corrected code.
If the code is already correct, return it unchanged.

OUTPUT: Return ONLY the corrected TSX component code. No markdown, no explanations.`;

    const response = await callLLM(config, systemPrompt, `Verification attempt ${attempt}:\n${currentCode}`, true);
    if (response.error) {
      console.error(`[LogoPipeline] Verifier attempt ${attempt} error:`, response.error);
      continue;
    }
    if (response.content) {
      currentCode = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
    }
  }

  return { verifiedCode: currentCode };
}

// ─── Main Logo Pipeline Orchestrator ─────────────────────────

export interface LogoPipelineInput {
  prompt: string;
  stylePreset: LogoStylePreset;
  logoFileUrl: string;
  logoFileName: string;
  fonts: Record<string, FontSettings>;
  colors: Record<string, string>;
  bgSelection: Record<string, unknown>;
  config: AgentConfig;
  savePath?: string;
  projectTitle?: string;
  onState: LogoPipelineCallback;
  onCheckpoint?: (checkpoint: Record<string, unknown>) => void;
}

export async function runLogoPipeline(input: LogoPipelineInput): Promise<string> {
  const {
    prompt, stylePreset, logoFileUrl, logoFileName,
    fonts, colors, bgSelection, config,
    savePath, projectTitle, onState, onCheckpoint
  } = input;

  if (!config) {
    onState({ status: 'error', progress: 0, error: 'No API key configured. Set one in Settings.' });
    return '';
  }

  // ── Prepare logo data ──
  onState({ status: 'storyboarding', progress: 0.05 });
  console.log(`[LogoPipeline] Starting logo pipeline — style: "${stylePreset.label}", file: "${logoFileName}"`);

  if (logoFileName && !isSvgFile(logoFileName)) {
    onState({ status: 'error', progress: 0.05, error: `Only SVG files are supported. You uploaded: ${logoFileName}` });
    return '';
  }

  const logoData: { svgText?: string; fileName: string } = {
    fileName: logoFileName || 'logo.svg'
  };

  if (logoFileUrl) {
    try {
      logoData.svgText = await readSvgTextFromBlobUrl(logoFileUrl);
      console.log(`[LogoPipeline] Read SVG source — ${logoData.svgText.length} chars`);
    } catch (err) {
      console.error('[LogoPipeline] Failed to read SVG file:', err);
      onState({ status: 'error', progress: 0.05, error: 'Failed to read SVG file. Ensure it is a valid .svg.' });
      return '';
    }
  } else {
    console.warn('[LogoPipeline] No SVG uploaded — using default kinetic logo');
    try {
      const fallbackUrl = new URL('../../../../kinetic_brand/logo_transparent.svg', import.meta.url).href;
      logoData.svgText = await readSvgTextFromBlobUrl(fallbackUrl);
    } catch {
      logoData.svgText = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#8b5cf6"/></svg>';
    }
  }

  if (!logoData.svgText) {
    onState({ status: 'error', progress: 0.05, error: 'SVG source is empty. Upload a valid .svg file.' });
    return '';
  }

  // ── Save initial checkpoint ──
  const sceneDescriptor = { id: 'scene_1', description: `Logo reveal: ${stylePreset.label}`, duration: 150 };
  const initialData = {
    title: projectTitle || 'Logo Animation',
    prompt,
    narration: '',
    scenes: [sceneDescriptor],
    unfinished: true,
    savePath,
  };
  if (savePath && window.electronAPI?.writeFile) {
    window.electronAPI.writeFile(savePath, JSON.stringify(initialData, null, 2));
  }
  if (onCheckpoint) onCheckpoint(initialData);

  // ── Stage 1: Logo Animator Agent (combined code + animation) ──
  onState({ status: 'designing', progress: 0.15 });
  console.log('[LogoPipeline] Stage 1: Running Logo Animator Agent...');

  const animResult = await runLogoAnimatorAgent(
    config,
    prompt,
    stylePreset,
    logoData,
    { fonts, colors, bgSelection }
  );

  if (animResult.error || !animResult.tsxCode) {
    onState({ status: 'error', progress: 0.15, error: animResult.error || 'Logo animation generation failed.' });
    return '';
  }

  console.log(`[LogoPipeline] Stage 1 complete — generated ${animResult.tsxCode.length} chars of scene code`);

  // ── Stage 2: Logo Verifier Agent (syntax + motion check) ──
  onState({ status: 'assembling', progress: 0.60 });
  console.log('[LogoPipeline] Stage 2: Running Logo Verifier Agent...');

  const verifyResult = await runLogoVerifierAgent(config, animResult.tsxCode);
  const finalSceneCode = verifyResult.verifiedCode;

  console.log(`[LogoPipeline] Stage 2 complete — verified code: ${finalSceneCode.length} chars`);

  // ── Stage 3: Assembly & File Writing ──
  onState({ status: 'assembling', progress: 0.85 });
  console.log('[LogoPipeline] Stage 3: Assembling final composition...');

  const cleanedCode = stripAllImports(finalSceneCode);

  const finalComposition = `import React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as flubber from 'flubber';
import { Series, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, AbsoluteFill, Img, staticFile } from 'remotion';

import type { GlowConfig, StyleConfig } from '../primitives/types';
import {
    ActionButton, AppCanvas, BreadcrumbHeader, BrowserFrame, DataGridContainer,
    HeroMetricCard, MockWindow, NotificationToaster, SidebarLayout, SplitHeroLayout,
    TabSwitcherContainer, TopNavbar
} from '../primitives/StructuralSDK';
import {
    BillingInvoiceCard, CustomCard, FeatureBenefitCard, FeatureCard, GlassmorphicCard,
    KanbanTaskCard, NotificationCard, PriceCard, PricingPlanCard, ProfileCard,
    ProfileHeaderCard, PushNotificationToast, RegularCard, SettingsToggleCard
} from '../primitives/CardSDK';
import {
    AreaChart, BarChartCard, DonutChartCard, LineChartCard, MetricFunnel,
    PieChartCard, ScatterPlotCard, StockCard
} from '../primitives/ChartsSDK';
import {
    SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale,
    AccordionExpand, RotateFlip, GlitchIntro
} from '../primitives/TransitionSDK';
import {
    Cursor, SmoothScroll, FocusZoom, TextTyper, ChartAnimate, DragAndDrop,
    TypingGhostCursor, MarqueeTrack, ProgressRing
} from '../primitives/MotionSDK';

${cleanedCode}

export const VideoComposition: React.FC = () => {
    return (
        <div className="w-full h-full bg-slate-950 text-white relative overflow-hidden flex items-center justify-center">
            <Series>
                <Series.Sequence durationInFrames={150}>
                    <${sceneExportName(0)} />
                </Series.Sequence>
            </Series>
        </div>
    );
};

export default VideoComposition;
`;

  // ── Write files & save finished checkpoint ──
  const finishedData: Record<string, unknown> = {
    title: projectTitle || 'Logo Animation',
    prompt,
    narration: '',
    scenes: [sceneDescriptor],
    code: finalComposition,
    unfinished: false,
    savePath,
  };

  if (window.electronAPI?.writeFile) {
    try {
      const wrote = await writeComposition(finalComposition);
      if (wrote) console.log('[LogoPipeline] Wrote VideoComposition.tsx');
      if (savePath) {
        await window.electronAPI.writeFile(savePath, JSON.stringify(finishedData, null, 2));
        console.log(`[LogoPipeline] Saved project checkpoint to: ${savePath}`);
      }
    } catch (e) {
      console.error('[LogoPipeline] Failed to write final files:', e);
    }
  }

  if (onCheckpoint) onCheckpoint(finishedData);

  onState({ status: 'done', progress: 1.0 });
  console.log('[LogoPipeline] ✅ Logo pipeline complete!');
  return finalComposition;
}
