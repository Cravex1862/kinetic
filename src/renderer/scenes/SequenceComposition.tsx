import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { getSceneFrame } from './timeline';
import { ComponentRenderer } from './ComponentRenderer';
import { AudioVisualizer } from '../primitives/AudioVisualizer';
import { CaptionOverlay } from './CaptionOverlay';
import { parseNarration } from './narration';
import { SignalContext } from '../primitives/useSignal';

function buildSignalMap(nodes: any[]): Record<string, any> {
  const map: Record<string, any> = {};
  function traverse(node: any) {
    if (!node) return;
    const props = node.props || {};
    if (props.id) {
      map[props.id] = {
        clickFrame: props.clickFrame,
        signalOutEvent: props.signalOut?.event,
        signalOutFrame: props.signalOut?.frame,
      };
    }
    if (node.children) {
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      } else {
        traverse(node.children);
      }
    }
  }
  if (Array.isArray(nodes)) {
    nodes.forEach(traverse);
  }
  return map;
}

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

  const signalMap = React.useMemo(() => {
    if (!cur) return {};
    return buildSignalMap(cur.components);
  }, [cur]);

  if (!cur) {
    return (
      <div className="w-full h-full bg-gray-950 flex items-center justify-center text-white text-xs">
        Scene out of bounds
      </div>
    );
  }

  // Calculate layout dimensions based on aspect ratio to prevent vertical video stretching
  const ratio = width / height;
  let designW = 1024;
  let designH = 576;
  if (Math.abs(ratio - 9 / 16) < 0.1) {
    designW = 576;
    designH = 1024;
  } else if (Math.abs(ratio - 1.0) < 0.1) {
    designW = 576;
    designH = 576;
  }

  // Calculate Cinematic Zoom-Fade Transition (10 frames)
  const transDur = 10;
  let op = 1;
  let sc = 1;
  if (localFrame < transDur) {
    const t = localFrame / transDur;
    const eased = t * t * (3 - 2 * t); // Smoothstep easing
    op = eased;
    sc = 0.97 + 0.03 * eased;
  } else if (localFrame > cur.duration - transDur) {
    const t = Math.max(0, (cur.duration - localFrame) / transDur);
    const eased = t * t * (3 - 2 * t); // Smoothstep easing
    op = eased;
    sc = 1.03 - 0.03 * eased;
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
          width: `${designW}px`,
          height: `${designH}px`,
          transform: `scale(${width / designW})`,
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
            width: '100%',
            height: '100%',
            opacity: op,
            transform: `scale(${sc})`,
            transformOrigin: 'center center',
          }}
          className="relative"
        >
          <SignalContext.Provider value={signalMap}>
            {cur.components.map((node: any, i: number) => (
              <ComponentRenderer key={i} node={node} keyframes={cur.keyframes} localFrame={localFrame} />
            ))}
          </SignalContext.Provider>
        </div>

        <CaptionOverlay chunks={narrationChunks} fadeInFrames={8} fadeOutFrames={8} />
      </div>
    </div>
  );
}

export default SequenceComposition;
