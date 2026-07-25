import React from 'react';
import { interpolate, Easing } from 'remotion';
import { StyleConfig, configToStyle } from '../types';
import { useFrame } from '../useFrame';

interface DragAndDropProps {
  children: React.ReactNode;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  duration?: number;
  liftHeight?: number;
  dropShadowColor?: string;
  style?: StyleConfig;
  frame?: number;
}

export const DragAndDrop: React.FC<DragAndDropProps> = ({
  children,
  startX = 0,
  startY = 0,
  endX = 200,
  endY = 200,
  duration = 40,
  liftHeight = 8,
  dropShadowColor = 'rgba(0, 0, 0, 0.4)',
  style,
  frame: propFrame,
}) => {
  const frame = useFrame(propFrame);
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.inOut(Easing.bezier(0.42, 0, 0.58, 1))(progress);

  const x = interpolate(eased, [0, 1], [startX, endX], { extrapolateRight: 'clamp' });
  const y = interpolate(eased, [0, 1], [startY, endY], { extrapolateRight: 'clamp' });

  const liftProgress = Math.min(frame / (effectiveDur * 0.3), 1);
  const lowerProgress = Math.max(0, Math.min((frame - effectiveDur * 0.7) / (effectiveDur * 0.3), 1));
  const shadowBlur = interpolate(liftProgress - lowerProgress, [0, 1], [4, liftHeight * 3], { extrapolateRight: 'clamp' });
  const translateZ = interpolate(liftProgress - lowerProgress, [0, 1], [0, -liftHeight * 2], { extrapolateRight: 'clamp' });

  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translateZ(${translateZ}px)`,
        filter: `drop-shadow(0 ${shadowBlur}px ${shadowBlur}px ${dropShadowColor})`,
        willChange: 'left, top, filter',
        ...us,
      }}
    >
      {children}
    </div>
  );
};
