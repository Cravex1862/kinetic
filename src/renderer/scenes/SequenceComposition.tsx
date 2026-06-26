import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { getSceneFrame } from './timeline';
import { ComponentRenderer } from './ComponentRenderer';
import { AudioVisualizer } from '../primitives/AudioVisualizer';
import { CaptionOverlay } from './CaptionOverlay';
import { parseNarration } from './narration';

interface SequenceCompositionProps {
  scenes: any[];
  fonts?: any;
  colors?: any;
  showVisualizer?: boolean;
  globalAudioUrl?: string;
}

function SequenceComposition({
  scenes = [],
  fonts = {
    Title: { fontFamily: 'Inter' },
    Heading: { fontFamily: 'Inter' },
    Paragraph: { fontFamily: 'Inter' }
  },
  colors = { Primary: '#6366f1', Secondary: '#8b5cf6', Accent: '#f59e0b', Background: '#0f172a' },
  showVisualizer = false,
  globalAudioUrl = '',
}: SequenceCompositionProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  console.log("RENDER SIZE IN SEQUENCE:", width, height);

  if (!scenes || scenes.length === 0) {
    return (
      <div className="w-full h-full bg-gray-950 flex items-center justify-center text-white text-xs">
        No scenes loaded
      </div>
    );
  }

  const sceneDurations = scenes.map((s) => s.duration);
  const { sceneIndex, localFrame } = getSceneFrame(frame, sceneDurations);

  const cur = scenes[sceneIndex];
  const narrationChunks = parseNarration(scenes.map(s => s.narration), sceneDurations);

  if (!cur) {
    return (
      <div className="w-full h-full bg-gray-950 flex items-center justify-center text-white text-xs">
        Scene out of bounds
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center animate-bg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: colors.Background || '#0f172a',
        backgroundImage: colors.backgroundImage ? `url(${colors.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style>
        {`
        .font-title, h1, h2 {
          font-family: '${fonts?.Title?.fontFamily || 'Inter'}', sans-serif;
        }
        .font-heading, h3, h4 {
          font-family: '${fonts?.Heading?.fontFamily || 'Inter'}', sans-serif;
        }
        .font-paragraph, p, span, div {
          font-family: '${fonts?.Paragraph?.fontFamily || 'Inter'}', sans-serif;
        }
        `}
      </style>

      <div
        style={{
          width: '1024px',
          height: '576px',
          transform: `scale(${width / 1024})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {showVisualizer && globalAudioUrl && (
          <AudioVisualizer
            audioUrl={globalAudioUrl}
            glowColor={colors.Primary || '#6366f1'}
            frame={localFrame}
            fps={30}
          />
        )}

        <div
          style={{
            opacity: localFrame < 5 ? localFrame / 5 : localFrame > cur.duration - 5 ? (cur.duration - localFrame) / 5 : 1,
            transform: localFrame > cur.duration - 5 ? `translateX(${(cur.duration - 5 - localFrame) * 20}px)` : 'none',
            transition: 'none',
            width: '100%',
            height: '100%',
          }}
          className="relative"
        >
          {cur.components.map((node: any, i: number) => (
            <ComponentRenderer key={i} node={node} keyframes={cur.keyframes} localFrame={localFrame} />
          ))}
        </div>

        <CaptionOverlay chunks={narrationChunks} fadeInFrames={8} fadeOutFrames={8} />
      </div>
    </div>
  );
}

export default SequenceComposition;
