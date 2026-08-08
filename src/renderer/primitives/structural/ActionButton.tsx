import React from 'react';
import { StyleConfig, configToStyle, GlowConfig, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';
import { jsx } from 'react/jsx-runtime';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonLayout = 'icon-only' | 'label-only' | 'icon-label';

interface ActionButtonProps extends BaseMotionProps {
  glowConfig: GlowConfig;
  size: ButtonSize;
  icon?: string;
  label: string;
  layout?: ButtonLayout;
  onClick?: () => void;
  style?: StyleConfig;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  glowConfig,
  size,
  icon,
  label,
  layout = 'label-only',
  onClick,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg bg-indigo-600 font-medium text-white transition-all duration-150 hover:bg-indigo-500 active:scale-95 ${sizeStyles[size]}`}
      style={{ ...glow, ...us }}
    >
      {layout !== 'label-only' && icon && <span>{icon}</span>}
      {layout !== 'icon-only' && <span>{label}</span>}
    </button>
  );
};
