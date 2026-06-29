import { callLLM } from './llmClient';
import type { AgentConfig, Storyboard, StoryboardScene } from './types';

const SYSTEM_PROMPT = `You are a video storyboard planner. Given a user's prompt and narration script, produce a JSON storyboard with scenes.

Rules:
- Choose the optimal number of scenes (usually 3 to 6 scenes depending on narration length and visual pacing) to tell the story effectively.
- Each scene gets a duration between 30-120 frames (at 30fps).
- Assign a concise description for each scene.
- Distribute the narration script sequentially across these scenes so that the entire text is covered naturally in order.
- The total duration should be reasonable for the narration length (approx 2-3 words per second, or 10-15 words per 30-frame scene).
- Return valid JSON only, no markdown.

Output format:
{
  "scenes": [
    {
      "id": "scene-1",
      "description": "Opening shot of the dashboard",
      "duration": 60,
      "narration": "Welcome to our platform..."
    }
  ]
}`;

export async function runManager(config: AgentConfig, prompt: string, narration: string): Promise<{ storyboard?: Storyboard; error?: string }> {
  const userPrompt = `User prompt: "${prompt || 'No prompt provided'}"\n\nNarration:\n"${narration || 'No narration script provided'}"\n\nAnalyze the prompt and narration above, decide on the optimal number of scenes, and distribute the narration sequentially across the scenes.`;

  const result = await callLLM(config, SYSTEM_PROMPT, userPrompt);
  console.log("Raw AI Storyboard Output:", result.content);
  if (result.error) return { error: result.error };

  try {
    const cleaned = result.content.replace(/```json/gi, '').replace(/```/gi, '').trim()
    const parsed = JSON.parse(cleaned) as { scenes: StoryboardScene[] };
    if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return { error: 'Manager returned empty storyboard' };
    }
    return { storyboard: parsed };
  } catch (e) {
    console.error("Failed to parse storyboard JSON. Error details:", e);
    return { error: 'Failed to parse storyboard from LLM response' };
  }
}
