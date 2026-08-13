import { callLLM, sanitizeCompositionCode } from '../llmClient';
import type { AgentConfig, ComponentCode, DesignTokens } from '../types';
import { stripAllImports } from '../pipeline';
import { findRelevantSkills } from '../../utils/skillRAG';

// ─── Component Category Mapper ────────────────────────────────────────────────
function getComponentCategoryHint(name: string): string {
    const containers = ['BrowserFrame', 'MockWindow', 'AppCanvas'];
    const layouts = ['SidebarLayout', 'SplitHeroLayout', 'TopNavbar', 'TabSwitcherContainer', 'DataGridContainer'];
    const cards = ['HeroMetricCard', 'GlassmorphicCard', 'KanbanTaskCard', 'NotificationCard', 'PricingPlanCard', 'CustomCard', 'FeatureCard', 'FeatureBenefitCard', 'BillingInvoiceCard', 'RegularCard', 'ProfileCard', 'ProfileHeaderCard'];
    const charts = ['BarChartCard', 'AreaChartCard', 'LineChartCard', 'DonutChartCard', 'MetricFunnelCard', 'PieChartCard', 'ScatterPlotCard', 'StockCard'];

    if (containers.includes(name)) return 'Outer Window / Screen Container';
    if (layouts.includes(name)) return 'App Page Layout (holds sidebar/main content)';
    if (cards.includes(name)) return 'Metric / Info Card Widget';
    if (charts.includes(name)) return 'Data Visualization Chart Widget';
    return 'Interactive UI Element';
}

// ─── System Prompt Builder with RAG Skill Injection ───────────────────────────
export function buildLayoutAssemblerSystemPrompt(skillGuideText?: string): string {
    const skillBlock = skillGuideText
        ? `\nRETRIEVED SCENE LAYOUT CRAFT GUIDES:\n${skillGuideText}\n`
        : '';

    return `You are a Lead Motion Graphics Scene Layout Architect.
Your task is to arrange the provided component tags into a high-impact, 1920x1080 React scene layout.

${skillBlock}
LAYOUT & NESTING RULES:
1. STRICT TAG INVENTORY (CRITICAL):
   - You MUST ONLY use the EXACT tag names listed in the user prompt under "TAGS TO ARRANGE".
   - You are FORBIDDEN from inventing or hallucinating any extra tag names!
   - Every single tag provided in the user list MUST appear exactly once.
2. OBEY COMPONENT HIERARCHY:
   - Outer Containers (e.g. BrowserFrame) MUST wrap inner Layouts or Cards.
   - Page Layouts (e.g. SidebarLayout) MUST wrap Cards or Charts inside their content areas.
3. PREVENT VERTICAL OVERFLOW (~80% CANVAS DENSITY):
   - Never stack multiple large cards vertically!
   - When 2 or 3 cards/charts are siblings, place them side-by-side in a horizontal flex row:
     <div style={{ display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
       <Tag_1 />
       <Tag_2 />
     </div>
4. USE IN-SCOPE STYLING VARIABLES:
   - Available in-scope variables: primaryColor, secondaryColor, accentColor, semanticColor, errorColor, successColor, neutralColor, surfaceColor, backgroundColor, textColor, fontFamily.
5. RETURN FORMAT:
   - Return ONLY valid TSX inside a \`\`\`tsx ... \`\`\` block. No markdown prose.
   - Use the EXACT bare tag names provided in the user prompt. Do NOT add attributes or props onto these placeholder tags!`;
}

// ─── Agent Runner ─────────────────────────────────────────────────────────────
export async function runLayoutAssemblerAgent(
    config: AgentConfig,
    components: ComponentCode[],
    scenePurpose: string,
    designTokens: DesignTokens
): Promise<string> {
    if (!components || components.length === 0) {
        return `<div style={{ width: '100%', height: '100%', backgroundColor: backgroundColor }} />`;
    }

    // Single component optimization — no AI needed
    if (components.length === 1) {
        const singleComp = components[0];
        const cleaned = stripAllImports(singleComp.animatedJSX);
        return `<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n  ${cleaned}\n</div>`;
    }

    // ── RAG Skill Retrieval for Layout category ──────────────────────────────
    let skillGuideText = '';
    try {
        const skills = await findRelevantSkills(scenePurpose, 2, 'layout');
        if (skills.length > 0) {
            console.log(`📐 [LayoutAssembler] RAG retrieved ${skills.length} layout skills: ${skills.map(s => s.name).join(', ')}`);
            skillGuideText = skills.map(s => `=== LAYOUT SKILL: ${s.name} ===\n${s.cleanContent}`).join('\n\n');
        }
    } catch (err) {
        console.warn(`[LayoutAssembler] Skill RAG retrieval failed:`, err);
    }

    const systemPrompt = buildLayoutAssemblerSystemPrompt(skillGuideText);

    // Build unique tag names for each component e.g. <BrowserFrame_1 />
    const tagMap: Array<{ tag: string; name: string; animatedJSX: string; hint: string }> = components.map((comp, idx) => {
        const tag = `${comp.primitiveName}_${idx + 1}`;
        return {
            tag,
            name: comp.primitiveName,
            animatedJSX: stripAllImports(comp.animatedJSX),
            hint: getComponentCategoryHint(comp.primitiveName),
        };
    });

    const tagListStr = tagMap.map(t => `- <${t.tag} />  (Type: ${t.name} — ${t.hint})`).join('\n');

    const userPrompt = `Scene Objective: "${scenePurpose}"

TAGS TO ARRANGE (Use these EXACT tag names):
${tagListStr}

Arrange these exact tags into a nested, full-screen React TSX layout now. Remember: \`\`\`tsx block only.`;

    const response = await callLLM(config, systemPrompt, userPrompt, true);

    if (response.error || !response.content) {
        console.warn('[LayoutAssembler] LLM layout assembly failed, using flex fallback:', response.error);
        return fallbackFlexLayout(tagMap);
    }

    let layoutTSX = sanitizeCompositionCode(response.content);

    // 2-pass tag replacement loop (paired tags first, then self-closing)
    for (const t of tagMap) {
        const cleanAnimatedJSX = t.animatedJSX.replace(/100v[hw]/gi, '100%');

        // Pass 1: Paired tags e.g. <Tag_1>children</Tag_1>
        const pairedRegex = new RegExp(`<${t.tag}(?:\\s[^>]*?)?>([\\s\\S]*?)</${t.tag}>`, 'gi');
        if (pairedRegex.test(layoutTSX)) {
            layoutTSX = layoutTSX.replace(pairedRegex, (_match, innerChildren) => {
                const trimmedChildren = (innerChildren || '').trim();
                if (trimmedChildren.length > 0 && /children/i.test(cleanAnimatedJSX)) {
                    return cleanAnimatedJSX.replace(/children/i, trimmedChildren);
                }
                return cleanAnimatedJSX;
            });
        }

        // Pass 2: Self-closing or remaining open tags e.g. <Tag_1 />
        const selfClosingRegex = new RegExp(`<${t.tag}(?:\\s[^>]*?)?/>|<${t.tag}(?:\\s[^>]*?)?>`, 'gi');
        layoutTSX = layoutTSX.replace(selfClosingRegex, cleanAnimatedJSX);
    }

    return layoutTSX;
}

// ─── Fallback Flex Layout ──────────────────────────────────────────────────────
function fallbackFlexLayout(tagMap: Array<{ tag: string; animatedJSX: string }>): string {
    const childrenStr = tagMap.map(t => t.animatedJSX).join('\n');
    return `<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: backgroundColor }}>\n${childrenStr}\n</div>`;
}
