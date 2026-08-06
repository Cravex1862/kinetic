import { callLLM } from "./llmClient";
import type { AgentConfig } from "./types";
import type { BeatNetPrediction } from "../utils/beatDetector";
import type { VoiceoverSegment } from "../utils/timestampScriptParser";

export async function runCodeAnimatorAgent(
    config: AgentConfig,
    scene: any,
    staticTsxCode: string,
    sceneIndex: number = 1,
    beatPredictions?: BeatNetPrediction[] | number[],
    voiceoverSegment?: VoiceoverSegment
): Promise<{ animatedTsxCode?: string; error?: string }> {
    let beatInstruction = '';
    if (beatPredictions && beatPredictions.length > 0) {
      if (typeof beatPredictions[0] === 'number') {
        beatInstruction = `BEATNET AI RHYTHM DIRECTIVE:
The soundtrack has detected beats at frames: [${(beatPredictions as number[]).join(', ')}].
Align keyframe entrance frames, card reveals, cursor clicks, camera tilts, and chart animations to hit ON or near these exact beat frame numbers.`;
      } else {
        const preds = beatPredictions as BeatNetPrediction[];
        const beatSummary = preds
          .slice(0, 30)
          .map((p) => `f${p.frame} (${p.intensity}% Ooomph ${p.impactLevel.toUpperCase()}${p.isDownbeat ? ' DOWNBEAT' : ''})`)
          .join(', ');

        beatInstruction = `BEATNET AI RHYTHM & OOOMPH DIRECTIVE:
Track Detected Beats & Impact Intensity Levels:
${beatSummary}

ANIMATION RHYTHM MAPPING CONSTRAINTS:
1. HEAVY IMPACT BEATS (70%+ Ooomph / DOWNBEATS): Trigger major 3D perspective tilts, camera zoom-ins, or full-screen card reveals.
2. MEDIUM IMPACT BEATS (35%-70% Ooomph): Trigger card entrances, chart growth animations, or tab switches.
3. SUBTLE IMPACT BEATS (15%-35% Ooomph): Trigger text typing clicks, cursor movements, or subtle icon bounces.`;
      }
    }

    let sentimentInstruction = '';
    if (voiceoverSegment) {
        const mood = voiceoverSegment.mood || 'neutral';
        sentimentInstruction = `
NARRATION SENTIMENT & KEYFRAME TIMING DIRECTIVE:
Narration Line: "${voiceoverSegment.sentence}"
Target Start Timestamp: ${voiceoverSegment.time} (Frame: ${voiceoverSegment.frame})
Detected VADER Sentiment Mood: ${mood.toUpperCase()}

EASING & MOTION CURVE CONSTRAINTS:
${
  mood === 'excited'
    ? '1. EXCITED MOOD: Use snappy spring physics (stiffness: 140, damping: 10) or overshoot cubic bezier curves (Easing.bezier(0.34, 1.56, 0.64, 1.0)) for energetic card entries and scale pops.'
    : mood === 'calm'
    ? '1. CALM MOOD: Use gentle, smooth ease-in-out curves (Easing.bezier(0.25, 0.1, 0.25, 1.0)) and soft opacity transitions.'
    : mood === 'dramatic'
    ? '1. DRAMATIC MOOD: Use heavy decelerated cubic curves (Easing.out(Easing.cubic)) with high mass spring damping (damping: 22, mass: 1.5).'
    : mood === 'playful'
    ? '1. PLAYFUL MOOD: Use bouncy spring dynamics with subtle scale bounces and springy offsets.'
    : '1. NEUTRAL MOOD: Use standard smooth ease-out curves (Easing.out(Easing.ease)).'
}
Align keyframe entrance frame to start around frame ${voiceoverSegment.frame}.`;
    }

    const systemPrompt = `
You are a Remotion Physics & Shots.so Motion Specialist Agent.

Your goal is to inject hardware-accelerated Remotion physics into the visual TSX code while PRESERVING all Shots.so design styling (glassmorphism, gradients, 3D perspective, glowing halos).


- Ensure the main outer scene container retains 'backgroundColor: 'transparent''.

IMPORTANT COMPONENT EXPORT RULE:
You MUST preserve the exported main component name as Scene${sceneIndex} (e.g. export const Scene${sceneIndex}: React.FC = () => { ... }).

REMOTION MOTION & ACTION-LAYER TOOLS TO INJECT:
- useCurrentFrame(), useVideoConfig()
- spring({ frame, fps, config: { damping: 12, stiffness: 90 } })
- interpolate(frame, [start, end], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
- Mild, subtle 3D perspective rotation: interpolate rotateX from 8deg -> 4deg, rotateY from -4deg -> -1deg with transformOrigin: 'center center'.
- Card Layout Rule: Keep cards centered using max-w-2xl w-full and container bounds (flex items-center justify-center).
- Ambient background light floating: Math.sin(frame / 20) * 16 for organic orb movement.
- SVG Path stroke animation: interpolate strokeDashoffset from pathLength -> 0 for glowing lines and sparklines.

AVAILABLE ACTION-LAYER MOTION SDK COMPONENTS (Use naturally when relevant to scene requirements):
- Mouse Pointer Clicks: <Cursor startX={100} startY={200} targetId="..." clickFrame={15} /> (Optionally use when user prompt implies clicking buttons or cards).
- Typewriter Headlines: <TextTyper text="..." charsPerFrame={2} showCursor={true} textColor="#ffffff" /> (Optionally use for animated typing titles).
- Logo/Badge Marquees: <MarqueeTrack direction="left" speedMultiplier={1.5} gap={16}> (Optionally use for continuous logo tracks).
- Drag-and-Drop Cards: <DragAndDrop startX={150} startY={300} endX={600} endY={300} dropFrame={30}> (Optionally use for moving task cards).
- Progress Rings: <ProgressRing progress={85} radius={40} strokeWidth={6} color="#a855f7" /> (Optionally use for metric circles).

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

${beatInstruction}
${sentimentInstruction}

Static TSX Code:
${staticTsxCode}

Inject Remotion spring physics, dynamic 3D tilts, floating ambient orbs, and internal <Sequence> staggering. Keep export const Scene${sceneIndex}: React.FC = ...
`;

    const response = await callLLM(config, systemPrompt, userPrompt);
    if (response.error) return { error: response.error };

    const cleanedCode = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
    return { animatedTsxCode: cleanedCode };
}