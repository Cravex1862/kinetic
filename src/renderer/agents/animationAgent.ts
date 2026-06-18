import { callLLM } from './llmClient';
import type { AgentConfig, StoryboardScene, ComponentTree, AnimationPlan } from './types';

const SYSTEM_PROMPT = `You are a motion designer for a keyframe animation engine. Given a scene description and component tree, assign animations.

Animatable properties (from MorphRegistry):
- Number: x, y, width, height, scale, rotation, opacity, blur, borderRadius, padding, gap, columns, sidebarWidth, splitRatio, blur, saturate, glowIntensity, glowSpread
- Color: backgroundColor, borderColor, primaryColor, accentColor, color
- Vec2: position, offset, translate
- Boolean: collapsed, visible, expanded, highlighted, toggled, showHand, showCursor
- String: url, panelSize, windowStyle, sidebarPosition, direction, variant, trend, status, size

Easing presets: ease-in-out, ease-in, ease-out, linear, bounce

For each component, define a keyframe with from/to configs. Duration should match or be less than the scene duration.
Return valid JSON only.

Output format:
{
  "keyframes": [
    {
      "component": "BrowserFrame",
      "from": { "opacity": 0, "scale": 0.95 },
      "to": { "opacity": 1, "scale": 1 },
      "duration": 30,
      "easing": "ease-out"
    }
  ]
}`;

export async function runAnimationAgent(
  config: AgentConfig,
  scene: StoryboardScene,
  components: ComponentTree,
): Promise<{ animation?: AnimationPlan; error?: string }> {
  const userPrompt = `Scene: "${scene.description}" (duration: ${scene.duration} frames)\n\nComponent tree:\n${JSON.stringify(components, null, 2)}`;

  const result = await callLLM(config, SYSTEM_PROMPT, userPrompt);
  console.log("Raw AI Animation Output:", result.content);
  if (result.error) return { error: result.error };

  try {
    const cleaned = result.content.replace(/```json/gi,'').replace(/```/g,'').trim();
    const parsed = JSON.parse(cleaned) as AnimationPlan;
    if (!parsed.keyframes || !Array.isArray(parsed.keyframes)) {
      return { error: 'Animation agent returned invalid keyframes' };
    }
    return { animation: parsed };
  } catch (e) {
    console.error("Failed to parse animation JSON. Error details:", e);
    return { error: 'Failed to parse animation plan from LLM response' };
  }
}
