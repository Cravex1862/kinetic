import { callLLM } from "./llmClient";
import type { AgentConfig } from "./types";
import type { StoryboardSceneDef } from "./storyboardAgent";

export async function runCodeAnimatorAgent(
    config: AgentConfig,
    scene: StoryboardSceneDef,
    staticTsxCode: string,
    sceneIndex: number = 1
): Promise<{ animatedTsxCode?: string; error?: string }> {
    const systemPrompt = `
You are a Remotion Physics & Shots.so Motion Specialist Agent.

Your goal is to inject hardware-accelerated Remotion physics into the visual TSX code while PRESERVING all Shots.so design styling (glassmorphism, gradients, 3D perspective, glowing halos).


- Ensure the main outer scene container retains 'backgroundColor: 'transparent''.

IMPORTANT COMPONENT EXPORT RULE:
You MUST preserve the exported main component name as Scene${sceneIndex} (e.g. export const Scene${sceneIndex}: React.FC = () => { ... }).

REMOTION MOTION TOOLS TO INJECT:
- useCurrentFrame(), useVideoConfig()
- spring({ frame, fps, config: { damping: 12, stiffness: 90 } })
- interpolate(frame, [start, end], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
- Dynamic 3D perspective rotation shifts: interpolate rotateX from 24deg -> 14deg, rotateY from -8deg -> -2deg.
- Ambient background light floating: Math.sin(frame / 20) * 16 for organic orb movement.
- SVG Path stroke animation: interpolate strokeDashoffset from pathLength -> 0 for glowing lines and sparklines.

TAG STRUCTURE RULES:
- Use <Series> tags to sequence full scenes back-to-back in overall composition.
- CRITICAL REMOTION SEQUENCE RULE: Never pass a function as children to <Sequence> (e.g. DO NOT write <Sequence>{(frame) => ...}</Sequence> because React will crash!). Instead, pass direct JSX elements inside <Sequence> or compute frame delays directly: const itemFrame = Math.max(0, frame - delay).

OUTPUT FORMAT:
Return pure TSX code for the animated scene component exported as Scene${sceneIndex}.
`;

    const userPrompt = `
Scene Number: ${sceneIndex}
Scene ID: ${scene.id}
Duration in frames: ${scene.duration}

Static TSX Code:
${staticTsxCode}

Inject Remotion spring physics, dynamic 3D tilts, floating ambient orbs, and internal <Sequence> staggering. Keep export const Scene${sceneIndex}: React.FC = ...
`;

    const response = await callLLM(config, systemPrompt, userPrompt);
    if (response.error) return { error: response.error };

    const cleanedCode = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
    return { animatedTsxCode: cleanedCode };
}