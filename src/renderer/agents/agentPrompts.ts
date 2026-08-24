/**
 * agentPrompts.ts
 *
 * Central registry of every agent's system prompt.
 * Import this in PromptSandbox (or any dev tool) to read the prompts without
 * running the agents.
 *
 * NOTE: Agent prompts that are built dynamically (Component Creator)
 * expose their base/static version here.
 */

import { BRAND_DISCOVERY_SYSTEM, DESIGN_AGENT_SYSTEM } from './subagents/designAgent';
import {
  FREELANCE_INTERVIEW_SYSTEM,
  MASTER_DIRECTOR_SYSTEM,
  PER_SCENE_SUBAGENT_SYSTEM,
} from './subagents/storyboardAgent';
import { buildSceneCreatorSystemPrompt } from './subagents/sceneCreator';
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
    systemPrompt: buildSceneCreatorSystemPrompt('', ''),
    description: 'Builds a single primitive component with rich props and inner JSX for the scene.',
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
