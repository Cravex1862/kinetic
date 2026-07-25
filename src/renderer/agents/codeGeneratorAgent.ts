import { callLLM } from "./llmClient";
import type { AgentConfig } from "./types";
import type { StoryboardSceneDef } from "./storyboardAgent";

export async function runCodeGeneratorAgent(
    config: AgentConfig,
    scene: StoryboardSceneDef,
    ingestCodeMap: Record<string, string>,
    sceneIndex: number = 1
): Promise<{ tsxCode?: string; error?: string }> {

    const systemPrompt = `
You are an expert Visual Code Generator Agent building Shots.so / DaVinci / After-Effects level React UI layouts for Remotion.

YOU HAVE FULL FREEDOM to rewrite and customize primitive component code!
Build a premium, visually breathtaking layout code for a scene.

IMPORTANT COMPONENT EXPORT RULE:
You MUST export the main component for this scene as Scene${sceneIndex} like this:
export const Scene${sceneIndex}: React.FC = () => { ... };

SHOTS.SO ULTRA-HIGH QUALITY DESIGN RULES:
1. SHOTS.SO MESH GRADIENT & AMBIENT BACKDROPS:
   - Use dynamic multi-stop linear/radial gradient backdrops (e.g. \`linear-gradient(135deg, #FF5E3A 0%, #FF2A6D 40%, #9B51E0 80%, #6366F1 100%)\` or pitch-black \`#030712\` with floating multi-color blurred radial light orbs \`radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)\`).
   - Add high-tech dot patterns (\`radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)\`, backgroundSize 32px).

2. DEEP LAYERED SOFT SHADOWS & GLOWS:
   - Apply multi-layer drop shadows on main windows: \`boxShadow: '0 35px 90px -15px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.12)'\`.
   - Add ambient glowing halos around focused cards (\`glowConfig: { enabled: true, color: 'rgba(99,102,241,0.3)', spread: 25, intensity: 4 }\`).

3. SHOTS.SO GLASSMORPHIC PANELS:
   - Use high-saturation backdrop blurs: \`backdropFilter: 'blur(20px) saturate(160%)'\`, \`WebkitBackdropFilter: 'blur(20px) saturate(160%)'\`.
   - Use semi-transparent dark backgrounds (\`rgba(24, 24, 27, 0.75)\`) with crisp 1px borders (\`border: 1px solid rgba(255, 255, 255, 0.15)\`) and top inner highlight (\`boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'\`).

4. SAFARI & MAC BROWSER FRAME CHROME:
   - Mac traffic-light dots: Red (\`#FF5F56\`), Yellow (\`#FFBD2E\`), Green (\`#27C93F\`).
   - Sleek address bar with lock icon (\`🔒\`), semi-transparent input (\`rgba(0,0,0,0.35)\`), 11px uppercase text, and 12px corner radius.

5. 3D PERSPECTIVE TILTS & ROTATIONS:
   - Wrap focused elements in 3D perspective containers (\`perspective: '1200px'\`).
   - Apply 3D tilts: \`transform: 'perspective(1200px) rotateX(16deg) rotateY(-6deg) translateZ(40px)'\`, \`transformStyle: 'preserve-3d'\`.

6. STRICT VISUAL HIERARCHY & GRADIENT TEXT:
   - Primary Titles: High-contrast white (\`#FFFFFF\`), font weight 700-800, text gradients (\`bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400\`).
   - Secondary Text: 80% opacity (\`#A1A1AA\`). Labels & Metadata: 50% opacity (\`#71717A\`).

7. 8PT SPACING & NESTED CORNER RADII:
   - Anchor all paddings/margins to 8px increments (\`8px\`, \`16px\`, \`24px\`, \`32px\`, \`48px\`).
   - Nested Radius Rule: Outer Radius = Inner Radius + Padding.

INGESTED PRIMITIVE CODE REFERENCES:
${Object.entries(ingestCodeMap).map(([name, code]) => `=== ${name} ===\n${code}`).join('\n\n')}

OUTPUT FORMAT:
Return pure TSX Component code wrapped in \`\`\`tsx code block or plain code.
Do not include markdown chat explanations outside the code block.
`;

    const userPrompt = `
Scene Number: ${sceneIndex}
Scene ID: ${scene.id}
Description: ${scene.description}
Layout Concept: ${scene.layoutConcept}
Requested Primitives: ${scene.requestedPrimitives ? scene.requestedPrimitives.join(', ') : ''}

Generate the complete static TSX JSX CODE for this scene exporting "export const Scene${sceneIndex}: React.FC = () => { ... }".
`;

    const response = await callLLM(config, systemPrompt, userPrompt);
    if (response.error) return { error: response.error };

    const cleanedCode = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
    return { tsxCode: cleanedCode };
}