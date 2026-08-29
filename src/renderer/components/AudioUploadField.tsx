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
      {!audioFile ? (
        <label className="w-full flex items-center justify-between px-3 py-3 bg-[#18181b] border border-dashed border-[#27272a] rounded-xl hover:bg-white/[0.02] transition-colors group cursor-pointer select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-gray-600 group-hover:text-gray-400">
              <MusicNotes size={16} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold text-gray-300">Select Audio</span>
              <span className="text-[10px] text-gray-600">WAV, MP3, AAC — syncs to beat</span>
            </div>
          </div>
          <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
          <span className="text-[10px] bg-[#18181b] px-2.5 py-1 rounded-lg border border-[#27272a] text-gray-400 font-semibold mr-1">Browse File</span>
        </label>
      ) : (
        <div className="flex items-center justify-between px-3 py-3 bg-[#18181b] border border-violet-500/30 rounded-xl select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center">
              <MusicNotes size={16} className="text-violet-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-200 truncate max-w-[180px]">{audioFile.name}</span>
              <span className="text-[10px] font-mono font-semibold">
                {isAnalyzing ? <span className="text-purple-400 animate-pulse">Running BeatNet AI...</span> : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {beatCount} beats detected</span>}
              </span>
            </div>
          </div>
          <button onClick={() => onSelectAudio(null)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition" title="Remove soundtrack">
            <Trash size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
