import React from 'react';
import { StyleConfig, configToStyle } from '../types';
import { useFrame } from '../useFrame';

interface TextTyperProps {
  text: string;
  charsPerFrame?: number;
  showCursor?: boolean;
  cursorBlinkCycle?: number;
  textColor?: string;
  fontSize?: number;
  style?: StyleConfig;
  frame?: number;
}

export const TextTyper: React.FC<TextTyperProps> = ({
  text,
  charsPerFrame = 1,
  showCursor = true,
  cursorBlinkCycle = 30,
  textColor,
  fontSize,
  style,
  frame: propFrame,
}) => {
  const frame = useFrame(propFrame);
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
