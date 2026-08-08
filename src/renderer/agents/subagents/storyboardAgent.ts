import { callLLM, safeParseJson } from '../llmClient';
import type { AgentConfig, DesignTokens, SceneBlueprint } from '../types';

// ─── Available primitives list (just names — no props) ────────────────────────
// Storyboard agent only needs names to choose from, not full prop specs.
// Prop specs are given to the Component Creator per-primitive later.
export const STORYBOARD_PRIMITIVE_NAMES = [
    // Structural
    'BrowserFrame', 'SidebarLayout', 'TopNavbar', 'AppCanvas', 'MockWindow',
    'HeroMetricCard', 'DataGridContainer', 'SplitHeroLayout',
    'TabSwitcherContainer', 'ActionButton', 'BreadcrumbHeader', 'NotificationToaster',
    // Cards
    'GlassmorphicCard', 'KanbanTaskCard', 'NotificationCard', 'PricingPlanCard',
    'PriceCard', 'ProfileCard', 'SettingsToggleCard', 'CustomCard', 'FeatureCard',
    'FeatureBenefitCard', 'BillingInvoiceCard', 'PushNotificationToast', 'RegularCard',
    'ProfileHeaderCard',
    // Charts
    'BarChartCard', 'AreaChart', 'DonutChartCard', 'LineChartCard',
    'MetricFunnelCard', 'PieChartCard', 'ScatterPlotCard', 'StockCard',
];

// ─── System Prompt ────────────────────────────────────────────────────────────
const STORYBOARD_AGENT_SYSTEM = `You are a motion graphics video director.
Break a video prompt into 2-4 scenes. For each scene, pick 1-3 components from the provided COMPONENT LIST.

Return ONLY a JSON array. No markdown fences. No prose. Just the array.

Each item in the array must have:
{
  "id": "scene1",
  "purpose": "one sentence: what this scene shows visually",
  "durationInFrames": 150,
  "componentList": ["ComponentName1", "ComponentName2"]
}

Rules:
- durationInFrames must be between 60 (2s at 30fps) and 270 (9s)
- componentList must use EXACT names from the provided list
- Pick components that naturally visualize the scene's purpose
- Vary the components across scenes — don't repeat the same set
- First scene is often an intro/hero. Last scene wraps up.
- If the prompt mentions charts/metrics, use chart components
- If the prompt mentions a dashboard/app UI, use BrowserFrame + SidebarLayout together
- Maximum 3 components per scene — keep it focused`;

// ─── Default fallback ─────────────────────────────────────────────────────────
function defaultBlueprints(): SceneBlueprint[] {
    return [
        {
            id: 'scene1',
            purpose: 'Hero intro showing the main visual',
            durationInFrames: 150,
            componentList: ['MockWindow'],
        },
        {
            id: 'scene2',
            purpose: 'Data and metrics visualization',
            durationInFrames: 180,
            componentList: ['BarChartCard', 'HeroMetricCard'],
        },
    ];
}

// ─── Agent Runner ─────────────────────────────────────────────────────────────
export async function runStoryboardAgent(
    config: AgentConfig,
    prompt: string,
    narration: string,
    designTokens: DesignTokens,
    sceneCount: number = 3
): Promise<SceneBlueprint[]> {
    const narrationHint = narration.trim()
        ? `\nVoiceover hint (use for scene pacing): "${narration.trim().slice(0, 200)}"`
        : '';

    const userPrompt = `Video prompt: "${prompt}"${narrationHint}

Target number of scenes: ${sceneCount}
Visual theme: ${designTokens.theme} mode, primary color ${designTokens.primaryColor}

COMPONENT LIST (use EXACT names):
${STORYBOARD_PRIMITIVE_NAMES.join(', ')}

Return the JSON array now.`;

    const response = await callLLM(config, STORYBOARD_AGENT_SYSTEM, userPrompt, true);

    if (response.error || !response.content) {
        console.warn('[StoryboardAgent] LLM failed, using defaults:', response.error);
        return defaultBlueprints();
    }

    const parsed = safeParseJson<SceneBlueprint[]>(response.content, []);

    if (!Array.isArray(parsed) || parsed.length === 0) {
        console.warn('[StoryboardAgent] Invalid response shape, using defaults');
        return defaultBlueprints();
    }

    // Validate and clamp each blueprint
    return parsed.map((bp, i) => ({
        id: bp.id || `scene${i + 1}`,
        purpose: bp.purpose || `Scene ${i + 1}`,
        durationInFrames: Math.max(60, Math.min(270, bp.durationInFrames || 150)),
        componentList: Array.isArray(bp.componentList) && bp.componentList.length > 0
            ? bp.componentList.slice(0, 3) // max 3 per scene
            : ['MockWindow'],
    }));
}
