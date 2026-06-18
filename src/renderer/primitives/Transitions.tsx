import React from 'react';
import { interpolate, Easing } from 'remotion';
import { useFrame } from './useFrame';

interface WhipPanProps {
  children: React.ReactNode;
  frame?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
}

export function WhipPan({
  children,
  frame,
  duration = 24,
  direction = 'left',
  distance = 500,
}: WhipPanProps) {
  const currentFrame = useFrame(frame);
  const elapsed = currentFrame;
  const progress = Math.min(elapsed / duration, 1);
  const eased = Easing.inOut(Easing.ease)(progress);

  const isHorizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'right' || direction === 'down' ? -1 : 1;
  const offset = interpolate(eased, [0, 1], [0, sign * distance], { extrapolateRight: 'clamp' });
  const blur = interpolate(progress, [0, 0.5, 1], [0, 8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const transform = isHorizontal
    ? `translateX(${offset}px)`
    : `translateY(${offset}px)`;

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <div style={{ transform, filter: `blur(${blur}px)`, willChange: 'transform, filter' }}>
        {children}
      </div>
    </div>
  );
}

interface CrossfadeProps {
  children: React.ReactNode;
  frame?: number;
  duration?: number;
  direction?: 'in' | 'out';
}

export function Crossfade({
  children,
  frame,
  duration = 30,
  direction = 'in',
}: CrossfadeProps) {
  const currentFrame = useFrame(frame);
  const elapsed = currentFrame;
  const progress = Math.min(elapsed / duration, 1);
  const eased = Easing.out(Easing.ease)(progress);

  const opacity = direction === 'in' ? eased : 1 - eased;

  return (
    <div style={{ width: '100%', height: '100%', opacity }}>
      {children}
    </div>
  );
}
