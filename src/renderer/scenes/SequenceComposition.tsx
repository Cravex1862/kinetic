import React from 'react';
import { useCurrentFrame } from 'remotion';
import type { SceneDefinition } from './types';
import { getSceneFrame } from './timeline';
import { SceneRenderer } from './SceneRenderer';
import type { MorphSchema } from '../primitives/MorphSDK';
import { CaptionOverlay } from './CaptionOverlay';
import { parseNarration } from './narration';

interface SequenceCompositionProps {
  scenes: SceneDefinition[];
  schema: MorphSchema;
}

function SequenceComposition({ scenes, schema }: SequenceCompositionProps) {
  const frame = useCurrentFrame();
  const sceneDurations = scenes.map((s) => s.duration);
  const { sceneIndex, localFrame, progress } = getSceneFrame(frame, sceneDurations);
  const currentScene = scenes[sceneIndex];
  const narrationChunks = parseNarration(scenes.map(s => s.narration), sceneDurations);

  return (
    <div className="w-full h-full bg-gray-950 relative overflow-hidden">
      <SceneRenderer
        scene={currentScene}
        localFrame={localFrame}
        progress={progress}
        sceneIndex={sceneIndex}
        schema={schema}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white font-mono text-xs px-3 py-1 flex gap-4">
        <span>Scene {sceneIndex + 1}/{scenes.length}</span>
        <span>Frame {localFrame}/{currentScene.duration}</span>
        <span>Global {frame}</span>
        <span>Progress {(progress * 100).toFixed(0)}%</span>
      </div>
      <CaptionOverlay chunks={narrationChunks} fadeInFrames={8} fadeOutFrames={8} />
    </div>
  );
}

export default SequenceComposition;
