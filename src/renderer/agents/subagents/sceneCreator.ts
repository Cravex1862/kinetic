import { callLLM } from "../llmClient";
import { extractCodeBlock } from "../compositionStore";
import type { AgentConfig } from "../types";
import {
  findRelevantSkills,
  SkillCategory,
} from "../../utils/skillRAG";

export interface AgentResultWithPrompt {
  code: string;
  systemPrompt: string;
  userPrompt: string;
}

// ─── System Prompt Builder with RAG Skill Guides ─────
export function buildSceneCreatorSystemPrompt(
  skillGuideText?: string,
  sceneID?: string,
): string {
  return `You are a Lead Motion Graphics UI & React Developer.
Your job is to build a high-impact, professional video scene. 


Skills are availble design rules to help you think like a professional designer while creating scenes. Availble Skills : \n
ad-creative-video, launch-video, testimonial-video, animated-infographic, chart-animation, presentation-video, photo-slideshow, 
product-demo-video, promo-video, diagram-animation, explainer-video, isometric-animation, whiteboard-animation, wrapped-video, 
brand-motion-guidelines, client-revisions, creative-brief, motion-pricing, video-delivery-specs, generative-illustration, 
kinetic-typography, manim, map-animation, after-effects, animation-principles, beat-sync-editing, color-motion, logo-animation, 
motion-art-direction, motion-background, remotion-video, shot-composition, text-message-animation, caption-animation, countdown-video, 
lower-thirds, short-form-video, 60fps-animation, accessible-animation, ascii-animation, glassmorphism, gsap-web, lottie-animation, 
micro-interaction, page-transition-animation, svg-animation, particle-system, shader-glsl, threejs-animation, audiogram, youtube-intro-outro


Recommended Skills by an embedding model:
${skillGuideText}

IN-SCOPE STYLING VARIABLES (AVAILABLE IN SCOPE — USE THESE DIRECTLY IN JSX):\n
- primaryColor    (Use for main buttons, active pills, primary glowConfig.color, highlight text)\n
- secondaryColor  (Use for secondary highlights, badge outlines, subtitled tags)\n
- accentColor     (Use for key accent highlights, sparkline strokes, warning/attention dots)\n
- semanticColor   (Use for info notifications, links, blue status pills)\n
- errorColor      (Use for critical alerts, down trend indicators, error badges, red dots)\n
- successColor    (Use for positive growth badges (+2.4%), active indicators, online/optimal pills, up trends)\n
- neutralColor    (Use for muted borders, subtle timestamps, inactive menu items)\n
- surfaceColor    (Use for card containers, window headers, panel backgrounds)\n
- backgroundColor  (Use for outer wrapper backdrops and dark gradients)\n
- textColor       (Use for headers, titles, and body text)\n
- fontFamily      (Use for all inline style fontFamily declarations)\n

EXAMPLE IN-SCOPE VARIABLE USAGE IN JSX:\n
  style={{ backgroundColor: surfaceColor, color: textColor, fontFamily: fontFamily, border: "1px solid " + neutralColor }}\n
  <span style={{ color: successColor, backgroundColor: "rgba(34, 197, 94, 0.15)" }}>+2.4%</span>\n
  glowConfig={{ enabled: true, color: primaryColor, intensity: 8, spread: 4 }}\n

CRITICAL MANDATES & NON-EMPTY CONSTRAINTS (STRICTLY ENFORCED):\n
1. USE IN-SCOPE COLOR VARIABLES: Always use primaryColor, secondaryColor, accentColor, semanticColor, errorColor, successColor, neutralColor, surfaceColor, backgroundColor, textColor, fontFamily.\n
2. DOMAIN RELEVANCY: Fill all text, titles, labels, and numbers with authentic context matching the scene objective.\n
3. CODE FORMAT: Return ONLY valid TSX inside a \`\`\`tsx ... \`\`\` block. No markdown prose, no imports, no export default wrappers. The component MUST be named exactly: export const ${sceneID} = () => {{ ... }}
4. Relevant craft skills have been provided above — apply them directly. Output ONLY the tsx block, nothing else.`;
}

// ─── Agent Runner with Detailed Prompt Return ─────────────────────────────────
export async function runSceneCreatorAgentDetailed(
  config: AgentConfig,
  scene: string,
  isBackground: boolean = false,
  sceneID: string,
): Promise<AgentResultWithPrompt> {
  const category = /chart|graph|metric|funnel|sparkline/i.test(scene)
    ? "data"
    : "layout";

  let skillGuideText = "";
  try {
    const skills = await findRelevantSkills(scene, 2, category as SkillCategory);
    if (skills.length > 0) {
      skillGuideText = skills
        .map((s) => `=== CRAFT SKILL: ${s.name} ===\n${s.cleanContent}`)
        .join("\n\n");
      console.log(`[SceneCreator] Injected ${skills.length} skill(s): ${skills.map((s) => s.name).join(', ')}`);
    } else {
      console.warn(`[SceneCreator] No relevant skills found for scene: "${scene.slice(0, 60)}..."`);
    }
  } catch (err) {
    console.warn(`[SceneCreator] Skill RAG retrieval failed:`, err);
  }

  const systemPrompt = buildSceneCreatorSystemPrompt(
    skillGuideText,
    sceneID,
  );

  const positionHint = isBackground
    ? "Role: Full-screen background or layout container. Fill the entire canvas width & height."
    : "Role: Hero content element. Embed and surround with rich headers, SVG badges, and metric pills to fill the canvas.";

  const userPrompt = `Scene : "${scene}"
        ${positionHint}

 Remember: \`\`\`tsx block only.`;

  let response = await callLLM(config, systemPrompt, userPrompt, true);

  if (response.error || !response.content) {
    console.error("[SceneCreator] Scene generation failed:", response.error);
    return { code: "", systemPrompt, userPrompt };
  }

  const cleaned = extractCodeBlock(response.content);

  return {
    code: cleaned,
    systemPrompt,
    userPrompt,
  };
}

export async function runSceneCreatorAgent(
  config: AgentConfig,
  scene: string,
  isBackground: boolean = false,
  sceneID: string,
): Promise<string> {
  const res = await runSceneCreatorAgentDetailed(
    config,
    scene,
    isBackground,
    sceneID,
  );
  return res.code;
}
