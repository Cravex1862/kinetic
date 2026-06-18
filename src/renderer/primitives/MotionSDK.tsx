import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { StyleConfig, configToStyle } from './types';

// ─── Cursor ──────────────────────────────────────────────────
interface CursorProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  clickFrame?: number;
  duration?: number;
  controlPointOffset?: number;
  longPressFrames?: number;
  cursorColor?: string;
  cursorSize?: number;
  style?: StyleConfig;
}

export const Cursor: React.FC<CursorProps> = ({
  startX,
  startY,
  endX,
  endY,
  clickFrame,
  duration = 30,
  controlPointOffset = 120,
  longPressFrames,
  cursorColor = 'white',
  cursorSize = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.out(Easing.bezier(0.42, 0, 0.58, 1))(progress);

  const cp1x = startX + controlPointOffset;
  const cp1y = startY;
  const cp2x = endX - controlPointOffset;
  const cp2y = endY;

  const t = eased;
  const u = 1 - t;
  const x = u * u * u * startX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * endX;
  const y = u * u * u * startY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * endY;

  let clickScale = 1;
  const isClickActive = clickFrame !== undefined && frame >= clickFrame;

  if (isClickActive) {
    const clickDuration = longPressFrames !== undefined ? longPressFrames : 10;
    const clickProgress = frame - clickFrame;
    const clickEnd = Math.min(clickDuration, 10);
    clickScale = interpolate(
      Math.min(clickProgress, clickEnd),
      [0, 3, clickEnd],
      [1, 0.3, 1],
      { extrapolateRight: 'clamp' },
    );
  }

  const isLongPress = longPressFrames !== undefined && isClickActive && frame - clickFrame >= longPressFrames;

  return (
    <div
      className="pointer-events-none absolute z-[999]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) scale(${clickScale})`,
        willChange: 'transform, left, top',
        ...us,
      }}
    >
      <svg width={cursorSize} height={cursorSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 14L12 15L9 21L5 3Z"
          fill={isLongPress ? '#fbbf24' : cursorColor}
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ─── SmoothScroll ────────────────────────────────────────────
interface SmoothScrollProps {
  children: React.ReactNode;
  scrollDistance: number;
  duration?: number;
  scrollDirection?: 'vertical' | 'horizontal';
  style?: StyleConfig;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({
  children,
  scrollDistance,
  duration = 60,
  scrollDirection = 'vertical',
  style,
}) => {
  const frame = useCurrentFrame();
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

// ─── FocusZoom ───────────────────────────────────────────────
interface FocusZoomProps {
  children: React.ReactNode;
  zoomScale?: number;
  duration?: number;
  originX?: number;
  originY?: number;
  style?: StyleConfig;
}

export const FocusZoom: React.FC<FocusZoomProps> = ({
  children,
  zoomScale = 1.5,
  duration = 40,
  originX = 50,
  originY = 50,
  style,
}) => {
  const frame = useCurrentFrame();
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

// ─── TextTyper ───────────────────────────────────────────────
interface TextTyperProps {
  text: string;
  charsPerFrame?: number;
  showCursor?: boolean;
  cursorBlinkCycle?: number;
  textColor?: string;
  fontSize?: number;
  style?: StyleConfig;
}

export const TextTyper: React.FC<TextTyperProps> = ({
  text,
  charsPerFrame = 1,
  showCursor = true,
  cursorBlinkCycle = 30,
  textColor,
  fontSize,
  style,
}) => {
  const frame = useCurrentFrame();
  const speed = style?.speed ?? 1;
  const adjustedChars = charsPerFrame * speed;
  const charsToShow = Math.min(Math.floor(frame * adjustedChars), text.length);
  const displayed = text.slice(0, charsToShow);
  const us = configToStyle(style);

  const cursorVisible = showCursor && frame % cursorBlinkCycle < cursorBlinkCycle / 2;

  const colorStyle: React.CSSProperties = textColor ? { color: textColor } : {};
  const sizeStyle: React.CSSProperties = fontSize ? { fontSize } : {};
  return (
    <span className="font-mono" style={{ ...colorStyle, ...sizeStyle, ...us }}>
      {displayed}
      {showCursor && charsToShow < text.length && (
        <span className="inline-block w-[2px] bg-current align-text-bottom" style={{ opacity: cursorVisible ? 1 : 0 }}>
          &nbsp;
        </span>
      )}
    </span>
  );
};

// ─── ChartAnimate ────────────────────────────────────────────
interface ChartAnimateProps {
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
  const internalFrame = useCurrentFrame();
  const f = frame ?? internalFrame;
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

// ─── DragAndDrop ─────────────────────────────────────────────
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
}) => {
  const frame = useCurrentFrame();
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

// ─── TypingGhostCursor ────────────────────────────────────────
interface TypingGhostCursorProps {
  isActive: boolean;
  blinkRate?: number;
  frame?: number;
  cursorColor?: string;
  style?: StyleConfig;
}

function cursorStyle(cursorColor?: string): React.CSSProperties {
  return { width: 2, height: '1em', backgroundColor: cursorColor ?? 'currentColor' };
}

function TypingGhostCursorInner({ isActive, blinkRate = 30, cursorColor, style }: TypingGhostCursorProps) {
  const frame = useCurrentFrame();
  const visible = isActive && frame % blinkRate < blinkRate / 2;
  if (!visible) return null;
  return <span className="inline-block align-text-bottom" style={{ ...cursorStyle(cursorColor), ...configToStyle(style) }}>&nbsp;</span>;
}

export const TypingGhostCursor: React.FC<TypingGhostCursorProps> = (props) => {
  if (props.frame !== undefined) {
    const { isActive, blinkRate = 30, frame, cursorColor, style } = props;
    const visible = isActive && frame % blinkRate < blinkRate / 2;
    if (!visible) return null;
    return <span className="inline-block align-text-bottom" style={{ ...cursorStyle(cursorColor), ...configToStyle(style) }}>&nbsp;</span>;
  }
  return <TypingGhostCursorInner {...props} />;
};

// ─── MarqueeTrack ─────────────────────────────────────────────
interface MarqueeTrackProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speedMultiplier?: number;
  gap?: number;
  frame?: number;
  style?: StyleConfig;
}

function MarqueeTrackInner(props: MarqueeTrackProps) {
  const frame = useCurrentFrame();
  return <MarqueeTrackStatic {...props} frame={frame} />;
}

function MarqueeTrackStatic({ children, direction = 'left', speedMultiplier = 1, gap = 8, frame }: MarqueeTrackProps & { frame: number }) {
  const speed = speedMultiplier;
  const offset = (frame * speed * 2) % 400;
  const x = direction === 'left' ? -offset : offset;

  return (
    <div className="overflow-hidden">
      <div className="flex" style={{ gap: `${gap}px`, transform: `translateX(${x}px)`, willChange: 'transform' }}>
        {children}
        {children}
      </div>
    </div>
  );
}

export const MarqueeTrack: React.FC<MarqueeTrackProps> = (props) => {
  if (props.frame !== undefined) return <MarqueeTrackStatic {...props} frame={props.frame} />;
  return <MarqueeTrackInner {...props} />;
};

// ─── ProgressRing ─────────────────────────────────────────────
interface ProgressRingProps {
  strokeWidth?: number;
  color?: string;
  targetPercentage: number;
  size?: number;
  duration?: number;
  backgroundColor?: string;
  frame?: number;
  style?: StyleConfig;
}

function ProgressRingInner(props: ProgressRingProps) {
  const frame = useCurrentFrame();
  return <ProgressRingStatic {...props} frame={frame} />;
}

function ProgressRingStatic({ strokeWidth = 8, color = '#6366f1', targetPercentage, size = 80, duration = 30, backgroundColor = '#374151', frame }: ProgressRingProps & { frame: number }) {
  const progress = Math.min(frame / duration, 1);
  const eased = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(progress);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (targetPercentage / 100) * eased);

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={backgroundColor} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ willChange: 'stroke-dashoffset' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.2} fontWeight="bold">
        {Math.round(targetPercentage * eased)}%
      </text>
    </svg>
  );
}

export const ProgressRing: React.FC<ProgressRingProps> = (props) => {
  if (props.frame !== undefined) return <ProgressRingStatic {...props} frame={props.frame} />;
  return <ProgressRingInner {...props} />;
};
