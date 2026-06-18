import { callLLM } from './llmClient';
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

export async function runCopywritingAgent(
  config: AgentConfig,
  scene: StoryboardScene,
): Promise<{ copy?: { captions: string[]; labels: string[]; voiceover: string }; error?: string }> {
  const userPrompt = `Scene: "${scene.description}"\nDuration: ${scene.duration} frames\nNarration: "${scene.narration}"\n\nGenerate on-screen copy for this scene.`;

  const result = await callLLM(config, SYSTEM_PROMPT, userPrompt);
  console.log("Raw AI Copywriting Output:", result.content);
  if (result.error) return { error: result.error };

  try {
    const cleaned = result.content.replace(/```json/gi, '').replace(/```/g,'').trim();
    const parsed = JSON.parse(cleaned) as { captions: string[]; labels: string[]; voiceover: string };
    return { copy: parsed };
  } catch (e) {
    console.error("Failed to parse copywriting JSON. Error details:", e);
    return { error: 'Failed to parse copy from LLM response' };
  }
}
