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

export const Scene1: React.FC = () => {

  const frame = useCurrentFrame();
  const node_0_rotateX = interpolate(frame, [0, 105, 287], [20, 0, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.42, 0, 0.58, 1.0) });
  const node_0_translateY = interpolate(frame, [0, 105], [600, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.34, 1.56, 0.64, 1.0) });
  const node_0_translateZ = interpolate(frame, [0, 107, 264], [400, 100, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.34, 1.56, 0.64, 1.0) });









































































































































  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BrowserFrame
        data-label="Main Browser Frame"
        osType="mac"
        url="https://app.hyper-scale.io/live"
        width={1150}
        height={650}
        rotateX={node_0_rotateX}
        rotateY={0}
        perspective={1200}
        translateZ={node_0_translateZ}
        glowConfig={{ enabled: true, color: 'rgba(6, 182, 212, 0.4)', spread: 35, intensity: 5 }}
       rotateZ={0} translateX={0} translateY={node_0_translateY} scale={1} opacity={1}>
        <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#0F172A' }}>
          <SidebarLayout data-label="Sidebar Navigation" appName="HyperScale" activeMenuItemId="live" width={260} backgroundColor="#0F172A"  rotateX={0}  rotateY={0}  rotateZ={0}  translateX={0}  translateY={600}  translateZ={0}  perspective={0}  scale={1}  opacity={1}  height={650} />
          <div style={{ flex: 1, padding: 32, backgroundColor: '#0B1120', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <BarChartCard
              data-label="Quarterly Growth Chart"
              titleText="Quarterly Growth"
              barColor="#10B981"
              data={[
                { label: 'Q1', value: 45, color: '#10B981' },
                { label: 'Q2', value: 68, color: '#10B981' },
                { label: 'Q3', value: 85, color: '#10B981' },
                { label: 'Q4', value: 120, color: '#10B981' },
              ]}
             rotateX={0}  rotateY={0}  rotateZ={0}  translateX={0}  translateY={0}  translateZ={0}  perspective={0}  scale={1}  opacity={1}  width={1150}  height={650} />
            <GlassmorphicCard data-label="ARR Growth Floating Card" id="target-card" glowConfig={{ enabled: true, color: 'rgba(168, 85, 247, 0.35)', spread: 20, intensity: 3 }} rotateX={0} rotateY={0} rotateZ={0} translateX={0} translateY={0} translateZ={0} perspective={0} scale={1} opacity={1} width={1150} height={0}>
              <div style={{ padding: 16, color: '#fff', fontWeight: 'bold' }}>ARR Growth +148%</div>
            </GlassmorphicCard>
          </div>
        </div>
      </BrowserFrame>
      <Cursor startX={200} startY={200} targetId="target-card" clickFrame={45} />
    </div>
  );
};
export default Scene1;
