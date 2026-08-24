/**
 * verifierAgent.ts
 *
 * Fast line-by-line reviewer & Edit Agent matching exact image.png diagram specs:
 *   - Inputs: sequence composition
 *   - Evaluates code for syntax errors, skills, and rules
 *   - Output if clean: "verify"
 *   - Output if fixes needed: [{ "line": "12", "fixedLine": "<new code>" }]
 */

import { callLLM, safeParseJson } from '../llmClient';
import type { AgentConfig } from '../types';

export interface VerifierPatch {
    line: string | number;
    fixedLine: string;
    error?: string;
}

export const VERIFIER_SYSTEM = `You are a World-Class TypeScript/Remotion Verification Agent.

Your job: inspect the provided numbered VideoComposition.tsx file line-by-line for syntax errors, unclosed tags, and rule violations.

OUTPUT FORMAT RULES (EXACT MATCH TO DIAGRAM):
1. If the code is correct with NO errors, respond with exactly ONE word:
verify

2. If fixes are needed, return ONLY a valid JSON array of targeted line replacements:
[
  { "line": "42", "fixedLine": "          <HeroMetricCard primaryText=\"99.99%\" captionText=\"Uptime\" glowConfig={{ enabled: true, color: '#28a745', intensity: 10, spread: 5 }} />" }
]

CRITICAL RULES:
- "line" must be the line number string or number.
- "fixedLine" must be the exact complete replacement line of TSX code.
- Return ONLY the JSON array or "verify". No markdown text surrounding it.`;

export const EDIT_AGENT_SYSTEM = `You are a World-Class Motion Graphics Edit Agent.

Your job: update the provided numbered VideoComposition.tsx file according to the user's requested edit.

OUTPUT FORMAT RULES (EXACT MATCH TO DIAGRAM):
Return ONLY a valid JSON array of targeted line replacements:
[
  { "line": "15", "fixedLine": "  const primaryColor = '#ff0055';" }
]

CRITICAL RULES:
- "line" must be the line number string or number.
- "fixedLine" must be the exact replacement line.
- Return ONLY the JSON array. No markdown text surrounding it.`;

// ─── Utility: apply line patch array to code string ───────────────────────────
export function applyLinePatches(code: string, patches: VerifierPatch[]): string {
    if (!Array.isArray(patches) || patches.length === 0) return code;

    const lines = code.split('\n');
    // Sort patches descending by line number so edits do not shift target indices
    const sorted = [...patches].sort((a, b) => Number(b.line) - Number(a.line));

    for (const patch of sorted) {
        const lineNum = typeof patch.line === 'number' ? patch.line : parseInt(String(patch.line), 10);
        const idx = lineNum - 1;
        if (!isNaN(idx) && idx >= 0 && idx < lines.length) {
            console.log(`  [Verifier/Edit Patch] Line ${lineNum}: replaced with "${patch.fixedLine.trim()}"`);
            lines[idx] = patch.fixedLine;
        }
    }

    return lines.join('\n');
}

// ─── Verification Agent Runner ────────────────────────────────────────────────
export async function runVerifierAgent(
    config: AgentConfig,
    assembledCode: string
): Promise<string> {
    const numberedCode = assembledCode
        .split('\n')
        .map((line, i) => `${i + 1}: ${line}`)
        .join('\n');

    const userPrompt = `VERIFY THIS SEQUENCE COMPOSITION FOR SYNTAX AND RULE ERRORS:\n\n${numberedCode}`;

    const response = await callLLM(config, VERIFIER_SYSTEM, userPrompt, true);
    if (response.error || !response.content) {
        console.warn('[Verifier] LLM response empty, returning code as-is');
        return assembledCode;
    }

    const trimmed = response.content.trim();
    if (trimmed.toLowerCase() === 'verify' || trimmed.toLowerCase().startsWith('verify')) {
        console.log('[Verifier] ✅ Output: verify');
        return assembledCode;
    }

    const patches = safeParseJson<VerifierPatch[]>(trimmed, []);
    if (!Array.isArray(patches) || patches.length === 0) {
        return assembledCode;
    }

    return applyLinePatches(assembledCode, patches);
}

// ─── Repair Agent Runner (compiler/static-error driven) ───────────────────────
export const REPAIR_SYSTEM = `You are a World-Class TypeScript/Remotion Repair Agent.

You will receive:
1. A list of validation errors (TypeScript compiler errors and/or static checks).
2. The FULL source of src/renderer/scenes/VideoComposition.tsx.

Fix EVERY listed error while changing as little as possible.

CRITICAL RULES:
- Keep every existing scene component name (Scene1, Scene2, ...) and the VideoComposition master component with its default export.
- Do NOT add import statements. React and remotion helpers (Series, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, AbsoluteFill) are already imported for you.
- Do NOT use Math.random(), Date.now(), new Date(), or any Node APIs — animation values must derive only from the frame number.
- If an error is a false positive you cannot reproduce, leave that part unchanged.
- Output ONLY the complete corrected TypeScript file inside one \`\`\`tsx ... \`\`\` block. No prose.`;

export async function runRepairAgent(
    config: AgentConfig,
    code: string,
    issues: string[]
): Promise<string> {
    const numberedCode = code
        .split('\n')
        .map((line, i) => `${i + 1}: ${line}`)
        .join('\n');

    const userPrompt = `VALIDATION ERRORS TO FIX:\n${issues
        .map((issue, i) => `${i + 1}. ${issue}`)
        .join('\n')}\n\nFULL FILE:\n${numberedCode}`;

    const response = await callLLM(config, REPAIR_SYSTEM, userPrompt, true);
    if (response.error || !response.content) {
        console.warn('[Repair] LLM response empty, returning code as-is');
        return code;
    }

    const cleaned = response.content
        .trim()
        .replace(/^```[a-z]*\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

    if (!cleaned || cleaned.length < 50 || !/export\s/.test(cleaned)) {
        console.warn('[Repair] Repaired output looked invalid, keeping previous version');
        return code;
    }

    return cleaned;
}

// ─── Edit Agent Runner ────────────────────────────────────────────────────────
export async function runEditAgent(
    config: AgentConfig,
    assembledCode: string,
    userEditRequest: string
): Promise<string> {
    const numberedCode = assembledCode
        .split('\n')
        .map((line, i) => `${i + 1}: ${line}`)
        .join('\n');

    const userPrompt = `USER EDIT REQUEST: "${userEditRequest}"\n\nCURRENT VIDEO COMPOSITION:\n${numberedCode}`;

    const response = await callLLM(config, EDIT_AGENT_SYSTEM, userPrompt, true);
    if (response.error || !response.content) {
        return assembledCode;
    }

    const patches = safeParseJson<VerifierPatch[]>(response.content, []);
    if (!Array.isArray(patches) || patches.length === 0) {
        return assembledCode;
    }

    return applyLinePatches(assembledCode, patches);
}
