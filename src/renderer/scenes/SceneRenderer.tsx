import React from 'react';
import type { SceneDefinition } from './types';
import { applyMorphProps } from '../primitives/MorphSDK';

interface SceneRendererProps {
  scene: SceneDefinition;
  localFrame: number;
  progress: number;
  schema: Record<string, { type: 'number' | 'color' | 'vec2' | 'boolean' | 'string' }>;
  sceneIndex?: number;
}

export function SceneRenderer({
  scene,
  localFrame,
  progress,
  schema,
  sceneIndex,
}: SceneRendererProps) {
  const resolved = applyMorphProps(scene.from, scene.to, schema, progress, scene.easing);

  const bgColor = String(resolved.color ?? resolved.backgroundColor ?? '#1e1b4b');
  const widthVal = resolved.width ?? resolved.size ?? 200;
  const heightVal = resolved.height ?? resolved.size ?? 200;
  const borderRadiusVal = resolved.borderRadius ?? resolved.radius ?? 16;
  const opacityVal = Number(resolved.opacity ?? 1);

  const x = resolved.x as number | undefined;
  const y = resolved.y as number | undefined;
  const scaleVal = resolved.scale as number | undefined;

  const transformParts: string[] = [];
  if (x !== undefined && y !== undefined) {
    transformParts.push(`translateX(${x}px) translateY(${y}px)`);
  }
  if (scaleVal !== undefined) {
    transformParts.push(`scale(${scaleVal})`);
  }

  const containerStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    width: typeof widthVal === 'number' ? `${widthVal}px` : String(widthVal),
    height: typeof heightVal === 'number' ? `${heightVal}px` : String(heightVal),
    borderRadius: typeof borderRadiusVal === 'number' ? `${borderRadiusVal}px` : String(borderRadiusVal),
    opacity: opacityVal,
    ...(transformParts.length > 0 ? { transform: transformParts.join(' ') } : {}),
  };

  const entries = Object.entries(resolved).slice(0, 5);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center text-white font-mono text-sm border border-indigo-500/30"
      style={containerStyle}
    >
      <div className="absolute top-2 left-2 space-y-0.5">
        {sceneIndex !== undefined && <div>Scene {sceneIndex}</div>}
        <div>Frame {localFrame}</div>
        <div>{Math.round(progress * 100)}%</div>
        {entries.map(([key, value]) => (
          <div key={key}>
            {key}: {String(value)}
          </div>
        ))}
      </div>
    </div>
  );
}
