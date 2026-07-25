import React from 'react';
import { useCurrentFrame } from 'remotion';
import { StyleConfig, configToStyle } from '../types';

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
