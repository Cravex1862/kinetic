import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BrowserFrame } from '../primitives/StructuralSDK';
import { Cursor } from '../primitives/MotionSDK';

export const exampleComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fontFamily = "Inter, sans-serif";
  const backgroundColor = "#08090E"; 
  const surfaceColor = "#14151C"; 
  const surfaceLight = "#1C1D24"; 
  const textColor = "#EDEDF2";
  const textMuted = "#8F9098";
  const accentColor = "#D8B4FE"; 
  const successColor = "#22C55E"; 

  // Entrance Animation
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 35 },
  });
  const scale = interpolate(entranceSpring, [0, 1], [0.95, 1]);
  const opacity = interpolate(entranceSpring, [0, 1], [0, 1]);
  // Start off-screen at bottom (1200px down)
  const translateY = interpolate(entranceSpring, [0, 1], [1200, 0]);
  // Start popped out closer to camera
  const translateZ = interpolate(entranceSpring, [0, 1], [400, 0]);

  // Flatten Animation (waits until all inner cards, including AI Assistant, have loaded)
  const flattenSpring = spring({
    frame: Math.max(0, frame - 110), // Starts well after cardSpring3 (frame 55) finishes
    fps,
    config: { damping: 30, stiffness: 15 },
  });
  // Hold at 25 degrees tilt until the flatten spring kicks in
  const rotateX = interpolate(flattenSpring, [0, 1], [25, 0]);
  const rotateY = 0;

  // Exit Animation (slides everything up off screen)
  const exitSpring = spring({
    frame: Math.max(0, frame - 230), // Starts after click resolves
    fps,
    config: { damping: 18, stiffness: 50 },
  });
  const exitTranslateY = interpolate(exitSpring, [0, 1], [0, -1800]);

  // Zoom & Pan on the button during flatten
  const focusScale = interpolate(flattenSpring, [0, 1], [1, 1.8]);
  const focusTranslateX = interpolate(flattenSpring, [0, 1], [0, -890]); 
  const focusTranslateY = interpolate(flattenSpring, [0, 1], [0, -550]); 

  // Combine transforms
  const combinedTranslateX = focusTranslateX;
  const combinedTranslateY = translateY + focusTranslateY;
  const combinedScale = scale * focusScale;

  // Staggered Animations for content cards (adjusted timing for slower entry)
  const cardSpring1 = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 16, stiffness: 60 } });
  const cardSpring2 = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 16, stiffness: 60 } });
  const cardSpring3 = spring({ frame: Math.max(0, frame - 55), fps, config: { damping: 16, stiffness: 60 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: fontFamily,
        position: 'relative'
      }}
    >
      {/* Exit Wrapper to slide everything up together */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        transform: `translateY(${exitTranslateY}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
        width: '88%',
        height: '82%',
        transform: `translate(${combinedTranslateX}px, ${combinedTranslateY}px) scale(${combinedScale})`,
        opacity,
        display: 'flex',
      }}>
        <BrowserFrame
          url="https://app.teamble.com/prep/taylor"
          width="100%"
          height="100%"
          osType="mac"
          backgroundColor={surfaceColor}
          perspective={1200}
          rotateX={rotateX}
          rotateY={rotateY}
          translateZ={translateZ}
          style={{
            boxShadow: '0 35px 90px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(216, 180, 254, 0.1)',
          }}
        >
          <div style={{ padding: '40px 56px', display: 'flex', flexDirection: 'column', gap: '40px', height: '100%', overflow: 'hidden' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
               <div style={{ color: textMuted, cursor: 'pointer', fontSize: '24px', fontWeight: 300, paddingRight: '8px' }}>‹</div>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#475569', backgroundImage: 'url("https://i.pravatar.cc/100?img=47")', backgroundSize: 'cover' }} />
               <h1 style={{ fontSize: '28px', fontWeight: 700, color: textColor, margin: 0, letterSpacing: '-0.02em' }}>
                 Prep for 1 on 1 with Taylor <span style={{ color: textMuted, fontWeight: 500 }}>(Account Executive)</span>
               </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '40px', flex: 1, overflow: 'hidden' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', paddingBottom: '40px' }}>
                
                {/* Taylor's Objectives */}
                <div style={{ 
                  transform: `translateY(${interpolate(cardSpring1, [0, 1], [30, 0])}px)`, 
                  opacity: cardSpring1 
                }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: textColor, marginBottom: '20px', letterSpacing: '-0.01em' }}>Taylor's Objectives</h2>
                  <div style={{ backgroundColor: surfaceLight, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: textColor, marginBottom: '20px' }}>Secure 10 new strategic accounts</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: successColor, fontSize: '14px', fontWeight: 600 }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: successColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '12px' }}>✓</div>
                        On Track
                      </div>
                      <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '42%', backgroundColor: successColor, height: '100%', borderRadius: '4px' }} />
                      </div>
                      <div style={{ color: successColor, fontSize: '14px', fontWeight: 700 }}>42%</div>
                    </div>
                  </div>
                </div>

                {/* Section Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: textColor, margin: 0, letterSpacing: '-0.01em' }}>1 on 1 Prep survey</h2>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={textColor}><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div style={{ color: textMuted, fontSize: '14px', fontWeight: 500 }}>07 January 2025</div>
                </div>

                {/* Progress & Achievements */}
                <div style={{ 
                  transform: `translateY(${interpolate(cardSpring2, [0, 1], [30, 0])}px)`, 
                  opacity: cardSpring2 
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginBottom: '20px' }}>Progress & Achievements</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Item 01 */}
                    <div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ color: textMuted, fontWeight: 700, fontSize: '15px' }}>01.</span>
                        <span style={{ color: textColor, fontWeight: 600, fontSize: '15px' }}>What recent accomplishments are you most proud of?</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: surfaceLight, borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#475569', backgroundImage: 'url("https://i.pravatar.cc/100?img=47")', backgroundSize: 'cover' }} />
                          <span style={{ color: textMuted, fontSize: '14px', fontWeight: 500 }}>Taylor Wright</span>
                        </div>
                        <div style={{ color: textColor, fontSize: '15px', flex: 1, fontWeight: 500 }}>Successfully secured a meeting with a key buyer at a Fortune 500</div>
                      </div>
                    </div>

                    {/* Item 02 */}
                    <div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ color: textMuted, fontWeight: 700, fontSize: '15px' }}>02.</span>
                        <span style={{ color: textColor, fontWeight: 600, fontSize: '15px' }}>What are your main priorities for next month?</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: surfaceLight, borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#475569', backgroundImage: 'url("https://i.pravatar.cc/100?img=47")', backgroundSize: 'cover' }} />
                          <span style={{ color: textMuted, fontSize: '14px', fontWeight: 500 }}>Taylor Wright</span>
                        </div>
                        <div style={{ color: textColor, fontSize: '15px', flex: 1, fontWeight: 500 }}>Nail the upcoming demo schedule</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column - AI Assistant */}
              <div style={{ 
                transform: `translateY(${interpolate(cardSpring3, [0, 1], [30, 0])}px)`, 
                opacity: cardSpring3,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  backgroundColor: surfaceLight, 
                  borderRadius: '28px', 
                  border: '1px solid rgba(216, 180, 254, 0.12)', 
                  padding: '32px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '28px', 
                  height: '100%', 
                  boxShadow: 'inset 0 0 60px rgba(216, 180, 254, 0.02), 0 20px 40px rgba(0,0,0,0.2)' 
                }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #C084FC, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: textColor, margin: 0 }}>AI Assistant</h2>
                  </div>

                  <p style={{ color: textMuted, fontSize: '15px', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    Welcome to your 1 on 1 prep, I would like to help you prep, here are some suggestions:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {['Summary of Taylor\'s feedback', 'Summary of Taylor\'s latest 1-on-1', 'Suggest conversation starters'].map((text, i) => (
                      <div key={i} style={{ 
                        padding: '16px 20px', 
                        backgroundColor: 'rgba(216, 180, 254, 0.03)', 
                        border: '1px solid rgba(216, 180, 254, 0.15)', 
                        borderRadius: '14px',
                        color: accentColor,
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}>
                        <span style={{ fontSize: '18px', fontWeight: 400 }}>+</span> {text}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <button 
                      id="craft-feedback-btn"
                      style={{ 
                        width: '100%', 
                        padding: '18px', 
                        borderRadius: '100px', 
                        border: 'none', 
                        background: 'linear-gradient(90deg, rgba(216, 180, 254, 0.08), rgba(244, 114, 182, 0.08))',
                        borderTop: '1px solid rgba(216, 180, 254, 0.15)',
                        borderBottom: '1px solid rgba(216, 180, 254, 0.15)',
                        color: '#E879F9',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(216, 180, 254, 0.1)',
                      }}
                    >
                      Help me craft feedback
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </BrowserFrame>
      </div>
      
        {/* Animated Mouse Cursor */}
        {frame >= 190 && (
          <Cursor
            frame={Math.max(0, frame - 190)} // Render only after UI settles so it measures perfectly
            targetId="craft-feedback-btn"
            startX={1920}
            startY={1080}
            duration={30} // Snappy 30 frame movement
            clickFrame={30} // Clicks exactly on arrival
            longPressFrames={6} // Triggers exact 200ms (6-frame) bounce scale ripple
          />
        )}
      </div>
    </div>
  );
};
