import { CursorClick, MenuExpand, ScrollReveal } from './InteractionSDK';
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
  CursorClick: {
    clickX: { type: 'number' },
    clickY: { type: 'number' },
    radius: { type: 'number' },
    pulseColor: { type: 'string' },
    showHand: { type: 'boolean' },
    handSize: { type: 'number' },
    startFrame: { type: 'number' },
  },
  ScrollReveal: {
    scrollDistance: { type: 'number' },
    direction: { type: 'string' },
    startFrame: { type: 'number' },
    duration: { type: 'number' },
    containerHeight: { type: 'number' },
  },
  MetricCounter: {
    from: { type: 'number' },
    to: { type: 'number' },
    duration: { type: 'number' },
    startFrame: { type: 'number' },
    prefix: { type: 'string' },
    suffix: { type: 'string' },
    decimals: { type: 'number' },
    easing: { type: 'string' },
  },
  ToggleAnimate: {
    toggled: { type: 'boolean' },
    switchDuration: { type: 'number' },
    label: { type: 'string' },
    size: { type: 'string' },
  },
  MenuExpand: {
    expanded: { type: 'boolean' },
    duration: { type: 'number' },
    maxHeight: { type: 'number' },
  },
  Map: {
    lat: { type: 'number' },
    lng: { type: 'number' },
    zoom: { type: 'number' },
    pinLat: { type: 'number' },
    pinLng: { type: 'number' },
    pinScale: { type: 'number' },
    routeProgress: { type: 'number' },
    styleVariant: { type: 'string' },
  }
};
