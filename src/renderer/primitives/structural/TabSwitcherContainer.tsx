import React from 'react';
import { StyleConfig, configToStyle, GlowConfig } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface TabSwitcherContainerProps {
  tabs: string[];
  activeTab: number;
  glowConfig: GlowConfig;
  direction?: 'horizontal' | 'vertical';
  style?: StyleConfig;
}

export const TabSwitcherContainer: React.FC<TabSwitcherContainerProps> = ({
  tabs,
  activeTab,
  glowConfig,
  direction = 'horizontal',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const isHorizontal = direction === 'horizontal';
  return (
    <div
      className={`relative flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-stretch rounded-lg bg-gray-900`}
      style={{ ...glow, ...us }}
    >
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={`relative z-10 flex-1 px-4 py-2 text-center text-sm font-medium transition-colors duration-200 ${i === activeTab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          style={us}
        >
          {tab}
        </div>
      ))}
      <div
        className="absolute z-0 rounded-md bg-indigo-600 transition-all duration-300"
        style={
          isHorizontal
            ? { left: `${(100 / tabs.length) * activeTab}%`, width: `${100 / tabs.length}%`, top: 2, bottom: 2 }
            : { top: `${(100 / tabs.length) * activeTab}%`, height: `${100 / tabs.length}%`, left: 2, right: 2 }
        }
      />
    </div>
  );
};
