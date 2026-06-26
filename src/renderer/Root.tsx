import React from 'react';
import { Composition, registerRoot } from 'remotion';
import './index.css';

const FPS = 30;
const DURATION = 150;
const WIDTH = 1920;
const HEIGHT = 1080;

// ─── Root Composition Map ────────────────────────────────────
import SequenceComposition from './scenes/SequenceComposition';

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SceneSequence"
        component={SequenceComposition as React.FC<any>}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={({ props }) => {
          console.log("PROPS IN ROOT:", JSON.stringify(props));
          const scenes = (props?.scenes as any[]) || [];
          const duration = scenes.reduce((sum, s) => sum + (s.duration || 0), 0) || 150;
          return {
            durationInFrames: duration,
            props,
          };
        }}
        defaultProps={{
          scenes: [] as any[],
          fonts: {
            Title: { fontFamily: 'Inter' },
            Heading: { fontFamily: 'Inter' },
            Paragraph: { fontFamily: 'Inter' }
          },
          colors: { Primary: '#6366f1', Secondary: '#8b5cf6', Accent: '#f59e0b', Background: '#0f172a' },
          showVisualizer: false,
          globalAudioUrl: '',
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);

export { RemotionRoot };
