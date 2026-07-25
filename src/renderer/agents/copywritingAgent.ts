import { callLLM, safeParseJson } from './llmClient';
import type { AgentConfig, StoryboardScene } from './types';

const SYSTEM_PROMPT = `You are a copywriter for video motion graphics. Given a scene, generate polished on-screen text.

Return a JSON object with:
- captions: array of short text lines that appear on screen during this scene (2-5 items)
- labels: array of on-screen UI labels or headings (1-3 items)
- voiceover: a refined version of the narration text suitable for voiceover

Return valid JSON only.

Output format:
{
  "captions": ["Welcome to the platform", "Your data at a glance"],
  "labels": ["Dashboard", "Analytics"],
  "voiceover": "Welcome to our platform. Here you can see all your key metrics."
}`;

interface CopywritingOutput {
  captions: string[];
  labels: string[];
  voiceover: string;
}

export async function runCopywritingAgent(
  config: AgentConfig,
  scene: StoryboardScene,
): Promise<{ copy?: CopywritingOutput; error?: string }> {
  const userPrompt = `Scene: "${scene.description}"\nDuration: ${scene.duration} frames\nNarration: "${scene.narration}"\n\nGenerate on-screen copy for this scene.`;

  const result = await callLLM(config, SYSTEM_PROMPT, userPrompt);
  console.log("Raw AI Copywriting Output:", result.content);
  if (result.error) return { error: result.error };

  const parsed = safeParseJson<CopywritingOutput>(result.content, {
    captions: [],
    labels: [],
    voiceover: scene.narration,
  });

  return { copy: parsed };
}

