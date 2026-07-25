import React from 'react';
import { StyleConfig, configToStyle, GlowConfig } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

type ToastPosition = 'top-right' | 'bottom-right' | 'top-left' | 'top-full' | 'bottom-full';

interface NotificationToasterProps {
  notifications: React.ReactNode[];
  glowConfig: GlowConfig;
  position?: ToastPosition;
  style?: StyleConfig;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'top-full': 'top-4 left-4 right-4',
  'bottom-full': 'bottom-4 left-4 right-4',
};

export const NotificationToaster: React.FC<NotificationToasterProps> = ({
  notifications,
  glowConfig,
  position = 'top-right',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const isFullWidth = position === 'top-full' || position === 'bottom-full';
  return (
    <div className={`pointer-events-none absolute z-[999] flex flex-col gap-2 ${positionStyles[position]}`} style={{ ...glow, ...us }}>
      {notifications.map((n, i) => (
        <div
          key={i}
          className={`pointer-events-auto rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 shadow-2xl backdrop-blur-sm transition-all ${isFullWidth ? 'w-full' : ''}`}
          style={{ transform: `translateY(${i * 4}px)`, ...us }}
        >
          {n}
        </div>
      ))}
    </div>
  );
};
