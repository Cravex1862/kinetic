import { callLLM, sanitizeCompositionCode } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';
import { getPrimitiveSpec } from '../primitiveRegistry';

// ─── System prompt builder (per-primitive) ────────────────────────────────────
// The key optimization for small models: each call only knows about ONE component.
function buildSystemPrompt(primitiveName: string, propSpec: string): string {
    return `You are a React/Remotion UI component builder.
Your ONLY job: write a single <${primitiveName}> JSX element with visually rich, correct props.

COMPONENT SPEC (the ONLY props you may use):
${propSpec}

RULES:
1. Return ONLY the JSX element — no imports, no function wrappers, no explanations
2. Use design tokens from the user message for colors
3. All string prop values must use double quotes: url="example.com"
4. All numeric prop values without quotes: width={600}
5. Use glowConfig when available for visual richness: glowConfig={{ enabled: true, color: "...", intensity: 8, spread: 4 }}
6. Use rotateX/rotateY for 3D tilt when available — makes it look premium
7. Fill children with realistic-looking placeholder content (real data, real labels — not "lorem ipsum")
8. Make it look like a real production app, not a demo
9. Wrap output in a tsx code block: \`\`\`tsx ... \`\`\`
10. Close ALL tags properly
11. CRITICAL: If you add children, use ONLY hardcoded string literals and hardcoded numbers. NEVER use JSX expressions like {title}, {value}, {change}, {trend} — those variables do not exist in scope and will crash the render
12. CRITICAL: Only add children to a component if the SPEC above explicitly lists a "children" prop. If "children" is not in the spec, do NOT add any child elements inside the component tags — leave it self-closing: <${primitiveName} ... />`;
}

// ─── Agent Runner ─────────────────────────────────────────────────────────────
export async function runComponentCreatorAgent(
    config: AgentConfig,
    primitiveName: string,
    designTokens: DesignTokens,
    scenePurpose: string,
    isBackground: boolean = false
): Promise<string> {
    const propSpec = getPrimitiveSpec(primitiveName);

    if (!propSpec) {
        console.warn(`[ComponentCreator] No prop spec found for "${primitiveName}", using minimal fallback`);
        return `<${primitiveName} />`;
    }

    const systemPrompt = buildSystemPrompt(primitiveName, propSpec);

    const positionHint = isBackground
        ? 'Role: BACKGROUND element. Use width="100%" and height="100%".'
        : 'Role: FOREGROUND/CONTENT element. Use appropriate width (400-800px).';

    const userPrompt = `Scene: "${scenePurpose}"
${positionHint}

Design tokens to use:
  fontFamily: "${designTokens.fontFamily}"
  primaryColor: "${designTokens.primaryColor}"
  backgroundColor: "${designTokens.backgroundColor}"
  accentColor: "${designTokens.accentColor}"
  textColor: "${designTokens.textColor}"
  surfaceColor: "${designTokens.surfaceColor}"

Write the <${primitiveName}> JSX element now. Remember: tsx code block only, no imports.`;

    const response = await callLLM(config, systemPrompt, userPrompt, true);

    if (response.error || !response.content) {
        console.warn(`[ComponentCreator:${primitiveName}] LLM failed:`, response.error);
        return `<${primitiveName} />`;
    }

    const cleaned = sanitizeCompositionCode(response.content);
    return cleaned || `<${primitiveName} />`;
}
