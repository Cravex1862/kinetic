import React from 'react';
import { GlowConfig, StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { buildGlowFilter, getTransform3DStyle } from '../utils/styleHelpers';

export interface GlassmorphicCardProps extends BaseMotionProps {
  children: React.ReactNode;
  glowConfig?: GlowConfig;
  blur?: number;
  saturate?: number;
  borderOpacity?: number;
  width?: number | string;
  height?: number | string;
  style?: StyleConfig;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  translateZ?: number;
  translateX?: number;
  translateY?: number;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  glowConfig = { enabled: false, color: 'rgba(168, 85, 247, 0.4)', spread: 20, intensity: 3 },
  blur = 12,
  saturate = 1.4,
  borderOpacity = 0.2,
  width,
  height,
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
  const us = configToStyle(style);
  const t3d = getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY);


  return (
    <div
      style={{
        backdropFilter: `blur(${blur}px) saturate(${saturate})`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate})`,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '16px',
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        padding: '20px',
        width: width ?? '100%',
        height: height ?? undefined,
        ...glow,
        ...t3d,
        ...us,
      }}
    >
      {children}
    </div>
  );
};

