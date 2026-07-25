import React from 'react';
import { StyleConfig, configToStyle, GlowConfig } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface TopNavbarProps {
  glowConfig: GlowConfig;
  logo: React.ReactNode;
  brandName?: string;
  searchPlaceholder?: string;
  actions?: React.ReactNode[];
  style?: StyleConfig;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  glowConfig,
  logo,
  brandName,
  searchPlaceholder = 'Search...',
  actions = [],
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-6 py-3" style={{ ...glow, ...us }}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{logo}</div>
        {brandName && <span className="hidden text-sm font-semibold text-white sm:inline" style={us}>{brandName}</span>}
        <div
          className="rounded-md bg-gray-800 px-4 py-2 text-sm text-gray-400 ring-1 ring-gray-600 transition-colors focus-within:ring-indigo-500"
          style={us}
        >
          {searchPlaceholder}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions.map((action, i) => (
          <div key={i}>{action}</div>
        ))}
      </div>
    </div>
  );
};
