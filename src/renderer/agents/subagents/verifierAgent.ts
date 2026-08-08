/**
 * verifierAgent.ts
 *
 * Fast single-pass reviewer. Instead of regenerating the entire file (slow),
 * the LLM outputs either the word "verify" (code is clean) or a JSON array
 * of targeted line fixes. The Manager applies the fixes surgically.
 *
 * Format:
 *   "verify"
 *   OR
 *   [{ "line": 42, "error": "unclosed div", "fix": "<corrected line content>" }, ...]
 */

import { callLLM, safeParseJson } from '../llmClient';
import type { AgentConfig } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface VerifierFix {
    line: number;
    error: string;
    fix: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const VERIFIER_SYSTEM = `You are a TypeScript/TSX syntax checker for Remotion video code.

Scan the provided VideoComposition.tsx for STRUCTURAL errors only:
- Unclosed JSX tags (e.g. <div> without </div>)
- Missing closing parentheses or braces in JSX returns
- JSX expressions not wrapped in a single root element
- TypeScript syntax errors that would prevent compilation

DO NOT flag:
- Style choices or prop values you disagree with
- Missing imports (these are handled separately)
- Logic issues
- Formatting

If the code is correct, respond with exactly:
verify

If there are errors, respond with a JSON array only — no markdown fences, no prose:
[{ "line": <number>, "error": "<short description>", "fix": "<the corrected line, exact replacement>" }]

Maximum 10 fixes. Only the most critical structural errors.`;

// ─── Apply fixes to code string ───────────────────────────────────────────────
function applyFixes(code: string, fixes: VerifierFix[]): string {
    const lines = code.split('\n');
    // Sort fixes descending by line number so applying one fix doesn't shift other line numbers
    const sorted = [...fixes].sort((a, b) => b.line - a.line);

    for (const fix of sorted) {
        const idx = fix.line - 1; // 1-indexed → 0-indexed
        if (idx >= 0 && idx < lines.length) {
            console.log(`  [Verifier] Line ${fix.line}: ${fix.error}`);
            console.log(`    Before: ${lines[idx].trim()}`);
            lines[idx] = fix.fix;
            console.log(`    After:  ${fix.fix.trim()}`);
        }
    }

    return lines.join('\n');
}

// ─── Agent Runner ─────────────────────────────────────────────────────────────
export async function runVerifierAgent(
    config: AgentConfig,
    assembledCode: string
): Promise<string> {
    // Number the lines so the LLM can reference them accurately
    const numberedCode = assembledCode
        .split('\n')
        .map((line, i) => `${i + 1}: ${line}`)
        .join('\n');

    const userPrompt = `Check this VideoComposition.tsx for structural errors:\n\n${numberedCode}`;

    const response = await callLLM(config, VERIFIER_SYSTEM, userPrompt, true);

    if (response.error || !response.content) {
        console.warn('[Verifier] LLM failed, skipping verification:', response.error);
        return assembledCode;
    }

    const trimmed = response.content.trim();

    // ── Case 1: clean code ──
    if (trimmed.toLowerCase() === 'verify' || trimmed.toLowerCase().startsWith('verify')) {
        console.log('[Verifier] ✅ Code verified clean');
        return assembledCode;
    }

    // ── Case 2: fix array ──
    const fixes = safeParseJson<VerifierFix[]>(trimmed, []);
    if (!Array.isArray(fixes) || fixes.length === 0) {
        console.warn('[Verifier] Response was not "verify" or a valid fix array. Skipping.');
        return assembledCode;
    }

    console.log(`[Verifier] 🔧 Applying ${fixes.length} fix(es)...`);
    return applyFixes(assembledCode, fixes);
}
