import React from 'react';
import { useCurrentFrame } from 'remotion';
import { BaseMotionProps } from '../types';

export interface SubtitleItem {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitlesTrackProps extends BaseMotionProps {
  subtitles?: SubtitleItem[];
  styleType?: 'classic' | 'highlight' | 'minimal';
  fontSize?: number;
  activeColor?: string;
  position?: 'bottom' | 'center' | 'top';
}

export const SubtitlesTrack: React.FC<SubtitlesTrackProps> = ({
  subtitles = [],
  styleType = 'highlight',
  fontSize = 36,
  activeColor = '#facc15',
  position = 'bottom',
}) => {
  const frame = useCurrentFrame();

  const currentSub = subtitles.find(
    (s) => frame >= s.startFrame && frame <= s.endFrame
  );

  if (!currentSub) return null;

  const positionClasses = {
    top: 'top-12',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-12',
  }[position];

  if (styleType === 'highlight') {
    return (
      <div className={`absolute inset-x-0 ${positionClasses} flex justify-center items-center z-50 pointer-events-none px-6`}>
        <div 
          className="font-black tracking-tight text-center uppercase drop-shadow-lg"
          style={{ 
            fontSize: `${fontSize}px`,
            color: activeColor,
            textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)',
            WebkitTextStroke: '1px black'
          }}
        >
          {currentSub.text}
        </div>
      </div>
    );
  }

  if (styleType === 'classic') {
    return (
      <div className={`absolute inset-x-0 ${positionClasses} flex justify-center items-center z-50 pointer-events-none px-6`}>
        <div 
          className="bg-black/80 text-white font-medium px-4 py-2 rounded-lg text-center backdrop-blur-sm"
          style={{ fontSize: `${fontSize * 0.75}px` }}
        >
          {currentSub.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-x-0 ${positionClasses} flex justify-center items-center z-50 pointer-events-none px-6`}>
      <div 
        className="text-white font-semibold tracking-wide text-center drop-shadow-md"
        style={{ fontSize: `${fontSize * 0.8}px` }}
      >
        {currentSub.text}
      </div>
    </div>
  );
};
