import { Browser } from "@phosphor-icons/react";
import { ActionButton, AppCanvas, BreadcrumbHeader, BrowserFrame, DataGridContainer, HeroMetricCard, MockWindow, NotificationToaster, SidebarLayout, SplitHeroLayout, TabSwitcherContainer, TopNavbar } from "../primitives/StructuralSDK";
import { BillingInvoiceCard, CustomCard, FeatureBenefitCard, FeatureCard, GlassmorphicCard, KanbanTaskCard, NotificationCard, PriceCard, PricingPlanCard, ProfileCard, ProfileHeaderCard, PushNotificationToast, RegularCard, SettingsToggleCard } from "../primitives/CardSDK";
import Settings from "../pages/Settings";
import { AreaChart, BarChartCard, DonutChartCard, LineChartCard, MetricFunnel, PieChartCard, ScatterPlotCard, StockCard } from "../primitives/ChartsSDK";

export interface PrimitiveMeta {
    name: string;
    category: 'structural' | 'cards' | 'charts' | 'transitions' | 'morph';
    description: string;
    props: string[];
}

export const PRIMITIVE_MENU_SUMMARY = `

=====================================================================
EXHAUSTIVE COMPONENT AND PROP REGISTRY (ALL SDKS)
=====================================================================

1. Common Shared Config Structures (Accepted across all primitives):
    - GlowConfig: { enabled: boolean, color: string, intensity: number, spread: number}
    - TextFormatConfig: { size?: number, fontFamily?: string, color?: string. bold?: boolean, italics?:boolean, underline?: boolean, alignment?: 'left'|'center'|'right'|'justify', lineSpacing?: number, letterSpacing?: number }
    - 3D Perspective Props: { rotateX?: number, rotateY?: number, rotateZ?: number, perspective?: number, translateZ?: number }
    - Common Base Props: { width?: number | string, height?: number | string, backgroundColor?: string, borderRadius?: number, padding?: number, style?: React.CSSProperties }

---------------------------------------------------------------------
2. Structural SDK Components and Props:
- BrowserFrame:
    Props: children, url?, osType? ('mac'|'windows'), width?, height?, backgroundColor?, 
           windowBarColor?, borderRadius?, showNavArrow?, showNewTabButton?, glowConfig?, style?,
           onBackClick?, onForwardClick?, onNewTabClick?, rotateX?, rotateY?, rotateZ?, perspective?,
           translateZ?
-SidebarLayout:
    Props: logoText?, logoUrl?, items: Array<{ id: string, label: string, icon?: string, badge?: string, active?: boolean}>, 
           activeId?, userProfile?: { name: string, role: string, avatarUrl?: string}, width?, backgroundColor?, activeItemBgColor?,
           itemTextColor?, activeItemColor?, borderRadius?, glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?, children?
-TopNavbar:
    Props: title?, breadcumbs?: string[], actions?: Array<{ label: string, icon?: string, variant?: 'primary'|'secondary'|'ghost' }>, showSearch?: boolean,
           searchPlaceholder?, backgroundColor?, borderBottomColor?, height?, glowConfig?, rotateX?, rotateY, rotateZ, perspective?, translateZ?
-AppCanvas:
    Props: children?, backgroundColor?, gridPattern?: boolean, gridColor?, gridSpacing?, 
    ambientClog?: Array<{ color: string, x: number, y: number, radius: number, opacity: number}>,
    width?, height?
-MockWindow:
    Props: title?, width?, height?, isFrameless?: boolean, windowColor?, headerColor?, 
    controlsPosition?: 'left'|'right', glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?,
    translateZ?, children?
-HeroMetricCard:
    Props: title: string, value: string | number, change?: string | number,
           trend?: 'up'| 'down' | 'neutral', chartType?: 'mini-line' | 'mini-bar',
           sparklineData?: number[], backgroundColor?, borderRadius?, glowConfig?, 
           rotateX?, rotateZ?, perpsective?, translate?
-DataGridContainer:
    Props: headers: string[], rows: Array<Record<string,any>>, selectable?: boolean, 
           pageSize?: number, hoverHighlight?: boolean, backgroundColor?, borderColor?,
           borderRadius?, glowConfig, rotateX, rotateZ, rotateY, perspective, translateZ?
-SplitHeroLayout:
    Props: leftContent: React.ReactNode, rightContent: React.ReactNode,
           leftWidth?: string, rightWidth?: string, gap?: number, alignVertical?: 'start'|'center'|'end'
-TabSwitcherContainer:
    Props: tabs: Array<{ id: string, label:string, count?: number}>, activeTab: string, 
           onChange?: (tabId, string) => void, variant?: 'pills'|'underline'|'contained', 
           backgroundColor?, glowConfig?
-ActionButton:
    Props: label: string, icon?: string, variant?: 'primary'|'secondary'|'danger'|'ghost',
           size?: 'sm|'md|'lg', glowConfig?, onClick?, disabled?: boolean
-BreadCrumbHeader:
    Props: paths: Array<{ label: string, href?: string }>, activeItem?: string, speratorIcon?: string
-NotificationToaster:
    Props: notifications: Array<{ id: string, title: string, message: string, 
           type?: 'info'|'success'|'warning'|'error', icon?: string}>, 
           position?: 'top-right'|'bottom-right'|'top-center'

------------------------------------------------------------------
3. Cards Sdk Components & Props:
-FeatureCard:
    Props: glowConfig?, width?, height?, logoUrl?, logoBgColor?,
           logoBorderRadius?, titleText: string, titleConfig:? TextFormatConfig,
           descriptionText: string, descriptionConfig?: TextFormatConfig, 
           backgroundColor?, borderRadius, padding?, rotateX?, rotateY?, rotateZ?,
           perspective?, translateZ?

-GlassmorphicCard:
    Props: title?: string, subtitle?: string, content?: React.ReactNode, blurAmount? : number,
           opacity?: number, borderColor?, glowConfig?, width?, height?, borderRadius?, rotateX,
           rotateZ, rotateY, perspective?, translateZ
-KanbanTaskCard:
    Props: title: string, tags?: string[], asignee?: { name: string, avatarUrl?: string},
           priority? : 'low'|'medium'|'high'|'urgent',status?: string, dueDate?: string,
           backgroundColor?, borderRadius?, glowConfig?, rotateX?, rotateY?, rotateZ?,
           perspective?, translateZ
-NotificationCard:
    Props: title:string, message: string, timeStamp?: string, icon?: string, unread?: boolean,
           actionLabel?: string, backgroundColor?, borderRadius?, glowConfig?, rotateX?, rotateY?,
           rotateZ?, perspective?, translateZ?
-PricePlanCard:
    Props: planName: string, price: string | number, billingCycle?: string, features: string[], isPopular?: boolean,
           popularBadgeText?: string, ctaLabel?: string, ctaVariant?: 'primary'|'secondary', backgroundColor?, borderRadius?,
           glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
-PriceCard:
    Props: amount: string | number, currency?: string, interval?: 'month'|'year'|'one-time', title?: string, subTitle?: string,
           features?: string[], glowConfig?, rotateX?, rotateZ?, perspective?, translateZ?
-ProfileCard:
    Props: name : string, role: string, avatarUrl?: string, metrics?: Array<{ label:string, 
           value: string|number}>, badge? string, backgroundColor?, borderRadius?, glowConfig?,
           rotateX?, rotateY?, rotateZ, perspective?, translateZ?
-SettingsToggleCard:
    Props: title: string, description?: string, isChecked: boolean, icon?: string, onToggle?: (chceked: boolean) => void,
           backgroundColor?, borderRadius?, glowConfig?, rotateX?, rotateY?, perspective?, translateZ?
-CustomCard:
    Props: header?: React.ReactNode, footer?: React.ReactNode, children?: React.ReactNode, backgroundColor?,
           borderColor?, borderRadius?, padding?, glowConfig?, rotateX?, rotateY?, rotateZ?, perspective, translateZ?
-FeatureBenefitCard:
    Props: benefitTitle: string, bulletPoints: string[], highlightColor?: string, iconUrl?: string, backgroundColor?,
           borderRadius?, glowConfig?, rotateX?, rotateY?, rotateZ?, perspecive?, translateZ?
-BillingInvoiceCard:
    Props: invoiceNumber: string, amountDue: string | number, dueDate: string, status: 'paid'|'pending'|'overdue',
           items: Array<{ description: string, amount: string| number}>, glowConfig?, rotateX?, rotateY?, rotateZ?, 
           perspective?, translateZ?
-PushNotificationToast:
    Props: appIcon?: string, appName?: string, title: string, body?: string, timeAgo?: string, onClick?, glowConfig?
-RegularCard:
    Props: titleText: string, titleConfig?: TextFormatConfig, bodyText?: string, bodyConfig?: TextFormatConfig, accentColor?
           backgroundColor?, borderRadius?, glowConfig?
-ProfileHeaderCard:
    Props: userName: string, handle: string, coverImageUrl?: string, avatarUrl?: string,
           bio?: string, followerCount?: number, glowConfig?

------------------------------------------------------------------
4. Charts SDK Components & Props:
-BarChartCard:
    Props: title? string, categories: string[], values: number[], barColor?: string, animated?: boolean, 
           width?, height, showGrid?: boolean, showYAxis?: boolean, glowConfig?, rotateX?, rotateY?, rotateZ?,
           perspective?, translateZ?
-AreaChartCard:
    Props: title?: string, data: Array<{ x : string|number, y: number }>, gradientFrom?: string, gradientTo?: string,
           strokeColor?: string, showGrid?: boolean, width?, height?, glowConfig?, rotateX?, rotateZ?, perspective?, translateZ?
-LineChatCard:
    Props: title?: string, points: ArraY<{ x: string|number, y: number}>, strokColor?: string, strokeWidth?: number, isCurved?: boolean,
           showAreaFill?: boolean, glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
-DonutChardCard:
    Props: title?: string, labels: string[], values: number[], centerText?: string, centerSubtext?: string,
           colors?: string[], width?, height?, glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
-MetricFunnelCard:
    Props: steps: string[], values: number[], conversionRates?: number[], funnelColor?: string, backgroundColor?, 
           glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
-PieChartCard:
    Props: title?: string, segments: Array<{ label: string, value: number, color?:string}>, showLegend?: boolean,
           width?, height?, glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
-ScatterPlotCard:
    Props: title?: string, points: Array<{ x: number, y: number, label?: string, size?: number}>, xAxisLabel?: string,
           yAxisLabel?: string, dotColor?: string, glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
-StockCard:
    Props: symbol: string, companyName?: stirng, price: number, history: number[], changePercent: number, currency?: string,
           glowConfig?, rotateX?, rotateY?, rotateZ?, perspective?, translateZ?
===================================================================
`;

const PRIMITIVE_PATH_MAP: Record<string, string> = {
    BrowserFrame: 'structural/BrowserFrame.tsx',
    SidebarLayout: 'structural/SidebarLayout.tsx',
    TopNavbar: 'structural/TopNavbar.tsx',
    AppCanvas: 'structural/AppCanvas.tsx',
    MockWindow: 'structural/MockWindow.tsx',
    HeroMetricCard: 'structural/HeroMetricCard.tsx',
    DataGridContainer: 'structural/DataGridContainer.tsx',
    SplitHeroLayout: 'structural/SplitHeroLayout.tsx',
    TabSwitcherContainer: 'structural/TabSwitcherContainer.tsx',
    ActionButton: 'structural/ActionButton.tsx',
    BreadcrumbHeader: 'structural/BreadcrumbHeader.tsx',
    NotificationToaster: 'structural/NotificationToaster.tsx',

    GlassmorphicCard: 'cards/GlassmorphicCard.tsx',
    KanbanTaskCard: 'cards/KanbanTaskCard.tsx',
    NotificationCard: 'cards/NotificationCard.tsx',
    PricingPlanCard: 'cards/PricingPlanCard.tsx',
    PriceCard: 'cards/PriceCard.tsx',
    ProfileCard: 'cards/ProfileCard.tsx',
    SettingsToggleCard: 'cards/SettingsToggleCard.tsx',
    CustomCard: 'cards/CustomCard.tsx',
    FeatureCard: 'cards/FeatureCard.tsx',
    FeatureBenefitCard: 'cards/FeatureBenefitCard.tsx',
    BillingInvoiceCard: 'cards/BillingInvoiceCard.tsx',
    PushNotificationToast: 'cards/PushNotificationToast.tsx',
    RegularCard: 'cards/RegularCard.tsx',
    ProfileHeaderCard: 'cards/ProfileHeaderCard.tsx',

    AreaChartCard: 'charts/AreaChartCard.tsx',
    BarChartCard: 'charts/BarChartCard.tsx',
    DonutChartCard: 'charts/DonutChartCard.tsx',
    LineChartCard: 'charts/LineChartCard.tsx',
    MetricFunnelCard: 'charts/MetricFunnelCard.tsx',
    PieChartCard: 'charts/PieChartCard.tsx',
    ScatterPlotCard: 'charts/ScatterPlotCard.tsx',
    StockCard: 'charts/StockCard.tsx',
};

export async function ingestPrimitiveSourceCode(componentNames: string[]): Promise<Record<string, string>> {
    const codeMap: Record<string, string> = {};
    const names = Array.isArray(componentNames) ? componentNames : [];

    for (const name of names) {
        const relativePath = PRIMITIVE_PATH_MAP[name];
        if (!relativePath) continue;

        try {
            const fullPath = `src/renderer/primitives/${relativePath}`;
            if (window.electronAPI?.readFile) {
                const content = await window.electronAPI.readFile(fullPath);
                codeMap[name] = content;
            } else {
                const res = await fetch(`/@fs/${fullPath}`).catch(() => null);
                if (res && res.ok) {
                    codeMap[name] = await res.text();
                }
            }
        } catch (err) {
            console.warn(`Could not load source code for primitive [${name}]`, err);
        }
    }

    return codeMap;
}

