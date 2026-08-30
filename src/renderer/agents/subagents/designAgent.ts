import { callLLM, safeParseJson } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';

// ─── Design Token Synthesis System Prompt ──────────────────────────────
export const DESIGN_AGENT_SYSTEM = `You are a senior brand designer for motion graphics videos.
Your job: synthesize a cohesive visual theme given a video description, requested brand design specs, and user preferences.

Return ONLY a valid JSON object with these exact keys. No markdown. No prose. Just JSON.

{
  "fontFamily": "string — a Google Font name like Inter, Roboto, Space Grotesk, Outfit, DM Sans",
  "primaryColor": "string — a hex color, vibrant and modern",
  "backgroundColor": "string — a very dark hex color for the canvas background",
  "accentColor": "string — a hex color that complements the primary",
  "textColor": "string — a near-white hex color for text",
  "surfaceColor": "string — a dark hex color slightly lighter than background, for card surfaces",
  "theme": "dark or light (almost always dark)"
}

Rules:
- ALWAYS prefer dark theme unless the prompt explicitly asks for light
- Avoid generic colors: no plain #FF0000, #00FF00, #0000FF
- Draw strong color & typography inspiration from the requested brand design specs provided
- primaryColor should be vibrant and distinctive
- backgroundColor should be near-black (#050508 to #111118 range)
- surfaceColor should be 1-2 shades lighter than backgroundColor`;

// ─── Default fallback ─────────────────────────────────────────────────────────
const DEFAULT_TOKENS: DesignTokens = {
    fontFamily: 'Inter',
    primaryColor: '#6366f1',
    secondaryColor: '#a78bfa',
    accentColor: '#f59e0b',
    semanticColor: '#3b82f6',
    errorColor: '#ef4444',
    successColor: '#22c55e',
    neutralColor: '#64748b',
    backgroundColor: '#09090b',
    textColor: '#f4f4f5',
    surfaceColor: '#18181b',
    theme: 'dark',
};

/**
 * Synthesize design tokens for a video prompt.
 */
export async function runDesignAgentDetailed(
    config: AgentConfig,
    prompt: string
): Promise<DesignTokens> {
    const userPrompt = `Video description: "${prompt}"

Synthesize the final JSON design tokens now.`;

    const response = await callLLM(config, DESIGN_AGENT_SYSTEM, userPrompt, true);

    if (response.error) {
        throw new Error(response.error);
    }
    const rawOutput = response.content || '';
    const parsed = safeParseJson<Partial<DesignTokens>>(rawOutput, {});
    if (!rawOutput || Object.keys(parsed).length === 0) {
        throw new Error(`Design AI returned empty response from ${config.provider}. Try again or switch model.`);
    }

    return {
        fontFamily: parsed.fontFamily || DEFAULT_TOKENS.fontFamily,
        primaryColor: parsed.primaryColor || DEFAULT_TOKENS.primaryColor,
        secondaryColor: parsed.secondaryColor || DEFAULT_TOKENS.secondaryColor,
        accentColor: parsed.accentColor || DEFAULT_TOKENS.accentColor,
        semanticColor: parsed.semanticColor || DEFAULT_TOKENS.semanticColor,
        errorColor: parsed.errorColor || DEFAULT_TOKENS.errorColor,
        successColor: parsed.successColor || DEFAULT_TOKENS.successColor,
        neutralColor: parsed.neutralColor || DEFAULT_TOKENS.neutralColor,
        backgroundColor: parsed.backgroundColor || DEFAULT_TOKENS.backgroundColor,
        textColor: parsed.textColor || DEFAULT_TOKENS.textColor,
        surfaceColor: parsed.surfaceColor || DEFAULT_TOKENS.surfaceColor,
        theme: parsed.theme === 'light' ? 'light' : 'dark',
    };
}

export async function runDesignAgent(
    config: AgentConfig,
    prompt: string,
    seedColors?: Partial<DesignTokens>
): Promise<DesignTokens> {
    const tokens = await runDesignAgentDetailed(config, prompt);
    if (seedColors) {
        return { ...tokens, ...seedColors };
    }
    return tokens;
}



