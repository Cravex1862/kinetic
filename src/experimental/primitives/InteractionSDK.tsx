import React, { useRef } from 'react';
import { interpolate, interpolateColors, spring, Easing, useCurrentFrame } from 'remotion';
import { useFrame } from './useFrame';
import { configToStyle, type StyleConfig } from './types';

interface CursorClickProps {
  clickX: number;
  clickY: number;
  radius?: number;
  pulseColor?: string;
  showHand?: boolean;
  handSize?: number;
  frame?: number;
  startFrame?: number;
  style?: StyleConfig;
}

export function CursorClick({
  clickX,
  clickY,
  radius = 20,
  pulseColor = 'rgba(255, 255, 255, 0.8)',
  showHand = true,
  handSize = 24,
  frame,
  startFrame = 0,
  style,
}: CursorClickProps) {
  const currentFrame = useFrame(frame);
  const elapsed = Math.max(0, currentFrame - startFrame);
  const duration = 20;

  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutSize, setLayoutSize] = React.useState({ w: 1024, h: 576 });

  React.useLayoutEffect(() => {
    const canvasEl = containerRef.current?.closest('.relative') || containerRef.current?.parentElement;
    if (!canvasEl) return;
    setLayoutSize({
      w: canvasEl.clientWidth || 1024,
      h: canvasEl.clientHeight || 576,
    });
  }, []);

  const ratio = layoutSize.w / layoutSize.h;
  let designW = 1920;
  let designH = 1080;
  if (Math.abs(ratio - 9 / 16) < 0.1) {
    designW = 1080;
    designH = 1920;
  } else if (Math.abs(ratio - 1.0) < 0.1) {
    designW = 1080;
    designH = 1080;
  }

  const layoutX = clickX * (layoutSize.w / designW);
  const layoutY = clickY * (layoutSize.h / designH);

  const pulseProgress = Math.min(elapsed / duration, 1);
  const eased = Easing.out(Easing.ease)(pulseProgress);

  const pulseRadius = interpolate(pulseProgress, [0, 1], [0, radius * 2.5], {
    extrapolateRight: 'clamp',
  });

  const pulseOpacity = interpolate(pulseProgress, [0, 1], [0.8, 0], {
    extrapolateRight: 'clamp',
  });

  const handElapsed = Math.max(0, currentFrame - startFrame);
  const handOpacity = handElapsed >= 5 ? 1 : interpolate(handElapsed, [0, 5], [0, 1], { extrapolateRight: 'clamp' });

  const us = configToStyle(style);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...us,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <circle
          cx={layoutX}
          cy={layoutY}
          r={pulseRadius}
          fill="none"
          stroke={pulseColor}
          strokeWidth={3}
          opacity={pulseOpacity}
        />

        {showHand && handElapsed >= 5 && (
          <g transform={`translate(${layoutX}, ${layoutY})`} opacity={handOpacity}>
            <path
              d="M5 3L19 14L12 15L9 21L5 3Z"
              fill={pulseColor}
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeLinejoin="round"
              transform={`translate(-${handSize / 2}, -${handSize / 2}) scale(${handSize / 24})`}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── ScrollReveal ─────────────────────────────────────────────
interface ScrollRevealProps {
  children: React.ReactNode;
  scrollDistance: number;
  direction?: 'down' | 'up';
  frame?: number;
  startFrame?: number;
  duration?: number;
  style?: StyleConfig;
  className?: string;
  containerHeight?: number;
}

export function ScrollReveal({
  children,
  scrollDistance,
  direction = 'down',
  frame,
  startFrame = 0,
  duration = 30,
  style,
  className = '',
  containerHeight = 300,
}: ScrollRevealProps) {
  const currentFrame = useFrame(frame);
  const elapsed = Math.max(0, currentFrame - startFrame);
  const progress = Math.min(elapsed / duration, 1);
  const eased = Easing.out(Easing.ease)(progress);
  const scroll = interpolate(eased, [0, 1], [0, scrollDistance], { extrapolateRight: 'clamp' });
  const us = configToStyle(style);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: `${containerHeight}px`, ...us }}
    >
      <div
        style={{
          transform: `translateY(${direction === 'down' ? -scroll : scroll}px)`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── MetricCounter ─────────────────────────────────────────────
interface MetricCounterProps {
  from: number;
  to: number;
  duration?: number;
  frame?: number;
  startFrame?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  easing?: 'ease-in-out' | 'ease-out' | 'ease-in' | 'linear';
  style?: StyleConfig;
}

export function MetricCounter({
  from,
  to,
  duration = 30,
  frame,
  startFrame = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  easing = 'ease-out',
  style,
}: MetricCounterProps) {
  const currentFrame = useFrame(frame);
  const elapsed = Math.max(0, currentFrame - startFrame);
  const progress = Math.min(elapsed / duration, 1);

  const easingMap: Record<string, (t: number) => number> = {
    'ease-in-out': Easing.inOut(Easing.ease),
    'ease-out': Easing.out(Easing.ease),
    'ease-in': Easing.in(Easing.ease),
    linear: (t) => t,
  };
  const eased = easingMap[easing](progress);
  const value = interpolate(eased, [0, 1], [from, to], { extrapolateRight: 'clamp' });
  const us = configToStyle(style);

  return (
    <span className="font-mono tabular-nums" style={us}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── ToggleAnimate ──────────────────────────────────────────────
interface ToggleAnimateProps {
  toggled: boolean;
  frame?: number;
  startFrame?: number;
  switchDuration?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleConfig;
}

const toggleSizes: Record<string, { width: number; height: number; knob: number }> = {
  sm: { width: 36, height: 20, knob: 16 },
  md: { width: 48, height: 26, knob: 22 },
  lg: { width: 64, height: 34, knob: 28 },
};

export function ToggleAnimate({
  toggled,
  frame,
  startFrame = 0,
  switchDuration = 20,
  label,
  size = 'md',
  style,
}: ToggleAnimateProps) {
  const currentFrame = useFrame(frame);
  const elapsed = Math.max(0, currentFrame - startFrame);
  const progress = Math.min(elapsed / switchDuration, 1);
  const dims = toggleSizes[size];
  const knobX = interpolate(progress, [0, 1], [2, dims.width - dims.knob - 2], { extrapolateRight: 'clamp' });
  const knobColor = interpolateColors(progress, [0, 0.5, 1], toggled ? ['#374151', '#6366f1', '#6366f1'] : ['#6366f1', '#374151', '#374151']);
  const us = configToStyle(style);

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none" style={us}>
      <div
        className="relative rounded-full transition-colors"
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          backgroundColor: knobColor,
        }}
      >
        <div
          className="absolute top-0.5 rounded-full bg-white shadow"
          style={{
            width: `${dims.knob}px`,
            height: `${dims.knob}px`,
            left: `${knobX}px`,
            transition: 'box-shadow 0.1s',
          }}
        />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}

// ─── MenuExpand ─────────────────────────────────────────────────
interface MenuExpandProps {
  children: React.ReactNode;
  expanded: boolean;
  frame?: number;
  startFrame?: number;
  duration?: number;
  maxHeight?: number;
  style?: StyleConfig;
}

export function MenuExpand({
  children,
  expanded,
  frame,
  startFrame = 0,
  duration = 20,
  maxHeight = 300,
  style,
}: MenuExpandProps) {
  const currentFrame = useFrame(frame);
  const elapsed = Math.max(0, currentFrame - startFrame);
  const progress = Math.min(elapsed / duration, 1);
  const eased = Easing.inOut(Easing.ease)(progress);
  const target = expanded ? 1 : 0;
  const openProgress = Math.abs(target - (1 - progress));
  const height = interpolate(eased, [0, 1], expanded ? [0, maxHeight] : [maxHeight, 0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(eased, [0, 1], expanded ? [0, 1] : [1, 0], { extrapolateRight: 'clamp' });
  const us = configToStyle(style);

  return (
    <div
      className="overflow-hidden"
      style={{
        height: `${height}px`,
        opacity,
        transition: 'none',
        ...us,
      }}
    >
      {children}
    </div>
  );
}
