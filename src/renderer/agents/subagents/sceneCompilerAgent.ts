import { callLLM, sanitizeCompositionCode } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';

export interface SceneCompilerInput {
  scenes: Array<{
    sceneId: string;
    title: string;
    durationInFrames: number;
    sceneTSX: string;
    tag?: string;
    description?: string;
  }>;
  globalTransitionPlan: string;
  designTokens: DesignTokens;
}

export interface SceneCompilerResult {
  compiledTSX: string;
  fullSystemPrompt: string;
  fullUserPrompt: string;
  rawOutput: string;
}

export const SCENE_COMPILER_SYSTEM = `You are a World-Class Motion Graphics Scene Compiler & 3D Camera Compositor.
Your job: take individual React/Remotion TSX scenes and compile them into ONE seamless master video composition with 3D camera physics & spatial transitions between scenes.

EXACT TRANSITION MECHANICS FROM ARCHITECTURE SPEC (CRITICAL):
1. 3D FLIP 90° TRANSITION MECHANIC:
   - When transitioning from Scene N to Scene N+1:
     - Entering scene flips in (-90deg -> 0deg) over frames 0-15.
     - Exiting scene flips out (0deg -> 90deg) over final 15 frames.
2. SPATIAL CAMERA ZOOM MECHANIC:
   - Entering scene scales in (1.3 -> 1.0) and fades opacity (0 -> 1.0) over frames 0-15.
   - Exiting scene scales down (1.0 -> 0.7) and fades opacity (1.0 -> 0) over final 15 frames.

REMOTION COMPOSITION RULES:
1. Wrap sequential scenes inside Remotion <Series> and <Series.Sequence durationInFrames={N}>.
2. Apply frame interpolation for transitions using useCurrentFrame() inside each sequence.
3. Component Export MUST be:
   export const VideoComposition: React.FC = () => { ... };
   export default VideoComposition;
4. VARIABLE SCOPE SAFETY: Define all colors/styles inside each sub-component (do NOT reference variables declared outside the component function scope!).
5. STRICT JSX SYNTAX VALIDITY: Ensure all JSX tags are fully closed. Do NOT truncate prop values.

OUTPUT FORMAT: Return ONLY valid TSX wrapped inside a \`\`\`tsx ... \`\`\` code block exporting VideoComposition.`;

export async function runSceneCompilerAgent(
  config: AgentConfig,
  input: SceneCompilerInput
): Promise<SceneCompilerResult> {
  const taggedScenesList = input.scenes.map((s, idx) => {
    return `<scene${idx + 1} id="${s.sceneId}" tag="${s.tag || 'scene-intro'}" desc="${s.title}" durationInFrames="${s.durationInFrames}">\n${s.sceneTSX}\n</scene${idx + 1}>`;
  }).join('\n\n' + '─'.repeat(60) + '\n\n');

  const userPrompt = `GLOBAL STORYBOARD TRANSITION STRATEGY:
"${input.globalTransitionPlan}"

DESIGN SYSTEM TOKENS:
  primaryColor: "${input.designTokens.primaryColor}"
  backgroundColor: "${input.designTokens.backgroundColor}"
  surfaceColor: "${input.designTokens.surfaceColor}"
  fontFamily: "${input.designTokens.fontFamily}"

TAGGED SCENES TO COMPILE (${input.scenes.length} SCENES TOTAL):
${taggedScenesList}

Compile all tagged scenes into a single master TSX file exporting VideoComposition with 3D flips, zooms, and spatial transitions using Remotion <Series> and <Series.Sequence durationInFrames={...}>. Return \`\`\`tsx block ONLY.`;

  const response = await callLLM(config, SCENE_COMPILER_SYSTEM, userPrompt, true);
  let rawOutput = response.content || response.error || '';
  let cleaned = sanitizeCompositionCode(rawOutput);

  // Fallback spatial compiler
  if (!cleaned || !cleaned.includes('VideoComposition') || cleaned.includes('<Scene') || cleaned.includes('textColor}}') || cleaned.includes('intensity:\n') || cleaned.includes('intensity:\n  ')) {
    const sceneComponents: string[] = [];
    const sequenceItems: string[] = [];

    input.scenes.forEach((s, idx) => {
      const compName = `Scene${idx + 1}`;
      let inlineTSX = s.sceneTSX
        .replace(/^import\s+[\s\S]*?;/gm, '')
        .replace(/^export\s+default\s+function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s*\(/m, '')
        .replace(/^export\s+const\s+\w+[\s\S]*?=\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\(/m, '')
        .replace(/\);\s*\}\s*;?\s*$/m, '')
        .replace(/textColor/g, '"#f4f4f5"')
        .replace(/primaryColor/g, `"${input.designTokens.primaryColor || '#6366f1'}"`)
        .replace(/backgroundColor/g, `"${input.designTokens.backgroundColor || '#09090b'}"`)
        .replace(/surfaceColor/g, `"${input.designTokens.surfaceColor || '#18181b'}"`)
        .trim();

      const isBroken = !inlineTSX ||
        inlineTSX.startsWith('<Scene') ||
        inlineTSX.includes('intensity:\n') ||
        inlineTSX.includes('intensity:\r\n') ||
        (inlineTSX.match(/<[A-Za-z]/g) || []).length !== (inlineTSX.match(/<\/[A-Za-z]|(\/>)/g) || []).length;

      if (isBroken) {
        inlineTSX = `<MockWindow width={1400} height={800} visible={true} glowConfig={{ enabled: true, color: "${input.designTokens.primaryColor || '#6366f1'}", intensity: 10, spread: 6 }}><div className="p-8 flex flex-col items-center justify-center text-center h-full bg-[#111827] text-white rounded-xl"><h1 className="text-4xl font-bold text-white mb-2">${s.title}</h1></div></MockWindow>`;
      }

      sceneComponents.push(`const ${compName}: React.FC = () => {\n  const frame = useCurrentFrame();\n  const duration = ${s.durationInFrames};\n  const transStart = Math.max(0, duration - 15);\n  const isEntering = frame < 15;\n  const isExiting = frame > transStart;\n\n  const flipY = isEntering ? interpolate(frame, [0, 15], [-90, 0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [0, 90], { extrapolateRight: 'clamp' }) : 0;\n  const scale = isEntering ? interpolate(frame, [0, 15], [1.3, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0.7], { extrapolateRight: 'clamp' }) : 1.0;\n  const opacity = isEntering ? interpolate(frame, [0, 15], [0, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0], { extrapolateRight: 'clamp' }) : 1.0;\n\n  return (\n    <div\n      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#0d1117] text-[#c9d1d9] font-sans"\n      style={{\n        transform: \`perspective(1200px) rotateY(\${flipY}deg) scale(\${scale})\`,\n        opacity,\n        transformStyle: 'preserve-3d',\n      }}\n    >\n      ${inlineTSX}\n    </div>\n  );\n};`);

      sequenceItems.push(`        <Series.Sequence durationInFrames={${s.durationInFrames}}>\n          <${compName} />\n        </Series.Sequence>`);
    });

    cleaned = `import React from 'react';
import { Series, Sequence, useCurrentFrame, interpolate } from 'remotion';
import {
  BrowserFrame, MockWindow, TopNavbar, SidebarLayout, AppCanvas,
  BreadcrumbHeader, SplitHeroLayout, TabSwitcherContainer, ActionButton,
  NotificationToaster, HeroMetricCard, DataGridContainer
} from '../primitives/StructuralSDK';
import {
  FeatureCard, GlassmorphicCard, KanbanTaskCard, NotificationCard,
  PricingPlanCard, PriceCard, ProfileCard, SettingsToggleCard,
  CustomCard, FeatureBenefitCard, BillingInvoiceCard, PushNotificationToast,
  RegularCard, ProfileHeaderCard
} from '../primitives/CardSDK';
import {
  BarChartCard, AreaChartCard, LineChartCard, DonutChartCard,
  MetricFunnelCard, PieChartCard, ScatterPlotCard, StockCard
} from '../primitives/ChartsSDK';
import {
  SpringEnter, FadeBlur, SlideInOut, ScaleUp, StaggerContainer
} from '../primitives/TransitionSDK';
import {
  Cursor, TextTyper, FocusZoom, ChartAnimate, ProgressRing,
  MarqueeTrack, TypingGhostCursor
} from '../primitives/MotionSDK';

${sceneComponents.join('\n\n')}

export const VideoComposition: React.FC = () => {
  const primaryColor = "${input.designTokens.primaryColor || '#6366f1'}";
  const secondaryColor = "${input.designTokens.secondaryColor || '#818cf8'}";
  const accentColor = "${input.designTokens.accentColor || '#f59e0b'}";
  const semanticColor = "${input.designTokens.semanticColor || '#3b82f6'}";
  const errorColor = "${input.designTokens.errorColor || '#ef4444'}";
  const successColor = "${input.designTokens.successColor || '#22c55e'}";
  const neutralColor = "${input.designTokens.neutralColor || '#27272a'}";
  const surfaceColor = "${input.designTokens.surfaceColor || '#18181b'}";
  const backgroundColor = "${input.designTokens.backgroundColor || '#09090b'}";
  const textColor = "${input.designTokens.textColor || '#f4f4f5'}";
  const fontFamily = "${input.designTokens.fontFamily || 'Inter, sans-serif'}";

  return (
    <div
      className="w-[1920px] h-[1080px] relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor, color: textColor, fontFamily }}
    >
      <Series>
${sequenceItems.join('\n')}
      </Series>
    </div>
  );
};

export default VideoComposition;`;
  }

  return {
    compiledTSX: cleaned,
    fullSystemPrompt: SCENE_COMPILER_SYSTEM,
    fullUserPrompt: userPrompt,
    rawOutput: cleaned,
  };
}
