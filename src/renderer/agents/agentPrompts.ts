/**
 * agentPrompts.ts
 *
 * Central registry of every agent's system prompt.
 * Import this in PromptSandbox (or any dev tool) to read the prompts without
 * running the agents.
 *
 * NOTE: Agent prompts that are built dynamically (Layout Assembler,
 * Component Creator, Animator) expose their base/static version here.
 */

import { BRAND_DISCOVERY_SYSTEM, DESIGN_AGENT_SYSTEM } from './subagents/designAgent';
import {
  FREELANCE_INTERVIEW_SYSTEM,
  MASTER_DIRECTOR_SYSTEM,
  PER_SCENE_SUBAGENT_SYSTEM,
} from './subagents/storyboardAgent';
import { buildLayoutAssemblerSystemPrompt } from './subagents/layoutAssemblerAgent';
import { buildComponentCreatorSystemPrompt } from './subagents/sceneCreator';
import { SCENE_COMPILER_SYSTEM } from './subagents/sceneCompilerAgent';
import { VERIFIER_SYSTEM, EDIT_AGENT_SYSTEM } from './subagents/verifierAgent';

export interface AgentStagePrompt {
  /** Displayed name in the sandbox list */
  stage: string;
  /** Which pipeline step this belongs to (1-based) */
  step: number;
  /** The system prompt text */
  systemPrompt: string;
  /** Short description of what this agent does */
  description: string;
}

export const AGENT_STAGE_PROMPTS: AgentStagePrompt[] = [
  {
    stage: 'Step 1 — Brand Discovery (Design Agent Pass 1)',
    step: 1,
    systemPrompt: BRAND_DISCOVERY_SYSTEM,
    description: 'Selects 1-2 brand design kits from the catalog that match the video prompt.',
  },
  {
    stage: 'Step 1 — Design Token Synthesis (Design Agent Pass 2)',
    step: 1,
    systemPrompt: DESIGN_AGENT_SYSTEM,
    description: 'Synthesizes a cohesive visual theme (colors, fonts) from the chosen brands.',
  },
  {
    stage: 'Step 2 — Client Interview (Storyboard Agent)',
    step: 2,
    systemPrompt: FREELANCE_INTERVIEW_SYSTEM,
    description: 'Generates 5-10 discovery questions to clarify the video brief before storyboarding.',
  },
  {
    stage: 'Step 2 — Master Director (Storyboard Agent)',
    step: 2,
    systemPrompt: MASTER_DIRECTOR_SYSTEM,
    description: 'Plans the overall video structure: scene count, durations, global transitions.',
  },
  {
    stage: 'Step 2 — Per-Scene Subagent (Storyboard Agent)',
    step: 2,
    systemPrompt: PER_SCENE_SUBAGENT_SYSTEM,
    description: 'Details every element in a single scene: layout, components, animations, copy.',
  },
  {
    stage: 'Step 3 — Component Creator (Layout Assembler)',
    step: 3,
    systemPrompt: buildComponentCreatorSystemPrompt('<Primitive>', '<PropSpec>', ''),
    description: 'Builds a single primitive component with rich props and inner JSX for the scene.',
  },
  {
    stage: 'Step 3 — Layout Assembler',
    step: 3,
    systemPrompt: buildLayoutAssemblerSystemPrompt(),
    description: 'Arranges the generated component tags into a full 1920×1080 scene layout.',
  },
  {
    stage: 'Step 4 — Animator (Pass 1: Motion Discovery)',
    step: 4,
    systemPrompt: `You are a Lead Remotion Motion Graphics Choreographer.
Your job in Pass 1 is to inspect a generated TSX scene composition and select which Motion Wrappers, Motion SDK Tools, and Motion Skills you want to use to bring it to life.

Return ONLY a valid JSON object specifying:
{
  "requestedTransitions": ["SpringEnter", "SlideInOut"],
  "requestedMotions": ["Cursor", "TextTyper"],
  "requestedMotionSkills": ["motion-graphics-pro"],
  "motionStrategy": "Brief 1-sentence choreography plan."
}`,
    description: 'Decides which motion wrappers, SDK tools and skills to apply to the scene.',
  },
  {
    stage: 'Step 4 — Animator (Pass 2: Motion Generation)',
    step: 4,
    systemPrompt: `You are a Lead Motion Graphics UI & Remotion Animator.
Your job is to take a complete TSX scene composition and animate every single key element using staggered entrances, interactive cursors, 3D perspective flips, and smooth motion wrappers!

CRITICAL ANIMATION RULES (STRICTLY ENFORCED):
1. STAGGER ALL ENTRANCES (DELAY OFFSETTING): Wrap outer container in <SpringEnter delay={0}>.
2. ADD INTERACTIVE CURSOR MOTION: add <Cursor> to simulate clicking a status badge or button.
3. SUBTLE 3D PERSPECTIVE TILTS: Apply on <MockWindow rotateX={6} rotateY={-5} perspective={1200}>.
4. PRESERVE ORIGINAL SCENE CONTENT: Keep all exact text, titles, numbers intact.
5. OUTPUT FORMAT: Return ONLY valid TSX wrapped inside a \`\`\`tsx ... \`\`\` block.`,
    description: 'Wraps the scene TSX with animations, cursors, staggered entrances and 3D tilts.',
  },
  {
    stage: 'Step 5 — Scene Compiler',
    step: 5,
    systemPrompt: SCENE_COMPILER_SYSTEM,
    description: 'Compiles individual scene TSX files into one master VideoComposition.tsx with 3D transitions.',
  },
  {
    stage: 'Step 6 — Verifier',
    step: 6,
    systemPrompt: VERIFIER_SYSTEM,
    description: 'Line-by-line syntax checker. Returns "verify" or a JSON patch array.',
  },
  {
    stage: 'Step 6 — Edit Agent',
    step: 6,
    systemPrompt: EDIT_AGENT_SYSTEM,
    description: 'Applies user edit requests as targeted line patches to the final composition.',
  },
];
