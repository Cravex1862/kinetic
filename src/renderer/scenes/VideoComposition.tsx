import React from 'react';
import { Series, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { GlowConfig, StyleConfig } from '../primitives/types';
import { 
    ActionButton, AppCanvas, BreadcrumbHeader, BrowserFrame, DataGridContainer, 
    HeroMetricCard, MockWindow, NotificationToaster, SidebarLayout, SplitHeroLayout, 
    TabSwitcherContainer, TopNavbar 
} from '../primitives/StructuralSDK';
import { 
    BillingInvoiceCard, CustomCard, FeatureBenefitCard, FeatureCard, GlassmorphicCard, 
    KanbanTaskCard, NotificationCard, PriceCard, PricingPlanCard, ProfileCard, 
    ProfileHeaderCard, PushNotificationToast, RegularCard, SettingsToggleCard 
} from '../primitives/CardSDK';
import { 
    AreaChart, BarChartCard, DonutChartCard, LineChartCard, MetricFunnel, 
    PieChartCard, ScatterPlotCard, StockCard 
} from '../primitives/ChartsSDK';
import { 
    SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale, 
    AccordionExpand, RotateFlip, GlitchIntro 
} from '../primitives/TransitionSDK';
import { 
    Cursor, SmoothScroll, FocusZoom, TextTyper, ChartAnimate, DragAndDrop, 
    TypingGhostCursor, MarqueeTrack, ProgressRing 
} from '../primitives/MotionSDK';

// Helper for gradient text
const GradientText: React.FC<{ children: React.ReactNode; from: string; to: string; fontSize?: string; fontWeight?: string }> = ({
  children,
  from,
  to,
  fontSize = '28px',
  fontWeight = '700',
}) => (
  <span
    style={{
      background: `linear-gradient(to right, ${from}, ${to})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize,
      fontWeight,
      fontFamily: 'sans-serif',
      display: 'inline-block',
    }}
  >
    {children}
  </span>
);

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Clean, subtle glow without massive drop-shadow distortion
  const browserFrameGlow: GlowConfig = {
    enabled: true,
    color: 'rgba(139, 92, 246, 0.4)',
    intensity: 1,
    spread: 20,
  };

  const glassmorphicCardGlow: GlowConfig = {
    enabled: true,
    color: 'rgba(14, 165, 233, 0.4)',
    intensity: 1,
    spread: 15,
  };

  const sidebarMenuItems = [
    { id: 'home', label: 'Dashboard', active: true },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  const barChartData = [
    { label: 'Jan', value: 35, color: '#6366f1' },
    { label: 'Feb', value: 48, color: '#8b5cf6' },
    { label: 'Mar', value: 62, color: '#ec4899' },
    { label: 'Apr', value: 55, color: '#f59e0b' },
    { label: 'May', value: 70, color: '#22c55e' },
  ];

  // BrowserFrame Entry Animation (clean, subtle 2.5D perspective)
  const browserEntryProgress = spring({
    frame: frame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const browserScale = interpolate(browserEntryProgress, [0, 1], [0.94, 1], { extrapolateRight: 'clamp' });
  const browserTranslateY = interpolate(browserEntryProgress, [0, 1], [30, 0], { extrapolateRight: 'clamp' });
  const browserRotateXEntry = interpolate(browserEntryProgress, [0, 1], [8, 4], { extrapolateRight: 'clamp' });
  const browserRotateYEntry = interpolate(browserEntryProgress, [0, 1], [-8, -3], { extrapolateRight: 'clamp' });

  // Subtle continuous 3D floating movement
  const continuousRotateY = Math.sin(frame / 60) * 1.5;
  const continuousRotateX = Math.cos(frame / 75) * 1;

  const finalBrowserRotateX = browserRotateXEntry + continuousRotateX;
  const finalBrowserRotateY = browserRotateYEntry + continuousRotateY;

  // Internal element spring animations (visible from frame 0)
  const sidebarProgress = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const sidebarTranslateX = interpolate(sidebarProgress, [0, 1], [-40, 0], { extrapolateRight: 'clamp' });

  const barChartProgress = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const barChartTranslateY = interpolate(barChartProgress, [0, 1], [30, 0], { extrapolateRight: 'clamp' });

  const glassCardProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const glassCardScale = interpolate(glassCardProgress, [0, 1], [0.85, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#030712',
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        perspective: '1600px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient Floating Orbs */}
      {[...Array(4)].map((_, i) => {
        const orbFrame = frame + i * 20;

        const orbScale = interpolate(Math.sin(orbFrame / 50) * 0.5 + 0.5, [0, 1], [0.9, 1.1], { extrapolateRight: 'clamp' });
        const orbOpacity = interpolate(Math.sin(orbFrame / 70) * 0.5 + 0.5, [0, 1], [0.25, 0.5], { extrapolateRight: 'clamp' });
        const orbTranslateX = Math.sin(orbFrame / 60) * (60 + i * 15);
        const orbTranslateY = Math.cos(orbFrame / 70) * (50 + i * 10);

        const orbColor = ['#8b5cf6', '#0ea5e9', '#ec4899', '#f59e0b'][i % 4];

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${120 + i * 20}px`,
              height: `${120 + i * 20}px`,
              borderRadius: '50%',
              backgroundColor: orbColor,
              filter: `blur(40px)`,
              opacity: orbOpacity,
              transform: `
                translateX(${orbTranslateX}px)
                translateY(${orbTranslateY}px)
                scale(${orbScale})
              `,
              left: `${15 + i * 20}%`,
              top: `${15 + i * 15}%`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        );
      })}

      <div
        style={{
          transform: `scale(${browserScale}) translateY(${browserTranslateY}px) perspective(1600px) rotateX(${finalBrowserRotateX}deg) rotateY(${finalBrowserRotateY}deg)`,
          transformOrigin: 'center center',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1) inset',
          borderRadius: '24px',
        }}
      >
        <BrowserFrame
          url="https://app.dashboard.com/analytics"
          width={1200}
          height={700}
          borderRadius={24}
          glowConfig={browserFrameGlow}
        >
          <div style={{ display: 'flex', height: '100%', backgroundColor: '#09090b' }}>
            <div style={{ transform: `translateX(${sidebarTranslateX}px)` }}>
              <SidebarLayout
                appName="Kinetic"
                menuItems={sidebarMenuItems}
                activeMenuItemId="home"
                showCollapseButton={false}
                showProfileFooter={true}
                profileName="Alice Smith"
                profileHandle="@asmith"
                isVerified={true}
                showSettings={true}
                width={280}
                height={700}
                borderRadius={0}
                padding={24}
                backgroundColor="rgba(18,18,20,0.85)"
              />
            </div>

            <div
              style={{
                flex: 1,
                position: 'relative',
                padding: '32px',
                backgroundColor: '#09090b',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
              }}
            >
              <div style={{ transform: `translateY(${barChartTranslateY}px)` }}>
                <BarChartCard
                  titleText="Monthly Performance"
                  data={barChartData}
                  barColor="#8b5cf6"
                  barSpacing={24}
                  barBorderRadius={8}
                  showGridLines={true}
                  yAxisTicks={[0, 25, 50, 75]}
                  xAxisTitle="Months"
                  yAxisTitle="Units Sold"
                  height={450}
                  borderRadius={16}
                  padding={24}
                  backgroundColor="#121215"
                  frame={frame}
                />
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: '48px',
                  transform: `scale(${glassCardScale})`,
                  transformOrigin: 'top right',
                }}
              >
                <GlassmorphicCard
                  glowConfig={glassmorphicCardGlow}
                  blur={20}
                  saturate={1.8}
                  borderOpacity={0.25}
                  width={300}
                  height={160}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontFamily: 'sans-serif', color: '#a1a1aa', fontSize: '14px', fontWeight: '500' }}>
                      Total ARR
                    </span>
                    <GradientText from="#a78bfa" to="#f472b6" fontSize="36px" fontWeight="800">
                      $1.2M
                    </GradientText>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: 'sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-8 8h6v8h4v-8h6z" transform="rotate(180 12 12)"/>
                    </svg>
                    +18.5%
                  </div>
                </GlassmorphicCard>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
};

export const VideoComposition: React.FC = () => {
    return (
        <div className="w-full h-full bg-slate-950 text-white relative overflow-hidden flex items-center justify-center">
            <Series>
                <Series.Sequence durationInFrames={300}>
                    <Scene1 />
                </Series.Sequence>
            </Series>
        </div>
    );
};

export default VideoComposition;
