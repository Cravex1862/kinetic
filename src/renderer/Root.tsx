import React from 'react';
import { Composition, registerRoot } from 'remotion';
import './index.css';

import VideoComposition from './scenes/VideoComposition';

interface CompositionProps {
  totalDuration?: number;
  bgSelection?: Record<string, unknown>;
}

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={300}
        calculateMetadata={async ({ props }: { props: CompositionProps }) => ({
          durationInFrames: typeof props.totalDuration === 'number' ? props.totalDuration : 300,
        })}
      />
    </>
  );
};

registerRoot(RemotionRoot);

export { RemotionRoot };
