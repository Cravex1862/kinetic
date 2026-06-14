import React, { useRef } from 'react';
import { useCurrentFrame, spring, interpolate, Easing, Sequence } from 'remotion';
import { StyleConfig, configToStyle } from './types';

// ─── SpringEnter ─────────────────────────────────────────────
interface SpringEnterProps {
  children: React.ReactNode;
  delay?: number;
  mass?: number;
  damping?: number;
  stiffness?: number;
  overshootClamping?: boolean;
  style?: StyleConfig;
}

export const SpringEnter: React.FC<SpringEnterProps> = ({
  children,
  delay = 0,
  mass = 0.5,
  damping = 12,
  stiffness = 100,
  overshootClamping = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const adjustedFrame = Math.floor(frame * speed);
  const springValue = spring({
    frame: Math.max(0, adjustedFrame - delay),
    fps: 30,
    config: { mass, damping, stiffness, overshootClamping },
  });
  const us = configToStyle(style);

  return (
    <div
      style={{
        opacity: springValue,
        transform: `scale(${0.8 + 0.2 * springValue}) translateY(${(1 - springValue) * 30}px)`,
        willChange: 'transform, opacity',
        ...us,
      }}
    >
      {children}
    </div>
  );
};

// ─── StaggerContainer ────────────────────────────────────────
interface StaggerContainerProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  mass?: number;
  damping?: number;
  style?: StyleConfig;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 5,
  mass = 0.5,
  damping = 14,
  style,
}) => {
  const speed = style?.speed ?? 1;
  const adjustedDelay = Math.floor(staggerDelay / speed);
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <Sequence from={index * adjustedDelay}>
          <SpringEnter delay={0} mass={mass} damping={damping} style={style}>
            {child}
          </SpringEnter>
        </Sequence>
      ))}
    </>
  );
};

// ─── FadeBlur ────────────────────────────────────────────────
interface FadeBlurProps {
  children: React.ReactNode;
  duration?: number;
  startBlur?: number;
  style?: StyleConfig;
}

export const FadeBlur: React.FC<FadeBlurProps> = ({
  children,
  duration = 30,
  startBlur = 10,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const opacity = interpolate(progress, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const blur = interpolate(progress, [0, 1], [startBlur, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ opacity, filter: `blur(${blur}px)`, willChange: 'opacity, filter', ...us }}>
      {children}
    </div>
  );
};

// ─── SlideInOut ──────────────────────────────────────────────
type Direction = 'left' | 'right' | 'top' | 'bottom';

interface SlideInOutProps {
  children: React.ReactNode;
  direction?: Direction;
  distance?: number;
  duration?: number;
  fade?: boolean;
  style?: StyleConfig;
}

const entryOffsets: Record<Direction, (dist: number) => { x: number; y: number }> = {
  left: (d) => ({ x: -d, y: 0 }),
  right: (d) => ({ x: d, y: 0 }),
  top: (d) => ({ x: 0, y: -d }),
  bottom: (d) => ({ x: 0, y: d }),
};

export const SlideInOut: React.FC<SlideInOutProps> = ({
  children,
  direction = 'left',
  distance = 500,
  duration = 30,
  fade = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.out(Easing.bezier(0.16, 1, 0.3, 1))(progress);
  const offset = entryOffsets[direction](distance);
  const x = interpolate(eased, [0, 1], [offset.x, 0], { extrapolateRight: 'clamp' });
  const y = interpolate(eased, [0, 1], [offset.y, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ opacity: fade ? eased : 1, transform: `translateX(${x}px) translateY(${y}px)`, willChange: 'transform, opacity', ...us }}>
      {children}
    </div>
  );
};

// ─── CardReveal ──────────────────────────────────────────────
interface CardRevealProps {
  children: React.ReactNode;
  duration?: number;
  style?: StyleConfig;
}

export const CardReveal: React.FC<CardRevealProps> = ({
  children,
  duration = 30,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1))(progress);
  const inset = `${(1 - eased) * 50}%`;

  return (
    <div style={{ clipPath: `inset(${inset} ${inset} ${inset} ${inset})`, willChange: 'clip-path', ...us }}>
      {children}
    </div>
  );
};

// ─── PulseScale ──────────────────────────────────────────────
interface PulseScaleProps {
  children: React.ReactNode;
  cycleFrames?: number;
  minScale?: number;
  maxScale?: number;
  style?: StyleConfig;
}

export const PulseScale: React.FC<PulseScaleProps> = ({
  children,
  cycleFrames = 60,
  minScale = 0.95,
  maxScale = 1.05,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const effectiveCycle = Math.floor(cycleFrames / speed);
  const cycle = frame % effectiveCycle;
  const us = configToStyle(style);

  const scale = interpolate(
    cycle,
    [0, effectiveCycle * 0.25, effectiveCycle * 0.75, effectiveCycle],
    [1, maxScale, minScale, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{ transform: `scale(${scale})`, willChange: 'transform', ...us }}>
      {children}
    </div>
  );
};

// ─── AccordionExpand ──────────────────────────────────────────
interface AccordionExpandProps {
  children: React.ReactNode;
  expanded: boolean;
  duration?: number;
  frame?: number;
  style?: StyleConfig;
}

function AccordionExpandInner(props: AccordionExpandProps) {
  const frame = useCurrentFrame();
  return <AccordionExpandStatic {...props} frame={frame} />;
}

function AccordionExpandStatic({ children, expanded, duration = 30, frame }: Required<AccordionExpandProps> & { frame: number }) {
  const hasToggled = useRef(false);
  const startRef = useRef(frame);
  const startExpandedRef = useRef(expanded);

  if (expanded !== startExpandedRef.current) {
    startRef.current = frame;
    startExpandedRef.current = expanded;
    hasToggled.current = true;
  }

  const effectiveDur = Math.floor(duration);

  if (!hasToggled.current) {
    return (
      <div style={{ maxHeight: expanded ? '500px' : '0px', overflow: 'hidden', willChange: 'max-height' }}>
        <div>{children}</div>
      </div>
    );
  }

  const elapsed = Math.max(0, frame - startRef.current);
  const t = Math.min(elapsed / effectiveDur, 1);
  const raw = expanded ? t : 1 - t;
  const eased = interpolate(raw, [0, 1], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        maxHeight: `${eased * 500}px`,
        overflow: 'hidden',
        willChange: 'max-height',
      }}
    >
      <div>{children}</div>
    </div>
  );
}

export const AccordionExpand: React.FC<AccordionExpandProps> = (props) => {
  if (props.frame !== undefined) return <AccordionExpandStatic {...props} frame={props.frame} />;
  return <AccordionExpandInner {...props} />;
};

// ─── RotateFlip ───────────────────────────────────────────────
type FlipAxis = 'X' | 'Y';

interface RotateFlipProps {
  children: React.ReactNode;
  axis?: FlipAxis;
  startFrame?: number;
  endFrame?: number;
  frame?: number;
  style?: StyleConfig;
}

function RotateFlipInner(props: RotateFlipProps) {
  const frame = useCurrentFrame();
  return <RotateFlipStatic {...props} frame={frame} />;
}

function RotateFlipStatic({ children, axis = 'Y', startFrame = 0, endFrame = 30, frame }: Required<RotateFlipProps> & { frame: number }) {
  const effectiveEnd = endFrame - startFrame;
  const adjusted = Math.max(0, frame - startFrame);
  const progress = Math.min(adjusted / Math.max(effectiveEnd, 1), 1);

  const angle = interpolate(progress, [0, 1], [0, 180], { extrapolateRight: 'clamp' });
  const rotateProp = axis === 'X' ? 'rotateX' : 'rotateY';

  return (
    <div style={{ perspective: '800px' }}>
      <div
        style={{
          transform: `${rotateProp}(${angle}deg)`,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const RotateFlip: React.FC<RotateFlipProps> = (props) => {
  if (props.frame !== undefined) return <RotateFlipStatic {...props} frame={props.frame} />;
  return <RotateFlipInner {...props} />;
};

// ─── GlitchIntro ──────────────────────────────────────────────
interface GlitchIntroProps {
  children: React.ReactNode;
  duration?: number;
  frame?: number;
  style?: StyleConfig;
}

function GlitchIntroInner(props: GlitchIntroProps) {
  const frame = useCurrentFrame();
  return <GlitchIntroStatic {...props} frame={frame} />;
}

function GlitchIntroStatic({ children, duration = 5, frame }: Required<GlitchIntroProps> & { frame: number }) {
  if (frame >= duration) return <>{children}</>;

  const offsetX = interpolate(frame, [0, 1, 2, 3, 4], [0, -3, 4, -2, 0], { extrapolateRight: 'clamp' });
  const offsetY = interpolate(frame, [0, 1, 2, 3, 4], [0, 2, -3, 1, 0], { extrapolateRight: 'clamp' });
  const redOffset = interpolate(frame, [0, 1, 2, 3, 4], [0, 4, -4, 2, 0], { extrapolateRight: 'clamp' });
  const blueOffset = interpolate(frame, [0, 1, 2, 3, 4], [0, -4, 3, -2, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, transform: `translate(${offsetX}px, ${offsetY}px)` }}>
        {children}
      </div>
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.4, transform: `translate(${redOffset}px, 0px)`, color: '#ff0000', mixBlendMode: 'screen' }}>
        {children}
      </div>
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.4, transform: `translate(${blueOffset}px, 0px)`, color: '#0066ff', mixBlendMode: 'screen' }}>
        {children}
      </div>
    </div>
  );
}

export const GlitchIntro: React.FC<GlitchIntroProps> = (props) => {
  if (props.frame !== undefined) return <GlitchIntroStatic {...props} frame={props.frame} />;
  return <GlitchIntroInner {...props} />;
};
