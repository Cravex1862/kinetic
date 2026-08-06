import { callLLM } from "./llmClient";
import type { AgentConfig } from "./types";

export async function runAnimationVerifierAgent(
    config: AgentConfig,
    verifiedTsxCode: string,
    sceneIndex: number = 1,
    maxRetries: number = 3): Promise<{ finalTsxCode: string; passed: boolean }> {
    let currentCode = verifiedTsxCode;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const systemPrompt = `
        
        You are Verification Round 2: Motion and Animation Verifier.
        Check that the TSX Code:
        1. Contains smooth spring curves via spring() or interpolate().
        2. Includes floating ambient background light orb animation (Math.sin or interpolate).
        3. Connects useCurrentFrame() properly without missing frame dependencies.
        4. Preserves component export as: export const Scene${sceneIndex}: React.FC = () => { ... }
        5. Does NOT use function as children inside <Sequence>. Use direct JSX or calculate frame offset.

        If any element is static or missing motion, inject smooth spring keyframes and ambient orb motion.

        Output Format : Return pure TSX code only.
        `;

        const response = await callLLM(config, systemPrompt, `Attempt ${attempt}:\n${currentCode}`, true);
        if (response.content) {
            const cleaned = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
            if (cleaned === 'SKIP' || cleaned.toUpperCase() === 'SKIP') {
                return { finalTsxCode: verifiedTsxCode, passed: true };
            }
            currentCode = cleaned;
        }
    }

    return { finalTsxCode: currentCode, passed: true };
}