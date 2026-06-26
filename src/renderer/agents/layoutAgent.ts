import { callLLM } from './llmClient';
import type { AgentConfig, StoryboardScene, ComponentTree, ComponentNode } from './types';

const SYSTEM_PROMPT = `You are a UI layout designer for a motion-graphics engine. Given a scene description, produce a component tree using ONLY components from the Primitives SDK.

Available components:
- BrowserFrame: { url, panelSize: "small"|"medium"|"large", windowStyle: "mac"|"windows" }
- AppCanvas: { aspectRatio: "16:9"|"4:3"|"1:1" }
- MockWindow: { visible, top, left, width, height, windowStyle }
- SidebarLayout: { collapsed, sidebarWidth, sidebarPosition: "left"|"right" }
- DataGridContainer: { columns, gap }
- TopNavbar: { brandName, searchPlaceholder }
- HeroMetricCard: { primaryText, captionText, trend: "up"|"down" }
- ActionButton: { size: "sm"|"md"|"lg", label, icon, layout: "label-only"|"icon-label"|"icon-only" }
- SplitHeroLayout: { splitRatio }
- TabSwitcherContainer: { tabs: string[], activeTab }
- BreadcrumbHeader: { pathSequence: string[], separator }
- NotificationToaster: { position }
- CustomCard: { variant: "elevated"|"outlined"|"flat" }
- GlassmorphicCard: { blur, saturate }
- ProfileHeaderCard: { name, handle, badge }
- FeatureBenefitCard: { accent, header, description }
- PricingPlanCard: { highlighted, accentColor, price }
- KanbanTaskCard: { priorityLabel, title }
- BillingInvoiceCard: { status, description, amount, dueDate }
- SettingsToggleCard: { size, label, description }
- PushNotificationToast: { appName, title, body, time }
- CursorClick : {clickX, clickY, radius, showHand}
- ScrollReveal: {scrollDistance, direction, containerHeight}
- MetricCounter: {from,to,duration,prefix,suffix,decimals}
- ToggleAnimate: {toggled, label, size}
- MenuExpand: {expanded, maxHeight}
- Cursor: {startX, startY, targetId, clickFrame, duration}
- TextTyper: {text, charsPerFrame, showCursor}
- ProgressRing: { targetPercentage, size, duration}
- Map: { lat,lng,zoom,pinLat, pinLng, pinScale,routeProgress, styleVariant: "standard" || "dark" || "neon" }

Every primitive component can optionally accept:
- id : string (unique identifier)
- signalIn : {sourceId: string, event: 'click', action: 'expand' | "toggle" | "show" }
- signalOut : { event:string, frame: number }

Rules for Clicks:
- To animate a cursor click, set "targetId" on the Cursor to match "id" of the target component, and specify "clickFrame".

Output a JSON component tree. Every component must have "type" and "props". Use "children" for nesting.
Return valid JSON only.

Output format:
{
  "components": [
    { "type": "BrowserFrame", "props": { "url": "...", "panelSize": "medium" }, "children": [...] }
  ]
}`;

export async function runLayoutAgent(
  config: AgentConfig,
  scene: StoryboardScene,
  prevComponents?: ComponentTree,
): Promise<{ components?: ComponentTree; error?: string }> {
  const userPrompt = `Scene: "${scene.description}" (duration: ${scene.duration} frames, narration: "${scene.narration}")`;

  const context = prevComponents
    ? `\nPrevious scene's layout (maintain consistency if this is a continuation):\n${JSON.stringify(prevComponents, null, 2)}`
    : '';

  const result = await callLLM(config, SYSTEM_PROMPT, userPrompt + context);
  console.log("Raw AI Layout Output:", result.content);
  if (result.error) return { error: result.error };

  try {
    const cleaned = result.content.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const parsed = JSON.parse(cleaned) as ComponentTree;
    if (!parsed.components || !Array.isArray(parsed.components)) {
      return { error: 'Layout agent returned invalid component tree' };
    }
    return { components: parsed };
  } catch (e) {
    console.error("Failed to parse layout JSON. Error details:", e);
    return { error: 'Failed to parse component tree from LLM response' };
  }
}
