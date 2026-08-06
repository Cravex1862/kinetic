import { callLLM, getStoredConfig } from "@/renderer/agents/llmClient";
import type { AgentConfig } from "@/renderer/agents/types";
import { PipelineState } from "@/renderer/agents/types";
import { stripAllImports } from "@/renderer/agents/pipeline";

export type MinecraftPipelineCallback = (state: PipelineState) => void;

export interface MinecraftPipelineInput {
  prompt: string;
  selectedItems: string[];
  activeHotbarIndex: number;
  voiceoverMode: 'script' | 'audio';
  scriptText: string;
  voiceoverFile?: File | null;
  soundtrackFile?: File | null;
  savePath?: string;
  projectTitle?: string;
  onState: MinecraftPipelineCallback;
  onCheckpoint?: (checkpoint: Record<string, unknown>) => void;
}

// ─── Stage 1: Storyboard Generator ───────────────────────────

interface MinecraftSceneDescriptor {
  id: string;
  description: string;
  duration: number; // in frames @ 30fps
}

async function runMinecraftStoryboardAgent(
  config: AgentConfig,
  prompt: string,
  selectedItems: string[],
  scriptText: string
): Promise<MinecraftSceneDescriptor[]> {
  const itemsText = selectedItems.length > 0 ? selectedItems.join(', ') : 'diamond_sword, apple, emerald';
  
  const systemPrompt = `You are a Minecraft Motion Graphics Storyboarder for Remotion video scenes.
Based on the user's prompt and selected items, break down the video into 2 to 4 animated sequence scenes (total duration: 150–300 frames @ 30fps = 5-10 seconds).

Return a JSON array of scene objects matching this schema:
[
  { "id": "scene_1", "description": "Brief description of scene action", "duration": 90 }
]

Return ONLY valid JSON with no markdown wrapper or explanation text.`;

  const userPrompt = `User Prompt: ${prompt}
Selected Minecraft Items: ${itemsText}
Script Text: ${scriptText || 'None'}`;

  try {
    const response = await callLLM(config, systemPrompt, userPrompt, true);
    if (response.content) {
      const cleanJson = response.content.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[MinecraftPipeline] Storyboard LLM error, using fallback scenes:', err);
  }

  // Fallback scenes
  return [
    { id: 'scene_1', description: 'Minecraft Intro & Steve Character Greeting', duration: 90 },
    { id: 'scene_2', description: 'Inventory GUI Open & Selected Items Showcase', duration: 120 },
    { id: 'scene_3', description: 'Hotbar Selection & In-Game Chat Alert', duration: 90 },
  ];
}

// ─── Stage 2: Minecraft Scene Code Agent ─────────────────────

async function runMinecraftCodeAgent(
  config: AgentConfig,
  prompt: string,
  scenes: MinecraftSceneDescriptor[],
  selectedItems: string[],
  activeHotbarIndex: number,
  scriptText: string
): Promise<{ tsxCode?: string; error?: string }> {
  const itemsText = selectedItems.length > 0 ? selectedItems.join(', ') : 'diamond_sword, apple, emerald, golden_apple';

  const systemPrompt = `You are an elite Remotion React developer creating a high-quality Minecraft-themed video walkthrough composition.

AVAILABLE MINECRAFT PRIMITIVE COMPONENTS (Imported from '../../primitives/minecraft'):
- <WholeInventory activeHotbarIndex={number} onSelectHotbarSlot={fn} characterPreview={<SteveCharacter3D />} hotbarSlots={array} armorSlots={array} shieldSlot={slot} />
- <Hotbar slots={array} activeSlotIndex={number} />
- <InventorySlot itemName="Name" count={64} itemIcon="diamond_sword" isActive={boolean} isSelected={boolean} durabiltyPercent={number} />
- <SteveCharacter3D className="w-[120px] h-[160px]" autoRotate={boolean} />
- <MinecraftChat messages={[{ sender: "Steve", message: "Hello!", color: "#55FF55" }]} />
- <MinecraftButton label="Build Scene" onClick={fn} />
- <MinecraftTitleScreen title="Minecraft World" subtitle="Created with Kinetic" />

SELECTED ITEMS FOR SHOWCASE:
${itemsText}

ACTIVE HOTBAR INDEX: ${activeHotbarIndex >= 0 ? activeHotbarIndex : 0}

SCRIPT / NARRATION: ${scriptText || 'Welcome to the Minecraft showcase!'}

TIMING & SCENES:
${scenes.map(s => `- ${s.id}: ${s.description} (${s.duration} frames)`).join('\n')}
Total Duration: ${scenes.reduce((acc, s) => acc + s.duration, 0)} frames @ 30 FPS.

RULES:
1. Export a single React component named \`Scene1\`:
   export const Scene1: React.FC = () => { ... };
2. Use Remotion hooks: useCurrentFrame(), useVideoConfig(), spring(), interpolate().
3. Structure scenes cleanly using <Sequence> components mapped to exact frame offsets.
4. Render authentic pixel-perfect Minecraft GUI overlays with Dark Minecraft canvas backdrop (#09090b).
5. Do NOT write import statements — imports are auto-injected.
6. Return ONLY valid TSX component code inside TSX codeblock.`;

  const userPrompt = `Build the complete Minecraft Remotion video composition for: "${prompt}"`;

  const response = await callLLM(config, systemPrompt, userPrompt, true);
  if (response.error || !response.content) {
    return { error: response.error || 'Failed to generate Minecraft scene code.' };
  }

  const tsxCode = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
  return { tsxCode };
}

// ─── Stage 3: Verifier Agent ─────────────────────────────────

async function runMinecraftVerifierAgent(
  config: AgentConfig,
  code: string
): Promise<{ verifiedCode: string }> {
  const systemPrompt = `You are a Remotion TSX Code Verifier for Minecraft video scenes.
Verify and fix syntax, unclosed JSX tags, missing props, or invalid Remotion spring/interpolate hooks.
Ensure component is exported as: export const Scene1: React.FC = () => { ... };
Return ONLY the corrected TSX code without markdown wrapper.`;

  try {
    const response = await callLLM(config, systemPrompt, code, true);
    if (response.content) {
      const clean = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
      return { verifiedCode: clean };
    }
  } catch (err) {
    console.warn('[MinecraftPipeline] Verifier call error:', err);
  }

  return { verifiedCode: code };
}

// ─── Main Minecraft Pipeline Orchestrator ─────────────────────

export async function runMinecraftPipeline(input: MinecraftPipelineInput): Promise<string> {
  const {
    prompt, selectedItems, activeHotbarIndex,
    voiceoverMode, scriptText,
    savePath, projectTitle, onState, onCheckpoint
  } = input;

  const config = getStoredConfig();
  if (!config) {
    onState({ status: 'error', progress: 0, error: 'No API key configured. Set one in Settings.' });
    return '';
  }

  // 1. Storyboarding
  onState({ status: 'storyboarding', progress: 0.1 });
  console.log('[MinecraftPipeline] Stage 1: Storyboarding Minecraft scenes...');
  const scenes = await runMinecraftStoryboardAgent(config, prompt, selectedItems, scriptText);
  const totalFrames = scenes.reduce((acc, s) => acc + s.duration, 0);

  // Initial checkpoint
  const initialData = {
    title: projectTitle || 'Minecraft Showcase',
    prompt,
    scenes,
    unfinished: true,
    savePath,
  };
  if (savePath && window.electronAPI?.writeFile) {
    window.electronAPI.writeFile(savePath, JSON.stringify(initialData, null, 2));
  }
  if (onCheckpoint) onCheckpoint(initialData);

  // 2. Code Generation
  onState({ status: 'designing', progress: 0.35 });
  console.log('[MinecraftPipeline] Stage 2: Generating Minecraft scene code...');
  const codeResult = await runMinecraftCodeAgent(
    config,
    prompt,
    scenes,
    selectedItems,
    activeHotbarIndex,
    scriptText
  );

  if (codeResult.error || !codeResult.tsxCode) {
    onState({ status: 'error', progress: 0.35, error: codeResult.error || 'Scene generation failed.' });
    return '';
  }

  // 3. Verification
  onState({ status: 'compiling', progress: 0.7 });
  console.log('[MinecraftPipeline] Stage 3: Verifying scene code...');
  const verified = await runMinecraftVerifierAgent(config, codeResult.tsxCode);
  const cleanedCode = stripAllImports(verified.verifiedCode);

  // 4. Assembly
  onState({ status: 'compiling', progress: 0.9 });
  console.log('[MinecraftPipeline] Stage 4: Assembling final composition...');

  const finalComposition = `import React from 'react';
import { Series, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, AbsoluteFill, Img, staticFile } from 'remotion';

import {
  WholeInventory, Hotbar, InventorySlot, SteveCharacter3D,
  MinecraftChat, MinecraftButton, MinecraftTitleScreen
} from '../../primitives/minecraft';

${cleanedCode}

export const VideoComposition: React.FC = () => {
  return (
    <AbsoluteFill className="bg-gray-950 flex items-center justify-center">
      <Scene1 />
    </AbsoluteFill>
  );
};
`;

  onState({ status: 'done', progress: 1.0 });
  console.log('[MinecraftPipeline] Pipeline complete!');

  return finalComposition;
}
