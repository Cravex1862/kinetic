import React from 'react';
import { ArrowLeft, UploadSimple } from '@phosphor-icons/react';

interface YoutubeVideoCreatorProps {
  onBack: () => void;
}

const YoutubeVideoCreator: React.FC<YoutubeVideoCreatorProps> = ({ onBack }) => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#09090b] text-white p-6 font-mono overflow-y-auto">
      {/* Top Title Header */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold tracking-widest text-zinc-100 uppercase">
          Yt Video Creator
        </h1>
      </div>

      {/* Main Browser Window Container */}
      <div className="w-full max-w-5xl rounded-[24px] border-[3px] border-zinc-800 bg-[#121215] p-6 shadow-2xl flex flex-col relative">
        
        {/* Window Control Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80 mb-6">
          {/* Three Window Control Dots + Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors mr-1"
              title="Back to Templates"
            >
              <ArrowLeft size={14} weight="bold" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-700/50" />
              <span className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-700/50" />
              <span className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-700/50" />
            </div>
          </div>
          
          {/* Mock URL Bar or Info Indicator */}
          <div className="hidden sm:block text-[10px] text-zinc-600 bg-zinc-950/50 border border-zinc-900 rounded-md px-3 py-0.5 max-w-[200px] truncate">
            kinetic://youtube-creator-v1.0
          </div>
        </div>

        {/* Browser Body Area - Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (4 of 12 cols) */}
          <div className="md:col-span-4 flex flex-col gap-5">
            {/* Box 1: Upload Script */}
            <div className="rounded-2xl border-[3px] border-zinc-800 bg-zinc-900/30 p-6 flex flex-col items-center justify-center min-h-[120px] text-center hover:border-zinc-750 transition-colors">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Upload Script</span>
              <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
                +
              </div>
            </div>

            {/* Box 2: Styling */}
            <div className="rounded-2xl border-[3px] border-zinc-800 bg-zinc-900/30 p-6 flex flex-col items-center justify-center min-h-[160px] text-center hover:border-zinc-750 transition-colors">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Styling</span>
              <span className="text-[10px] text-zinc-600 mt-2">Adjust Typography & Brand Colors</span>
            </div>

            {/* Box 3: Custom Instructions */}
            <div className="rounded-2xl border-[3px] border-zinc-800 bg-zinc-900/30 p-6 flex flex-col items-center justify-center min-h-[120px] text-center hover:border-zinc-750 transition-colors">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Custom Instructions</span>
              <span className="text-[10px] text-zinc-600 mt-2">Special prompt instructions...</span>
            </div>
          </div>

          {/* RIGHT COLUMN (8 of 12 cols) */}
          <div className="md:col-span-8 flex flex-col gap-5">
            {/* Box 4: Preview Window */}
            <div className="rounded-2xl border-[3px] border-zinc-800 bg-zinc-950 p-8 flex flex-col items-center justify-center min-h-[300px] text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_16px] opacity-10" />
              <span className="text-lg font-bold text-zinc-300 tracking-widest uppercase relative z-10">
                Preview Window
              </span>
              <span className="text-[10px] text-zinc-600 mt-2 relative z-10">Video composition viewport</span>
            </div>

            {/* Box 5: Upload/ Describe Background */}
            <div className="rounded-2xl border-[3px] border-zinc-800 bg-zinc-900/30 p-6 flex flex-col items-center justify-center min-h-[100px] text-center hover:border-zinc-750 transition-colors">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                Upload/ Describe Background
              </span>
              <span className="text-[10px] text-zinc-600 mt-1">PNG, JPG or AI Prompt Description</span>
            </div>

            {/* Box 6 & 7: Bottom Action Buttons Row */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Upload Assets Button */}
              <button className="flex items-center justify-center gap-2.5 rounded-xl border-[3px] border-zinc-800 bg-zinc-900/20 px-5 py-3.5 text-sm font-bold hover:border-zinc-700 hover:bg-zinc-900/50 active:scale-[0.98] transition-all">
                <UploadSimple size={18} className="text-zinc-400" />
                <span className="text-zinc-300 uppercase tracking-wider">Upload Assets</span>
              </button>

              {/* Generate Button */}
              <button className="flex items-center justify-center rounded-xl border-[3px] border-zinc-800 bg-zinc-900/20 px-5 py-3.5 text-sm font-bold hover:border-purple-500/50 hover:bg-purple-600/10 active:scale-[0.98] transition-all">
                <span className="text-purple-400 uppercase tracking-widest">Generate</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default YoutubeVideoCreator;
