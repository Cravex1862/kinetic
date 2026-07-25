import React from 'react';
import { Composition, registerRoot } from 'remotion';
import './index.css';

import VideoComposition from './scenes/VideoComposition';

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
      />
    </>
  );
};

registerRoot(RemotionRoot);

export { RemotionRoot };
