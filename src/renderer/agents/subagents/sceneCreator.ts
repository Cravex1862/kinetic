import { callLLM, LLMResponse, sanitizeCompositionCode, safeParseJson } from "../llmClient";
import type { AgentConfig, DesignTokens } from "../types";
import { getPrimitiveSpec } from "../primitiveRegistry";
import {
  findRelevantSkills,
  getSkillByName,
  RelevantSkill,
  SkillCategory,
} from "../../utils/skillRAG";
import { exampleComposition } from "../../design-specs/exampleComposition";

export interface AgentResultWithPrompt {
  code: string;
  systemPrompt: string;
  userPrompt: string;
}

export const SCENE_CREATOR_PROMPT = `You are a Lead Motion Graphics UI & React Developer.
Your job is to build a high-impact, professional video scene. 


Skills are availble design rules to help you think like a professional designer while creating scenes. Availble Skills : \n
ad-creative-video, launch-video, testimonial-video, animated-infographic, chart-animation, presentation-video, photo-slideshow, 
product-demo-video, promo-video, diagram-animation, explainer-video, isometric-animation, whiteboard-animation, wrapped-video, 
brand-motion-guidelines, client-revisions, creative-brief, motion-pricing, video-delivery-specs, generative-illustration, 
kinetic-typography, manim, map-animation, after-effects, animation-principles, beat-sync-editing, color-motion, logo-animation, 
motion-art-direction, motion-background, remotion-video, shot-composition, text-message-animation, caption-animation, countdown-video, 
lower-thirds, short-form-video, 60fps-animation, accessible-animation, ascii-animation, glassmorphism, gsap-web, lottie-animation, 
micro-interaction, page-transition-animation, svg-animation, particle-system, shader-glsl, threejs-animation, audiogram, youtube-intro-outro

If you want the props to any primitives or view any skills output this format : { primitives : [primitive1, primitive2,],
skills : [skill1, skill2]
  }

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

Requested Scene by the second:\n


CRITICAL MANDATES & NON-EMPTY CONSTRAINTS (STRICTLY ENFORCED):\n
1. DO NOT NEST OUTER CONTAINERS INSIDE EACH OTHER: Choose EITHER <MockWindow> OR <BrowserFrame> OR <AppCanvas> as the root outer window. NEVER put <BrowserFrame> inside <MockWindow>!\n
2. NO EMPTY BARE TAGS (CRITICAL): You are STRICTLY FORBIDDEN from returning a self-closing empty tag like \`< primitiveName />\` or \`<primitiveName></primitiveName>\`. You MUST write out full props AND rich inner children!\n
2. CONTAINER PRIMITIVES (BrowserFrame, MockWindow, SidebarLayout, AppCanvas, GlassmorphicCard):\n
   You MUST pass explicit props (e.g. \`width={1000}\`, \`height={650}\`, \`windowColor={surfaceColor}\`, \`glowConfig={{ enabled: true, color: primaryColor, intensity: 8, spread: 4 }}\`) AND nest rich inner JSX children inside the container (headers, metric badges, status indicators, domain subtitles).\n
3. CARD & CHART PRIMITIVES (HeroMetricCard, BarChartCard, LineChartCard, FeatureCard):\n
   You MUST pass all key props (title="...", value="...", categories={[...]}, values={[...]}, barColor={primaryColor}, width={550}, height={320}).\n
4. USE IN-SCOPE COLOR VARIABLES: Always use primaryColor, secondaryColor, accentColor, semanticColor, errorColor, successColor, neutralColor, surfaceColor, backgroundColor, textColor, fontFamily.\n
5. DOMAIN RELEVANCY: Fill all text, titles, labels, and numbers with authentic context matching the scene objective.\n
6. CODE FORMAT: Return ONLY valid TSX inside a \`\`\`tsx ... \`\`\` block. No markdown prose, no imports, no export default wrappers.
7. GENERATE A COMPLETE UI. This means filling up the container element with sub elements. THIS DOES NOT MEAN YOU OVERCROWD IT. If you want an example of a good UI then output {requestUI: true} along with the primitives and sdks.\n
8. Use Raw Primitives (Variables): For the "big picture" camera moves, page transitions, 3D perspective tilts, and complex choreographed         
  sequences where multiple elements need to move exactly together.
  Use Motion SDKs: For isolated, reusable "drop-in" effects that don't need to coordinate with anything else. For example, the <Cursor>         
  component from the SDK is perfect because animating a mouse moving and clicking is extremely tedious to write from scratch every time. Other    
  good examples are <TextTyper> or a <MarqueeTrack>.   
9. IT IS HIGHLY RECOMMENDED TO REQUEST FOR PRIMITIVES and SKILLs. BUT KEEP IN MIND IF YOU ARE Requesting for primitives and skills then do not output code. I will give you the primitives and skills then output code.
`;

// ─── System Prompt Builder with Prop Spec Contracts & RAG Skill Guides ─────
export function buildSceneCreatorSystemPrompt(
  primitiveName: string[],
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

If you want the props to any primitives or view any skills output this format : { primitives : [primitive1, primitive2,],
skills : [skill1, skill2]
  }

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
4. It is highley recommended that you request for skills. Keep in mind if you are requesting for skills only output a JSON with the correct format.`;
}

export async function handleRequest(
  requestPrimitives: string[],
  requestSkills: string[],
  requestUI: boolean,
) {
  const output: {
    requestedPrimitives: string[];
    requestedSkills: (string | RelevantSkill | null)[];
    requestedUI: string;
  } = {
    requestedPrimitives: [],
    requestedSkills: [],
    requestedUI: "",
  };
  if (requestPrimitives) {
    output.requestedPrimitives = requestPrimitives.map((request) =>
      getPrimitiveSpec(request),
    );
  }
  if (requestSkills) {
    output.requestedSkills = requestSkills.map((request) =>
      getSkillByName(request),
    );
  }
  if (requestUI) {
    output.requestedUI = `${exampleComposition}`;
  }

  return output;
}
// ─── Agent Runner with Detailed Prompt Return ─────────────────────────────────
export async function runSceneCreatorAgentDetailed(
  config: AgentConfig,
  primitiveName: string[],
  designTokens: DesignTokens,
  scene: string,
  isBackground: boolean = false,
  sceneID: string,
): Promise<AgentResultWithPrompt> {
  let category = "layout";

  primitiveName.forEach((primitive) => {
    const isChart = /chart|graph|metric|funnel|sparkline/i.test(primitive);
    category = isChart ? "data" : "layout";
  });

  let skillGuideText = "";
  try {
    const skills = await findRelevantSkills(
      `${scene} ${primitiveName}`,
      2,
      category as SkillCategory,
    );
    if (skills.length > 0) {
      skillGuideText = skills
        .map((s) => `=== CRAFT SKILL: ${s.name} ===\n${s.cleanContent}`)
        .join("\n\n");
    }
  } catch (err) {
    console.warn(`[ComponentCreator] Skill RAG retrieval failed:`, err);
  }

  const systemPrompt = buildSceneCreatorSystemPrompt(
    primitiveName,
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
    const fallbackComponent = primitiveName.length > 0 ? primitiveName[0] : 'div';
    return {
      code: `<${fallbackComponent} />`,
      systemPrompt,
      userPrompt,
    };
  }

  let cleaned = sanitizeCompositionCode(response.content);

  // The model may reply with a props/skills request instead of code — sometimes
  // with stray prose tokens around it ("on {...}"). Detect that leniently.
  interface PrimitiveRequest {
    primitives?: string[];
    skills?: string[];
    requestUI?: boolean;
  }
  const looksLikeCode = /export\s|<[A-Za-z]/.test(cleaned);
  const parsedRequest = looksLikeCode
    ? null
    : safeParseJson<PrimitiveRequest>(cleaned, {});
  const hasPropsRequest =
    (parsedRequest?.primitives?.length ?? 0) > 0 ||
    (parsedRequest?.skills?.length ?? 0) > 0 ||
    parsedRequest?.requestUI === true;

  if (hasPropsRequest && parsedRequest) {
    const fullFill = JSON.stringify(
      await handleRequest(
        parsedRequest.primitives || [],
        parsedRequest.skills || [],
        parsedRequest.requestUI === true,
      ),
    );
    const fullContext = `I said to you:
                            ${systemPrompt}\n 
                            ${userPrompt}\n
                            You said to me:\n
                            ${cleaned}\n\n
                            and I responded:\n
                            ${fullFill} \n\n
                            Now give the full code. DO NOT WRITE IMPORT STATEMENTS. Output exactly one component: export const ${sceneID} = () => {{ ... }} inside a \`\`\`tsx block.
                            `;
    const followUp = await callLLM(config, fullContext, "Give me the complete scene code now.", true);
    if (!followUp.error && followUp.content) {
      cleaned = sanitizeCompositionCode(followUp.content);
    } else {
      console.warn("[SceneCreator] Follow-up call failed after props request:", followUp.error);
    }
  }

  return {
    code: cleaned,
    systemPrompt,
    userPrompt,
  };
}

export async function runSceneCreatorAgent(
  config: AgentConfig,
  primitiveName: string[],
  designTokens: DesignTokens,
  scene: string,
  isBackground: boolean = false,
  sceneID: string,
): Promise<string> {
  const res = await runSceneCreatorAgentDetailed(
    config,
    primitiveName,
    designTokens,
    scene,
    isBackground,
    sceneID,
  );
  return res.code;
}
