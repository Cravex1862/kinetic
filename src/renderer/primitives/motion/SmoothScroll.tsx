import React from 'react';
import { interpolate, Easing } from 'remotion';
import { StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { useFrame } from '../useFrame';

interface SmoothScrollProps extends BaseMotionProps {
  children: React.ReactNode;
  scrollDistance: number;
  duration?: number;
  scrollDirection?: 'vertical' | 'horizontal';
  style?: StyleConfig;
  frame?: number;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({
  children,
  scrollDistance,
  duration = 60,
  scrollDirection = 'vertical',
  style,
  frame: propFrame,
}) => {
  const frame = useFrame(propFrame);
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.inOut(Easing.ease)(progress);
  const translate = interpolate(eased, [0, 1], [0, -scrollDistance], { extrapolateRight: 'clamp' });
  const transform = scrollDirection === 'vertical' ? `translateY(${translate}px)` : `translateX(${translate}px)`;

  return (
    <div style={{ transform, willChange: 'transform', ...us }}>
      {children}
    </div>
  );
};
