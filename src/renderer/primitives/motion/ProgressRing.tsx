import React from 'react';
import { useCurrentFrame, Easing } from 'remotion';
import { StyleConfig } from '../types';

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
