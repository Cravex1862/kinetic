import React from 'react';
import { GlowConfig, StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface ProfileHeaderCardProps extends BaseMotionProps {
  glowConfig: GlowConfig;
  avatarUrl?: string;
  avatarInitials?: string;
  name: string;
  handle: string;
  metadata?: React.ReactNode;
  badgeText?: string;
  style?: StyleConfig;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  glowConfig,
  avatarUrl,
  avatarInitials,
  name,
  handle,
  metadata,
  badgeText,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const resolvedMetadata = metadata ?? (badgeText ? <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{badgeText}</span> : undefined);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-900 p-4" style={{ ...glow, ...us }}>
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {avatarInitials ?? name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate" style={us}>{name}</div>
        <div className="text-xs text-gray-400 truncate" style={us}>{handle}</div>
      </div>
      {resolvedMetadata && <div className="flex-shrink-0" style={us}>{resolvedMetadata}</div>}
    </div>
  );
};
