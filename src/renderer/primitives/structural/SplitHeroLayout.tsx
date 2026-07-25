import React from 'react';
import { StyleConfig, configToStyle, GlowConfig } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface SplitHeroLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  glowConfig: GlowConfig;
  splitRatio?: number;
  style?: StyleConfig;
}

export const SplitHeroLayout: React.FC<SplitHeroLayoutProps> = ({
  leftPanel,
  rightPanel,
  glowConfig,
  splitRatio = 0.5,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const leftPct = `${Math.round(splitRatio * 100)}%`;
  return (
    <div className="flex" style={{ width: '100%', height: '100%', ...glow, ...us }}>
      <div className="flex items-center justify-center p-8" style={{ width: leftPct, ...us }}>
        {leftPanel}
      </div>
      <div className="flex items-center justify-center border-l border-gray-700 p-8" style={{ flex: 1, ...us }}>
        {rightPanel}
      </div>
    </div>
  );
};
