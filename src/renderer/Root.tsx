import { Composition, registerRoot } from 'remotion';

const FPS = 30;
const DURATION = 150;
const WIDTH = 1920;
const HEIGHT = 1080;

// ─── Structural Demo ─────────────────────────────────────────
import {
  BrowserFrame,
  AppCanvas,
  MockWindow,
  SidebarLayout,
  DataGridContainer,
  TopNavbar,
  HeroMetricCard,
  ActionButton,
  type GlowConfig,
} from './primitives/StructuralSDK';

import { SpringEnter, FadeBlur, SlideInOut, CardReveal } from './primitives/TransitionSDK';

import { Cursor, SmoothScroll, FocusZoom, TextTyper } from './primitives/MotionSDK';

const glow: GlowConfig = {
  enabled: true,
  color: '#6366f1',
  intensity: 2.5,
  spread: 4,
};

const StructuralDemo: React.FC = () => {
  return (
    <AppCanvas glowConfig={glow} aspectRatio="16:9">
      <BrowserFrame glowConfig={glow} url="https://app.example.com">
        <TopNavbar
          glowConfig={glow}
          logo={<span className="text-xl font-bold text-white">Acme</span>}
          searchPlaceholder="Search projects..."
          actions={[
            <ActionButton key="1" glowConfig={glow} size="sm" label="New" layout="label-only" />,
            <ActionButton key="2" glowConfig={glow} size="sm" label="Settings" icon="\u2699" layout="icon-label" />,
          ]}
        />
        <SidebarLayout
          glowConfig={glow}
          collapsed={false}
          sidebarContent={
            <nav className="flex flex-col gap-2 text-sm text-gray-400">
              <span className="font-medium text-white">Dashboard</span>
              <span>Analytics</span>
              <span>Reports</span>
              <span>Settings</span>
            </nav>
          }
        >
          <div className="p-6">
            <HeroMetricCard glowConfig={glow} primaryText="$12.4k" captionText="Monthly Revenue" trend="up" />
            <DataGridContainer glowConfig={glow} columns={2}>
              <div className="h-32 rounded-lg bg-gray-800" />
              <div className="h-32 rounded-lg bg-gray-800" />
            </DataGridContainer>
          </div>
        </SidebarLayout>
      </BrowserFrame>
      <MockWindow glowConfig={glow} visible top={60} left={120} width={320} height={200}>
        <p className="text-sm text-gray-300">Settings overlay content</p>
      </MockWindow>
    </AppCanvas>
  );
};

const TransitionDemo: React.FC = () => {
  return (
    <AppCanvas glowConfig={glow} aspectRatio="16:9">
      <div className="flex h-full w-full items-center justify-center gap-8 bg-gray-950 p-12">
        <SpringEnter delay={0}>
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            Spring
          </div>
        </SpringEnter>
        <FadeBlur duration={30}>
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
            Fade
          </div>
        </FadeBlur>
        <SlideInOut direction="top" distance={300}>
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg">
            Slide
          </div>
        </SlideInOut>
        <CardReveal>
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg">
            Reveal
          </div>
        </CardReveal>
      </div>
    </AppCanvas>
  );
};

const MotionDemo: React.FC = () => {
  return (
    <AppCanvas glowConfig={glow} aspectRatio="16:9">
      <div className="relative flex h-full w-full items-center justify-center bg-gray-950">
        <TextTyper text="Hello from SaaS Video Demos" charsPerFrame={1} showCursor />
        <FocusZoom zoomScale={1.2}>
          <div className="flex h-48 w-96 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
            Focus Zoom Target
          </div>
        </FocusZoom>
        <SmoothScroll scrollDistance={200}>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 w-64 rounded-lg bg-gray-800" />
            ))}
          </div>
        </SmoothScroll>
        <Cursor startX={100} startY={100} endX={400} endY={300} clickFrame={45} />
      </div>
    </AppCanvas>
  );
};

// ─── Root Composition Map ────────────────────────────────────
const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StructuralDemo"
        component={StructuralDemo}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="TransitionDemo"
        component={TransitionDemo}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="MotionDemo"
        component={MotionDemo}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};

registerRoot(RemotionRoot);

export { RemotionRoot };
