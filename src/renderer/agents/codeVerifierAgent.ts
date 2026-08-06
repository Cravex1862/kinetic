import { callLLM } from "./llmClient";
import type { AgentConfig } from "./types";

export async function runCodeVerifierAgent(
    config: AgentConfig,
    animatedTsxCode: string,
    sceneIndex: number = 1,
    maxRetries: number = 3): Promise<{ verifiedTsxCode: string; passed: boolean }> {
    let currentCode = animatedTsxCode;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const systemPrompt = `
            
                You are Verification Round 1: Syntax & Layout Centering Agent.
                Inspect the TSX Code for:
                1. Valid JSX syntax & closed tags.
                2. Proper import statements for React and Remotion.
                3. Layout centering (flex items-center justify-center, w-full, h-full).
                4. Component export name MUST be: export const Scene${sceneIndex}: React.FC = () => { ... }
                5. NO function as children inside <Sequence> (e.g. replace <Sequence>{(f) => ...}</Sequence> with direct JSX or frame calculation).


                If code has errors, FIX IT and return the corrected TSX code.
                If valid, return the code unchanged.

                Output format: Return pure TSX code only.
            
            `;

        const response = await callLLM(config, systemPrompt, `Attempt ${attempt}:   \n${currentCode}`, true);
        if (response.content) {
            const cleaned = response.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
            if (cleaned === 'SKIP' || cleaned.toUpperCase() === 'SKIP') {
                return { verifiedTsxCode: animatedTsxCode, passed: true };
            }
            currentCode = cleaned;
        }
    }

    return { verifiedTsxCode: currentCode, passed: true };
}