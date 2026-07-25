import React from 'react';
import { GlowConfig, StyleConfig, configToStyle } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  blur?: number;
  saturate?: number;
  borderOpacity?: number;
  width?: number | string;
  height?: number | string;
  style?: StyleConfig;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  glowConfig,
  blur = 12,
  saturate = 1.4,
  borderOpacity = 0.2,
  width,
  height,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
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
        ...us,
      }}
    >
      {children}
    </div>
  );
};
