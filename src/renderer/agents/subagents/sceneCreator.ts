import { callLLM, sanitizeCompositionCode } from '../llmClient';
import type { AgentConfig, DesignTokens } from '../types';
import { getPrimitiveSpec } from '../primitiveRegistry';
import { findRelevantSkills } from '../../utils/skillRAG';

export interface AgentResultWithPrompt {
    code: string;
    systemPrompt: string;
    userPrompt: string;
}

export const SCENE_CREATOR_PROMPT = `You are a Lead Motion Graphics UI & React Developer.
Your job is to build a high-impact, professional video scene. 

Primitives are UI building blocks you can use to write code easier. Availble Primitives : \n
        'BrowserFrame', 'AppCanvas', 'MockWindow', 'SidebarLayout', 'DataGridContainer',
        'TopNavbar', 'HeroMetricCard', 'ActionButton', 'SplitHeroLayout', 'TabSwitcherContainer',
        'BreadcrumbHeader', 'NotificationToaster', 'FeatureCard', 'GlassmorphicCard',
        'KanbanTaskCard', 'NotificationCard', 'PricingPlanCard', 'PriceCard', 'ProfileCard',
        'SettingsToggleCard', 'CustomCard', 'FeatureBenefitCard', 'BillingInvoiceCard',
        'PushNotificationToast', 'RegularCard', 'ProfileHeaderCard', 'BarChartCard',
        'AreaChartCard', 'LineChartCard', 'DonutChartCard', 'MetricFunnelCard',
        'PieChartCard', 'ScatterPlotCard', 'StockCard',
        'SpringEnter', 'FadeBlur', 'SlideInOut', 'ScaleUp', 'StaggerContainer',
        'Cursor', 'TextTyper', 'FocusZoom', 'ChartAnimate', 'ProgressRing', 'MarqueeTrack', 'TypingGhostCursor'\n\n

Skills are availble design rules to help you think like a professional designer while creating scenes. Availble Skills : \n
ad-creative-video, launch-video, testimonial-video, animated-infographic, chart-animation, presentation-video, photo-slideshow, 
product-demo-video, promo-video, diagram-animation, explainer-video, isometric-animation, whiteboard-animation, wrapped-video, 
brand-motion-guidelines, client-revisions, creative-brief, motion-pricing, video-delivery-specs, generative-illustration, 
kinetic-typography, manim, map-animation, after-effects, animation-principles, beat-sync-editing, color-motion, logo-animation, 
motion-art-direction, motion-background, remotion-video, shot-composition, text-message-animation, caption-animation, countdown-video, 
lower-thirds, short-form-video, 60fps-animation, accessible-animation, ascii-animation, glassmorphism, gsap-web, lottie-animation, 
micro-interaction, page-transition-animation, svg-animation, particle-system, shader-glsl, threejs-animation, audiogram, youtube-intro-outro

If you want the props to any primitives or view any skills output this format : { primitives : [primitive1, primitive2,],
skills : [skill1, skill2]
  }

IN-SCOPE STYLING VARIABLES (AVAILABLE IN SCOPE — USE THESE DIRECTLY IN JSX):\n
- primaryColor    (Use for main buttons, active pills, primary glowConfig.color, highlight text)\n
- secondaryColor  (Use for secondary highlights, badge outlines, subtitled tags)\n
- accentColor     (Use for key accent highlights, sparkline strokes, warning/attention dots)\n
- semanticColor   (Use for info notifications, links, blue status pills)\n
- errorColor      (Use for critical alerts, down trend indicators, error badges, red dots)\n
- successColor    (Use for positive growth badges (+2.4%), active indicators, online/optimal pills, up trends)\n
- neutralColor    (Use for muted borders, subtle timestamps, inactive menu items)\n
- surfaceColor    (Use for card containers, window headers, panel backgrounds)\n
- backgroundColor  (Use for outer wrapper backdrops and dark gradients)\n
- textColor       (Use for headers, titles, and body text)\n
- fontFamily      (Use for all inline style fontFamily declarations)\n

EXAMPLE IN-SCOPE VARIABLE USAGE IN JSX:\n
  style={{ backgroundColor: surfaceColor, color: textColor, fontFamily: fontFamily, border: "1px solid " + neutralColor }}\n
  <span style={{ color: successColor, backgroundColor: "rgba(34, 197, 94, 0.15)" }}>+2.4%</span>\n
  glowConfig={{ enabled: true, color: primaryColor, intensity: 8, spread: 4 }}\n

Requested Scene by the second:\n


CRITICAL MANDATES & NON-EMPTY CONSTRAINTS (STRICTLY ENFORCED):\n
1. DO NOT NEST OUTER CONTAINERS INSIDE EACH OTHER: Choose EITHER <MockWindow> OR <BrowserFrame> OR <AppCanvas> as the root outer window. NEVER put <BrowserFrame> inside <MockWindow>!\n
2. NO EMPTY BARE TAGS (CRITICAL): You are STRICTLY FORBIDDEN from returning a self-closing empty tag like \`< primitiveName />\` or \`<primitiveName></primitiveName>\`. You MUST write out full props AND rich inner children!\n
2. CONTAINER PRIMITIVES (BrowserFrame, MockWindow, SidebarLayout, AppCanvas, GlassmorphicCard):\n
   You MUST pass explicit props (e.g. \`width={1000}\`, \`height={650}\`, \`windowColor={surfaceColor}\`, \`glowConfig={{ enabled: true, color: primaryColor, intensity: 8, spread: 4 }}\`) AND nest rich inner JSX children inside the container (headers, metric badges, status indicators, domain subtitles).\n
3. CARD & CHART PRIMITIVES (HeroMetricCard, BarChartCard, LineChartCard, FeatureCard):\n
   You MUST pass all key props (title="...", value="...", categories={[...]}, values={[...]}, barColor={primaryColor}, width={550}, height={320}).\n
4. USE IN-SCOPE COLOR VARIABLES: Always use primaryColor, secondaryColor, accentColor, semanticColor, errorColor, successColor, neutralColor, surfaceColor, backgroundColor, textColor, fontFamily.\n
5. DOMAIN RELEVANCY: Fill all text, titles, labels, and numbers with authentic context matching the scene objective.\n
6. CODE FORMAT: Return ONLY valid TSX inside a \`\`\`tsx ... \`\`\` block. No markdown prose, no imports, no export default wrappers.`

// ─── System Prompt Builder with Prop Spec Contracts & RAG Skill Guides ─────
export function buildComponentCreatorSystemPrompt(
    primitiveName: string,
    propSpec: string,
    skillGuideText?: string,
    scene?: string,
): string {
    const skillBlock = skillGuideText
        ? `\nRETRIEVED CRAFT SKILL GUIDES (Follow these animation & design best practices):\n${skillGuideText}\n`
        : '';

    return `You are a Lead Motion Graphics UI & React Developer.
Your job is to build a high-impact, professional video scene. 

Primitives are UI building blocks you can use to write code easier. Availble Primitives : \n
        'BrowserFrame', 'AppCanvas', 'MockWindow', 'SidebarLayout', 'DataGridContainer',
        'TopNavbar', 'HeroMetricCard', 'ActionButton', 'SplitHeroLayout', 'TabSwitcherContainer',
        'BreadcrumbHeader', 'NotificationToaster', 'FeatureCard', 'GlassmorphicCard',
        'KanbanTaskCard', 'NotificationCard', 'PricingPlanCard', 'PriceCard', 'ProfileCard',
        'SettingsToggleCard', 'CustomCard', 'FeatureBenefitCard', 'BillingInvoiceCard',
        'PushNotificationToast', 'RegularCard', 'ProfileHeaderCard', 'BarChartCard',
        'AreaChartCard', 'LineChartCard', 'DonutChartCard', 'MetricFunnelCard',
        'PieChartCard', 'ScatterPlotCard', 'StockCard',
        'SpringEnter', 'FadeBlur', 'SlideInOut', 'ScaleUp', 'StaggerContainer',
        'Cursor', 'TextTyper', 'FocusZoom', 'ChartAnimate', 'ProgressRing', 'MarqueeTrack', 'TypingGhostCursor'\n\n

Skills are availble design rules to help you think like a professional designer while creating scenes. Availble Skills : \n
ad-creative-video, launch-video, testimonial-video, animated-infographic, chart-animation, presentation-video, photo-slideshow, 
product-demo-video, promo-video, diagram-animation, explainer-video, isometric-animation, whiteboard-animation, wrapped-video, 
brand-motion-guidelines, client-revisions, creative-brief, motion-pricing, video-delivery-specs, generative-illustration, 
kinetic-typography, manim, map-animation, after-effects, animation-principles, beat-sync-editing, color-motion, logo-animation, 
motion-art-direction, motion-background, remotion-video, shot-composition, text-message-animation, caption-animation, countdown-video, 
lower-thirds, short-form-video, 60fps-animation, accessible-animation, ascii-animation, glassmorphism, gsap-web, lottie-animation, 
micro-interaction, page-transition-animation, svg-animation, particle-system, shader-glsl, threejs-animation, audiogram, youtube-intro-outro

If you want the props to any primitives or view any skills output this format : { primitives : [primitive1, primitive2,],
skills : [skill1, skill2]
  }

IN-SCOPE STYLING VARIABLES (AVAILABLE IN SCOPE — USE THESE DIRECTLY IN JSX):\n
- primaryColor    (Use for main buttons, active pills, primary glowConfig.color, highlight text)\n
- secondaryColor  (Use for secondary highlights, badge outlines, subtitled tags)\n
- accentColor     (Use for key accent highlights, sparkline strokes, warning/attention dots)\n
- semanticColor   (Use for info notifications, links, blue status pills)\n
- errorColor      (Use for critical alerts, down trend indicators, error badges, red dots)\n
- successColor    (Use for positive growth badges (+2.4%), active indicators, online/optimal pills, up trends)\n
- neutralColor    (Use for muted borders, subtle timestamps, inactive menu items)\n
- surfaceColor    (Use for card containers, window headers, panel backgrounds)\n
- backgroundColor  (Use for outer wrapper backdrops and dark gradients)\n
- textColor       (Use for headers, titles, and body text)\n
- fontFamily      (Use for all inline style fontFamily declarations)\n

EXAMPLE IN-SCOPE VARIABLE USAGE IN JSX:\n
  style={{ backgroundColor: surfaceColor, color: textColor, fontFamily: fontFamily, border: "1px solid " + neutralColor }}\n
  <span style={{ color: successColor, backgroundColor: "rgba(34, 197, 94, 0.15)" }}>+2.4%</span>\n
  glowConfig={{ enabled: true, color: primaryColor, intensity: 8, spread: 4 }}\n

Requested Scene by the second:\n
${scene}

CRITICAL MANDATES & NON-EMPTY CONSTRAINTS (STRICTLY ENFORCED):\n
1. DO NOT NEST OUTER CONTAINERS INSIDE EACH OTHER: Choose EITHER <MockWindow> OR <BrowserFrame> OR <AppCanvas> as the root outer window. NEVER put <BrowserFrame> inside <MockWindow>!\n
2. NO EMPTY BARE TAGS (CRITICAL): You are STRICTLY FORBIDDEN from returning a self-closing empty tag like \`<${primitiveName} />\` or \`<${primitiveName}></${primitiveName}>\`. You MUST write out full props AND rich inner children!\n
2. CONTAINER PRIMITIVES (BrowserFrame, MockWindow, SidebarLayout, AppCanvas, GlassmorphicCard):\n
   You MUST pass explicit props (e.g. \`width={1000}\`, \`height={650}\`, \`windowColor={surfaceColor}\`, \`glowConfig={{ enabled: true, color: primaryColor, intensity: 8, spread: 4 }}\`) AND nest rich inner JSX children inside the container (headers, metric badges, status indicators, domain subtitles).\n
3. CARD & CHART PRIMITIVES (HeroMetricCard, BarChartCard, LineChartCard, FeatureCard):\n
   You MUST pass all key props (title="...", value="...", categories={[...]}, values={[...]}, barColor={primaryColor}, width={550}, height={320}).\n
4. USE IN-SCOPE COLOR VARIABLES: Always use primaryColor, secondaryColor, accentColor, semanticColor, errorColor, successColor, neutralColor, surfaceColor, backgroundColor, textColor, fontFamily.\n
5. DOMAIN RELEVANCY: Fill all text, titles, labels, and numbers with authentic context matching the scene objective.\n
6. CODE FORMAT: Return ONLY valid TSX inside a \`\`\`tsx ... \`\`\` block. No markdown prose, no imports, no export default wrappers.`;
}

// ─── Agent Runner with Detailed Prompt Return ─────────────────────────────────
export async function runComponentCreatorAgentDetailed(
    config: AgentConfig,
    primitiveName: string,
    designTokens: DesignTokens,
    scene: string,
    isBackground: boolean = false
): Promise<AgentResultWithPrompt> {
    const propSpec = getPrimitiveSpec(primitiveName);

    const isChart = /chart|graph|metric|funnel|sparkline/i.test(primitiveName);
    const category = isChart ? 'data' : 'layout';

    let skillGuideText = '';
    try {
        const skills = await findRelevantSkills(`${scene} ${primitiveName}`, 2, category);
        if (skills.length > 0) {
            skillGuideText = skills.map(s => `=== CRAFT SKILL: ${s.name} ===\n${s.cleanContent}`).join('\n\n');
        }
    } catch (err) {
        console.warn(`[ComponentCreator] Skill RAG retrieval failed:`, err);
    }

    const systemPrompt = buildComponentCreatorSystemPrompt(primitiveName, scene, skillGuideText);

    const positionHint = isBackground
        ? 'Role: Full-screen background or layout container. Fill the entire canvas width & height.'
        : 'Role: Hero content element. Embed and surround with rich headers, SVG badges, and metric pills to fill the canvas.';

    const userPrompt = `Scene : "${scene}"
        ${positionHint}

 Remember: \`\`\`tsx block only.`;

    if (!propSpec) {
        return {
            code: `<${primitiveName} />`,
            systemPrompt,
            userPrompt,
        };
    }

    const response = await callLLM(config, systemPrompt, userPrompt, true);

    if (response.error || !response.content) {
        return {
            code: `<${primitiveName} />`,
            systemPrompt,
            userPrompt,
        };
    }

    const cleaned = sanitizeCompositionCode(response.content);
    return {
        code: cleaned || `<${primitiveName} />`,
        systemPrompt,
        userPrompt,
    };
}

// Standard runner wrapper
export async function runComponentCreatorAgent(
    config: AgentConfig,
    primitiveName: string,
    designTokens: DesignTokens,
    scenePurpose: string,
    isBackground: boolean = false
): Promise<string> {
    const res = await runComponentCreatorAgentDetailed(config, primitiveName, designTokens, scenePurpose, isBackground);
    return res.code;
}
