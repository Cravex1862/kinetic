import React from 'react';
import { Series, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, AbsoluteFill, Img, staticFile } from 'remotion';

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
import { VectorMorph, SVG_PRESETS } from '../primitives/VectorMorph';

ActionButton, AppCanvas, BreadcrumbHeader, BrowserFrame, DataGridContainer, 
    HeroMetricCard, MockWindow, NotificationToaster, SidebarLayout, SplitHeroLayout, 
    TabSwitcherContainer, TopNavbar 
    BillingInvoiceCard, CustomCard, FeatureBenefitCard, FeatureCard, GlassmorphicCard, 
    KanbanTaskCard, NotificationCard, PriceCard, PricingPlanCard, ProfileCard, 
    ProfileHeaderCard, PushNotificationToast, RegularCard, SettingsToggleCard 
    AreaChart, BarChartCard, DonutChartCard, LineChartCard, MetricFunnel, 
    PieChartCard, ScatterPlotCard, StockCard 
    SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale, 
    AccordionExpand, RotateFlip, GlitchIntro 
    Cursor, SmoothScroll, FocusZoom, TextTyper, ChartAnimate, DragAndDrop, 
    TypingGhostCursor, MarqueeTrack, ProgressRing 

export const GlowingRingOverlay: React.FC<{
  size?: number;
  progress?: number;
  opacity?: number;
  rotationOffset?: number;
}> = ({ size = 500, progress = 1, opacity = 1, rotationOffset = 0 }) => {
  const pathLength = 1319;
  const strokeDashoffset = pathLength * (1 - progress);

  return (
    <div
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        style={{
          transform: `rotate(${-90 + rotationOffset}deg)`,
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient
            id="ringGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle
          cx="250"
          cy="250"
          r="210"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="250"
          cy="250"
          r="210"
          stroke="url(#ringGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          filter="url(#glow)"
        />
        {progress > 0.1 && (
          <>
            <circle
              cx="460"
              cy="250"
              r="6"
              fill="#06b6d4"
              style={{ filter: 'drop-shadow(0 0 8px #06b6d4)' }}
            />
            <circle
              cx="250"
              cy="40"
              r="4"
              fill="#818cf8"
              style={{ filter: 'drop-shadow(0 0 6px #818cf8)' }}
            />
          </>
        )}
      </svg>
    </div>
  );
};

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const browserScale = interpolate(browserSpring, [0, 1], [0.88, 1]);
  const browserOpacity = interpolate(browserSpring, [0, 1], [0, 1]);

  const rotateX = interpolate(frame, [0, 150], [14, 6], {
    extrapolateRight: 'clamp',
  });
  const rotateY = interpolate(frame, [0, 150], [-4, -1], {
    extrapolateRight: 'clamp',
  });

  const cardFrame = Math.max(0, frame - 12);
  const cardSpring = spring({
    frame: cardFrame,
    fps,
    config: { damping: 12, stiffness: 90 },
  });

  const cardScale = interpolate(cardSpring, [0, 1], [0.75, 1]);
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardTranslateY = interpolate(cardSpring, [0, 1], [40, 0]);

  const ringFrame = Math.max(0, frame - 24);
  const ringSpring = spring({
    frame: ringFrame,
    fps,
    config: { damping: 18, stiffness: 60 },
  });

  const ringProgress = interpolate(ringSpring, [0, 1], [0, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOpacity = interpolate(ringSpring, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringRotation = frame * 0.4;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <AppCanvas
        osType="mac"
        appTitle="Kinetic Analytics — Real-Time Visualizer"
        backgroundColor="#030712"
      >
        <BrowserFrame
          url="https://app.kinetic.com/overview"
          osType="mac"
          width="88%"
          height="80%"
          rotateX={rotateX}
          rotateY={rotateY}
          perspective={1200}
          translateZ={20}
          glowConfig={{
            enabled: true,
            color: 'rgba(6, 182, 212, 0.35)',
            intensity: 1,
            spread: 50,
          }}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <GlowingRingOverlay
              size={480}
              progress={ringProgress}
              opacity={ringOpacity}
              rotationOffset={ringRotation}
            />
            <HeroMetricCard
              primaryText="+300 USD"
              captionText="Instant conversion triggered"
              trend="up"
              style={{ transform: `translateY(${cardTranslateY}px)` }}
              glowConfig={{
                enabled: true,
                color: 'rgba(99, 102, 241, 0.4)',
                intensity: 1,
                spread: 40,
              }}
            />
          </div>
        </BrowserFrame>
      </AppCanvas>
    </div>
  );
};


export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) => {
    const bgType = bgSelection?.type || 'color';
    const bgColor = bgSelection?.color || '#09090b';
    const bgGradient = bgSelection?.gradient || 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #311042 100%)';
    const bgImage = bgSelection?.imageUrl || '';
    const blurPx = bgSelection?.blurPx || 0;

    let backdropStyle: React.CSSProperties = { backgroundColor: bgColor };
    if (bgType === 'gradient') {
        backdropStyle = { background: bgGradient };
    } else if (bgType === 'image' && bgImage) {
        backdropStyle = {
            backgroundImage: `url("${bgImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
            transform: blurPx > 0 ? 'scale(1.08)' : undefined,
        };
    } else if (bgColor === 'transparent') {
        backdropStyle = { backgroundColor: 'transparent' };
    }

    return (
        <div className="w-full h-full text-white relative overflow-hidden flex items-center justify-center">
            <div style={backdropStyle} className="absolute inset-0 pointer-events-none z-0 transition-all duration-200" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Series>
                    <Series.Sequence durationInFrames={150}>
                        <Scene1 />
                    </Series.Sequence>
                </Series>
            </div>
        </div>
    );
};

export default VideoComposition;

