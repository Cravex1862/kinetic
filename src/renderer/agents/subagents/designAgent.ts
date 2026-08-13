import { callLLM, safeParseJson } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';
import { AVAILABLE_DESIGN_SPEC_KEYS, SiteDesignSpec } from '../designSpecLoader';

// ─── Pass 1: Brand Discovery System Prompt ──────────────────────────────────────
export const BRAND_DISCOVERY_SYSTEM = `You are a Brand Design Consultant for high-end motion graphics videos.
Below is a catalog of 74+ official brand design kits available in our system.

Your job: inspect the user's video prompt and select 1 to 2 brand design kits from the catalog to request as design inspiration.

AVAILABLE BRAND DESIGN KITS CATALOG:
${JSON.stringify(AVAILABLE_DESIGN_SPEC_KEYS, null, 2)}

Return ONLY a valid JSON object matching this exact structure:
{
  "requestedBrands": ["stripe", "linear.app"],
  "reasoning": "Brief 1-sentence reason why these brands fit the video prompt vibe."
}`;

// ─── Pass 2: Design Token Synthesis System Prompt ──────────────────────────────
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

export interface DesignAgentResult {
    requestedBrands: string[];
    tokens: DesignTokens;
    fullSystemPrompt: string;
    fullUserPrompt: string;
    rawOutput: string;
}

/**
 * Pass 1: Ask LLM to select up to 2 brand design kits for inspiration
 */
export async function runDesignAgentBrandDiscovery(
    config: AgentConfig,
    prompt: string
): Promise<{ requestedBrands: string[]; fullPrompt: string; rawOutput: string }> {
    const userPromptText = `Video prompt: "${prompt}"\n\nSelect up to 2 brand design kits now. Valid JSON ONLY.`;
    const response = await callLLM(config, BRAND_DISCOVERY_SYSTEM, userPromptText, false);

    const rawOutput = response.content || response.error || '';
    const parsed = safeParseJson<{ requestedBrands?: string[] }>(rawOutput, {});

    const requested = Array.isArray(parsed.requestedBrands) && parsed.requestedBrands.length > 0
        ? parsed.requestedBrands
        : ['linear.app'];

    return {
        requestedBrands: requested,
        fullPrompt: `=== PASS 1 BRAND DISCOVERY SYSTEM PROMPT ===\n${BRAND_DISCOVERY_SYSTEM}\n\n=== PASS 1 USER PROMPT ===\n${userPromptText}`,
        rawOutput: JSON.stringify(parsed, null, 2),
    };
}

/**
 * Pass 2: Synthesize design tokens using requested brand specs
 */
export async function runDesignAgentDetailed(
    config: AgentConfig,
    prompt: string,
    userFeedback?: string,
    brandSpecs?: SiteDesignSpec[]
): Promise<DesignAgentResult> {
    let brandSpecContext = '';
    const requestedBrandNames: string[] = [];

    if (brandSpecs && brandSpecs.length > 0) {
        brandSpecContext = `\n\nREQUESTED OFFICIAL BRAND DESIGN KITS FOR INSPIRATION:\n` +
            brandSpecs.map(s => {
                requestedBrandNames.push(s.siteKey);
                return `=== BRAND: ${s.name} (${s.siteKey}) ===\nDescription: ${s.description}\nColors: Primary: ${s.colors.primary}, Canvas: ${s.colors.canvas}, Surface1: ${s.colors.surface1}, Surface2: ${s.colors.surface2}, Border: ${s.colors.border}, Text: ${s.colors.textPrimary}`;
            }).join('\n\n');
    }

    const feedbackStr = userFeedback
        ? `\n\nUSER FEEDBACK / EDITS REQUESTED: "${userFeedback}"\nIncorporate these user adjustments into the visual tokens!`
        : '';

    const userPrompt = `Video description: "${prompt}"${brandSpecContext}${feedbackStr}

Synthesize the final JSON design tokens now.`;

    const response = await callLLM(config, DESIGN_AGENT_SYSTEM, userPrompt, true);

    const rawOutput = response.content || response.error || '';
    const parsed = safeParseJson<Partial<DesignTokens>>(rawOutput, {});

    const tokens: DesignTokens = {
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

    return {
        requestedBrands: requestedBrandNames,
        tokens,
        fullSystemPrompt: DESIGN_AGENT_SYSTEM,
        fullUserPrompt: userPrompt,
        rawOutput: JSON.stringify(tokens, null, 2),
    };
}

export async function runDesignAgent(
    config: AgentConfig,
    prompt: string,
    seedColors?: Partial<DesignTokens>
): Promise<DesignTokens> {
    const result = await runDesignAgentDetailed(config, prompt);
    if (seedColors) {
        return { ...result.tokens, ...seedColors };
    }
    return result.tokens;
}



