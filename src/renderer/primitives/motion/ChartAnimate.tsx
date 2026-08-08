import React from 'react';
import { Easing } from 'remotion';
import { StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { useFrame } from '../useFrame';

interface ChartAnimateProps extends BaseMotionProps {
  children: React.ReactNode | ((progress: number, frame: number) => React.ReactNode);
  duration?: number;
  delay?: number;
  easingType?: 'outBack' | 'out' | 'inOut';
  style?: StyleConfig;
  frame?: number;
}

function easingFn(easingType: string, progress: number): number {
  if (easingType === 'out') return Easing.out(Easing.ease)(progress);
  if (easingType === 'inOut') return Easing.inOut(Easing.ease)(progress);
  return Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(progress);
}

function ChartAnimateInner({ children, duration = 30, delay = 0, easingType = 'outBack', style, frame }: ChartAnimateProps) {
  const f = useFrame(frame);
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const adjustedFrame = Math.max(0, f - delay);
  const progress = Math.min(adjustedFrame / effectiveDur, 1);
  const us = configToStyle(style);
  const eased = easingFn(easingType, progress);

  if (typeof children === 'function') {
    return <>{children(eased, f)}</>;
  }

  return (
    <div style={{ transform: `scaleY(${eased})`, transformOrigin: 'bottom center', willChange: 'transform', ...us }}>
      {children}
    </div>
  );
}

export const ChartAnimate: React.FC<ChartAnimateProps> = (props) => {
  if (props.frame !== undefined) {
    const speed = props.style?.speed ?? 1;
    const effectiveDur = Math.floor((props.duration ?? 30) / speed);
    const adjusted = Math.max(0, props.frame - (props.delay ?? 0));
    const progress = Math.min(adjusted / effectiveDur, 1);
    const eased = easingFn(props.easingType ?? 'outBack', progress);
    const us = configToStyle(props.style);
    if (typeof props.children === 'function') {
      return <>{props.children(eased, props.frame)}</>;
    }
    return (
      <div style={{ transform: `scaleY(${eased})`, transformOrigin: 'bottom center', willChange: 'transform', ...us }}>
        {props.children}
      </div>
    );
  }
  return <ChartAnimateInner {...props} />;
};
