import React from 'react';
import { GlowConfig, StyleConfig, configToStyle } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface FeatureBenefitCardProps {
  glowConfig: GlowConfig;
  icon: React.ReactNode;
  header: string;
  description: string;
  accentColor?: string;
  style?: StyleConfig;
}

export const FeatureBenefitCard: React.FC<FeatureBenefitCardProps> = ({
  glowConfig,
  icon,
  header,
  description,
  accentColor = '#6366f1',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const iconBg = { backgroundColor: `${accentColor}33` };
  const iconColor = { color: accentColor };
  return (
    <div className="rounded-xl bg-gray-900 p-5" style={{ ...glow, ...us }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ ...iconBg, ...iconColor, ...us }}>
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-white" style={us}>{header}</h3>
      <p className="text-sm leading-relaxed text-gray-400" style={us}>{description}</p>
    </div>
  );
};
