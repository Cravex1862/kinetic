import React, { useState, useEffect } from 'react';
import { spring, interpolate, Easing } from 'remotion';
import { Cursor, CursorClick, Hand, HandGrabbing } from '@phosphor-icons/react';

import {
  BrowserFrame,
  AppCanvas,
  MockWindow,
  SidebarLayout,
  DataGridContainer,
  TopNavbar,
  HeroMetricCard,
  ActionButton,
  SplitHeroLayout,
  TabSwitcherContainer,
  BreadcrumbHeader,
  NotificationToaster,
  type GlowConfig,
} from './primitives/StructuralSDK';

import { SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale, AccordionExpand, RotateFlip, GlitchIntro } from './primitives/TransitionSDK';
import { Cursor as MotionCursor, SmoothScroll, FocusZoom, TextTyper, ChartAnimate, DragAndDrop, TypingGhostCursor, MarqueeTrack, ProgressRing } from './primitives/MotionSDK';
import { BarChart, LineChart, PieChart, AreaChart, DonutChart, MetricFunnel, ScatterPlot, SparklineTicker } from './primitives/ChartsSDK';
import { CustomCard, GlassmorphicCard, ProfileHeaderCard, FeatureBenefitCard, PricingPlanCard, KanbanTaskCard, BillingInvoiceCard, SettingsToggleCard, PushNotificationToast } from './primitives/CardSDK';

// ─── Config state ────────────────────────────────────────────
type GlowState = { enabled: boolean; color: string; intensity: number; spread: number };
type TransState = { duration: number; direction: 'left' | 'right' | 'top' | 'bottom'; pulseMin: number; pulseMax: number };
type MotionState = { duration: number; clickFrame: number; dndCursor: boolean };

const defaultGlow: GlowState = { enabled: true, color: '#6366f1', intensity: 2.5, spread: 4 };
const defaultTrans: TransState = { duration: 45, direction: 'bottom', pulseMin: 0.9, pulseMax: 1.1 };
const defaultMotion: MotionState = { duration: 40, clickFrame: 35, dndCursor: true };

// ─── Frame loop hook ─────────────────────────────────────────
function usePlayableFrame(maxFrames: number, fps: number, playing: boolean): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const ms = 1000 / fps;
    const timer = setInterval(() => setFrame((f) => (f >= maxFrames ? 0 : f + 1)), ms);
    return () => clearInterval(timer);
  }, [maxFrames, fps, playing]);
  return frame;
}

// ─── Controls panel ──────────────────────────────────────────
type ControlPanelProps = { label: string; children: React.ReactNode };
const ControlPanel: React.FC<ControlPanelProps> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 rounded-lg border border-gray-700/60 bg-gray-900/50">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:text-white">
        <span>{label}</span>
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t border-gray-700/50 px-4 py-4">{children}</div>}
    </div>
  );
};

// ─── Slider ──────────────────────────────────────────────────
type SliderProps = { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void };
const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="flex items-center gap-3">
    <span className="w-24 text-xs text-gray-400">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-indigo-500" />
    <span className="w-10 text-right text-xs text-gray-500">{value}</span>
  </div>
);

// ─── Structural Card ─────────────────────────────────────────
type CardProps = { name: string; children: React.ReactNode };
const Card: React.FC<CardProps> = ({ name, children }) => (
  <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-lg">
    <div className="border-b border-gray-700/50 px-4 py-2"><span className="text-sm font-medium text-indigo-400">&lt;{name}&gt;</span></div>
    <div className="p-3">{children}</div>
  </div>
);

// ─── Animated card with render-prop (fix: stays mounted, no remount on config change) ─────
type AnimDeckProps = {
  name: string;
  children: (frame: number) => React.ReactNode;
  maxFrames: number;
};

const AnimDeck: React.FC<AnimDeckProps> = ({ name, children, maxFrames }) => {
  const [playing, setPlaying] = useState(false);
  const frame = usePlayableFrame(maxFrames, 30, playing);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-700/50 px-4 py-2">
        <span className="text-sm font-medium text-indigo-400">&lt;{name}&gt;</span>
        <button onClick={() => setPlaying((p) => !p)} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-500 active:scale-95">
          {playing ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="relative h-52 w-full">
        {playing ? children(frame) : <div className="flex h-full w-full items-center justify-center bg-gray-950"><span className="text-xs text-gray-600">Press Play</span></div>}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
//  PAGE
// ═════════════════════════════════════════════════════════════

const DemoPage: React.FC = () => {
  const [gc, setGc] = useState<GlowState>(defaultGlow);
  const glow: GlowConfig = gc;
  const updateGc = <K extends keyof GlowState>(k: K, v: GlowState[K]) => setGc((p) => ({ ...p, [k]: v }));

  // ─── Structural per-component configs ───────────────────────
  const [bfCfg, setBfCfg] = useState({ url: 'https://dashboard.acme.io', panelSize: 'medium' as const, windowStyle: 'mac' as const });
  const [mwCfg, setMwCfg] = useState({ visible: true, top: 10, left: 20, width: 180, height: 120, windowStyle: 'mac' as const });
  const [slCfg, setSlCfg] = useState({ collapsed: false, sidebarWidth: 120, sidebarPosition: 'left' as const });
  const [dgCfg, setDgCfg] = useState({ columns: 3, gap: 4 });
  const [tnCfg, setTnCfg] = useState({ brandName: 'Acme', searchPlaceholder: 'Search...' });
  const [shCfg, setShCfg] = useState({ splitRatio: 0.5 });
  const [bcCfg, setBcCfg] = useState({ separator: '/' });
  const [hmCfg, setHmCfg] = useState({ primary: '$12.4k', caption: 'Revenue', trend: 'up' as 'up' | 'down' });
  const [abCfg, setAbCfg] = useState({ size: 'md' as 'sm' | 'md' | 'lg', label: 'Button' });
  const [tsCfg, setTsCfg] = useState({ tabs: 'Overview,Analytics,Settings', active: 1 });
  const [ntCfg, setNtCfg] = useState({ position: 'top-full' as 'top-full' | 'top-right' | 'bottom-right' | 'bottom-left' });
  const [ptCfg, setPtCfg] = useState({ appName: 'Stripe', title: 'Payment received', body: 'Your invoice #1024 for $249.00 has been paid.', time: '2m ago' });

  // ─── Card SDK per-component configs ─────────────────────────
  const [ccCfg, setCcCfg] = useState({ variant: 'elevated' as 'elevated' | 'outlined' | 'flat', padding: 20, headerText: 'Revenue Overview', footerText: 'Updated 2m ago' });
  const [coCfg, setCoCfg] = useState({ borderColor: '#6366f1', borderWidth: 2, padding: 16, text: 'Outlined card with indigo border' });
  const [cfCfg, setCfCfg] = useState({ padding: 12, width: 200, height: 120, text: 'Flat card — no shadow, no border' });
  const [glCfg, setGlCfg] = useState({ blur: 12, saturate: 1.4, borderOpacity: 0.2 });
  const [phCfg, setPhCfg] = useState({ name: 'Alex Rivera', handle: '@alex.rivera', badge: 'Admin' });
  const [fbCfg, setFbCfg] = useState({ accent: '#6366f1', header: 'Cloud Sync', description: 'Real-time synchronization across all your devices with end-to-end encryption and automatic conflict resolution.' });
  const [ppCfg, setPpCfg] = useState({ highlighted: true, accentColor: '#6366f1', price: '$29' });
  const [knCfg, setKnCfg] = useState({ priorityLabel: 'High Priority', title: 'Implement user auth', status: 'High Priority' });
  const [ivCfg, setIvCfg] = useState({ status: 'paid' as 'paid' | 'pending' | 'overdue', description: 'Stripe Subscription — Pro Plan', amount: '$249.00', dueDate: 'Paid Jun 1' });
  const [tgCfg, setTgCfg] = useState({ size: 'md' as 'sm' | 'md', transitionMs: 150, label: 'Email notifications', description: 'Receive weekly report digests' });

  // ─── Structural demos (always visible, no play needed) ──────

  const structuralCards = (glow: GlowConfig) => (
    <>
      <Card name="BrowserFrame">
          <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
            <label className="flex items-center gap-1 text-xs text-gray-400"><select value={bfCfg.windowStyle} onChange={e => setBfCfg(p => ({...p, windowStyle: e.target.value as 'mac' | 'windows'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
              <option value="mac">Mac</option><option value="windows">Windows</option>
            </select></label>
            <label className="flex items-center gap-1 text-xs text-gray-400"><select value={bfCfg.panelSize} onChange={e => setBfCfg(p => ({...p, panelSize: e.target.value as 'small' | 'medium' | 'large'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
              <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
            </select></label>
            <label className="flex items-center gap-1 text-xs text-gray-400">URL <input value={bfCfg.url} onChange={e => setBfCfg(p => ({...p, url: e.target.value}))} className="w-20 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" /></label>
          </div>
          <BrowserFrame glowConfig={glow} url={bfCfg.url} panelSize={bfCfg.panelSize} windowStyle={bfCfg.windowStyle}>
            <div className="flex items-center justify-center text-gray-400"><span className="text-sm">Dashboard content</span></div>
          </BrowserFrame>
        </Card>
      <Card name="AppCanvas">
        <AppCanvas glowConfig={glow} aspectRatio="16:9">
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
            <span className="text-xs text-gray-400">16:9 Canvas</span>
          </div>
        </AppCanvas>
      </Card>
      <Card name="MockWindow">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" checked={mwCfg.visible} onChange={e => setMwCfg(p => ({...p, visible: e.target.checked}))} className="accent-indigo-500" /> Visible</label>
          <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={100} max={300} value={mwCfg.width} onChange={e => setMwCfg(p => ({...p, width: +e.target.value}))} className="w-16 accent-indigo-500" /></label>
          <label className="flex items-center gap-1 text-xs text-gray-400">H <input type="range" min={60} max={200} value={mwCfg.height} onChange={e => setMwCfg(p => ({...p, height: +e.target.value}))} className="w-16 accent-indigo-500" /></label>
          <select value={mwCfg.windowStyle} onChange={e => setMwCfg(p => ({...p, windowStyle: e.target.value as 'mac' | 'windows'}))} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
            <option value="mac">Mac</option><option value="windows">Windows</option>
          </select>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-lg bg-gray-950">
          <div className="flex h-full items-center justify-center text-xs text-gray-600">Underlay</div>
          <MockWindow glowConfig={glow} visible={mwCfg.visible} top={mwCfg.top} left={mwCfg.left} width={mwCfg.width} height={mwCfg.height} windowStyle={mwCfg.windowStyle}>
            <span className="text-xs text-gray-300">Overlay popup</span>
          </MockWindow>
        </div>
      </Card>
      <Card name="SidebarLayout">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" checked={!slCfg.collapsed} onChange={e => setSlCfg(p => ({...p, collapsed: !e.target.checked}))} className="accent-indigo-500" /> Open</label>
          <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={80} max={300} value={slCfg.sidebarWidth} onChange={e => setSlCfg(p => ({...p, sidebarWidth: +e.target.value}))} className="w-16 accent-indigo-500" /></label>
          <select value={slCfg.sidebarPosition} onChange={e => setSlCfg(p => ({...p, sidebarPosition: e.target.value as 'left' | 'right'}))} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
            <option value="left">Left</option><option value="right">Right</option>
          </select>
        </div>
        <div className="h-48 overflow-hidden rounded-lg">
          <SidebarLayout glowConfig={glow} collapsed={slCfg.collapsed} sidebarWidth={slCfg.sidebarWidth} sidebarPosition={slCfg.sidebarPosition}
            sidebarContent={<nav className="flex flex-col gap-1 text-xs text-gray-400">
              <span className="font-medium text-white">Dashboard</span><span>Analytics</span><span>Reports</span>
            </nav>}
          >
            <div className="flex h-full items-center justify-center text-xs text-gray-500">Main Content</div>
          </SidebarLayout>
        </div>
      </Card>
      <Card name="DataGridContainer">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">Cols <input type="range" min={1} max={6} value={dgCfg.columns} onChange={e => setDgCfg(p => ({...p, columns: +e.target.value}))} className="w-16 accent-indigo-500" /></label>
          <label className="flex items-center gap-1 text-xs text-gray-400">Gap <input type="range" min={1} max={8} value={dgCfg.gap} onChange={e => setDgCfg(p => ({...p, gap: +e.target.value}))} className="w-16 accent-indigo-500" /></label>
        </div>
        <DataGridContainer glowConfig={glow} columns={dgCfg.columns} gap={dgCfg.gap}>
          <div className="h-16 rounded-lg bg-indigo-600/20" /><div className="h-16 rounded-lg bg-emerald-600/20" /><div className="h-16 rounded-lg bg-amber-600/20" />
          <div className="h-16 rounded-lg bg-rose-600/20" /><div className="h-16 rounded-lg bg-cyan-600/20" /><div className="h-16 rounded-lg bg-purple-600/20" />
        </DataGridContainer>
      </Card>
      <Card name="TopNavbar">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <input value={tnCfg.brandName} onChange={e => setTnCfg(p => ({...p, brandName: e.target.value}))} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" placeholder="Brand" />
          <input value={tnCfg.searchPlaceholder} onChange={e => setTnCfg(p => ({...p, searchPlaceholder: e.target.value}))} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" placeholder="Search" />
        </div>
        <div className="overflow-hidden rounded-lg">
          <TopNavbar glowConfig={glow} brandName={tnCfg.brandName} logo={<span className="text-sm font-bold text-white">Acme</span>} searchPlaceholder={tnCfg.searchPlaceholder}
            actions={[
              <ActionButton key="1" glowConfig={glow} size="sm" label="New" />,
              <ActionButton key="2" glowConfig={glow} size="sm" icon="\u2699" label="" layout="icon-only" />,
            ]}
          />
        </div>
      </Card>
      <Card name="HeroMetricCard">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <input value={hmCfg.primary} onChange={e => setHmCfg(p => ({...p, primary: e.target.value}))} className="w-14 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="$12.4k" />
          <input value={hmCfg.caption} onChange={e => setHmCfg(p => ({...p, caption: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Revenue" />
          <select value={hmCfg.trend} onChange={e => setHmCfg(p => ({...p, trend: e.target.value as 'up' | 'down'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
            <option value="up">Up</option><option value="down">Down</option>
          </select>
        </div>
        <div className="flex gap-3">
          <HeroMetricCard glowConfig={glow} primaryText={hmCfg.primary} captionText={hmCfg.caption} trend={hmCfg.trend} />
          <HeroMetricCard glowConfig={glow} primaryText="85%" captionText="Retention" trend="down" />
        </div>
      </Card>
      <Card name="ActionButton">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <select value={abCfg.size} onChange={e => setAbCfg(p => ({...p, size: e.target.value as 'sm' | 'md' | 'lg'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
            <option value="sm">SM</option><option value="md">MD</option><option value="lg">LG</option>
          </select>
          <input value={abCfg.label} onChange={e => setAbCfg(p => ({...p, label: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Label" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton glowConfig={glow} size={abCfg.size} label={abCfg.label} />
          <ActionButton glowConfig={glow} size="sm" icon="+" label="Icon" layout="icon-label" />
          <ActionButton glowConfig={glow} size="sm" icon="+" label="" layout="icon-only" />
        </div>
      </Card>
      <Card name="SplitHeroLayout">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">Split <input type="range" min={0.2} max={0.8} step={0.1} value={shCfg.splitRatio} onChange={e => setShCfg(p => ({...p, splitRatio: +e.target.value}))} className="w-16 accent-indigo-500" /></label>
        </div>
        <SplitHeroLayout glowConfig={glow} splitRatio={shCfg.splitRatio}
          leftPanel={<div className="flex h-32 w-full items-center justify-center rounded-lg bg-indigo-600/20 text-xs text-gray-400">Left Panel</div>}
          rightPanel={<div className="flex h-32 w-full items-center justify-center rounded-lg bg-emerald-600/20 text-xs text-gray-400">Right Panel</div>}
        />
      </Card>
      <Card name="TabSwitcherContainer">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <input value={tsCfg.tabs} onChange={e => setTsCfg(p => ({...p, tabs: e.target.value}))} className="flex-1 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Tab1,Tab2,Tab3" />
          <label className="flex items-center gap-1 text-xs text-gray-400">Active <input type="range" min={0} max={4} value={tsCfg.active} onChange={e => setTsCfg(p => ({...p, active: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
        </div>
        <TabSwitcherContainer glowConfig={glow} tabs={tsCfg.tabs.split(',').map(s => s.trim()).filter(Boolean)} activeTab={Math.min(tsCfg.active, tsCfg.tabs.split(',').length - 1)} />
      </Card>
      <Card name="BreadcrumbHeader">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <input value={bcCfg.separator} onChange={e => setBcCfg(p => ({...p, separator: e.target.value}))} className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 w-16" placeholder="/" />
        </div>
        <BreadcrumbHeader glowConfig={glow} pathSequence={['Settings', 'Billing', 'Invoices']} separator={bcCfg.separator} />
      </Card>
      <Card name="NotificationToaster">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <select value={ntCfg.position} onChange={e => setNtCfg(p => ({...p, position: e.target.value as typeof ntCfg.position}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
            <option value="top-full">Top Full</option><option value="top-right">Top Right</option><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option>
          </select>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-lg bg-gray-950">
          <NotificationToaster glowConfig={glow} position={ntCfg.position} notifications={[
            <div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">&#10003;</span><span className="text-sm text-gray-200">Invoice #1024 paid — $249.00</span></div>,
            <div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs">i</span><span className="text-sm text-gray-200">New user registered — Alex Rivera</span></div>,
          ]} />
        </div>
      </Card>
      <Card name="PushNotificationToast">
        <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
          <input value={ptCfg.appName} onChange={e => setPtCfg(p => ({...p, appName: e.target.value}))} className="w-14 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="App" />
          <input value={ptCfg.title} onChange={e => setPtCfg(p => ({...p, title: e.target.value}))} className="w-20 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Title" />
          <input value={ptCfg.body} onChange={e => setPtCfg(p => ({...p, body: e.target.value}))} className="flex-1 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Body" />
          <input value={ptCfg.time} onChange={e => setPtCfg(p => ({...p, time: e.target.value}))} className="w-12 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="2m ago" />
        </div>
        <div className="flex flex-col gap-3">
          <PushNotificationToast glowConfig={glow}
            icon={<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">S</div>}
            appName={ptCfg.appName} title={ptCfg.title} body={ptCfg.body} time={ptCfg.time} />
          <PushNotificationToast glowConfig={glow}
            icon={<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">U</div>}
            appName="Userbase" title="New signup" body="Alex Rivera joined the Enterprise workspace." time="5m ago" />
        </div>
      </Card>
    </>
  );

  // ═══════════ Render ═══════════
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-12">
          <h1 className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
            Primitives SDK Showcase
          </h1>
          <p className="mt-2 text-gray-400">Phase 1 &mdash; All 36 components &middot; Tinker with the config panels below</p>
        </header>

        {/* ─── Structural ──────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold text-white">Structural SDK</h2>
          <ControlPanel label="Glow (all Structural)">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input type="checkbox" checked={gc.enabled} onChange={(e) => updateGc('enabled', e.target.checked)} className="accent-indigo-500" />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-400">
                Color
                <input type="color" value={gc.color} onChange={(e) => updateGc('color', e.target.value)} className="h-6 w-10 cursor-pointer rounded border-0 bg-transparent" />
              </label>
            </div>
            <div className="mt-3 space-y-2">
              <Slider label="Intensity" value={gc.intensity} min={0} max={5} step={0.1} onChange={(v) => updateGc('intensity', v)} />
              <Slider label="Spread" value={gc.spread} min={0} max={20} step={1} onChange={(v) => updateGc('spread', v)} />
            </div>
          </ControlPanel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {structuralCards(glow)}
          </div>
        </section>

        {/* ─── Transition ──────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold text-white">Transition SDK</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* SpringEnter */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Del <input type="range" min={0} max={30} defaultValue={0} className="w-12 accent-indigo-500" id="se-delay" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Mass <input type="range" min={0.3} max={3} step={0.1} defaultValue={0.5} className="w-12 accent-indigo-500" id="se-mass" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Damp <input type="range" min={5} max={30} defaultValue={12} className="w-12 accent-indigo-500" id="se-damp" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Stiff <input type="range" min={50} max={300} defaultValue={100} className="w-12 accent-indigo-500" id="se-stiff" /></label>
              </div>
              <AnimDeck name="SpringEnter" maxFrames={45}>
                {(frame) => {
                  const d = +(document.getElementById('se-delay') as HTMLInputElement)?.value || 0;
                  const m = +(document.getElementById('se-mass') as HTMLInputElement)?.value || 0.5;
                  const dp = +(document.getElementById('se-damp') as HTMLInputElement)?.value || 12;
                  const s = +(document.getElementById('se-stiff') as HTMLInputElement)?.value || 100;
                  const sv = spring({ frame: Math.max(0, frame - d), fps: 30, config: { mass: m, damping: dp, stiffness: s } });
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-lg"
                        style={{ opacity: sv, transform: `scale(${0.8 + 0.2 * sv}) translateY(${(1 - sv) * 30}px)` }}>Bounce</div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* StaggerContainer */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Step <input type="range" min={2} max={20} defaultValue={5} className="w-12 accent-indigo-500" id="st-delay" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Mass <input type="range" min={0.3} max={3} step={0.1} defaultValue={0.5} className="w-12 accent-indigo-500" id="st-mass" /></label>
              </div>
              <AnimDeck name="StaggerContainer" maxFrames={65}>
                {(frame) => {
                  const sd = +(document.getElementById('st-delay') as HTMLInputElement)?.value || 5;
                  const sm = +(document.getElementById('st-mass') as HTMLInputElement)?.value || 0.5;
                  return (
                    <div className="flex h-full w-full items-center justify-center gap-3 bg-gray-950">
                      {['A', 'B', 'C', 'D'].map((l, i) => {
                        const f = Math.max(0, frame - i * sd);
                        const sv = spring({ frame: f, fps: 30, config: { mass: sm, damping: 14, stiffness: 100 } });
                        return <div key={l} className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg"
                          style={{ opacity: sv, transform: `scale(${0.8 + 0.2 * sv}) translateY(${(1 - sv) * 20}px)` }}>{l}</div>;
                      })}
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* FadeBlur */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Blur <input type="range" min={0} max={20} defaultValue={10} className="w-12 accent-indigo-500" id="fb-blur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={15} max={90} defaultValue={30} className="w-12 accent-indigo-500" id="fb-dur" /></label>
              </div>
              <AnimDeck name="FadeBlur" maxFrames={45}>
                {(frame) => {
                  const sb = +(document.getElementById('fb-blur') as HTMLInputElement)?.value || 10;
                  const d = +(document.getElementById('fb-dur') as HTMLInputElement)?.value || 30;
                  const p = Math.min(frame / d, 1);
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="flex h-24 w-40 items-center justify-center rounded-2xl bg-emerald-600 text-xs font-bold text-white shadow-lg"
                        style={{ opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: 'clamp' }), filter: `blur(${interpolate(p, [0, 1], [sb, 0], { extrapolateRight: 'clamp' })}px)` }}>Fade Blur</div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* SlideInOut */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <select className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" id="si-dir">
                  <option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="bottom">Bottom</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">Dist <input type="range" min={100} max={500} defaultValue={200} className="w-12 accent-indigo-500" id="si-dist" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={15} max={90} defaultValue={30} className="w-12 accent-indigo-500" id="si-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="si-fade" /> Fade</label>
              </div>
              <AnimDeck name="SlideInOut" maxFrames={50}>
                {(frame) => {
                  const dir = (document.getElementById('si-dir') as HTMLSelectElement)?.value ?? 'left';
                  const dist = +(document.getElementById('si-dist') as HTMLInputElement)?.value || 200;
                  const sd = +(document.getElementById('si-dur') as HTMLInputElement)?.value || 30;
                  const fade = (document.getElementById('si-fade') as HTMLInputElement)?.checked ?? true;
                  const p = Math.min(frame / sd, 1);
                  const e = Easing.out(Easing.bezier(0.16, 1, 0.3, 1))(p);
                  const dx = dir === 'left' ? dist : dir === 'right' ? -dist : 0;
                  const dy = dir === 'top' ? dist : dir === 'bottom' ? -dist : 0;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="flex h-24 w-40 items-center justify-center rounded-2xl bg-rose-600 text-xs font-bold text-white shadow-lg"
                        style={{ opacity: fade ? e : 1, transform: `translateX(${interpolate(e, [0, 1], [dx, 0], { extrapolateRight: 'clamp' })}px) translateY(${interpolate(e, [0, 1], [dy, 0], { extrapolateRight: 'clamp' })}px)` }}>{dir}</div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* CardReveal */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={15} max={90} defaultValue={30} className="w-12 accent-indigo-500" id="cr-dur" /></label>
              </div>
              <AnimDeck name="CardReveal" maxFrames={50}>
                {(frame) => {
                  const cd = +(document.getElementById('cr-dur') as HTMLInputElement)?.value || 30;
                  const p = Math.min(frame / cd, 1);
                  const e = Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1))(p);
                  const inset = `${(1 - e) * 50}%`;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="flex h-24 w-40 items-center justify-center rounded-2xl bg-amber-600 text-xs font-bold text-white shadow-lg"
                        style={{ clipPath: `inset(${inset} ${inset} ${inset} ${inset})` }}>Reveal</div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* PulseScale */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Cycle <input type="range" min={20} max={120} defaultValue={60} className="w-12 accent-indigo-500" id="ps-cycle" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Min <input type="range" min={0.5} max={1} step={0.05} defaultValue={0.95} className="w-12 accent-indigo-500" id="ps-min" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Max <input type="range" min={1} max={2} step={0.05} defaultValue={1.05} className="w-12 accent-indigo-500" id="ps-max" /></label>
              </div>
              <AnimDeck name="PulseScale" maxFrames={90}>
                {(frame) => {
                  const ps_cycle = +(document.getElementById('ps-cycle') as HTMLInputElement)?.value || 60;
                  const ps_min = +(document.getElementById('ps-min') as HTMLInputElement)?.value || 0.95;
                  const ps_max = +(document.getElementById('ps-max') as HTMLInputElement)?.value || 1.05;
                  const cycle = frame % ps_cycle;
                  const scale = interpolate(cycle, [0, ps_cycle * 0.25, ps_cycle * 0.75, ps_cycle], [1, ps_max, ps_min, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-lg"
                        style={{ transform: `scale(${scale})` }}>Pulse</div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* AccordionExpand */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={20} max={100} defaultValue={60} className="w-16 accent-indigo-500" id="ax-dur" /></label>
              </div>
              <AnimDeck name="AccordionExpand" maxFrames={140}>
                {(frame) => {
                  const axd = +(document.getElementById('ax-dur') as HTMLInputElement)?.value || 60;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950 px-4">
                      <AccordionExpand expanded={frame > 40} duration={axd} frame={frame}>
                        <div className="w-full rounded-lg bg-gray-900 px-3 py-2">
                          <div className="text-xs text-gray-300 py-1">Dashboard</div>
                          <div className="text-xs text-gray-300 py-1">Analytics</div>
                          <div className="text-xs text-gray-300 py-1">Reports</div>
                          <div className="text-xs text-gray-300 py-1">Settings</div>
                        </div>
                      </AccordionExpand>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* RotateFlip */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <select className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" id="rf-axis">
                  <option value="Y">Y</option><option value="X">X</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">End <input type="range" min={20} max={60} defaultValue={30} className="w-12 accent-indigo-500" id="rf-end" /></label>
              </div>
              <AnimDeck name="RotateFlip" maxFrames={60}>
                {(frame) => {
                  const rf_axis = (document.getElementById('rf-axis') as HTMLSelectElement)?.value ?? 'Y';
                  const rf_end = +(document.getElementById('rf-end') as HTMLInputElement)?.value || 30;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <RotateFlip axis={rf_axis as 'X' | 'Y'} startFrame={0} endFrame={rf_end} frame={frame}>
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-lg">
                          Flip
                        </div>
                      </RotateFlip>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* GlitchIntro */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={3} max={15} defaultValue={5} className="w-12 accent-indigo-500" id="gi-dur" /></label>
              </div>
              <AnimDeck name="GlitchIntro" maxFrames={25}>
                {(frame) => {
                  const gd = +(document.getElementById('gi-dur') as HTMLInputElement)?.value || 5;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <GlitchIntro duration={gd} frame={frame}>
                        <div className="rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white">Glitch</div>
                      </GlitchIntro>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>
          </div>
        </section>

        {/* ─── Motion ──────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold text-white">Motion SDK</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* Cursor */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={20} max={80} defaultValue={40} className="w-12 accent-indigo-500" id="cur-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Click@ <input type="range" min={10} max={80} defaultValue={35} className="w-12 accent-indigo-500" id="cur-click" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" defaultValue="#ffffff" className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" id="cur-color" /></label>
              </div>
              <AnimDeck name="Cursor" maxFrames={55}>
                {(frame) => {
                  const cur_d = +(document.getElementById('cur-dur') as HTMLInputElement)?.value || 40;
                  const cur_c = +(document.getElementById('cur-click') as HTMLInputElement)?.value || 35;
                  const cur_col = (document.getElementById('cur-color') as HTMLInputElement)?.value ?? '#ffffff';
                  const p = Math.min(frame / cur_d, 1);
                  const e = Easing.out(Easing.bezier(0.42, 0, 0.58, 1))(p);
                  const sX = 40, sY = 160, eX = 200, eY = 100;
                  const cp1x = sX + 80, cp1y = sY, cp2x = eX - 80, cp2y = eY;
                  const t = e, u = 1 - t;
                  const x = u * u * u * sX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * eX;
                  const y = u * u * u * sY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * eY;
                  const isClicking = frame >= cur_c && frame < cur_c + 10;
                  const clickPhase = Math.min(Math.max(frame - cur_c, 0), 10);
                  const cs = isClicking ? interpolate(clickPhase, [0, 3, 10], [1, 0.3, 1], { extrapolateRight: 'clamp' }) : 1;
                  const targetScale = isClicking ? interpolate(clickPhase, [0, 3, 10], [1, 0.8, 1], { extrapolateRight: 'clamp' }) : 1;
                  const CursorIcon = isClicking ? CursorClick : Cursor;
                  return (
                    <div className="relative h-full w-full bg-gray-950">
                      <div className="absolute left-1/2 top-1/2 flex h-24 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gray-900 text-xs text-gray-400"
                        style={{ transform: `translate(-50%, -50%) scale(${targetScale})` }}>Target</div>
                      <div className="pointer-events-none absolute z-[999]" style={{ left: x, top: y, transform: `translate(-50%,-50%) scale(${cs}) rotate(18deg)` }}>
                        <CursorIcon size={24} color={cur_col} weight="fill" />
                      </div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* SmoothScroll */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={20} max={120} defaultValue={60} className="w-12 accent-indigo-500" id="ss-dur" /></label>
                <select className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" id="ss-dir">
                  <option value="vertical">V</option><option value="horizontal">H</option>
                </select>
              </div>
              <AnimDeck name="SmoothScroll" maxFrames={80}>
                {(frame) => {
                  const ss_d = +(document.getElementById('ss-dur') as HTMLInputElement)?.value || 60;
                  const ss_dir = (document.getElementById('ss-dir') as HTMLSelectElement)?.value ?? 'vertical';
                  const p = Math.min(frame / ss_d, 1);
                  const translate = interpolate(Easing.inOut(Easing.ease)(p), [0, 1], [0, -400], { extrapolateRight: 'clamp' });
                  const transform = ss_dir === 'vertical' ? `translateY(${translate}px)` : `translateX(${translate}px)`;
                  return (
                    <div className="flex h-full w-full items-start bg-gray-950 px-4 pt-4 overflow-hidden">
                      <div style={{ transform, willChange: 'transform' }}>
                        <div className="flex flex-col gap-2">
                          {Array.from({ length: 8 }).map((_, i) =>
                            <div key={i} className="flex h-10 w-56 items-center rounded-lg bg-gray-800 px-3 text-xs text-gray-400">Line {i + 1}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* FocusZoom */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={20} max={80} defaultValue={40} className="w-12 accent-indigo-500" id="fz-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Zoom <input type="range" min={1.1} max={3} step={0.1} defaultValue={1.8} className="w-12 accent-indigo-500" id="fz-scale" /></label>
              </div>
              <AnimDeck name="FocusZoom" maxFrames={55}>
                {(frame) => {
                  const fz_d = +(document.getElementById('fz-dur') as HTMLInputElement)?.value || 40;
                  const fz_s = +(document.getElementById('fz-scale') as HTMLInputElement)?.value || 1.8;
                  const p = Math.min(frame / fz_d, 1);
                  const scale = interpolate(Easing.inOut(Easing.bezier(0.65, 0, 0.35, 1))(p), [0, 1], [1, fz_s], { extrapolateRight: 'clamp' });
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="flex h-20 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-lg"
                        style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>Zoom</div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* TextTyper */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Speed <input type="range" min={1} max={5} defaultValue={2} className="w-12 accent-indigo-500" id="tt-speed" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Size <input type="range" min={12} max={32} defaultValue={18} className="w-12 accent-indigo-500" id="tt-size" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" defaultValue="#ffffff" className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" id="tt-color" /></label>
              </div>
              <AnimDeck name="TextTyper" maxFrames={80}>
                {(frame) => {
                  const tt_spd = +(document.getElementById('tt-speed') as HTMLInputElement)?.value || 2;
                  const tt_sz = +(document.getElementById('tt-size') as HTMLInputElement)?.value || 18;
                  const tt_col = (document.getElementById('tt-color') as HTMLInputElement)?.value ?? '#ffffff';
                  const text = 'Hello, SaaS Video Demos';
                  const n = Math.min(Math.floor(frame * tt_spd), text.length);
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="rounded-xl border border-gray-700 bg-gray-900 px-6 py-4">
                        <span className="font-mono" style={{ color: tt_col, fontSize: tt_sz }}>
                          {text.slice(0, n)}
                          {n < text.length && <span className="inline-block w-[2px] bg-current align-text-bottom" style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>&nbsp;</span>}
                        </span>
                      </div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* ChartAnimate */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={20} max={80} defaultValue={40} className="w-12 accent-indigo-500" id="ca-dur" /></label>
                <select className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" id="ca-ease">
                  <option value="outBack">OutBack</option><option value="out">Out</option><option value="inOut">InOut</option>
                </select>
              </div>
              <AnimDeck name="ChartAnimate" maxFrames={60}>
                {(frame) => {
                  const ca_d = +(document.getElementById('ca-dur') as HTMLInputElement)?.value || 40;
                  const ca_e = (document.getElementById('ca-ease') as HTMLSelectElement)?.value ?? 'outBack';
                  const vals = [40, 70, 55, 90, 65, 80];
                  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];
                  return (
                    <div className="flex h-full w-full items-end justify-center gap-2 bg-gray-950 pb-4">
                      {vals.map((h, i) => {
                        const p = Math.min(Math.max(0, frame - i * 3) / ca_d, 1);
                        const e = ca_e === 'out' ? Easing.out(Easing.ease)(p) : ca_e === 'inOut' ? Easing.inOut(Easing.ease)(p) : Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(p);
                        return <div key={i} className={`w-6 rounded-t-md ${colors[i]}`} style={{ height: h, transform: `scaleY(${e})`, transformOrigin: 'bottom center' }} />;
                      })}
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* DragAndDrop */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={20} max={80} defaultValue={40} className="w-12 accent-indigo-500" id="dnd-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Lift <input type="range" min={4} max={20} defaultValue={8} className="w-12 accent-indigo-500" id="dnd-lift" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" defaultValue="rgba(0,0,0,0.4)" className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" id="dnd-shadow" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="dnd-cursor" /> Cursor</label>
              </div>
              <AnimDeck name="DragAndDrop" maxFrames={55}>
                {(frame) => {
                  const dnd_d = +(document.getElementById('dnd-dur') as HTMLInputElement)?.value || 40;
                  const dnd_l = +(document.getElementById('dnd-lift') as HTMLInputElement)?.value || 8;
                  const dnd_shadow = (document.getElementById('dnd-shadow') as HTMLInputElement)?.value ?? 'rgba(0,0,0,0.4)';
                  const dnd_cursor = (document.getElementById('dnd-cursor') as HTMLInputElement)?.checked ?? true;
                  const total = dnd_d;
                  const restFrames = 5;
                  const grabPhase = total * 0.15;
                  const dragPhase = total * 0.25;
                  const dropPhase = total * 0.75;

                  let phase: 'idle' | 'grab' | 'drag' | 'release';
                  if (frame < restFrames) phase = 'idle';
                  else if (frame < grabPhase) phase = 'grab';
                  else if (frame < dropPhase) phase = 'drag';
                  else if (frame < total) phase = 'release';
                  else phase = 'idle';

                  const dragProgress = phase === 'grab' ? 0 : phase === 'release' ? 1 :
                    Math.min((frame - dragPhase) / (dropPhase - dragPhase), 1);
                  const eased = Easing.inOut(Easing.bezier(0.42, 0, 0.58, 1))(Math.max(0, dragProgress));
                  const x = interpolate(eased, [0, 1], [20, 200], { extrapolateRight: 'clamp' });
                  const y = interpolate(eased, [0, 1], [20, 120], { extrapolateRight: 'clamp' });

                  const lift = phase === 'drag' || phase === 'grab'
                    ? Math.min((frame - restFrames) / (grabPhase - restFrames), 1)
                    : Math.max(0, 1 - (frame - dropPhase) / (total - dropPhase));
                  const sb = interpolate(Math.min(lift, 1), [0, 1], [4, dnd_l * 3], { extrapolateRight: 'clamp' });

                  const isGrabbing = phase === 'grab' || phase === 'drag';
                  const HandIcon = phase === 'release' ? Hand : HandGrabbing;

                  return (
                    <div className="relative h-full w-full bg-gray-950">
                      <div className="absolute bottom-4 left-4 text-xs text-gray-600">Start</div>
                      <div className="absolute bottom-4 right-4 text-xs text-gray-600">End</div>
                      <div className="absolute" style={{ left: x, top: y, filter: `drop-shadow(0 ${sb}px ${sb}px ${dnd_shadow})` }}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-lg"
                          style={{ transform: isGrabbing ? 'scale(0.92)' : 'scale(1)', transition: 'transform 0.08s' }}>Drag</div>
                      </div>
                      {dnd_cursor && phase !== 'idle' && (
                        <div className="pointer-events-none absolute z-[999]" style={{ left: x + 28, top: y - 12 }}>
                          <HandIcon size={22} color="white" weight="fill" />
                        </div>
                      )}
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* TypingGhostCursor */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Blink <input type="range" min={5} max={60} defaultValue={20} className="w-12 accent-indigo-500" id="gc-blink" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" defaultValue="#ffffff" className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" id="gc-color" /></label>
              </div>
              <AnimDeck name="TypingGhostCursor" maxFrames={80}>
                {(frame) => {
                  const gc_blink = +(document.getElementById('gc-blink') as HTMLInputElement)?.value || 20;
                  const gc_col = (document.getElementById('gc-color') as HTMLInputElement)?.value ?? '#ffffff';
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <div className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3">
                        <span style={{ color: gc_col }}><TypingGhostCursor isActive blinkRate={gc_blink} frame={frame} cursorColor={gc_col} /></span>
                      </div>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* MarqueeTrack */}
            <div className="">
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <select className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300" id="mq-dir">
                  <option value="left">Left</option><option value="right">Right</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">Speed <input type="range" min={0.5} max={3} step={0.5} defaultValue={1} className="w-12 accent-indigo-500" id="mq-speed" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Gap <input type="range" min={4} max={24} defaultValue={8} className="w-12 accent-indigo-500" id="mq-gap" /></label>
              </div>
              <AnimDeck name="MarqueeTrack" maxFrames={120}>
                {(frame) => {
                  const mq_dir = (document.getElementById('mq-dir') as HTMLSelectElement)?.value ?? 'left';
                  const mq_spd = +(document.getElementById('mq-speed') as HTMLInputElement)?.value || 1;
                  const mq_gap = +(document.getElementById('mq-gap') as HTMLInputElement)?.value || 8;
                  const logos = ['Stripe', 'Slack', 'Figma', 'Vercel', 'Notion', 'Linear'];
                  return (
                    <div className="flex h-full w-full items-center bg-gray-950 overflow-hidden">
                      <MarqueeTrack direction={mq_dir as 'left' | 'right'} speedMultiplier={mq_spd} gap={mq_gap} frame={frame}>
                        {logos.map((l, i) => (
                          <div key={i} className="flex h-10 w-24 items-center justify-center rounded-lg bg-gray-800 text-xs font-medium text-gray-400">{l}</div>
                        ))}
                      </MarqueeTrack>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* ProgressRing */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">% <input type="range" min={10} max={100} defaultValue={73} className="w-12 accent-indigo-500" id="pr-pct" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Dur <input type="range" min={15} max={60} defaultValue={30} className="w-12 accent-indigo-500" id="pr-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" defaultValue="#6366f1" className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" id="pr-color" /></label>
              </div>
              <AnimDeck name="ProgressRing" maxFrames={65}>
                {(frame) => {
                  const pr_pct = +(document.getElementById('pr-pct') as HTMLInputElement)?.value || 73;
                  const pr_dur = +(document.getElementById('pr-dur') as HTMLInputElement)?.value || 30;
                  const pr_col = (document.getElementById('pr-color') as HTMLInputElement)?.value ?? '#6366f1';
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <ProgressRing frame={frame} targetPercentage={pr_pct} color={pr_col} size={80} strokeWidth={8} duration={pr_dur} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>
          </div>
        </section>

        {/* ─── Charts SDK ─────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold text-white">Charts SDK</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* BarChart */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={25} className="w-12 accent-indigo-500" id="bc-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Rad <input type="range" min={0} max={12} defaultValue={4} className="w-12 accent-indigo-500" id="bc-rad" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" className="accent-indigo-500" id="bc-val" /> Val</label>
              </div>
              <AnimDeck name="BarChart" maxFrames={60}>
                {(frame) => {
                  const bc_d = +(document.getElementById('bc-dur') as HTMLInputElement)?.value || 25;
                  const bc_r = +(document.getElementById('bc-rad') as HTMLInputElement)?.value || 4;
                  const bc_v = (document.getElementById('bc-val') as HTMLInputElement)?.checked ?? false;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <BarChart frame={frame} data={[
                        { label: 'Jan', value: 40, color: '#6366f1' },
                        { label: 'Feb', value: 70, color: '#10b981' },
                        { label: 'Mar', value: 55, color: '#f59e0b' },
                        { label: 'Apr', value: 90, color: '#ef4444' },
                        { label: 'May', value: 65, color: '#06b6d4' },
                      ]} width={280} height={170} glowConfig={glow} animDuration={bc_d} barRadius={bc_r} showValues={bc_v} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* LineChart */}
            <div className="">
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={30} className="w-12 accent-indigo-500" id="lc-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={1} max={6} defaultValue={3} className="w-12 accent-indigo-500" id="lc-w" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" className="accent-indigo-500" id="lc-area" /> Area</label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="lc-pts" /> Pts</label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="lc-lbl" /> Lbl</label>
              </div>
              <AnimDeck name="LineChart" maxFrames={60}>
                {(frame) => {
                  const lc_d = +(document.getElementById('lc-dur') as HTMLInputElement)?.value || 30;
                  const lc_w = +(document.getElementById('lc-w') as HTMLInputElement)?.value || 3;
                  const lc_area = (document.getElementById('lc-area') as HTMLInputElement)?.checked ?? false;
                  const lc_pts = (document.getElementById('lc-pts') as HTMLInputElement)?.checked ?? true;
                  const lc_lbl = (document.getElementById('lc-lbl') as HTMLInputElement)?.checked ?? true;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <LineChart frame={frame} data={[
                        { label: 'Q1', value: 30 }, { label: 'Q2', value: 55 },
                        { label: 'Q3', value: 72 }, { label: 'Q4', value: 88 },
                      ]} width={280} height={170} glowConfig={glow} animDuration={lc_d}
                        lineWidth={lc_w} showArea={lc_area} showPoints={lc_pts} showLabels={lc_lbl} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* PieChart */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={25} className="w-12 accent-indigo-500" id="pc-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Inner <input type="range" min={0} max={60} defaultValue={36} className="w-12 accent-indigo-500" id="pc-inner" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="pc-lbl" /> Lbl</label>
              </div>
              <AnimDeck name="PieChart" maxFrames={60}>
                {(frame) => {
                  const pc_d = +(document.getElementById('pc-dur') as HTMLInputElement)?.value || 25;
                  const pc_inner = +(document.getElementById('pc-inner') as HTMLInputElement)?.value || 36;
                  const pc_lbl = (document.getElementById('pc-lbl') as HTMLInputElement)?.checked ?? true;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <PieChart frame={frame} data={[
                        { label: 'US', value: 35, color: '#6366f1' },
                        { label: 'EU', value: 28, color: '#10b981' },
                        { label: 'APAC', value: 22, color: '#f59e0b' },
                        { label: 'Other', value: 15, color: '#ef4444' },
                      ]} size={170} glowConfig={glow} innerRadius={pc_inner} showLabels={pc_lbl} animDuration={pc_d} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* AreaChart */}
            <div className="">
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={25} className="w-12 accent-indigo-500" id="ac-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={1} max={6} defaultValue={3} className="w-12 accent-indigo-500" id="ac-w" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" className="accent-indigo-500" id="ac-pts" /> Pts</label>
              </div>
              <AnimDeck name="AreaChart" maxFrames={60}>
                {(frame) => {
                  const ac_d = +(document.getElementById('ac-dur') as HTMLInputElement)?.value || 25;
                  const ac_w = +(document.getElementById('ac-w') as HTMLInputElement)?.value || 3;
                  const ac_pts = (document.getElementById('ac-pts') as HTMLInputElement)?.checked ?? false;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <AreaChart frame={frame} data={[
                        { label: 'Jan', value: 30 }, { label: 'Feb', value: 55 },
                        { label: 'Mar', value: 45 }, { label: 'Apr', value: 80 },
                        { label: 'May', value: 65 }, { label: 'Jun', value: 95 },
                      ]} width={280} height={170} glowConfig={glow}
                        animDuration={ac_d} lineWidth={ac_w} showPoints={ac_pts} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* DonutChart */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={25} className="w-12 accent-indigo-500" id="dc-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Inner <input type="range" min={10} max={60} defaultValue={28} className="w-12 accent-indigo-500" id="dc-inner" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="dc-lbl" /> Lbl</label>
              </div>
              <AnimDeck name="DonutChart" maxFrames={60}>
                {(frame) => {
                  const dc_d = +(document.getElementById('dc-dur') as HTMLInputElement)?.value || 25;
                  const dc_inner = +(document.getElementById('dc-inner') as HTMLInputElement)?.value || 28;
                  const dc_lbl = (document.getElementById('dc-lbl') as HTMLInputElement)?.checked ?? true;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <DonutChart frame={frame} data={[
                        { label: 'Free', value: 45, color: '#6366f1' },
                        { label: 'Pro', value: 30, color: '#10b981' },
                        { label: 'Enterprise', value: 25, color: '#f59e0b' },
                      ]} size={170} glowConfig={glow} centerTextSlot="$82k"
                        innerRadius={dc_inner} showLabels={dc_lbl} animDuration={dc_d} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* MetricFunnel */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={30} className="w-12 accent-indigo-500" id="mf-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" className="accent-indigo-500" id="mf-pct" /> %</label>
              </div>
              <AnimDeck name="MetricFunnel" maxFrames={50}>
                {(frame) => {
                  const mf_d = +(document.getElementById('mf-dur') as HTMLInputElement)?.value || 30;
                  const mf_pct = (document.getElementById('mf-pct') as HTMLInputElement)?.checked ?? false;
                  const data = [
                    { label: 'Visited', value: 10000 },
                    { label: 'Signed up', value: 3200 },
                    { label: 'Activated', value: 1800 },
                    { label: 'Paid', value: 420 },
                  ];
                  const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];
                  const maxVal = data[0].value;
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950 px-4">
                      <svg width={260} height={160}>
                        {data.map((d, i) => {
                          const lp = Math.min(Math.max(0, frame - i * 3) / mf_d, 1);
                          const bw = (d.value / maxVal) * 200 * lp;
                          const bh = 28;
                          const y = 10 + i * (bh + 8);
                          return (
                            <g key={i}>
                              <rect x={(260 - bw) / 2} y={y} width={bw} height={bh} rx={4} fill={colors[i]} opacity={lp} />
                              <text x={130} y={y + bh / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={10}>
                                {d.label} — {d.value.toLocaleString()}{mf_pct && ` (${Math.round((d.value / maxVal) * 100)}%)`}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* ScatterPlot */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={30} className="w-12 accent-indigo-500" id="sc-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Sz <input type="range" min={3} max={12} defaultValue={6} className="w-12 accent-indigo-500" id="sc-sz" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="sc-grid" /> Grid</label>
              </div>
              <AnimDeck name="ScatterPlot" maxFrames={50}>
                {(frame) => {
                  const sc_d = +(document.getElementById('sc-dur') as HTMLInputElement)?.value || 30;
                  const sc_sz = +(document.getElementById('sc-sz') as HTMLInputElement)?.value || 6;
                  const sc_grid = (document.getElementById('sc-grid') as HTMLInputElement)?.checked ?? true;
                  const points = [
                    { x: 40, y: 60 }, { x: 80, y: 110 }, { x: 120, y: 50 }, { x: 160, y: 90 },
                    { x: 200, y: 30 }, { x: 60, y: 130 }, { x: 140, y: 100 }, { x: 180, y: 70 },
                    { x: 100, y: 80 }, { x: 220, y: 120 }, { x: 30, y: 100 }, { x: 150, y: 40 },
                  ];
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <ScatterPlot frame={frame} points={points.map((p, i) => ({ ...p, color: colors[i] }))}
                        width={260} height={160} glowConfig={glow}
                        animDuration={sc_d} pointSize={sc_sz} showGrid={sc_grid} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>

            {/* SparklineTicker */}
            <div>
              <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-gray-800/50 p-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Spd <input type="range" min={10} max={60} defaultValue={25} className="w-12 accent-indigo-500" id="sp-dur" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={1} max={5} defaultValue={2} className="w-12 accent-indigo-500" id="sp-w" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" defaultChecked className="accent-indigo-500" id="sp-dot" /> Dot</label>
              </div>
              <AnimDeck name="SparklineTicker" maxFrames={50}>
                {(frame) => {
                  const sp_d = +(document.getElementById('sp-dur') as HTMLInputElement)?.value || 25;
                  const sp_w = +(document.getElementById('sp-w') as HTMLInputElement)?.value || 2;
                  const sp_dot = (document.getElementById('sp-dot') as HTMLInputElement)?.checked ?? true;
                  const data = [30, 55, 40, 75, 50, 90, 65, 85, 70, 95, 80, 100];
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-950">
                      <SparklineTicker frame={frame} data={data} width={260} height={60}
                        glowConfig={glow} animDuration={sp_d} lineWidth={sp_w} showDot={sp_dot} />
                    </div>
                  );
                }}
              </AnimDeck>
            </div>
          </div>
        </section>

        {/* ─── Card SDK ────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-bold text-white">Card SDK</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card name="CustomCard (elevated)">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <select value={ccCfg.variant} onChange={e => setCcCfg(p => ({...p, variant: e.target.value as 'elevated' | 'outlined' | 'flat'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
                  <option value="elevated">Elevated</option><option value="outlined">Outlined</option><option value="flat">Flat</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">Pad <input type="range" min={8} max={32} value={ccCfg.padding} onChange={e => setCcCfg(p => ({...p, padding: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
                <input value={ccCfg.headerText} onChange={e => setCcCfg(p => ({...p, headerText: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Header" />
                <input value={ccCfg.footerText} onChange={e => setCcCfg(p => ({...p, footerText: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Footer" />
              </div>
              <CustomCard glowConfig={glow} variant={ccCfg.variant} padding={ccCfg.padding} headerText={ccCfg.headerText} footerText={ccCfg.footerText}>
                <div className="flex gap-6">
                  <div><span className="text-2xl font-bold text-white">$84.2k</span><p className="text-xs text-gray-400">Total revenue</p></div>
                  <div><span className="text-2xl font-bold text-emerald-400">+12.3%</span><p className="text-xs text-gray-400">vs last month</p></div>
                </div>
              </CustomCard>
            </Card>
            <Card name="CustomCard (outlined)">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" value={coCfg.borderColor} onChange={e => setCoCfg(p => ({...p, borderColor: e.target.value}))} className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={1} max={5} value={coCfg.borderWidth} onChange={e => setCoCfg(p => ({...p, borderWidth: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
                <input value={coCfg.text} onChange={e => setCoCfg(p => ({...p, text: e.target.value}))} className="flex-1 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Content" />
              </div>
              <CustomCard glowConfig={glow} variant="outlined" borderColor={coCfg.borderColor} borderWidth={coCfg.borderWidth} padding={coCfg.padding}
                styleConfig={{ backgroundColor: '#0f172a' }}>
                <span className="text-sm text-gray-300">{coCfg.text}</span>
              </CustomCard>
            </Card>
            <Card name="CustomCard (flat)">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">W <input type="range" min={100} max={300} value={cfCfg.width} onChange={e => setCfCfg(p => ({...p, width: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">H <input type="range" min={60} max={200} value={cfCfg.height} onChange={e => setCfCfg(p => ({...p, height: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
                <input value={cfCfg.text} onChange={e => setCfCfg(p => ({...p, text: e.target.value}))} className="flex-1 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Content" />
              </div>
              <CustomCard glowConfig={glow} variant="flat" padding={cfCfg.padding} width={cfCfg.width} height={cfCfg.height}
                styleConfig={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
                <span className="text-xs">{cfCfg.text}</span>
              </CustomCard>
            </Card>
            <Card name="GlassmorphicCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Blur <input type="range" min={4} max={30} value={glCfg.blur} onChange={e => setGlCfg(p => ({...p, blur: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Opacity <input type="range" min={0.05} max={0.5} step={0.05} value={glCfg.borderOpacity} onChange={e => setGlCfg(p => ({...p, borderOpacity: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
              </div>
              <GlassmorphicCard glowConfig={glow} blur={glCfg.blur} saturate={glCfg.saturate} borderOpacity={glCfg.borderOpacity}>
                <span className="text-sm font-medium text-white">Frosted glass</span>
                <p className="mt-1 text-xs text-gray-300">Hardware-accelerated backdrop blur</p>
              </GlassmorphicCard>
            </Card>
            <Card name="ProfileHeaderCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <input value={phCfg.name} onChange={e => setPhCfg(p => ({...p, name: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Name" />
                <input value={phCfg.handle} onChange={e => setPhCfg(p => ({...p, handle: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="@handle" />
                <input value={phCfg.badge} onChange={e => setPhCfg(p => ({...p, badge: e.target.value}))} className="w-12 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Badge" />
              </div>
              <ProfileHeaderCard glowConfig={glow} name={phCfg.name} handle={phCfg.handle}
                badgeText={phCfg.badge} />
            </Card>
            <Card name="FeatureBenefitCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" value={fbCfg.accent} onChange={e => setFbCfg(p => ({...p, accent: e.target.value}))} className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" /></label>
                <input value={fbCfg.header} onChange={e => setFbCfg(p => ({...p, header: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Header" />
                <input value={fbCfg.description} onChange={e => setFbCfg(p => ({...p, description: e.target.value}))} className="flex-1 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Description" />
              </div>
              <FeatureBenefitCard glowConfig={glow}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
                header={fbCfg.header} description={fbCfg.description} accentColor={fbCfg.accent} />
            </Card>
            <Card name="PricingPlanCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" checked={ppCfg.highlighted} onChange={e => setPpCfg(p => ({...p, highlighted: e.target.checked}))} className="accent-indigo-500" /> High</label>
                <label className="flex items-center gap-1 text-xs text-gray-400">Color <input type="color" value={ppCfg.accentColor} onChange={e => setPpCfg(p => ({...p, accentColor: e.target.value}))} className="h-5 w-8 rounded border-0 bg-transparent cursor-pointer" /></label>
                <input value={ppCfg.price} onChange={e => setPpCfg(p => ({...p, price: e.target.value}))} className="w-12 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="$29" />
              </div>
              <PricingPlanCard glowConfig={glow} price={ppCfg.price} features={['Up to 10 projects', 'Team collaboration', 'Analytics dashboard', 'Priority support']}
                ctaLabel="Get Started" highlighted={ppCfg.highlighted} accentColor={ppCfg.accentColor} />
            </Card>
            <Card name="KanbanTaskCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <input value={knCfg.title} onChange={e => setKnCfg(p => ({...p, title: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Title" />
                <input value={knCfg.priorityLabel} onChange={e => setKnCfg(p => ({...p, priorityLabel: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Label" />
              </div>
              <KanbanTaskCard glowConfig={glow} title={knCfg.title} status={knCfg.status} statusColor="#ef4444"
                priorityLabel={knCfg.priorityLabel} assigneeAvatars={['AK', 'MR', 'JL', 'TW']} deadline="Due Jun 18" />
            </Card>
            <Card name="BillingInvoiceCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <select value={ivCfg.status} onChange={e => setIvCfg(p => ({...p, status: e.target.value as 'paid' | 'pending' | 'overdue'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
                  <option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option>
                </select>
                <input value={ivCfg.description} onChange={e => setIvCfg(p => ({...p, description: e.target.value}))} className="flex-1 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Desc" />
                <input value={ivCfg.amount} onChange={e => setIvCfg(p => ({...p, amount: e.target.value}))} className="w-14 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="$0.00" />
              </div>
              <BillingInvoiceCard glowConfig={glow} description={ivCfg.description} amount={ivCfg.amount} dueDate={ivCfg.dueDate} status={ivCfg.status} />
            </Card>
            <Card name="SettingsToggleCard">
              <div className="mb-2 flex flex-wrap gap-2 border-b border-gray-700/50 pb-2">
                <select value={tgCfg.size} onChange={e => setTgCfg(p => ({...p, size: e.target.value as 'sm' | 'md'}))} className="rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300">
                  <option value="md">MD</option><option value="sm">SM</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">Ms <input type="range" min={50} max={500} value={tgCfg.transitionMs} onChange={e => setTgCfg(p => ({...p, transitionMs: +e.target.value}))} className="w-12 accent-indigo-500" /></label>
                <input value={tgCfg.label} onChange={e => setTgCfg(p => ({...p, label: e.target.value}))} className="w-16 rounded bg-gray-800 px-1 py-0.5 text-xs text-gray-300" placeholder="Label" />
              </div>
              <SettingsToggleCard glowConfig={glow} label={tgCfg.label} description={tgCfg.label} toggled={true} onToggle={() => {}}
                toggleSize={tgCfg.size as 'sm' | 'md'} transitionDuration={tgCfg.transitionMs} />
            </Card>
          </div>
        </section>

        <footer className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">SaaS Video Demos &mdash; Primitives SDK Phase 1</footer>
      </div>
    </div>
  );
};

export { DemoPage };
