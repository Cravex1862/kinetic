import React from 'react';
import { StyleConfig, configToStyle, GlowConfig, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface BreadcrumbHeaderProps extends BaseMotionProps {
  pathSequence: string[];
  separator?: string;
  glowConfig: GlowConfig;
  style?: StyleConfig;
}

export const BreadcrumbHeader: React.FC<BreadcrumbHeaderProps> = ({
  pathSequence,
  separator = '/',
  glowConfig,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div className="flex items-center gap-1 px-4 py-2 text-sm text-gray-400" style={{ ...glow, ...us }}>
      {pathSequence.map((segment, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-1 text-gray-600" style={us}>{separator}</span>}
          <span className={i === pathSequence.length - 1 ? 'font-medium text-white' : ''} style={us}>
            {segment}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
