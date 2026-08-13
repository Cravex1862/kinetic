import React from 'react';
import { useVideoConfig, delayRender, continueRender, interpolate } from 'remotion';
import { StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { useFrame } from '../useFrame';
import { Easing } from 'remotion';

interface CursorProps extends BaseMotionProps {
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  targetId?: string;
  clickFrame?: number;
  duration?: number;
  controlPointOffset?: number;
  longPressFrames?: number;
  cursorColor?: string;
  cursorSize?: number;
  style?: StyleConfig;
  frame?: number;
}

export const Cursor: React.FC<CursorProps> = ({
  startX,
  startY,
  endX,
  endY,
  targetId,
  clickFrame,
  duration = 30,
  controlPointOffset = 120,
  longPressFrames,
  cursorColor = 'white',
  cursorSize = 48,
  style,
  frame: propFrame,
}) => {
  const frame = useFrame(propFrame);
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const [resolvedEnd, setResolvedEnd] = React.useState<{ x: number; y: number } | null>(null);

  // 1. Math-based resolution of canvas design size and scale factors (Synchronous & Headless-safe)
  let videoWidth = 1024;
  let videoHeight = 576;
  try {
    const config = useVideoConfig();
    videoWidth = config.width;
    videoHeight = config.height;
  } catch (e) {
    // Fallback when rendered outside Remotion player (e.g. Studio UI)
    videoWidth = 1024;
    videoHeight = 576;
  }

  const ratio = videoWidth / videoHeight;

  let designW = 1920;
  let designH = 1080;
 

  const scaleX = videoWidth / designW;
  const scaleY = videoHeight / designH;

  // 2. Headless-safe DOM measurements (using delayRender to block until coordinates resolve)
  React.useLayoutEffect(() => {
    if (!targetId) return;

    const handle = delayRender(`resolving cursor target coordinates: ${targetId}`);
    
    // Give browser one frame to fully compute CSS flexbox / page layouts
    requestAnimationFrame(() => {
      try {
        const canvasEl = cursorRef.current?.closest('.relative') || cursorRef.current?.parentElement;
        if (!canvasEl) {
          continueRender(handle);
          return;
        }

        const canvasRect = canvasEl.getBoundingClientRect();
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const actualEl = targetEl.firstElementChild || targetEl;
          const targetRect = actualEl.getBoundingClientRect();

          if (targetRect.width > 0 && targetRect.height > 0) {
            // Calculate actual physical scaling of the preview window
            const actualScaleX = canvasRect.width / designW;
            const actualScaleY = canvasRect.height / designH;

            setResolvedEnd({
              x: (targetRect.left - canvasRect.left + targetRect.width / 2) / (actualScaleX || 1),
              y: (targetRect.top - canvasRect.top + targetRect.height / 2) / (actualScaleY || 1),
            });
          }
        }
      } catch (err) {
        console.error("Failed to measure cursor target positioning:", err);
      } finally {
        continueRender(handle);
      }
    });
  }, [targetId]);

  const finalEndX = resolvedEnd ? resolvedEnd.x : (endX !== undefined ? endX : startX);
  const finalEndY = resolvedEnd ? resolvedEnd.y : (endY !== undefined ? endY : startY);

  const speed = style?.speed ?? 1;
  const effectiveDur = Math.floor(duration / speed);
  const progress = Math.min(frame / effectiveDur, 1);
  const us = configToStyle(style);

  const eased = Easing.out(Easing.bezier(0.42, 0, 0.58, 1))(progress);

  const cp1x = startX + controlPointOffset;
  const cp1y = startY;
  const cp2x = finalEndX - controlPointOffset;
  const cp2y = finalEndY;

  const t = eased;
  const u = 1 - t;
  const x = u * u * u * startX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * finalEndX;
  const y = u * u * u * startY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * finalEndY;

  const layoutX = x * (videoWidth / designW);
  const layoutY = y * (videoHeight / designH);

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

  // 3. Automatic Target Element Click Reaction Effect
  React.useLayoutEffect(() => {
    if (!targetId || clickFrame === undefined) return;

    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const actualEl = (targetEl.firstElementChild || targetEl) as HTMLElement;
    if (!actualEl) return;

    const clickDuration = longPressFrames !== undefined ? longPressFrames : 10;
    const clickProgress = frame - clickFrame;
    const clickEnd = Math.min(clickDuration, 10);

    if (frame >= clickFrame && clickProgress <= clickEnd + 2) {
      const targetScale = interpolate(
        Math.min(Math.max(0, clickProgress), clickEnd),
        [0, 3, clickEnd],
        [1, 0.94, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
      );
      actualEl.style.transform = `scale(${targetScale})`;
      actualEl.style.transition = 'transform 0.05s ease-out';
      actualEl.style.filter = clickProgress <= 5 ? 'brightness(1.2)' : 'none';
    } else {
      actualEl.style.transform = '';
      actualEl.style.filter = '';
    }

    return () => {
      actualEl.style.transform = '';
      actualEl.style.filter = '';
    };
  }, [targetId, clickFrame, frame, longPressFrames]);

  const isLongPress = longPressFrames !== undefined && isClickActive && frame - clickFrame >= longPressFrames;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none absolute z-[999]"
      style={{
        left: `${layoutX}px`,
        top: `${layoutY}px`,
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
