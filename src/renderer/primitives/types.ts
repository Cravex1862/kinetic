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

export function buildGlowFilter(glow?: GlowConfig): React.CSSProperties {
  if (!glow || !glow.enabled) return {};
  return {
    boxShadow: `0 0 ${glow.spread}px ${glow.intensity}px ${glow.color}`,
  };
}

export function getTransform3DStyle(
  rotateX?: number,
  rotateY?: number,
  rotateZ?: number,
  perspective?: number,
  translateZ?: number,
  translateX?: number,
  translateY?: number
): React.CSSProperties {
  const transforms: string[] = [];

  if (perspective !== undefined && perspective > 0) {
    transforms.push(`perspective(${perspective}px)`);
  }
  if (translateX !== undefined && translateX !== 0) {
    transforms.push(`translateX(${translateX}px)`);
  }
  if (translateY !== undefined && translateY !== 0) {
    transforms.push(`translateY(${translateY}px)`);
  }
  if (translateZ !== undefined && translateZ !== 0) {
    transforms.push(`translateZ(${translateZ}px)`);
  }
  if (rotateX !== undefined && rotateX !== 0) {
    transforms.push(`rotateX(${rotateX}deg)`);
  }
  if (rotateY !== undefined && rotateY !== 0) {
    transforms.push(`rotateY(${rotateY}deg)`);
  }
  if (rotateZ !== undefined && rotateZ !== 0) {
    transforms.push(`rotateZ(${rotateZ}deg)`);
  }

  if (transforms.length === 0) return {};

  return {
    transform: transforms.join(' '),
    transformStyle: 'preserve-3d',
  };
}
