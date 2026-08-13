import { callLLM, safeParseJson, sanitizeCompositionCode } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';
import { findRelevantSkills, getSkillByName, RelevantSkill } from '../../utils/skillRAG';

export interface MotionRequestResult {
  requestedTransitions: string[];
  requestedMotions: string[];
  requestedMotionSkills: string[];
  motionStrategy: string;
}

const TRANSITION_SDK_SPECS: Record<string, string> = {
  SpringEnter: 'Props: children, delay?: number, mass?: number, damping?: number, stiffness?: number, style?: StyleConfig',
  FadeBlur: 'Props: children, duration?: number, startBlur?: number, style?: StyleConfig',
  SlideInOut: 'Props: children, direction?: "left"|"right"|"top"|"bottom", distance?: number, duration?: number, fade?: boolean, style?: StyleConfig',
  ScaleUp: 'Props: children, delay?: number, initialScale?: number, style?: StyleConfig',
  StaggerContainer: 'Props: children, staggerDelay?: number, style?: StyleConfig',
};

const MOTION_SDK_SPECS: Record<string, string> = {
  Cursor: 'Props: startX: number, startY: number, endX?: number, endY?: number, clickFrame?: number, duration?: number, cursorColor?: string',
  TextTyper: 'Props: text: string, startFrame?: number, speed?: number, style?: React.CSSProperties',
  FocusZoom: 'Props: children, zoomFrame?: number, zoomScale?: number, focusX?: number, focusY?: number',
  ChartAnimate: 'Props: children, startFrame?: number, durationInFrames?: number',
  ProgressRing: 'Props: progress: number, size?: number, strokeWidth?: number, color?: string',
  MarqueeTrack: 'Props: children, speed?: number, direction?: "left"|"right"',
  TypingGhostCursor: 'Props: targetText: string, startFrame?: number, style?: React.CSSProperties',
};

// ─── PASS 1: MOTION DISCOVERY ──────────────────────────────────────────────────
export async function runAnimatorDiscovery(
  config: AgentConfig,
  sceneTSX: string,
  designTokens: DesignTokens,
  scenePurpose: string
): Promise<{ requests: MotionRequestResult; fullPrompt: string; rawOutput: string }> {
  // Fetch top 2 motion skills from RAG
  let ragSkills: RelevantSkill[] = [];
  try {
    ragSkills = await findRelevantSkills(`${scenePurpose} motion animation`, 2, 'motion');
  } catch {}

  const availableTransitions = Object.keys(TRANSITION_SDK_SPECS);
  const availableMotions = Object.keys(MOTION_SDK_SPECS);
  const recommendedSkills = ragSkills.map((s) => s.name);

  const discoverySystem = `You are a Lead Remotion Motion Graphics Choreographer.
Your job in Pass 1 is to inspect a generated TSX scene composition and select which Motion Wrappers, Motion SDK Tools, and Motion Skills you want to use to bring it to life.

AVAILABLE TRANSITIONSDK WRAPPERS:
${JSON.stringify(availableTransitions)}

AVAILABLE MOTIONSDK ACTION COMPONENTS:
${JSON.stringify(availableMotions)}

RECOMMENDED MOTION SKILLS (RAG):
${JSON.stringify(recommendedSkills)}

Inspect the Scene TSX below and return JSON choosing:
1. "requestedTransitions": Select 1 to 3 Transition wrappers (e.g. SpringEnter, FadeBlur, SlideInOut).
2. "requestedMotions": Select 1 to 2 Motion action components (e.g. Cursor, TextTyper).
3. "requestedMotionSkills": Select 1 to 2 Motion skills (e.g. 60fps-animation, kinetic-typography).
4. "motionStrategy": 1-2 sentence description of your stagger timeline and keyframes.

Return ONLY a valid JSON object matching this exact structure:
{
  "requestedTransitions": ["SpringEnter", "FadeBlur", "SlideInOut"],
  "requestedMotions": ["Cursor"],
  "requestedMotionSkills": ["60fps-animation"],
  "motionStrategy": "SpringEnter on MockWindow (delay=0), staggered SlideInOut on metric cards (delay=15), Cursor clicking operational badge at frame 45."
}`;

  const discoveryUser = `SCENE TSX TO ANIMATE:
\`\`\`tsx
${sceneTSX}
\`\`\`

Accent Color: "${designTokens.accentColor}"
Scene Purpose: "${scenePurpose}"

Select your requested motion tools now. Valid JSON ONLY.`;

  const response = await callLLM(config, discoverySystem, discoveryUser, false);
  const fullPrompt = `=== PASS 1 MOTION DISCOVERY SYSTEM PROMPT ===\n${discoverySystem}\n\n=== PASS 1 MOTION DISCOVERY USER PROMPT ===\n${discoveryUser}`;

  const rawOutput = response.content || response.error || '';
  const parsed = safeParseJson<MotionRequestResult>(rawOutput, {
    requestedTransitions: ['SpringEnter', 'FadeBlur', 'SlideInOut'],
    requestedMotions: ['Cursor'],
    requestedMotionSkills: recommendedSkills,
    motionStrategy: 'Stagger SpringEnter and SlideInOut with interactive Cursor click.',
  });

  return {
    requests: {
      requestedTransitions: Array.isArray(parsed.requestedTransitions) && parsed.requestedTransitions.length > 0
        ? parsed.requestedTransitions
        : ['SpringEnter', 'SlideInOut'],
      requestedMotions: Array.isArray(parsed.requestedMotions) && parsed.requestedMotions.length > 0
        ? parsed.requestedMotions
        : ['Cursor'],
      requestedMotionSkills: Array.isArray(parsed.requestedMotionSkills) && parsed.requestedMotionSkills.length > 0
        ? parsed.requestedMotionSkills
        : recommendedSkills,
      motionStrategy: parsed.motionStrategy || 'Staggered entrances and smooth cursor interaction.',
    },
    fullPrompt,
    rawOutput: JSON.stringify(parsed, null, 2),
  };
}

// ─── PASS 2: TARGETED SCENE ANIMATION ─────────────────────────────────────────
export async function runAnimatorGeneratorAgent(
  config: AgentConfig,
  sceneTSX: string,
  designTokens: DesignTokens,
  motionRequests: MotionRequestResult
): Promise<{ animatedTSX: string; fullPrompt: string; rawOutput: string }> {
  // Build transition specs
  const transitionSpecs = motionRequests.requestedTransitions
    .map((name) => TRANSITION_SDK_SPECS[name] ? `- ${name}: ${TRANSITION_SDK_SPECS[name]}` : '')
    .filter(Boolean)
    .join('\n');

  // Build motion specs
  const motionSpecs = motionRequests.requestedMotions
    .map((name) => MOTION_SDK_SPECS[name] ? `- ${name}: ${MOTION_SDK_SPECS[name]}` : '')
    .filter(Boolean)
    .join('\n');

  // Fetch motion skill guides
  let skillGuides: string[] = [];
  motionRequests.requestedMotionSkills.forEach((skillName) => {
    const s = getSkillByName(skillName);
    if (s) skillGuides.push(`=== MOTION SKILL: ${s.name} ===\n${s.cleanContent}`);
  });

  const systemPrompt = `You are a Lead Motion Graphics UI & Remotion Animator.
Your job is to take a complete TSX scene composition and animate every single key element using staggered entrances, interactive cursors, 3D perspective flips, and smooth motion wrappers!

AVAILABLE TRANSITIONSDK SPECS:
${transitionSpecs}

AVAILABLE MOTIONSDK SPECS:
${motionSpecs}

RETRIEVED MOTION CRAFT GUIDES:
${skillGuides.join('\n\n')}

MOTION STRATEGY CHOSEN IN PASS 1:
"${motionRequests.motionStrategy}"

CRITICAL ANIMATION RULES (STRICTLY ENFORCED):
1. STAGGER ALL ENTRANCES (DELAY OFFSETTING):
   - Wrap outer container (\`<MockWindow>\` or \`<BrowserFrame>\`) in \`<SpringEnter delay={0}>\`.
   - Wrap inner left metric card in \`<SlideInOut direction="left" delay={15}>\`.
   - Wrap inner right metric card or chart in \`<SlideInOut direction="right" delay={25}>\`.
2. ADD INTERACTIVE CURSOR MOTION:
   - If requested, add \`<Cursor targetX={1450} targetY={180} clickFrame={45} color="${designTokens.accentColor}" />\` to simulate a 3D hand cursor clicking a status badge or button!
3. SUBTLE 3D PERSPECTIVE TILTS:
   - Apply subtle 3D tilt props on \`<MockWindow rotateX={6} rotateY={-5} perspective={1200}>\`.
4. PRESERVE ORIGINAL SCENE CONTENT:
   - Keep all exact text, titles, numbers, and Tailwind classes from the input TSX intact!
5. OUTPUT FORMAT: Return ONLY valid TSX wrapped inside a \`\`\`tsx ... \`\`\` block. No markdown prose, no import statements.`;

  const userPrompt = `ORIGINAL TSX SCENE TO ANIMATE:
\`\`\`tsx
${sceneTSX}
\`\`\`

Accent Color: "${designTokens.accentColor}"

Animate this full scene composition now. Remember: \`\`\`tsx block only.`;

  const response = await callLLM(config, systemPrompt, userPrompt, true);
  const fullPrompt = `================================================================================\n=== PASS 2 MOTION GENERATION SYSTEM PROMPT ===\n================================================================\n${systemPrompt}\n\n================================================================================\n=== PASS 2 MOTION GENERATION USER PROMPT ===\n================================================================\n${userPrompt}`;

  const cleaned = sanitizeCompositionCode(response.content || '');

  return {
    animatedTSX: cleaned || sceneTSX,
    fullPrompt,
    rawOutput: cleaned || response.error || '',
  };
}

// Legacy single-pass runner for backwards compatibility
export async function runAnimatorAgent(
  config: AgentConfig,
  componentJSX: string,
  primitiveName: string,
  designTokens: DesignTokens,
  delayHint: number = 0,
  scenePurpose: string = ''
): Promise<string> {
  const discovery = await runAnimatorDiscovery(config, componentJSX, designTokens, scenePurpose);
  const res = await runAnimatorGeneratorAgent(config, componentJSX, designTokens, discovery.requests);
  return res.animatedTSX;
}
