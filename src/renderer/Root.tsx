import React from 'react';
import { Composition, registerRoot } from 'remotion';

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
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: [],
          schema: {}
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);

export { RemotionRoot };
