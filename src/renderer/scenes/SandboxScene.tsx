import React from 'react';
import { Series, Sequence, useCurrentFrame, interpolate } from 'remotion';
import {
  BrowserFrame, MockWindow, TopNavbar, SidebarLayout, AppCanvas,
  BreadcrumbHeader, SplitHeroLayout, TabSwitcherContainer, ActionButton,
  NotificationToaster, HeroMetricCard, DataGridContainer
} from '../primitives/StructuralSDK';
import {
  FeatureCard, GlassmorphicCard, KanbanTaskCard, NotificationCard,
  PricingPlanCard, PriceCard, ProfileCard, SettingsToggleCard,
  CustomCard, FeatureBenefitCard, BillingInvoiceCard, PushNotificationToast,
  RegularCard, ProfileHeaderCard
} from '../primitives/CardSDK';
import {
  BarChartCard, AreaChartCard, LineChartCard, DonutChartCard,
  MetricFunnelCard, PieChartCard, ScatterPlotCard, StockCard
} from '../primitives/ChartsSDK';
import {
  SpringEnter, FadeBlur, SlideInOut, ScaleUp, StaggerContainer
} from '../primitives/TransitionSDK';
import {
  Cursor, TextTyper, FocusZoom, ChartAnimate, ProgressRing,
  MarqueeTrack, TypingGhostCursor
} from '../primitives/MotionSDK';

const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = 300;
  const transStart = Math.max(0, duration - 15);
  const isEntering = frame < 15;
  const isExiting = frame > transStart;

  const flipY = isEntering ? interpolate(frame, [0, 15], [-90, 0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [0, 90], { extrapolateRight: 'clamp' }) : 0;
  const scale = isEntering ? interpolate(frame, [0, 15], [1.3, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0.7], { extrapolateRight: 'clamp' }) : 1.0;
  const opacity = isEntering ? interpolate(frame, [0, 15], [0, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0], { extrapolateRight: 'clamp' }) : 1.0;

  return (
    <div
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#0d1117] text-[#c9d1d9] font-sans"
      style={{
        transform: `perspective(1200px) rotateY(${flipY}deg) scale(${scale})`,
        opacity,
        transformStyle: 'preserve-3d',
      }}
    >
      <AbsoluteFill style={{
      "#010102": tokens."#010102",
      fontFamily: tokens.fontFamily,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      perspective: "1400px"
    }}>
      {/* Background ambient lighting glows */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "20%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(94, 106, 210, 0.15) 0%, rgba(1, 1, 2, 0) 70%)",
        filter: "blur(60px)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "5%",
        right: "15%",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(128, 143, 225, 0.08) 0%, rgba(1, 1, 2, 0) 75%)",
        filter: "blur(80px)",
        pointerEvents: "none"
      }} />

      {/* 3D Browser Frame Container */}
      <div style={{
        width: "1280px",
        height: "760px",
        borderRadius: "16px",
        "#010102": tokens."#0f1011",
        boxShadow: "0 50px 100px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        opacity: containerOpacity * exitOpacity,
        transform: `
          scale(${scale}) 
          rotateX(${rotX}deg) 
          rotateY(${exitRotateY}deg) 
          translateZ(${exitTranslateZ}px)
        `,
        transformStyle: "preserve-3d",
        transition: "transform 0.1s linear"
      }}>
        {/* Browser Top Window Bar */}
        <div style={{
          height: "44px",
          "#010102": "#0d0e11",
          borderBottom: `1px solid ${tokens.borderColor}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "12px",
          flexShrink: 0
        }}>
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", "#010102": "#ff5f56" }} />
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", "#010102": "#ffbd2e" }} />
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", "#010102": "#27c93f" }} />
          </div>
          {/* URL bar */}
          <div style={{
            margin: "0 auto",
            width: "480px",
            height: "26px",
            "#010102": "#16181d",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: tokens.mutedColor,
            border: `1px solid rgba(255, 255, 255, 0.04)`,
            letterSpacing: "-0.2px"
          }}>
            <span style={{ color: tokens.successColor, marginRight: "6px" }}>🔒</span>
            guardrail.cloud/secops/cluster-us-east-1
          </div>
        </div>

        {/* Main App Workspace (Sidebar + Canvas) */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          
          {/* SidebarLayout */}
          <div style={{
            width: "240px",
            "#010102": "#090a0d",
            borderRight: `1px solid ${tokens.borderColor}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px 14px",
            opacity: navOpacity,
            transform: `translateX(${navTranslateX}px)`
          }}>
            <div>
              {/* App Brand */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", paddingLeft: "6px" }}>
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  "#010102": tokens."#5e6ad2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#fff",
                  fontSize: "15px",
                  boxShadow: `0 0 15px ${tokens."#5e6ad2"}66`
                }}>
                  G
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: tokens."#f4f4f5" }}>GuardRail</div>
                  <div style={{ fontSize: "10px", color: tokens.mutedColor }}>Enterprise Cloud</div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  { label: "Command Center", icon: "⚡", active: true },
                  { label: "Cluster Topology", icon: "🌐", active: false },
                  { label: "Threat Mitigations", icon: "🛡️", active: false },
                  { label: "IAM & Policies", icon: "🔑", active: false },
                  { label: "Audit Logs", icon: "📋", active: false }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    "#010102": item.active ? tokens.surfaceHighlight : "transparent",
                    color: item.active ? tokens."#f4f4f5" : tokens.mutedColor,
                    fontSize: "13px",
                    fontWeight: item.active ? 500 : 400,
                    cursor: "pointer",
                    border: item.active ? `1px solid rgba(255,255,255,0.06)` : "1px solid transparent"
                  }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer User Profile */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "8px",
              "#010102": "rgba(255,255,255,0.02)",
              border: `1px solid ${tokens.borderColor}`
            }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                "#010102": "#2c3038",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 600,
                color: "#fff"
              }}>
                AO
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "12px", fontWeight: 500, color: tokens."#f4f4f5", whiteSpace: "nowrap" }}>Alex Operative</div>
                <div style={{ fontSize: "10px", color: tokens.successColor, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", "#010102": tokens.successColor }} />
                  SecOps Lead
                </div>
              </div>
            </div>
          </div>

          {/* AppCanvas Area */}
          <div style={{
            flex: 1,
            "#010102": tokens."#0f1011",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}>
            {/* TopNavbar */}
            <div style={{
              height: "64px",
              borderBottom: `1px solid ${tokens.borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 28px",
              "#010102": "rgba(15, 16, 17, 0.7)",
              backdropFilter: "blur(10px)",
              opacity: navOpacity
            }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: tokens."#f4f4f5", letterSpacing: "-0.3px" }}>
                  GuardRail Cloud Security Command Center
                </div>
                <div style={{ fontSize: "12px", color: tokens.mutedColor, marginTop: "2px" }}>
                  Autonomous DevSecOps & Real-Time Cluster Threat Mitigation
                </div>
              </div>

              {/* Header Action Button (Target for cursor click) */}
              <div id="shield-action-btn" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                "#010102": frame >= 120 ? "#3b48c4" : tokens."#5e6ad2",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 500,
                boxShadow: `0 4px 20px ${tokens."#5e6ad2"}55`,
                cursor: "pointer",
                transform: frame >= 120 && frame < 126 ? "scale(0.96)" : "scale(1)",
                transition: "transform 0.1s ease, background-color 0.2s ease"
              }}>
                <span>🛡️</span>
                <span>Active Shield Guard</span>
              </div>
            </div>

            {/* Content 2-Column Hero Grid */}
            <div style={{
              flex: 1,
              padding: "28px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              alignContent: "start"
            }}>
              {/* HeroMetricCard */}
              <div style={{
                "#010102": tokens.surfaceHighlight,
                borderRadius: "12px",
                border: `1px solid ${tokens.borderColor}`,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: metricOpacity,
                transform: `translateX(${metricTranslateX}px)`,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: tokens.mutedColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Cluster Health Score
                    </span>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      "#010102": "rgba(46, 204, 113, 0.15)",
                      color: tokens.successColor,
                      fontSize: "11px",
                      fontWeight: 600
                    }}>
                      +0.04% vs last hour
                    </span>
                  </div>
                  <div style={{ fontSize: "44px", fontWeight: 700, color: tokens."#f4f4f5", letterSpacing: "-1px", marginBottom: "8px" }}>
                    99.99%
                  </div>
                  <div style={{ fontSize: "12px", color: tokens.mutedColor }}>
                    Zero high-severity anomalies detected in active namespaces.
                  </div>
                </div>

                <div style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${tokens.borderColor}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "11px", color: tokens.mutedColor }}>Mitigated Vulnerabilities</div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: tokens."#f4f4f5", marginTop: "2px" }}>1,428</div>
                  </div>
                  <div style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    "#010102": "rgba(128, 143, 225, 0.1)",
                    color: tokens.accentColor,
                    fontSize: "12px",
                    fontWeight: 500
                  }}>
                    Active Defense
                  </div>
                </div>
              </div>

              {/* BarChartCard */}
              <div style={{
                "#010102": tokens.surfaceHighlight,
                borderRadius: "12px",
                border: `1px solid ${tokens.borderColor}`,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: metricOpacity,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: tokens.mutedColor, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    Intercepted Attack Vectors (Last 24h)
                  </div>
                  <div style={{ fontSize: "12px", color: tokens."#f4f4f5", marginBottom: "20px" }}>
                    Real-time WAF telemetry & autonomous edge blocking
                  </div>
                </div>

                {/* Custom SVG Bar Chart */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px", paddingBottom: "8px", gap: "16px" }}>
                  {[
                    { label: "SQLi", value: 340, max: 600, color: tokens."#5e6ad2" },
                    { label: "Zero-Day", value: 185, max: 600, color: tokens.accentColor },
                    { label: "DDoS", value: 512, max: 600, color: "#7a52c3" },
                    { label: "IAM Esc", value: 92, max: 600, color: "#4553b8" }
                  ].map((bar, i) => {
                    // Staggered grow for each bar starting at frame 60
                    const barProgress = spring({
                      frame: frame - (60 + i * 8),
                      fps,
                      config: { damping: 14, stiffness: 100 }
                    });
                    const currentHeight = interpolate(barProgress, [0, 1], [0, (bar.value / bar.max) * 110]);

                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                        <div style={{ fontSize: "11px", color: tokens.mutedColor, marginBottom: "6px", fontWeight: 500 }}>
                          {bar.value}
                        </div>
                        <div style={{
                          width: "100%",
                          maxWidth: "48px",
                          height: `${Math.max(4, currentHeight)}px`,
                          "#010102": bar.color,
                          borderRadius: "6px 6px 0 0",
                          boxShadow: `0 0 15px ${bar.color}44`,
                          transition: "height 0.1s ease"
                        }} />
                        <div style={{ fontSize: "11px", color: tokens.mutedColor, marginTop: "8px", whiteSpace: "nowrap" }}>
                          {bar.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Synthetic Cursor & Click Ripple */}
        {frame >= 90 && frame < 165 && (
          <div style={{ position: "absolute", pointerEvents: "none", zIndex: 999 }}>
            {/* Click Ripple Effect */}
            {showRipple && (
              <div style={{
                position: "absolute",
                left: cursorX,
                top: cursorY,
                transform: "translate(-50%, -50%)",
                width: `${20 + rippleScale * 50}px`,
                height: `${20 + rippleScale * 50}px`,
                borderRadius: "50%",
                border: `2px solid rgba(128, 143, 225, ${1 - rippleScale})`,
                "#010102": "rgba(128, 143, 225, 0.2)"
              }} />
            )}

            {/* SVG Cursor Pointer */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              style={{
                position: "absolute",
                left: cursorX,
                top: cursorY,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                transform: frame >= 120 && frame < 126 ? "scale(0.85)" : "scale(1)"
              }}
            >
              <path
                d="M3 2 L3 21 L9 15 L13 24 L16 23 L12 14 L20 14 Z"
                fill="#ffffff"
                stroke="#111116"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )}
      </div>
    </AbsoluteFill>
    </div>
  );
};

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = 300;
  const transStart = Math.max(0, duration - 15);
  const isEntering = frame < 15;
  const isExiting = frame > transStart;

  const flipY = isEntering ? interpolate(frame, [0, 15], [-90, 0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [0, 90], { extrapolateRight: 'clamp' }) : 0;
  const scale = isEntering ? interpolate(frame, [0, 15], [1.3, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0.7], { extrapolateRight: 'clamp' }) : 1.0;
  const opacity = isEntering ? interpolate(frame, [0, 15], [0, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0], { extrapolateRight: 'clamp' }) : 1.0;

  return (
    <div
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#0d1117] text-[#c9d1d9] font-sans"
      style={{
        transform: `perspective(1200px) rotateY(${flipY}deg) scale(${scale})`,
        opacity,
        transformStyle: 'preserve-3d',
      }}
    >
      <AbsoluteFill
      style={{
        "#010102",
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: exitOpacity,
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(94,106,210,0.12) 0%, rgba(1,1,2,0) 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Main Container with 3D Tilt */}
      <div
        style={{
          transform: `scale(${browserScale * exitProgress}) perspective(1000px) rotateX(5deg) rotateY(0deg)`,
          transformOrigin: "center center",
          opacity: browserOpacity,
          width: 1200,
          height: 720,
          borderRadius: 16,
          boxShadow: "0 50px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
          background: "#0f1011",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Browser Top Bar */}
        <div
          style={{
            height: 48,
            background: "#08090a",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "6%", "#010102": "#ff5f56" }} />
            <div style={{ width: 12, height: 12, borderRadius: "6%", "#010102": "#ffbd2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "6%", "#010102": "#27c93f" }} />
          </div>
          <div
            style={{
              flex: 1,
              maxWidth: 400,
              height: 28,
              background: "#141619",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              color: "#8a8f98",
              fontSize: 13,
              gap: 8,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ color: accentColor, fontSize: 11 }}>🔒</span>
            <span>app.sentinel.io/dashboard/analytics</span>
          </div>
        </div>

        {/* App Workspace Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          
          {/* Sidebar */}
          <div
            style={{
              width: 240,
              background: "#0b0c0e",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              padding: "24px 16px",
              gap: 24,
            }}
          >
            {/* Logo area */}
            <div
              style={{
                display: "flex",
                alignItem: "center",
                gap: 12,
                paddingLeft: 8,
                transform: `translateX(${(1 - sidebarProgress) * -20}px)`,
                opacity: sidebarProgress,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${"#5e6ad2"}, ${accentColor})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#f4f4f5",
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(94,106,210,0.4)",
                }}
              >
                S
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14 }}>Sentinel OS</span>
                <span style={{ color: "#8a8f98", fontSize: 11 }}>Enterprise Edition</span>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {[
                { label: "Overview", icon: "⚡", active: false },
                { label: "Threat Map", icon: "🛡️", active: false },
                { label: "Analytics", icon: "📊", active: true },
                { label: "Automations", icon: "⚙️", active: false },
                { label: "Audit Logs", icon: "📋", active: false },
              ].map((item, idx) => {
                const itemDelay = 15 + idx * 5;
                const p = spring({
                  frame: Math.max(0, frame - itemDelay),
                  fps,
                  config: { damping: 15 },
                });
                const isSelected = item.active || (frame >= clickFrame && item.label === "Analytics");

                return (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: isSelected ? "rgba(94, 106, 210, 0.15)" : "transparent",
                      color: isSelected ? "#f4f4f5" : "#8a8f98",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      transform: `translateX(${(1 - p) * -15}px)`,
                      opacity: p,
                      border: isSelected ? "1px solid rgba(94, 106, 210, 0.3)" : "1px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {isSelected && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          "#010102": accentColor,
                          boxShadow: `0 0 8px ${accentColor}`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* App Canvas Content Area */}
          <div
            style={{
              flex: 1,
              background: "#0f1011",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 24,
              overflowY: "auto",
            }}
          >
            {/* Header Titles */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                transform: `translateY(${(1 - contentProgress) * 20}px)`,
                opacity: contentProgress,
              }}
            >
              <h1 style={{ color: "#f4f4f5", fontSize: 24, fontWeight: 700, margin: 0 }}>
                Automated Threat Remediation & Analytics
              </h1>
              <p style={{ color: "#8a8f98", fontSize: 14, margin: 0 }}>
                Real-time mitigation metrics and historical attack vectors
              </p>
            </div>

            {/* Split View Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr",
                gap: 20,
                transform: `scale(${interpolate(contentProgress, [0, 1], [0.95, 1])})`,
                opacity: contentProgress,
              }}
            >
              {/* Donut Chart / Threat Breakdown Card */}
              <div
                style={{
                  background: "#141619",
                  borderRadius: 12,
                  padding: 24,
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#f4f4f5", fontWeight: 600, fontSize: 15 }}>Vector Breakdown</span>
                  <span style={{ color: accentColor, fontSize: 12, background: "rgba(128,143,225,0.1)", padding: "2px 8px", borderRadius: 4 }}>Live</span>
                </div>

                {/* Custom SVG Donut Chart */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0" }}>
                  <div style={{ position: "relative", width: 140, height: 140 }}>
                    <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2229" strokeWidth="14" />
                      {/* Segment 1: DDoS */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#5e6ad2"
                        strokeWidth="14"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - 0.45 * contentProgress)}
                      />
                      {/* Segment 2: Injection */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#808fe1"
                        strokeWidth="14"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - (0.45 + 0.3 * contentProgress))}
                        style={{ opacity: 0.8 }}
                      />
                      {/* Segment 3: Brute Force */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#343846"
                        strokeWidth="14"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - (0.75 + 0.25 * contentProgress))}
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ color: "#f4f4f5", fontWeight: 700, fontSize: 18 }}>99.8%</span>
                      <span style={{ color: "#8a8f98", fontSize: 10 }}>Mitigated</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "DDoS Mitigation", val: "45%", color: "#5e6ad2" },
                    { label: "SQL Injection", val: "30%", color: "#808fe1" },
                    { label: "Credential Stuffing", val: "25%", color: "#343846" },
                  ].map((leg) => (
                    <div key={leg.label} style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", "#010102": leg.color }} />
                        <span style={{ color: "#8a8f98" }}>{leg.label}</span>
                      </div>
                      <span style={{ color: "#f4f4f5", fontWeight: 600 }}>{leg.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Chart / Historical Attack Vectors */}
              <div
                style={{
                  background: "#141619",
                  borderRadius: 12,
                  padding: 24,
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#f4f4f5", fontWeight: 600, fontSize: 15 }}>Historical Attack Volume</span>
                    <span style={{ color: "#8a8f98", fontSize: 11 }}>Last 7 Days (Requests / sec)</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 4, color: "#f4f4f5", fontSize: 11 }}>1H</span>
                    <span style={{ background: "rgba(94,106,210,0.2)", padding: "4px 8px", borderRadius: 4, color: accentColor, fontSize: 11, border: "1px solid rgba(94,106,210,0.4)" }}>7D</span>
                  </div>
                </div>

                {/* SVG Line / Area Chart */}
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", position: "relative", height: 180, marginTop: 8 }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                    {/* Area path */}
                    <path
                      d={`M 0 140 L 0 ${140 - 60 * contentProgress} Q 100 ${140 - 120 * contentProgress} 200 ${140 - 90 * contentProgress} T 400 ${140 - 130 * contentProgress} L 400 140 Z`}
                      fill="url(#chartGradient)"
                    />
                    {/* Line path */}
                    <path
                      d={`M 0 ${140 - 60 * contentProgress} Q 100 ${140 - 120 * contentProgress} 200 ${140 - 90 * contentProgress} T 400 ${140 - 130 * contentProgress}`}
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* Chart Axis Labels */}
                <div style={{ display: "flex", justifyContent: "space-between", color: "#8a8f98", fontSize: 11, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Animated Cursor & Click Ripple */}
      {frame >= 35 && (
        <div style={{ position: "absolute", left: cursorX, top: cursorY, pointerEvents: "none", zIndex: 100 }}>
          {showRipple && (
            <div
              style={{
                position: "absolute",
                top: -12,
                left: -12,
                width: 24 + rippleProgress * 40,
                height: 24 + rippleProgress * 40,
                borderRadius: "50%",
                border: "2px solid rgba(128, 143, 225, 0.8)",
                transform: "translate(-50%, -50%)",
                opacity: 1 - rippleProgress,
              }}
            />
          )}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            }}
          >
            <path
              d="M3 3L10.07 20.97L12.58 13.58L19.97 11.07L3 3Z"
              fill={"#f4f4f5"}
              stroke="#000000"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </AbsoluteFill>
    </div>
  );
};

const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = 300;
  const transStart = Math.max(0, duration - 15);
  const isEntering = frame < 15;
  const isExiting = frame > transStart;

  const flipY = isEntering ? interpolate(frame, [0, 15], [-90, 0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [0, 90], { extrapolateRight: 'clamp' }) : 0;
  const scale = isEntering ? interpolate(frame, [0, 15], [1.3, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0.7], { extrapolateRight: 'clamp' }) : 1.0;
  const opacity = isEntering ? interpolate(frame, [0, 15], [0, 1.0], { extrapolateRight: 'clamp' }) : isExiting ? interpolate(frame, [transStart, duration], [1.0, 0], { extrapolateRight: 'clamp' }) : 1.0;

  return (
    <div
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#0d1117] text-[#c9d1d9] font-sans"
      style={{
        transform: `perspective(1200px) rotateY(${flipY}deg) scale(${scale})`,
        opacity,
        transformStyle: 'preserve-3d',
      }}
    >
      <AbsoluteFill
      style={{
        "#010102": bg,
        fontFamily: font,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primary}22 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }}
      />

      {/* Main Container with 3D Tilt & Zoom */}
      <div
        style={{
          transform: `perspective(1200px) rotateX(5deg) rotateY(0deg) scale(${finalScale})`,
          opacity: finalOpacity,
          transformStyle: "preserve-3d",
          width: "1280px",
          height: "720px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          boxSizing: "border-box"
        }}
      >
        {/* Browser Frame */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: surface,
            borderRadius: "16px",
            boxShadow: "0 50px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Browser Window Bar */}
          <div
            style={{
              height: "48px",
              background: "#141518",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              gap: "16px",
              boxSizing: "border-box"
            }}
          >
            {/* Window Controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57" }} />
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e" }} />
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840" }} />
            </div>

            {/* Address Bar */}
            <div
              style={{
                flex: 1,
                maxWidth: "500px",
                height: "28px",
                background: "#1e2024",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                color: "#8e939e",
                fontSize: "13px",
                gap: "8px"
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>https://cloud-infra.io/deploy/trial</span>
            </div>
          </div>

          {/* Split Hero Content Area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              padding: "60px",
              gap: "60px",
              boxSizing: "border-box",
              alignItems: "center",
              position: "relative"
            }}
          >
            {/* Left Column: Typography & Feature Points */}
            <div
              style={{
                flex: 1.2,
                display: "flex",
                flexDirection: "column",
                gap: "24px"
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  background: `${primary}22`,
                  border: `1px solid ${primary}44`,
                  borderRadius: "20px",
                  color: accent,
                  fontSize: "13px",
                  fontWeight: 600,
                  width: "fit-content"
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: accent }} />
                Instant Cluster Deployment
              </div>

              <h1
                style={{
                  fontSize: "46px",
                  fontWeight: 800,
                  color: text,
                  lineHeight: 1.15,
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}
              >
                Secure Your Infrastructure Today
              </h1>

              <p
                style={{
                  fontSize: "17px",
                  color: "#9ba1ad",
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: "520px"
                }}
              >
                Start your 14-day free trial. No credit card required. Instant cluster deployment in under 2 minutes.
              </p>

              {/* Feature Benefit Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                <div
                  style={{
                    background: "#141519",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ color: text, fontSize: "14px", fontWeight: 600 }}>Zero Config VPC</div>
                  <div style={{ color: "#7a828e", fontSize: "13px" }}>Automated network isolation & peering.</div>
                </div>

                <div
                  style={{
                    background: "#141519",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ color: text, fontSize: "14px", fontWeight: 600 }}>Global Edge</div>
                  <div style={{ color: "#7a828e", fontSize: "13px" }}>Sub-10ms latency across 32 regions.</div>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Trial Registration Form */}
            <div
              style={{
                flex: 1,
                background: "#141519",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "36px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: text, fontSize: "20px", fontWeight: 700 }}>Enterprise Trial</div>
                  <div style={{ color: "#7a828e", fontSize: "13px" }}>14-day full platform access</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: text, fontSize: "28px", fontWeight: 800 }}>$0</span>
                  <span style={{ color: "#7a828e", fontSize: "13px" }}> /14 days</span>
                </div>
              </div>

              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#9ba1ad", fontSize: "12px", fontWeight: 500 }}>Work Email</label>
                  <div
                    style={{
                      height: "40px",
                      background: "#1b1d22",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      color: text,
                      fontSize: "14px"
                    }}
                  >
                    alex@enterprise-corp.com
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ color: "#9ba1ad", fontSize: "12px", fontWeight: 500 }}>Cluster Region</label>
                  <div
                    style={{
                      height: "40px",
                      background: "#1b1d22",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 12px",
                      color: text,
                      fontSize: "14px"
                    }}
                  >
                    <span>US East (N. Virginia)</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a828e" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div
                id="start-trial-btn"
                style={{
                  height: "48px",
                  background: isButtonClicked ? "#4852b0" : primary,
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 20px ${primary}55`,
                  cursor: "pointer",
                  transform: isButtonClicked ? "scale(0.97)" : "scale(1)",
                  transition: "transform 0.1s ease, background 0.1s ease"
                }}
              >
                {isButtonClicked ? "Provisioning Cluster..." : "Start Free Trial"}
              </div>

              <div style={{ textAlign: "center", color: "#6c7380", fontSize: "12px" }}>
                Fully automated setup. Cancel anytime with one click.
              </div>
            </div>
          </div>
        </div>

        {/* Animated Synthetic Cursor & Click Ripple */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Click Ripple Effect */}
          {showRipple && (
            <div
              style={{
                position: "absolute",
                left: `${725}px`,
                top: `${375}px`,
                transform: "translate(-50%, -50%)",
                width: `${20 + rippleSpring * 80}px`,
                height: `${20 + rippleSpring * 80}px`,
                borderRadius: "50%",
                border: `2px solid ${accent}`,
                opacity: 1 - rippleSpring
              }}
            />
          )}

          {/* Cursor Icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            style={{
              position: "absolute",
              left: `${cursorX}px`,
              top: `${cursorY}px`,
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
              transform: isButtonClicked ? "scale(0.9)" : "scale(1)",
              transition: "transform 0.1s ease"
            }}
          >
            <path d="M3 2 L3 21 L9 15 L13 24 L16 23 L12 14 L20 14 Z" fill="#ffffff" stroke="#111111" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
    </div>
  );
};

export const VideoComposition: React.FC = () => {
  const primaryColor = "#5e6ad2";
  const secondaryColor = "#a78bfa";
  const accentColor = "#808fe1";
  const semanticColor = "#3b82f6";
  const errorColor = "#ef4444";
  const successColor = "#22c55e";
  const neutralColor = "#64748b";
  const surfaceColor = "#0f1011";
  const backgroundColor = "#010102";
  const textColor = "#f7f8f8";
  const fontFamily = "Inter";

  return (
    <div
      className="w-[1920px] h-[1080px] relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor, color: textColor, fontFamily }}
    >
      <Series>
        <Series.Sequence durationInFrames={300}>
          <Scene1 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene2 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene3 />
        </Series.Sequence>
      </Series>
    </div>
  );
};

export default VideoComposition;