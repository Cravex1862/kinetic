import React, { useEffect, useState } from 'react';
import { X, Desktop, Play, ArrowsCounterClockwise } from '@phosphor-icons/react';
import { Player } from '@remotion/player';
import { SafeComposition } from '../scenes/SafeComposition';

interface VideoCompositionViewerModalProps {
  onClose: () => void;
}

export const VideoCompositionViewerModal: React.FC<VideoCompositionViewerModalProps> = ({ onClose }) => {
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Desktop size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-sans">
                Live Video Composition State
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Ctrl+Shift+V
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Rendering current state of src/renderer/scenes/VideoComposition.tsx
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReloadKey(prev => prev + 1)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            >
              <ArrowsCounterClockwise size={14} /> Reload Player
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Remotion Player Container */}
        <div className="flex-1 bg-black/90 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full max-w-4xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950">
            <Player
              key={`video_composition_preview_${reloadKey}`}
              component={SafeComposition}
              durationInFrames={370}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={30}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              controls
              autoPlay
              loop
            />
          </div>
          <p className="mt-4 text-xs text-zinc-500 font-sans flex items-center gap-2">
            <Play size={12} weight="fill" className="text-purple-400" />
            Live 60 FPS Remotion Preview Player — Press ESC or click X to dismiss
          </p>
        </div>
      </div>
    </div>
  );
};
