import React from 'react';
import { useCurrentFrame } from 'remotion';
import { StyleConfig, configToStyle, BaseMotionProps } from '../types';

interface TypingGhostCursorProps extends BaseMotionProps {
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
