import React, { useState } from 'react';
import { StyleConfig, configToStyle, GlowConfig, BaseMotionProps } from '../types';
import { buildGlowFilter, getTransform3DStyle } from '../utils/styleHelpers';

export interface BrowserFrameProps extends BaseMotionProps {
  children?: React.ReactNode;
  url?: string;
  osType?: 'mac' | 'windows';
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  windowBarColor?: string;
  borderRadius?: number;
  showNavArrow?: boolean;
  showNewTabButton?: boolean;
  glowConfig?: GlowConfig;
  style?: StyleConfig;
  onBackClick?: () => void;
  onForwardClick?: () => void;
  onNewTabClick?: () => void;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  translateZ?: number;
  translateX?: number;
  translateY?: number;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  url = 'https://app.kinetic.com',
  osType = 'mac',
  width = '100%',
  height = 500,
  backgroundColor = '#121214',
  windowBarColor = '#1a1a1e',
  borderRadius = 16,
  showNavArrow = true,
  showNewTabButton = true,
  glowConfig,
  style,
  onBackClick,
  onForwardClick,
  onNewTabClick,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  translateZ,
  translateX,
  translateY,
}) => {
  const [backActive, setBackActive] = useState(false);
  const [forwardActive, setForwardActive] = useState(false);
  const [tabActive, setTabActive] = useState(false);

  const glow = buildGlowFilter(glowConfig);
  const customStyle = configToStyle(style);

  const outerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: '1px solid rgba(255,255,255,0.08)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...glow,
    ...customStyle,
    ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
  };

  const headerStyle: React.CSSProperties = {
    height: '42px',
    backgroundColor: windowBarColor,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    gap: '12px',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
  };

  const urlBarPillStyle: React.CSSProperties = {
    flex: 1,
    maxWidth: '500px',
    height: '28px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 12px',
    color: '#a1a1aa',
    fontSize: '12px',
    fontFamily: 'sans-serif',
    fontWeight: '400',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const buttonIconStyle: React.CSSProperties = {
    cursor: 'pointer',
    color: '#a1a1aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    transition: 'transform 0.1s ease, backgroundColor 0.2s ease',
  };

  return (
    <div style={outerStyle}>

      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {osType === 'mac' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
            </div>
          )}

          {showNavArrow && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div
                style={{
                  ...buttonIconStyle,
                  transform: backActive ? 'scale(0.85)' : 'scale(1)',
                }}
                onMouseDown={() => setBackActive(true)}
                onMouseUp={() => setBackActive(false)}
                onClick={onBackClick}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </div>

              <div
                style={{
                  ...buttonIconStyle,
                  transform: forwardActive ? 'scale(0.85)' : 'scale(1)',
                }}
                onMouseDown={() => setForwardActive(true)}
                onMouseUp={() => setForwardActive(false)}
                onClick={onForwardClick}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div style={urlBarPillStyle}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showNewTabButton && (
            <div
              style={{
                ...buttonIconStyle,
                transform: tabActive ? 'scale(0.85)' : 'scale(1)',
              }}
              onMouseDown={() => setTabActive(true)}
              onMouseUp={() => setTabActive(false)}
              onClick={onNewTabClick}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          )}

          {osType === 'windows' && (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#a1a1aa', marginLeft: '6px' }}>
              <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
                <rect width="10" height="1" fill="currentColor" />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" fill="none" />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};