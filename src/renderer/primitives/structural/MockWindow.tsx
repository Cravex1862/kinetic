import React from 'react';
import { StyleConfig, configToStyle, GlowConfig, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface MockWindowProps extends BaseMotionProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  visible: boolean;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  windowStyle?: 'mac' | 'windows';
  style?: StyleConfig;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  translateZ?: number;
  translateX?: number;
  translateY?: number;
}

export const MockWindow: React.FC<MockWindowProps> = ({
  children,
  glowConfig,
  visible,
  top = 50,
  left = 50,
  width = 400,
  height = 300,
  windowStyle = 'mac',
  style,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  translateZ,
  translateX,
  translateY,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const transformParts = [];
  if (perspective !== undefined) transformParts.push(`perspective(${perspective}px)`);
  if (rotateX !== undefined) transformParts.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== undefined) transformParts.push(`rotateY(${rotateY}deg)`);
  if (rotateZ !== undefined) transformParts.push(`rotateZ(${rotateZ}deg)`);
  if (translateZ !== undefined) transformParts.push(`translateZ(${translateZ}px)`);

  const transformStyle: React.CSSProperties = transformParts.length > 0 ? {
    transform: transformParts.join(' '),
    transformStyle: 'preserve-3d',
  } : {};
  if (!visible) return null;
  return (
    <div
      className="absolute z-50 overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-2xl"
      style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px`, ...glow, ...us, ...transformStyle }}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-700 bg-gray-800 px-3 py-2" style={us}>
        {windowStyle === 'mac' ? (
          <><div className="h-2 w-2 rounded-full bg-red-500" /><div className="h-2 w-2 rounded-full bg-yellow-500" /><div className="h-2 w-2 rounded-full bg-green-500" /></>
        ) : (
          <div className="flex gap-1 ml-auto"><span className="text-[10px] text-gray-500">&#8212;</span><span className="text-[10px] text-gray-500">&#9744;</span><span className="text-[10px] text-gray-500">&#10005;</span></div>
        )}
      </div>
      <div className="p-4" style={us}>{children}</div>
    </div>
  );
};
