import React from "react";
import { StyleConfig, configToStyle, GlowConfig } from "../types";
import { buildGlowFilter, getTransform3DStyle } from "../utils/styleHelpers";

type AspectRatio = '16:9' | '9:16' | '4:3' | '1:1';

const aspectRatioMap: Record<AspectRatio, string> = {
  '16:9': '16 / 9',
  '9:16': '9 / 16',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
};

export interface AppCanvasProps {
  children?: React.ReactNode;
  osType?: 'mac' | 'windows';
  appTitle?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  windowBarColor?: string;
  borderRadius?: number;
  glowConfig?: GlowConfig;
  aspectRatio?: AspectRatio;
  style?: StyleConfig;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  translateZ?: number;
  translateX?: number;
  translateY?: number;
}

export const AppCanvas: React.FC<AppCanvasProps> = ({
  children,
  osType = 'mac',
  appTitle = 'Window Title',
  width,
  height,
  backgroundColor = '#121214',
  windowBarColor = '#1a1a1e',
  borderRadius = 16,
  glowConfig,
  aspectRatio = "16:9",
  style,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  translateZ,
  translateX,
  translateY,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const customStyle = configToStyle(style);

  const outerStyle: React.CSSProperties = {
    width: width !== undefined ? `${width}px` : '100%',
    height: height !== undefined ? `${height}px` : '100%',
    aspectRatio: width || height ? undefined : aspectRatioMap[aspectRatio],
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
    height: '36px',
    backgroundColor: windowBarColor,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    padding: '0px 16px',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    color: '#a1a1aa',
    fontSize: '13px',
    fontWeight: '500',
  };

  return (
    <div style={outerStyle}>

      <div style={headerStyle}>
        {osType === 'mac' ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
            {appTitle && (
              <span style={{ ...titleStyle, marginLeft: '12px' }}>{appTitle}</span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            {appTitle && <span style={titleStyle}>{appTitle}</span>}

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#a1a1aa' }}>
              <svg width="10" height="1" fill="currentColor">
                <rect width="10" height="1" fill="currentColor" />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" fill="none" />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};