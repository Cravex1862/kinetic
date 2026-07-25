import React from 'react';
import { interpolate, Easing } from 'remotion';
import { StyleConfig, configToStyle } from '../types';
import { useFrame } from '../useFrame';

interface FocusZoomProps {
  children: React.ReactNode;
  zoomScale?: number;
  duration?: number;
  originX?: number;
  originY?: number;
  style?: StyleConfig;
  frame?: number;
}

export const FocusZoom: React.FC<FocusZoomProps> = ({
  children,
  zoomScale = 1.5,
  duration = 40,
  originX = 50,
  originY = 50,
  style,
  frame: propFrame,
}) => {
  const frame = useFrame(propFrame);
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.inOut(Easing.bezier(0.65, 0, 0.35, 1))(progress);
  const scale = interpolate(eased, [0, 1], [1, zoomScale], { extrapolateRight: 'clamp' });

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: `${originX}% ${originY}%`, willChange: 'transform', ...us }}>
      {children}
    </div>
  );
};
