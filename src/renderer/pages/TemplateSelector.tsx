import React, { useState } from 'react';
import { ArrowLeft, Folder, PlugsConnected, FilmStrip, Browser, GameController, Star, Layout } from '@phosphor-icons/react';
import logoIcon from '../../../kinetic_brand/logo_transparent.svg';

interface TemplateSelectorProps {
  onSelect: (template: string, selectedDir: string) => void;
  onBack: () => void;
  initialDirectory: string;
  onSelectDirectory: (dir: string) => void;
}

const templates = [
  {
    key: 'basic-animation',
    title: 'Basic Animation',
    description: 'Use this for any regular animations needed',
    comingSoon: false,
    gradient: 'from-blue-600/10 to-purple-600/10 border-purple-500/20 group-hover:border-purple-500/50 hover:bg-purple-950/10',
    thumbnail: (
      <svg className="w-full h-full text-purple-400/80" fill="none" viewBox="0 0 100 60">
        <rect x="10" y="10" width="80" height="40" rx="4" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="30" r="12" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M44 30 L56 30 M50 24 L50 36" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    key: 'youtube-videos',
    title: 'Youtube Videos',
    description: 'Use this for creating full length youtube videos.',
    comingSoon: false,
    gradient: 'from-red-600/5 to-pink-600/5 border-red-500/10 group-hover:border-red-500/35',
    thumbnail: (
      <svg className="w-full h-full text-red-500/60" fill="none" viewBox="0 0 100 60">
        <rect x="10" y="10" width="80" height="40" rx="4" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <polygon points="45,22 62,30 45,38" fill="currentColor" />
        <line x1="15" x2="85" y1="44" y2="44" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
      </svg>
    )
  },
  {
    key: 'saas-demo-videos',
    title: 'SaaS Demo Videos',
    description: 'Use this for creating product demos for your SaaS',
    comingSoon: true,
    gradient: 'from-emerald-600/5 to-teal-600/5 border-emerald-500/10 group-hover:border-emerald-500/35',
    thumbnail: (
      <svg className="w-full h-full text-emerald-500/60" fill="none" viewBox="0 0 100 60">
        <rect x="10" y="10" width="80" height="40" rx="4" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <rect x="15" y="15" width="18" height="30" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="38" x2="80" y1="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="38" x2="70" y1="28" y2="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
        <line x1="38" x2="75" y1="36" y2="36" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      </svg>
    )
  },
  {
    key: 'minecraft-style',
    title: 'Minecraft Style',
    description: 'Use this for creating any minecraft styled explainer',
    comingSoon: true,
    gradient: 'from-amber-600/5 to-yellow-600/5 border-amber-500/10 group-hover:border-amber-500/35',
    thumbnail: (
      <svg className="w-full h-full text-amber-500/60" fill="none" viewBox="0 0 100 60">
        <rect x="25" y="10" width="15" height="15" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="42" y="10" width="15" height="15" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="59" y="10" width="15" height="15" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="33" y="28" width="15" height="15" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="50" y="28" width="15" height="15" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    key: 'logo-animator',
    title: 'Logo Animator',
    description: 'Use this for animating your logo.',
    comingSoon: true,
    gradient: 'from-purple-600/5 to-violet-600/5 border-purple-500/10 group-hover:border-purple-500/32',
    thumbnail: (
      <svg className="w-full h-full text-purple-400/60" fill="none" viewBox="0 0 100 60">
        <path d="M50 12 L75 42 L25 42 Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="30" r="6" fill="currentColor" />
      </svg>
    )
  },
  {
    key: 'ui-ux-walkthrough',
    title: 'UI/UX Walkthrough',
    description: 'Use this for creating a UI to demo to people before coding it',
    comingSoon: true,
    gradient: 'from-cyan-600/5 to-sky-600/5 border-cyan-500/10 group-hover:border-cyan-500/35',
    thumbnail: (
      <svg className="w-full h-full text-cyan-400/60" fill="none" viewBox="0 0 100 60">
        <rect x="15" y="15" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <rect x="55" y="25" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M45 25 L55 35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    )
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onBack, initialDirectory, onSelectDirectory }) => {
  const [selectedDir, setSelectedDir] = useState(initialDirectory);
  
  const handleBrowse = async () => {
    if (window.electronAPI?.selectDirectory) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        setSelectedDir(dir);
        onSelectDirectory(dir);
      }
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden font-sans page-enter">
      <header className="flex items-center justify-between border-b border-gray-900 px-8 py-4 bg-gray-950">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:border-purple-500/40 transition-all hover:scale-105"
            title="Go Back"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            title="Return to Dashboard"
          >
            <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" style={{
              filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45)) brightness(1.15)'
            }} />
            <span className="text-sm font-bold tracking-wide text-white">kinetic</span>
          </button>
          <span className="text-xs text-gray-700">/</span>
          <span className="text-xs text-gray-400">Template Selector</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/20 px-3.5 py-1.5 text-xs text-gray-400">
          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Selected Directory</span>
          <span className="truncate max-w-[280px] text-gray-200 font-mono" title={selectedDir}>{selectedDir || 'None Selected'}</span>
          <button onClick={handleBrowse} className="text-purple-400 hover:text-purple-300 font-bold transition-colors ml-2">Browse</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-12 py-10 flex flex-col items-center">
        <div className="w-full max-w-7xl mb-8 flex flex-col items-start">
          <h2 className="text-lg font-bold text-white tracking-wide">Choose a Template Below</h2>
          <p className="text-xs text-gray-500 mt-1">Select the canvas layout that fits your animation style</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 w-full max-w-7xl pb-12">
          {templates.map((t) => (
            <button key={t.key}
              onClick={() => {
                if (!t.comingSoon) {
                  onSelect(t.key, selectedDir);
                }
              }}
              disabled={t.comingSoon}
              data-tour={t.key === 'basic-animation' ? 'basic-animation-card' : undefined}
              className={`group flex flex-col text-left rounded-2xl border bg-gray-900/30 p-4 transition-all duration-300 ${t.comingSoon ? 'opacity-50 cursor-not-allowed border-gray-900' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 ' + t.gradient}`}>
              <div className="relative aspect-video w-full rounded-xl bg-gray-950/80 border border-gray-900 flex items-center justify-center overflow-hidden mb-4">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:10px_10px] opacity-10" />
                {t.thumbnail}
                {t.comingSoon && (
                  <div className="absolute top-2 right-2 rounded-full bg-gray-900/80 border border-gray-800 px-2 py-0.5 text-[8px] font-semibold text-gray-500 uppercase tracking-widest">
                    Coming Soon
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 px-1">
                <span className="text-sm font-bold text-white tracking-wide group-hover:text-purple-400 transition-colors">{t.title}</span>
                <span className="text-xs text-gray-500 mt-1.5 leading-relaxed flex-1">{t.description}</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TemplateSelector;