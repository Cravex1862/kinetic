import React from 'react';
import { MusicNotes, CheckCircle, Trash } from '@phosphor-icons/react';

interface AudioUploadFieldProps {
  audioFile: File | null;
  beatCount: number;
  isAnalyzing: boolean;
  onSelectAudio: (file: File | null) => void;
}

export const AudioUploadField: React.FC<AudioUploadFieldProps> = ({
  audioFile,
  beatCount,
  isAnalyzing,
  onSelectAudio,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelectAudio(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-300">
        Background Music (.mp3 / .wav)
      </label>

      {!audioFile ? (
        <label className="flex items-center justify-between px-3.5 py-2.5 bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-xl cursor-pointer transition select-none">
          <div className="flex items-center gap-2.5 text-xs text-gray-400">
            <MusicNotes size={16} className="text-purple-400" />
            <span>Upload soundtrack to sync animations to beat...</span>
          </div>
          <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
          <span className="text-[10px] bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800 text-gray-300 font-semibold">Browse File</span>
        </label>
      ) : (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-900 border border-purple-500/60 rounded-xl text-xs select-none">
          <div className="flex items-center gap-2.5">
            <MusicNotes size={16} className="text-purple-400" />
            <span className="text-white font-medium truncate max-w-[200px]">{audioFile.name}</span>
            {isAnalyzing ? (
              <span className="text-[10px] text-purple-400 font-mono animate-pulse">Running BeatNet AI...</span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                <CheckCircle size={12} /> {beatCount} beats detected
              </span>
            )}
          </div>
          <button
            onClick={() => onSelectAudio(null)}
            className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition"
            title="Remove soundtrack"
          >
            <Trash size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
