import React from 'react';
import { GlowConfig, StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface PushNotificationToastProps extends BaseMotionProps {
  glowConfig: GlowConfig;
  icon: React.ReactNode;
  appName: string;
  title: string;
  body: string;
  time?: string;
  borderRadius?: number;
  style?: StyleConfig;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  glowConfig,
  icon,
  appName,
  title,
  body,
  time,
  borderRadius = 16,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{
        borderRadius: `${borderRadius}px`,
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        backgroundColor: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.06) inset',
        ...glow,
        ...us,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white" style={us}>{appName}</span>
          {time && <span className="text-[10px] text-gray-400" style={us}>{time}</span>}
        </div>
        <div className="text-sm font-medium text-white leading-tight mt-0.5" style={us}>{title}</div>
        <div className="text-xs text-gray-400 leading-tight mt-0.5 line-clamp-2" style={us}>{body}</div>
      </div>
    </div>
  );
};
