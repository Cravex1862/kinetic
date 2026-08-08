import React from 'react';
import { StyleConfig, configToStyle, GlowConfig, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface DataGridContainerProps extends BaseMotionProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  columns?: number;
  gap?: number;
  style?: StyleConfig;
}

export const DataGridContainer: React.FC<DataGridContainerProps> = ({
  children,
  glowConfig,
  columns = 3,
  gap = 4,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div
      className="grid p-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 4}px`,
        ...glow,
        ...us,
      }}
    >
      {children}
    </div>
  );
};
