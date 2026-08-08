import { callLLM, safeParseJson } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';

// ─── System Prompt ────────────────────────────────────────────────────────────
const DESIGN_AGENT_SYSTEM = `You are a senior brand designer for motion graphics videos.
Your job: pick a cohesive visual theme given a video description.

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
- Use curated, harmonious palettes — think Stripe, Linear, Vercel aesthetic
- primaryColor should be vibrant and distinctive
- backgroundColor should be near-black (#050508 to #111118 range)
- surfaceColor should be 1-2 shades lighter than backgroundColor`;

// ─── Default fallback ─────────────────────────────────────────────────────────
const DEFAULT_TOKENS: DesignTokens = {
    fontFamily: 'Inter',
    primaryColor: '#6366f1',
    backgroundColor: '#09090b',
    accentColor: '#a78bfa',
    textColor: '#f4f4f5',
    surfaceColor: '#18181b',
    theme: 'dark',
};

// ─── Agent Runner ─────────────────────────────────────────────────────────────
export async function runDesignAgent(
    config: AgentConfig,
    prompt: string,
    seedColors?: Partial<DesignTokens>
): Promise<DesignTokens> {
    const seedStr = seedColors
        ? `\n\nBrand seed colors (use as strong inspiration, adjust if needed):\n${JSON.stringify(seedColors, null, 2)}`
        : '';

    const userPrompt = `Video description: "${prompt}"${seedStr}

Return the JSON object now.`;

    const response = await callLLM(config, DESIGN_AGENT_SYSTEM, userPrompt, true);

    if (response.error || !response.content) {
        console.warn('[DesignAgent] LLM failed, using defaults:', response.error);
        return { ...DEFAULT_TOKENS };
    }

    const parsed = safeParseJson<Partial<DesignTokens>>(response.content, {});

    // Merge with defaults so any missing key is covered
    return {
        fontFamily:       parsed.fontFamily       || DEFAULT_TOKENS.fontFamily,
        primaryColor:     parsed.primaryColor     || DEFAULT_TOKENS.primaryColor,
        backgroundColor:  parsed.backgroundColor  || DEFAULT_TOKENS.backgroundColor,
        accentColor:      parsed.accentColor      || DEFAULT_TOKENS.accentColor,
        textColor:        parsed.textColor        || DEFAULT_TOKENS.textColor,
        surfaceColor:     parsed.surfaceColor     || DEFAULT_TOKENS.surfaceColor,
        theme:            parsed.theme            || DEFAULT_TOKENS.theme,
    };
}
