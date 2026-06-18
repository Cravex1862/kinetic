import React from 'react';
import { interpolate, Easing, useCurrentFrame } from 'remotion';
import { useFrame } from '../primitives/useFrame';
import type { NarrationChunk } from './narration';

interface CaptionOverlayProps {
  chunks: NarrationChunk[];
  frame?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  position?: 'bottom' | 'top';
  style?: React.CSSProperties;
}

export function CaptionOverlay({
  chunks,
  frame,
  fadeInFrames = 8,
  fadeOutFrames = 8,
  position = 'bottom',
  style,
}: CaptionOverlayProps) {
  const currentFrame = useFrame(frame);

  const activeChunk = chunks.find(
    (chunk) => chunk.startFrame <= currentFrame && currentFrame < chunk.endFrame,
  );

  if (!activeChunk) return null;

  const local = currentFrame - activeChunk.startFrame;
  let opacity: number;

  if (local < fadeInFrames) {
    opacity = interpolate(local, [0, fadeInFrames], [0, 1], {
      easing: Easing.out(Easing.ease),
      extrapolateRight: 'clamp',
    });
  } else if (local > activeChunk.duration - fadeOutFrames) {
    opacity = Math.max(
      0,
      (activeChunk.duration - local) / fadeOutFrames,
    );
  } else {
    opacity = 1;
  }

  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50,
        bottom: position === 'bottom' ? '60px' : 'auto',
        top: position === 'top' ? '60px' : 'auto',
      }}
    >
      <p
        style={{ opacity }}
        className="text-center text-white text-lg font-medium drop-shadow-lg px-8 py-3 rounded-lg bg-black/40 backdrop-blur-sm max-w-3xl"
      >
        {activeChunk.text}
      </p>
    </div>
  );
}
