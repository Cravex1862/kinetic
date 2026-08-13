import { callLLM, safeParseJson, sanitizeCompositionCode } from './llmClient';
import type { AgentConfig, DesignTokens } from './types';
import { getPrimitiveSpec, getAllPrimitiveNames } from './primitiveRegistry';
import { findRelevantSkills, getAllSkillNames, getSkillByName, RelevantSkill } from '../utils/skillRAG';
import { detectSiteKeyFromPrompt, loadDesignSpec, SiteDesignSpec } from './designSpecLoader';
import { runDesignAgentBrandDiscovery, runDesignAgentDetailed, DesignAgentResult } from './subagents/designAgent';

export interface TestPipelineResult {
  step: number;
  stepName: string;
  fullPrompt: string;
  rawOutput: string;
  data: any;
}

export interface DetailedTestBlueprint {
  id: string;
  title: string;
  durationInFrames: number;
  layoutStructure: string;
  exactCopy: {
    heading: string;
    subheading: string;
    metrics: Array<{ label: string; value: string; trend?: string }>;
    chartData?: { title: string; categories: string[]; values: number[] };
  };
  componentList: string[];
  visualDirectives: string;
}

export interface ToolRequestResult {
  requestedPrimitives: string[];
  requestedSkills: string[];
}

export interface Phase1DesignResult {
  presetFound: string | null;
  requestedBrands: string[];
  designTokens: DesignTokens;
  fullSystemPrompt: string;
  fullUserPrompt: string;
  rawOutput: string;
}


export async function runPhase1DesignTokens(
  config: AgentConfig,
  userPrompt: string,
  userFeedback?: string
): Promise<Phase1DesignResult> {
  const presetKey = detectSiteKeyFromPrompt(userPrompt);

  if (presetKey && !userFeedback) {
    const spec = await loadDesignSpec(presetKey);
    const tokens: DesignTokens = {
      fontFamily: 'Inter, sans-serif',
      primaryColor: spec.colors.primary,
      secondaryColor: spec.colors.surface2,
      accentColor: spec.colors.primary,
      semanticColor: spec.colors.border,
      errorColor: '#ef4444',
      successColor: '#22c55e',
      neutralColor: spec.colors.textMuted,
      backgroundColor: spec.colors.canvas,
      textColor: spec.colors.textPrimary,
      surfaceColor: spec.colors.surface1,
      theme: 'dark',
    };

    return {
      presetFound: presetKey,
      requestedBrands: [presetKey],
      designTokens: tokens,
      fullSystemPrompt: `=== SAVED DESIGN PRESET SYSTEM ===\nPreset key detected: "${presetKey}". Loaded design tokens directly from official DESIGN.md specification.`,
      fullUserPrompt: `User Prompt: "${userPrompt}"\nDetected Brand Preset: "${presetKey}"`,
      rawOutput: JSON.stringify({ presetKey, specName: spec.name, tokens }, null, 2),
    };
  }

  // ─── 2-PASS BRAND DISCOVERY & SYNTHESIS ─────────────────────────────────────
  // Pass 1: Ask LLM which brand design specs to request from our 74+ catalog
  const pass1 = await runDesignAgentBrandDiscovery(config, userPrompt);
  const requestedBrandKeys = pass1.requestedBrands;

  // Load requested brand specs on demand
  const loadedBrandSpecs: SiteDesignSpec[] = [];
  for (const bKey of requestedBrandKeys) {
    try {
      const spec = await loadDesignSpec(bKey);
      if (spec) loadedBrandSpecs.push(spec);
    } catch (e) {
      console.warn(`[testPipeline] Could not load design spec for brand: ${bKey}`, e);
    }
  }

  // Pass 2: Synthesize design tokens using prompt + loaded brand specs + feedback
  const pass2: DesignAgentResult = await runDesignAgentDetailed(
    config,
    userPrompt,
    userFeedback,
    loadedBrandSpecs
  );

  const combinedSystemPrompt = `${pass1.fullPrompt}\n\n` + '─'.repeat(80) + `\n\n=== PASS 2 DESIGN SYNTHESIS SYSTEM PROMPT ===\n${pass2.fullSystemPrompt}`;
  const combinedUserPrompt = `${pass1.fullPrompt}\n\n` + '─'.repeat(80) + `\n\n=== PASS 2 USER SYNTHESIS PROMPT ===\n${pass2.fullUserPrompt}`;
  const combinedOutput = `=== PASS 1 BRAND REQUEST OUTPUT ===\n${pass1.rawOutput}\n\n=== PASS 2 FINAL DESIGN TOKENS OUTPUT ===\n${pass2.rawOutput}`;

  return {
    presetFound: null,
    requestedBrands: requestedBrandKeys,
    designTokens: pass2.tokens,
    fullSystemPrompt: combinedSystemPrompt,
    fullUserPrompt: combinedUserPrompt,
    rawOutput: combinedOutput,
  };
}

// ─── High-Detail Storyboard Agent ─────────────────────────────────────────────

const DETAILED_STORYBOARD_SYSTEM = `You are a World-Class Motion Graphics Executive Creative Director.
Your job is to break a video prompt into ultra-detailed, high-impact scene blueprints for a 1920x1080 SaaS video composition.

You MUST provide a SHIT TON of detail for every single scene:
1. LAYOUT STRUCTURE: Describe exact nesting hierarchy and layout containers.
2. EXACT COPY & DATA: Provide exact titles, subtitles, realistic metric numbers (e.g. "99.99%", "120 SQLi Threats", "340ms Latency"), and chart categories.
3. COMPONENT LIST: Recommend 2 to 4 primitives from the SDK (e.g. MockWindow, HeroMetricCard, BarChartCard).
4. VISUAL DIRECTIVES: Specify ambient glow color for the outer window, contrast backdrops, and secondary UI badges.

Return ONLY a valid JSON array matching this exact TS structure:
[
  {
    "id": "scene1",
    "title": "Hero Infrastructure Overview",
    "durationInFrames": 150,
    "layoutStructure": "MockWindow container wrapping a 2-column hero grid with HeroMetricCard and BarChartCard side-by-side.",
    "exactCopy": {
      "heading": "GuardRail Security Command Center",
      "subheading": "Real-time threat monitoring and cloud infrastructure protection",
      "metrics": [
        { "label": "System Uptime", "value": "99.99%", "trend": "+0.01%" },
        { "label": "Active Protection", "value": "24/7", "trend": "Optimal" }
      ],
      "chartData": {
        "title": "Threat Detections (Last 24h)",
        "categories": ["SQLi", "XSS", "DDoS", "Brute Force"],
        "values": [120, 85, 40, 15]
      }
    },
    "componentList": ["MockWindow", "HeroMetricCard", "BarChartCard"],
    "visualDirectives": "Apply primaryColor glow to MockWindow backdrop halo, successColor pill for uptime badge, and dark surfaceColor backdrop."
  }
]`;

import { runStoryboardAgentWithSubagents, MasterStoryboardResult, DetailedPerSceneStoryboard } from './subagents/storyboardAgent';

export async function runTestStoryboardAgent(
  config: AgentConfig,
  userPrompt: string,
  designTokens: DesignTokens,
  userFeedback?: string
): Promise<{ blueprints: DetailedTestBlueprint[]; masterResult: MasterStoryboardResult; ragSkills: RelevantSkill[]; fullPrompt: string; rawOutput: string }> {
  // Vector RAG Skill Retrieval directly on prompt for recommended skills
  const ragSkills = await findRelevantSkills(userPrompt, 3);

  const masterRes = await runStoryboardAgentWithSubagents(config, userPrompt, designTokens, userFeedback, ragSkills);

  // Convert detailed per-scene storyboards to DetailedTestBlueprint format for pipeline compatibility
  const blueprints: DetailedTestBlueprint[] = masterRes.scenes.map(sc => ({
    id: sc.sceneId,
    title: sc.title,
    durationInFrames: sc.durationInFrames,
    layoutStructure: sc.layoutStructure,
    exactCopy: {
      heading: sc.exactDataToDisplay.heading,
      subheading: sc.exactDataToDisplay.subheading,
      metrics: sc.exactDataToDisplay.metrics,
      chartData: sc.exactDataToDisplay.chartData,
    },
    componentList: sc.componentList,
    visualDirectives: `${sc.howEachComponentIsAnimated}. 3D Tilt: rotateX=${sc.perspective3D.rotateX}, rotateY=${sc.perspective3D.rotateY}. Exit: ${sc.transitionToNextScene}`,
  }));

  const combinedPrompts = `${masterRes.fullMasterPrompt}\n\n` + '─'.repeat(80) + `\n\n=== PER-SCENE SUBAGENT PROMPTS ===\n` + masterRes.perScenePrompts.join('\n\n' + '─'.repeat(40) + '\n\n');

  return {
    blueprints,
    masterResult: masterRes,
    ragSkills,
    fullPrompt: combinedPrompts,
    rawOutput: masterRes.rawOutput,
  };
}


// ─── PASS 1: AGENTIC TOOL DISCOVERY & TOOL REQUEST ────────────────────────────
export async function runTestSceneDiscovery(
  config: AgentConfig,
  blueprint: DetailedTestBlueprint,
  ragSkills: RelevantSkill[]
): Promise<{ requests: ToolRequestResult; fullPrompt: string; rawOutput: string }> {
  const recommendedPrimitives = blueprint.componentList;
  const recommendedSkills = ragSkills.map((s) => s.name);
  const allPrimitives = getAllPrimitiveNames();
  const allSkills = getAllSkillNames();

  const discoverySystem = `You are a Motion Graphics UI Architect preparing to build a 1920x1080 React scene composition.

Your goal in Pass 1 is to select which Primitive Component Contracts and Craft Skill Guides you need to inspect.

RECOMMENDED BY STORYBOARD AGENT:
Primitives: ${JSON.stringify(recommendedPrimitives)}

RECOMMENDED BY VECTOR RAG SEARCH:
Skills: ${JSON.stringify(recommendedSkills)}

FULL CATALOG OF AVAILABLE PRIMITIVE COMPONENTS (50+ available):
${JSON.stringify(allPrimitives, null, 2)}

FULL CATALOG OF AVAILABLE CRAFT SKILLS (51 available):
${JSON.stringify(allSkills, null, 2)}

  Inspect the Scene Blueprint below and select:
1. "requestedPrimitives": Select UP TO 12 primitives from the primitives catalog (select visual components like MockWindow, HeroMetricCard, BarChartCard AS WELL AS transition wrappers like SpringEnter, SlideInOut, FadeBlur, ScaleUp and motion tools like Cursor, TextTyper). CRITICAL: Select ONLY 1 root external container: MockWindow OR BrowserFrame OR AppCanvas.
2. "requestedSkills": Select up to 3 skills from the skills catalog.

Return ONLY a valid JSON object matching this exact structure:
{
  "requestedPrimitives": ["BrowserFrame", "TopNavbar", "HeroMetricCard", "BarChartCard", "SpringEnter", "SlideInOut", "Cursor"],
  "requestedSkills": ["chart-animation", "layout-skills"]
}`;

  const discoveryUser = `SCENE BLUEPRINT:
Title: "${blueprint.title}"
Layout Structure: "${blueprint.layoutStructure}"
Visual Directives: "${blueprint.visualDirectives}"

Select your requested primitives and craft skills now. Valid JSON ONLY.`;

  const response = await callLLM(config, discoverySystem, discoveryUser, false);
  const fullPrompt = `=== PASS 1 DISCOVERY SYSTEM PROMPT ===\n${discoverySystem}\n\n=== PASS 1 DISCOVERY USER PROMPT ===\n${discoveryUser}`;

  const rawOutput = response.content || response.error || '';
  const parsed = safeParseJson<ToolRequestResult>(rawOutput, {
    requestedPrimitives: recommendedPrimitives,
    requestedSkills: recommendedSkills,
  });

  return {
    requests: {
      requestedPrimitives: Array.isArray(parsed.requestedPrimitives) && parsed.requestedPrimitives.length > 0
        ? parsed.requestedPrimitives
        : recommendedPrimitives,
      requestedSkills: Array.isArray(parsed.requestedSkills) && parsed.requestedSkills.length > 0
        ? parsed.requestedSkills
        : recommendedSkills,
    },
    fullPrompt,
    rawOutput: JSON.stringify(parsed, null, 2),
  };
}

// ─── PASS 2: TARGETED HYBRID SCENE GENERATION ─────────────────────────────────
export async function runTestSceneGeneratorAgent(
  config: AgentConfig,
  blueprint: DetailedTestBlueprint,
  designTokens: DesignTokens,
  toolRequests: ToolRequestResult
): Promise<{ sceneTSX: string; fullPrompt: string; rawOutput: string }> {
  // Fetch exact prop contracts for requested primitives
  let propSpecs: string[] = [];
  toolRequests.requestedPrimitives.forEach((name) => {
    const spec = getPrimitiveSpec(name);
    if (spec) propSpecs.push(`=== PROP CONTRACT FOR <${name}> ===\n${spec}`);
  });

  // Fetch exact skill content for requested skills
  let skillGuides: string[] = [];
  toolRequests.requestedSkills.forEach((skillName) => {
    const s = getSkillByName(skillName);
    if (s) skillGuides.push(`=== CRAFT SKILL: ${s.name} ===\n${s.cleanContent}`);
  });

  const systemPrompt = `You are a World-Class Motion Graphics & High-End After-Effects React Architect.
Your task is to write FREEFORM, CREATIVE, EXPRESSIVE, UNCONSTRAINED TSX CODE for this scene!

IMPORTANT CREATIVE DIRECTIVE:
YOU ARE NOT REQUIRED TO USE THE PRIMITIVE COMPONENTS!
You have 100% complete freedom to write custom HTML, Tailwind CSS flex/grid layouts, custom SVG charts, typography, glassmorphic cards, or native React elements — OR use any primitive SDK components if you choose!

AVAILABLE STYLING TOKENS:
- primaryColor, secondaryColor, accentColor, semanticColor, errorColor, successColor, neutralColor, surfaceColor, backgroundColor, textColor, fontFamily

REQUESTED CRAFT SKILL GUIDES:
${skillGuides.join('\n\n')}

AVAILABLE PRIMITIVE COMPONENT CONTRACTS (OPTIONAL TO USE):
${propSpecs.join('\n\n')}

CREATIVE FREEDOM DIRECTIVES:
1. UNCONSTRAINED LAYOUT: Use any layout structure (<MockWindow>, <AppCanvas>, <SplitHeroLayout>, or custom Tailwind/HTML flex & grid flexbox containers) that best fits the scene blueprint.
2. RICH VISUAL DENSITY: Create stunning UI layouts with high visual polish, rich typography, color badges, SVG graphs, and metric displays.
3. DYNAMIC MOTION & ANIMATIONS: Wrap elements in transition wrappers (<SpringEnter>, <FadeBlur>, <SlideInOut>, <ScaleUp>) with staggered delays (delay={0}, delay={15}, delay={30}) and interactive cursor movements (<Cursor>).
4. OUTPUT FORMAT: Return ONLY valid TSX wrapped inside a \`\`\`tsx ... \`\`\` code block. No markdown prose, no import statements.`;

  const userPrompt = `SCENE BLUEPRINT:
  Title: "${blueprint.title}"
  Layout Structure: "${blueprint.layoutStructure}"
  Visual Directives: "${blueprint.visualDirectives}"

EXACT COPY & METRICS TO INJECT:
  Heading: "${blueprint.exactCopy.heading}"
  Subheading: "${blueprint.exactCopy.subheading}"
  Metric Values: ${JSON.stringify(blueprint.exactCopy.metrics)}
  Chart Data: ${JSON.stringify(blueprint.exactCopy.chartData)}

DESIGN SYSTEM TOKENS:
  fontFamily: "${designTokens.fontFamily}"
  primaryColor: "${designTokens.primaryColor}"
  backgroundColor: "${designTokens.backgroundColor}"
  surfaceColor: "${designTokens.surfaceColor}"
  accentColor: "${designTokens.accentColor}"
  textColor: "${designTokens.textColor}"

Generate the complete hybrid TSX scene composition now. Remember: \`\`\`tsx block only.`;

  const response = await callLLM(config, systemPrompt, userPrompt, true);
  const fullPrompt = `================================================================================\n=== PASS 2 TARGETED GENERATION SYSTEM PROMPT ===\n================================================================\n${systemPrompt}\n\n================================================================================\n=== PASS 2 TARGETED GENERATION USER PROMPT ===\n================================================================\n${userPrompt}`;

  const cleaned = sanitizeCompositionCode(response.content || '');

  return {
    sceneTSX: cleaned || `<MockWindow width={1400} height={800} visible={true}><div className="p-8 flex flex-col items-center justify-center text-center h-full bg-[#111827] text-white rounded-xl"><h1 className="text-4xl font-bold text-white">${blueprint.exactCopy.heading || blueprint.title}</h1></div></MockWindow>`,
    fullPrompt,
    rawOutput: cleaned || response.error || '',
  };
}

// ─── MULTI-SCENE COMPOSER LOOPER (GENERATE ALL SCENES) ─────────────────────────
export interface MultiSceneComposerResult {
  sceneResults: Array<{
    sceneId: string;
    title: string;
    durationInFrames: number;
    pass1: { requests: ToolRequestResult; fullPrompt: string; rawOutput: string };
    pass2: { sceneTSX: string; fullPrompt: string; rawOutput: string };
  }>;
  fullStitchedTSX: string;
  combinedPrompts: string;
  combinedOutputs: string;
}

export async function runTestAllScenesComposer(
  config: AgentConfig,
  blueprints: DetailedTestBlueprint[],
  designTokens: DesignTokens,
  ragSkills: RelevantSkill[]
): Promise<MultiSceneComposerResult> {
  const sceneResults: MultiSceneComposerResult['sceneResults'] = [];
  const sequenceJSXBlocks: string[] = [];
  let currentFrameOffset = 0;

  const promptLogs: string[] = [];
  const outputLogs: string[] = [];

  for (let i = 0; i < blueprints.length; i++) {
    const bp = blueprints[i];

    // Pass 1: Tool & Skill Discovery
    const p1 = await runTestSceneDiscovery(config, bp, ragSkills);

    // Limit requested skills to up to 2 as per Scene Composer specification
    p1.requests.requestedSkills = p1.requests.requestedSkills.slice(0, 2);

    // Pass 2: TSX Generation for Scene
    const p2 = await runTestSceneGeneratorAgent(config, bp, designTokens, p1.requests);

    sceneResults.push({
      sceneId: bp.id,
      title: bp.title,
      durationInFrames: bp.durationInFrames,
      pass1: p1,
      pass2: p2,
    });

    // Extract inner JSX element tree without swallowing component body
    let inlineTSX = p2.sceneTSX;
    const returnMatch = p2.sceneTSX.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*\}\s*$/);
    if (returnMatch && returnMatch[1] && returnMatch[1].trim().startsWith('<')) {
      inlineTSX = returnMatch[1].trim();
    }

    if (!inlineTSX || inlineTSX.length < 30) {
      inlineTSX = `<MockWindow width={1400} height={800} visible={true}><div className="p-8 flex flex-col items-center justify-center text-center h-full bg-[#111827] text-white rounded-xl"><h1 className="text-4xl font-bold text-white">${bp.title}</h1></div></MockWindow>`;
    }

    sequenceJSXBlocks.push(`      {/* SCENE #${i + 1}: ${bp.title} (${bp.durationInFrames} frames) */}
      <Sequence from={${currentFrameOffset}} durationInFrames={${bp.durationInFrames}}>
        <div className="w-full h-full flex items-center justify-center">
          ${inlineTSX}
        </div>
      </Sequence>`);

    currentFrameOffset += bp.durationInFrames;

    promptLogs.push(`=== SCENE #${i + 1} (${bp.title}) PASS 1 PROMPT ===\n${p1.fullPrompt}\n\n=== SCENE #${i + 1} PASS 2 PROMPT ===\n${p2.fullPrompt}`);
    outputLogs.push(`=== SCENE #${i + 1} (${bp.title}) PASS 1 REQUESTS ===\n${p1.rawOutput}\n\n=== SCENE #${i + 1} PASS 2 GENERATED TSX ===\n${p2.rawOutput}`);
  }

  const fullStitchedTSX = `import React from 'react';
import { Series, Sequence, useCurrentFrame } from 'remotion';
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

export default function SandboxScene() {
  const primaryColor = "${designTokens.primaryColor || '#6366f1'}";
  const secondaryColor = "${designTokens.secondaryColor || '#818cf8'}";
  const accentColor = "${designTokens.accentColor || '#f59e0b'}";
  const semanticColor = "${designTokens.semanticColor || '#3b82f6'}";
  const errorColor = "${designTokens.errorColor || '#ef4444'}";
  const successColor = "${designTokens.successColor || '#22c55e'}";
  const neutralColor = "${designTokens.neutralColor || '#27272a'}";
  const surfaceColor = "${designTokens.surfaceColor || '#18181b'}";
  const backgroundColor = "${designTokens.backgroundColor || '#09090b'}";
  const textColor = "${designTokens.textColor || '#f4f4f5'}";
  const fontFamily = "${designTokens.fontFamily || 'Inter, sans-serif'}";

  return (
    <div
      className="w-[1920px] h-[1080px] relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor, color: textColor, fontFamily }}
    >
${sequenceJSXBlocks.join('\n\n')}
    </div>
  );
}
`;

  return {
    sceneResults,
    fullStitchedTSX,
    combinedPrompts: promptLogs.join('\n\n' + '═'.repeat(80) + '\n\n'),
    combinedOutputs: outputLogs.join('\n\n' + '═'.repeat(80) + '\n\n'),
  };
}

// ─── SCENE COMPILER AGENT RUNNER ──────────────────────────────────────────────
import { runSceneCompilerAgent, SceneCompilerResult } from './subagents/sceneCompilerAgent';

export async function runTestSceneCompiler(
  config: AgentConfig,
  sceneResults: MultiSceneComposerResult['sceneResults'],
  globalTransitionPlan: string,
  designTokens: DesignTokens
): Promise<SceneCompilerResult> {
  const compilerInput = {
    scenes: sceneResults.map(s => ({
      sceneId: s.sceneId,
      title: s.title,
      durationInFrames: s.durationInFrames,
      sceneTSX: s.pass2.sceneTSX,
      exitTransition: '3d-flip',
    })),
    globalTransitionPlan: globalTransitionPlan || '3D flip 90deg seamless scene transition with camera zoom.',
    designTokens,
  };

  return await runSceneCompilerAgent(config, compilerInput);
}


