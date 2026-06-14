import type { MorphSchema } from './MorphSDK';

/** Central registry of morph schemas for all animatable components. */
export const morphSchemas: Record<string, MorphSchema> = {
  // ─── Structural ─────────────────────────────────────
  BrowserFrame: {
    panelSize: { type: 'string' },
    url: { type: 'string' },
    windowStyle: { type: 'string' },
  },
  AppCanvas: {
    width: { type: 'number' },
    height: { type: 'number' },
    aspectRatio: { type: 'string' },
  },
  MockWindow: {
    visible: { type: 'boolean' },
    top: { type: 'number' },
    left: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    windowStyle: { type: 'string' },
  },
  SidebarLayout: {
    collapsed: { type: 'boolean' },
    sidebarWidth: { type: 'number' },
    sidebarPosition: { type: 'string' },
  },
  DataGridContainer: {
    columns: { type: 'number' },
    gap: { type: 'number' },
  },
  TopNavbar: {
    brandName: { type: 'string' },
    searchPlaceholder: { type: 'string' },
  },
  HeroMetricCard: {
    primaryText: { type: 'string' },
    captionText: { type: 'string' },
    trend: { type: 'string' },
  },
  ActionButton: {
    size: { type: 'string' },
    label: { type: 'string' },
  },
  SplitHeroLayout: {
    splitRatio: { type: 'number' },
  },
  TabSwitcherContainer: {
    activeTab: { type: 'number' },
  },
  BreadcrumbHeader: {
    separator: { type: 'string' },
  },
  NotificationToaster: {
    position: { type: 'string' },
  },

  // ─── Card ────────────────────────────────────────────
  CustomCard: {
    variant: { type: 'string' },
    width: { type: 'number' },
    height: { type: 'number' },
    borderRadius: { type: 'number' },
    padding: { type: 'number' },
    borderWidth: { type: 'number' },
    borderColor: { type: 'color' },
    headerText: { type: 'string' },
    footerText: { type: 'string' },
  },
  GlassmorphicCard: {
    blur: { type: 'number' },
    saturate: { type: 'number' },
    borderOpacity: { type: 'number' },
  },
  ProfileHeaderCard: {
    name: { type: 'string' },
    handle: { type: 'string' },
    badgeText: { type: 'string' },
  },
  FeatureBenefitCard: {
    accentColor: { type: 'color' },
    header: { type: 'string' },
    description: { type: 'string' },
  },
  PricingPlanCard: {
    price: { type: 'string' },
    highlighted: { type: 'boolean' },
    accentColor: { type: 'color' },
  },
  KanbanTaskCard: {
    title: { type: 'string' },
    status: { type: 'string' },
    priorityLabel: { type: 'string' },
  },
  BillingInvoiceCard: {
    status: { type: 'string' },
    description: { type: 'string' },
    amount: { type: 'string' },
    dueDate: { type: 'string' },
  },
  SettingsToggleCard: {
    toggled: { type: 'boolean' },
    toggleSize: { type: 'string' },
    transitionDuration: { type: 'number' },
    label: { type: 'string' },
  },
  PushNotificationToast: {
    appName: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    time: { type: 'string' },
  },
};
