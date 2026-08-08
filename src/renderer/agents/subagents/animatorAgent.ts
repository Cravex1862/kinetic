import { callLLM, sanitizeCompositionCode } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';

// ─── TransitionSDK Docs (all 9 wrappers) ─────────────────────────────────────
// Exact props from TransitionSDK.tsx — only give the animator what it needs.
const TRANSITION_SDK_DOCS = `
Available TransitionSDK wrappers (import from '../primitives/TransitionSDK'):

SpringEnter — spring physics fade-in + scale up
  Props: delay?(number, frames), mass?(number, default 0.5), damping?(number, default 12), stiffness?(number, default 100), overshootClamping?(boolean)
  Example: <SpringEnter delay={10} mass={0.5} damping={12}>...</SpringEnter>

FadeBlur — fades in while unblurring
  Props: duration?(number, frames, default 30), startBlur?(number, px, default 10)
  Example: <FadeBlur duration={25} startBlur={12}>...</FadeBlur>

SlideInOut — slides in from a direction
  Props: direction?('left'|'right'|'top'|'bottom'), distance?(number, px, default 500), duration?(number, frames, default 30), fade?(boolean, default true)
  Example: <SlideInOut direction="bottom" distance={80} duration={24}>...</SlideInOut>

CardReveal — clip-path reveal from center
  Props: duration?(number, frames, default 30)
  Example: <CardReveal duration={20}>...</CardReveal>

PulseScale — continuous subtle breathing pulse
  Props: cycleFrames?(number, default 60), minScale?(number, default 0.95), maxScale?(number, default 1.05)
  Example: <PulseScale cycleFrames={90} minScale={0.97} maxScale={1.03}>...</PulseScale>

RotateFlip — 3D flip on entry
  Props: axis?('X'|'Y', default 'Y'), startFrame?(number, default 0), endFrame?(number, default 30)
  Example: <RotateFlip axis="Y" endFrame={20}>...</RotateFlip>

GlitchIntro — RGB glitch effect on entry
  Props: duration?(number, frames, default 5)
  Example: <GlitchIntro duration={6}>...</GlitchIntro>

StaggerContainer — staggers an array of children in sequence
  Props: staggerDelay?(number, frames between each child, default 5)
  Note: children MUST be an array (use JSX array syntax)
  Example: <StaggerContainer staggerDelay={8}>{[<A/>, <B/>, <C/>]}</StaggerContainer>
`.trim();

// ─── System Prompt ────────────────────────────────────────────────────────────
const ANIMATOR_SYSTEM = `You are a Remotion animation specialist.
Your ONLY job: wrap the provided JSX component in ONE TransitionSDK animation wrapper.

${TRANSITION_SDK_DOCS}

CRITICAL RULES:
1. Choose the MOST VISUALLY IMPRESSIVE wrapper for the component type
2. Do NOT add frame={{frame}} prop — wrappers call useCurrentFrame() internally
3. Do NOT add import statements
4. Return ONLY the wrapped JSX in a tsx code block: \`\`\`tsx ... \`\`\`
5. Keep ALL original props on the inner component EXACTLY as given
6. Close ALL tags properly
7. Use delay to offset the animation start (adds visual sophistication)`;

// ─── Agent Runner ─────────────────────────────────────────────────────────────
export async function runAnimatorAgent(
    config: AgentConfig,
    componentJSX: string,
    primitiveName: string,
    designTokens: DesignTokens,
    delayHint: number = 0
): Promise<string> {
    const userPrompt = `Wrap this <${primitiveName}> in ONE TransitionSDK animation wrapper.

Suggested delay offset: ${delayHint} frames (to stagger this element in the scene).
Accent color (reference for choosing vibrant wrappers): "${designTokens.accentColor}"

COMPONENT JSX TO WRAP:
${componentJSX}

Pick the wrapper that makes this component look most premium when it enters.
Return the wrapped JSX in a tsx code block. No imports. No function wrapper.`;

    const response = await callLLM(config, ANIMATOR_SYSTEM, userPrompt, true);

    if (response.error || !response.content) {
        console.warn(`[Animator:${primitiveName}] LLM failed, returning raw JSX:`, response.error);
        // Graceful fallback: wrap with a safe default
        return `<SpringEnter delay={${delayHint}}>\n  ${componentJSX}\n</SpringEnter>`;
    }

    const cleaned = sanitizeCompositionCode(response.content);
    // If cleanup failed or returned empty, fall back to SpringEnter wrap
    if (!cleaned || cleaned.trim().length < 10) {
        return `<SpringEnter delay={${delayHint}}>\n  ${componentJSX}\n</SpringEnter>`;
    }

    return cleaned;
}
