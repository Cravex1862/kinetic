import React from 'react';
import type { SceneDefinition } from './types';
import type { NarrationChunk } from './narration';

interface StoryboardPreviewProps {
  scenes: SceneDefinition[];
  chunks: NarrationChunk[];
  currentFrame?: number;
  fps?: number;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

export function StoryboardPreview({
  scenes,
  chunks,
  currentFrame,
  fps = 30,
}: StoryboardPreviewProps) {
  const totalFrames = chunks.reduce((acc, c) => acc + c.duration, 0);

  const activeIndex =
    currentFrame !== undefined
      ? chunks.findIndex(
          (c) => c.startFrame <= currentFrame && currentFrame < c.endFrame,
        )
      : -1;

  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="text-gray-500 pb-1">
        {scenes.length} scenes | Total: {totalFrames} frames (
        {Math.round((totalFrames / fps) * 10) / 10}s)
      </div>

      {scenes.map((scene, i) => {
        const chunk = chunks[i];
        if (!chunk) return null;

        const isActive = i === activeIndex;
        const pct =
          totalFrames > 0
            ? ((chunk.duration / totalFrames) * 100).toFixed(1)
            : '0';

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white w-16 shrink-0">
                Scene {i + 1}
              </span>
              <span className="text-gray-400 flex-1 truncate">
                {truncate(chunk.text, 50)}
              </span>
              <span className="text-gray-500 w-32 text-right shrink-0">
                {chunk.startFrame}-{chunk.endFrame} (
                {Math.round((chunk.duration / fps) * 10) / 10}s)
              </span>
            </div>
            <div className="w-full h-4 rounded bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-150 ${
                  isActive ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
