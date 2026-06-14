import React from 'react';

export type GlowConfig = {
  enabled: boolean;
  color: string;
  intensity: number;
  spread: number;
};

export type StyleConfig = {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | number;
  rotation?: number;
  speed?: number;
};

export function configToStyle(cfg?: StyleConfig): React.CSSProperties {
  if (!cfg) return {};
  const s: React.CSSProperties = {};
  if (cfg.color) s.color = cfg.color;
  if (cfg.backgroundColor) s.backgroundColor = cfg.backgroundColor;
  if (cfg.fontSize) s.fontSize = cfg.fontSize;
  if (cfg.fontFamily) s.fontFamily = cfg.fontFamily;
  if (cfg.fontWeight) s.fontWeight = cfg.fontWeight;
  if (cfg.rotation) {
    s.transform = `rotate(${cfg.rotation}deg)`;
  }
  return s;
}
