import React, { useState, useMemo } from 'react';
import type { SceneDefinition } from './types';
import { parseNarration, calculateDuration } from './narration';
import { StoryboardPreview } from './StoryboardPreview';
import type { MorphSchema } from '../primitives/MorphSDK';

interface PlaygroundProps {
  onExport?: (scenes: SceneDefinition[], schema: MorphSchema, fps: number) => void;
}

export function Playground({ onExport }: PlaygroundProps) {
  const [prompt, setPrompt] = useState("Create a product walkthrough for a cloud dashboard");
  const [narration, setNarration] = useState("");
  const [wpm, setWpm] = useState(150);
  const [fps, setFps] = useState(30);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFramesOverride, setTotalFramesOverride] = useState<number | null>(null);

  const paragraphs = useMemo(() => narration.split('\n').filter(Boolean), [narration]);

  const rawDurations = useMemo(
    () => paragraphs.map(p => calculateDuration(p, wpm, fps)),
    [paragraphs, wpm, fps],
  );

  const rawTotal = useMemo(() => rawDurations.reduce((a, b) => a + b, 0), [rawDurations]);

  const { durations, totalFrames } = useMemo(() => {
    if (totalFramesOverride !== null && rawTotal > 0) {
      const scale = totalFramesOverride / rawTotal;
      const scaled = rawDurations.map(d => Math.max(1, Math.round(d * scale)));
      const adjustedTotal = scaled.reduce((a, b) => a + b, 0);
      return { durations: scaled, totalFrames: adjustedTotal };
    }
    return { durations: rawDurations, totalFrames: rawTotal };
  }, [rawDurations, rawTotal, totalFramesOverride]);

  const scenes: SceneDefinition[] = useMemo(
    () => paragraphs.map((text, i) => ({
      duration: durations[i],
      easing: 'ease-in-out' as const,
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0 },
      narration: text,
      uiActions: [],
    })),
    [paragraphs, durations],
  );

  const chunks = useMemo(() => parseNarration(paragraphs, durations), [paragraphs, durations]);

  const clampedFrame = Math.min(currentFrame, totalFrames);

  const handleExport = () => {
    onExport?.(scenes, {}, fps);
  };

  const handleExportMP4 = async () => {
    if (!window.electronAPI?.exportVideo) return;
    const dir = await window.electronAPI.selectDirectory();
    if (!dir) return;
    await window.electronAPI.exportVideo({
      compositionId: 'playground',
      outputPath: dir,
      framesPerScene: durations,
      fps,
      width: 1920,
      height: 1080,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
        <label className="block mb-1 text-sm text-gray-400">Video Prompt</label>
        <textarea
          className="w-full h-20 rounded bg-gray-800 px-3 py-2 text-sm text-gray-300 font-mono resize-none"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />

        <label className="block mb-1 text-sm text-gray-400 mt-4">
          Narration (one paragraph per scene)
        </label>
        <textarea
          className="w-full h-32 rounded bg-gray-800 px-3 py-2 text-sm text-gray-300 font-mono resize-none"
          value={narration}
          onChange={e => setNarration(e.target.value)}
        />

        <label className="block mb-1 text-sm text-gray-400 mt-4">
          Speed: {wpm} WPM
        </label>
        <input
          type="range"
          className="w-full accent-indigo-500"
          min={80}
          max={300}
          value={wpm}
          onChange={e => setWpm(Number(e.target.value))}
        />

        <label className="block mb-1 text-sm text-gray-400 mt-4">
          FPS: {fps}
        </label>
        <input
          type="range"
          className="w-full accent-indigo-500"
          min={24}
          max={60}
          value={fps}
          onChange={e => setFps(Number(e.target.value))}
        />

        <p className="mt-4 text-sm text-gray-500">
          {paragraphs.length} scenes, {totalFrames} frames ({Math.round(totalFrames / fps * 10) / 10}s)
        </p>

        {totalFramesOverride !== null && (
          <div className="mt-2">
            <label className="block mb-1 text-sm text-gray-400">
              Total frames override
            </label>
            <input
              type="number"
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-300 font-mono"
              value={totalFramesOverride}
              onChange={e => setTotalFramesOverride(Number(e.target.value) || null)}
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
        <StoryboardPreview
          scenes={scenes}
          chunks={chunks}
          currentFrame={clampedFrame}
          fps={fps}
        />

        <label className="block mb-1 text-sm text-gray-400 mt-4">
          Frame: {clampedFrame} / {totalFrames}
        </label>
        <input
          type="range"
          className="w-full accent-indigo-500"
          min={0}
          max={Math.max(1, totalFrames)}
          value={clampedFrame}
          onChange={e => setCurrentFrame(Number(e.target.value))}
        />

        <div className="mt-4 flex gap-3">
          <button
            className="bg-indigo-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
            onClick={handleExport}
          >
            Export
          </button>

          {window.electronAPI?.exportVideo && (
            <button
              className="bg-indigo-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
              onClick={handleExportMP4}
            >
              Export to MP4
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Export generates a render manifest. Full MP4 export requires running in
          Electron with @remotion/renderer.
        </p>
      </div>
    </div>
  );
}
