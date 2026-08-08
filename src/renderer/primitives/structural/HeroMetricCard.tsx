import React from 'react';
import { StyleConfig, configToStyle, GlowConfig, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface HeroMetricCardProps extends BaseMotionProps {
  glowConfig?: GlowConfig;
  primaryText?: string;
  captionText?: string;
  label?: string;
  value?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
  description?: string;
  style?: StyleConfig | React.CSSProperties;
}

const trendColors: Record<string, string> = {
  up: 'text-emerald-400',
  down: 'text-rose-400',
  neutral: 'text-gray-400',
};

const trendArrows: Record<string, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

export const HeroMetricCard: React.FC<HeroMetricCardProps> = ({
  glowConfig,
  primaryText,
  captionText,
  label,
  value,
  trend = 'neutral',
  trendPercent,
  description,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us: React.CSSProperties = style ? ('transform' in style || 'backgroundColor' in style ? (style as React.CSSProperties) : configToStyle(style as StyleConfig)) : {};
  const displayPrimary = value || primaryText || '';
  const displayCaption = label || captionText || description || (trendPercent ? `${trendPercent}%` : '');

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-900 p-8 text-center shadow-lg"
      style={{ ...glow, ...us }}
    >
      <span className="text-5xl font-bold tracking-tight text-white" style={us}>
        {displayPrimary}
      </span>
      <span className="mt-2 flex items-center gap-1 text-sm text-gray-400">
        <span className={trendColors[trend]}>{trendArrows[trend]}</span>
        <span style={us}>{displayCaption}</span>
      </span>
    </div>
  );
};
