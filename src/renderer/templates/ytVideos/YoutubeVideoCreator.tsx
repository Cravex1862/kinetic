import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkle, UploadSimple, Palette, FilmStrip, Play, SpeakerHigh, Gear, CornersOut, Repeat, ClosedCaptioning, PictureInPicture } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';

interface YoutubeVideoCreatorProps {
  onBack: () => void;
}

const SIZE_OPTIONS = Array.from({ length: 63 }, (_, i) => i + 10);

type FontRow = 'Title Font' | 'Heading' | 'Paragraph';

interface FontSettings {
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  size: number;
}

const defaultFonts: Record<FontRow, FontSettings> = {
  'Title Font': { fontFamily: 'Roboto', bold: true, italic: false, underline: false, color: '#ffffff', size: 48 },
  Heading: { fontFamily: 'Roboto', bold: false, italic: false, underline: false, color: '#e2e8f0', size: 32 },
  Paragraph: { fontFamily: 'Roboto', bold: false, italic: false, underline: false, color: '#94a3b8', size: 14 },
};

const colorSwatches = [
  { label: 'Primary', defaultColor: '#ef4444' },
  { label: 'Secondary', defaultColor: '#f87171' },
  { label: 'Accent', defaultColor: '#fbbf24' },
  { label: 'Background', defaultColor: '#09090b' },
];

const YoutubeVideoCreator: React.FC<YoutubeVideoCreatorProps> = ({ onBack }) => {
  const [narration, setNarration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [bgDescription, setBgDescription] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [fonts, setFonts] = useState<Record<FontRow, FontSettings>>(defaultFonts);
  const [swatches, setSwatches] = useState<Record<string, string>>(Object.fromEntries(colorSwatches.map((s) => [s.label, s.defaultColor])));
  const [availableFonts, setAvailableFonts] = useState<string[]>(['Roboto', 'Inter', 'Poppins', 'DM Sans']);
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // Load device system fonts on view mount
  useEffect(() => {
    const fetchSystemFonts = async () => {
      if (window.electronAPI?.getSystemFonts) {
        const sysFonts = await window.electronAPI.getSystemFonts();
        if (sysFonts && sysFonts.length > 0) {
          setAvailableFonts(sysFonts);
        }
      }
    };
    fetchSystemFonts();
  }, []);

  // Fetch uninstalled font families from Google Fonts API dynamically
  useEffect(() => {
    const activeFamilies = [
      fonts['Title Font']?.fontFamily,
      fonts['Heading']?.fontFamily,
      fonts['Paragraph']?.fontFamily
    ];
    activeFamilies.forEach(family => {
      if (family && !availableFonts.includes(family)) {
        const formattedName = family.replace(/\s+/g, '+');
        const linkId = `gfont-${formattedName.toLowerCase()}`;
        if (!document.getElementById(linkId)) {
          const fontLink = document.createElement('link');
          fontLink.id = linkId;
          fontLink.rel = 'stylesheet';
          fontLink.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;
          document.head.appendChild(fontLink);
        }
      }
    });
  }, [fonts, availableFonts]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const assetInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBackgroundImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAssets: string[] = [];
      for (let i = 0; i < files.length; i++) {
        newAssets.push(files[i].name);
      }
      setUploadedAssets((prev) => [...prev, ...newAssets]);
    }
  };

  const toggleFontProp = (row: FontRow, prop: 'bold' | 'italic' | 'underline') => {
    setFonts((prev) => ({
      ...prev,
      [row]: { ...prev[row], [prop]: !prev[row][prop] },
    }));
  };

  const setFontColor = (row: FontRow, color: string) => {
    setFonts((prev) => ({
      ...prev,
      [row]: { ...prev[row], color },
    }));
  };

  const setFontSize = (row: FontRow, size: number) => {
    setFonts((prev) => ({
      ...prev,
      [row]: { ...prev[row], size },
    }));
  };

  const setFontFamily = (row: FontRow, fontFamily: string) => {
    setFonts((prev) => ({
      ...prev,
      [row]: { ...prev[row], fontFamily },
    }));
  };

  const renderFontRow = (label: FontRow) => {
    const f = fonts[label];
    return (
      <div key={label} className="space-y-1">
        <span className="text-[10px] font-semibold text-gray-500">{label}</span>
        <div className="flex gap-1.5">
          <select value={f.fontFamily} onChange={(e) => setFontFamily(label, e.target.value)} className="flex-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-white outline-none">
            {availableFonts.map((font) => <option key={font} value={font} className="bg-gray-950 text-white">{font}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-gray-800">
            <button
              onClick={() => toggleFontProp(label, 'bold')}
              className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.bold ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
            >
              B
            </button>
            <button
              onClick={() => toggleFontProp(label, 'italic')}
              className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.italic ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
            >
              I
            </button>
            <button
              onClick={() => toggleFontProp(label, 'underline')}
              className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.underline ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
            >
              U
            </button>
          </div>

          <input
            type="color"
            value={f.color}
            onChange={(e) => setFontColor(label, e.target.value)}
            className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
          />

          <select
            value={f.size}
            onChange={(e) => setFontSize(label, Number(e.target.value))}
            className="w-14 rounded border border-gray-800 bg-gray-900 px-1 py-0.5 text-xs text-white"
          >
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-gray-950 text-white">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white page-enter overflow-hidden">
      {/* LEFT SIDEBAR - Configuration Panel (Stretches to 25% width) */}
      <aside className="w-1/4 min-w-[320px] max-w-[480px] flex-shrink-0 border-r border-gray-900 bg-gray-950 p-5 flex flex-col gap-4 overflow-y-auto">
        <header className="flex items-center gap-2 border-b border-gray-900 pb-3">
          <button
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-900 hover:text-purple-400"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" />
            <span className="text-sm font-bold text-white">YouTube Creator</span>
          </div>
        </header>

        {/* Section 1: Upload Script */}
        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-400 mb-2">Upload Script</h4>
          <textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Enter YouTube video script..."
            className="w-full h-24 resize-none premium-input p-2.5 text-xs rounded-lg bg-gray-950/60"
          />
        </section>

        {/* Section 2: Styling */}
        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
            <Palette size={16} className="text-purple-400" />
            <h4 className="text-xs font-bold text-gray-400">Styling</h4>
          </div>

          <div className="space-y-3">
            {renderFontRow('Title Font')}
            {renderFontRow('Heading')}
            {renderFontRow('Paragraph')}
          </div>

          <div className="pt-2 border-t border-gray-900">
            <span className="text-[10px] font-semibold text-gray-500 block mb-2">Palette Colors</span>
            <div className="grid grid-cols-2 gap-2">
              {colorSwatches.map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-gray-950/40 p-1.5 rounded border border-gray-900">
                  <input
                    type="color"
                    value={swatches[s.label]}
                    onChange={(e) =>
                      setSwatches((prev) => ({ ...prev, [s.label]: e.target.value }))
                    }
                    className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                  <span className="text-[10px] text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Custom Instructions */}
        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-400 mb-2">Custom Instructions</h4>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe YouTube animation styling instructions..."
            className="w-full h-24 resize-none premium-input p-2.5 text-xs rounded-lg bg-gray-950/60"
          />
        </section>
      </aside>

      {/* RIGHT MAIN AREA (Stretches to 75% width, content flows full width) */}
      <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950/40 justify-between h-full">
        
        {/* 1. Preview Window Box (Stretches full width, aspect-video 16:9) */}
        <div className="w-full aspect-video rounded-2xl border border-gray-900 bg-gray-900/10 p-5 backdrop-blur-md relative overflow-hidden flex-shrink-0">
          <div className="absolute top-4 left-4 flex gap-1.5 z-10">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="text-center text-xs text-gray-500 border-b border-gray-900/60 pb-3 tracking-wider font-semibold z-10">
            walkthrough preview canvas
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full mt-4">
            <div className="flex flex-col gap-2 w-full h-full items-center youtube-preview-canvas">
              <style>
                {`
                .youtube-preview-canvas .video-player-container {
                  position: relative;
                  width: 100%;
                  height: 100%;
                  background-color: #000000;
                  font-family: Roboto, Arial, sans-serif;
                  overflow: hidden;
                  box-sizing: border-box;
                  border-radius: 12px;
                }

                .youtube-preview-canvas .video-display-area {
                  width: 100%;
                  height: 100%;
                  position: relative;
                }

                .youtube-preview-canvas .captions-container {
                  position: absolute;
                  bottom: 60px;
                  left: 50%;
                  transform: translateX(-50%);
                  text-align: center;
                  width: 85%;
                  pointer-events: none;
                  z-index: 10;
                }

                .youtube-preview-canvas .caption-text {
                  display: inline-block;
                  background-color: rgba(28, 28, 28, 0.8);
                  color: #ffffff;
                  padding: 6px 12px;
                  border-radius: 6px;
                  margin: 0;
                  letter-spacing: 0.5px;
                }

                .youtube-preview-canvas .player-controls-wrapper {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%);
                  padding: 0 16px 12px 16px;
                  display: flex;
                  flex-direction: column;
                  z-index: 20;
                }

                .youtube-preview-canvas .timeline-container {
                  height: 16px;
                  width: 100%;
                  display: flex;
                  align-items: center;
                  cursor: pointer;
                }

                .youtube-preview-canvas .timeline-scrubber-background {
                  height: 4px;
                  width: 100%;
                  background-color: rgba(255, 255, 255, 0.3);
                  position: relative;
                  border-radius: 4px;
                }

                .youtube-preview-canvas .timeline-progress-filled {
                  position: absolute;
                  left: 0;
                  top: 0;
                  bottom: 0;
                  width: 25%; 
                  background-color: #ff0000;
                  border-radius: 4px 0 0 4px;
                }

                .youtube-preview-canvas .timeline-scrubber-head {
                  position: absolute;
                  left: 25%; 
                  top: 50%;
                  transform: translate(-50%, -50%);
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background-color: #ff0000;
                }

                .youtube-preview-canvas .controls-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  height: 38px;
                  margin-top: 4px;
                }

                .youtube-preview-canvas .controls-left-group,
                .youtube-preview-canvas .controls-right-group {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                }

                .youtube-preview-canvas .player-btn {
                  background: none;
                  border: none;
                  color: #eeeeee;
                  width: 32px;
                  height: 32px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  opacity: 0.9;
                  padding: 0;
                }

                .youtube-preview-canvas .player-btn:hover {
                  opacity: 1;
                  color: #ffffff;
                }

                .youtube-preview-canvas .time-stamp-display {
                  color: #dddddd;
                  font-size: 11px;
                  margin-left: 4px;
                  user-select: none;
                  background-color: rgba(0, 0, 0, 0.4);
                  padding: 3px 6px;
                  border-radius: 6px;
                }
                `}
              </style>

              {/* Adapted Custom Video Player Layout stretching w-full h-full */}
              <div className="video-player-container">
                <div className="video-display-area">
                  <div 
                    style={{
                      backgroundColor: swatches['Background'] || '#09090b',
                      backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    className="w-full h-full"
                  />
                  
                  {/* Captions Overlay Container */}
                  <div className="captions-container">
                    <p 
                      style={{
                        fontFamily: fonts['Paragraph'].fontFamily,
                        color: fonts['Paragraph'].color,
                        fontWeight: fonts['Paragraph'].bold ? 'bold' : 'normal',
                        fontStyle: fonts['Paragraph'].italic ? 'italic' : 'normal',
                        textDecoration: fonts['Paragraph'].underline ? 'underline' : 'none',
                        fontSize: `${Math.min(18, fonts['Paragraph'].size)}px`
                      }}
                      className="caption-text"
                    >
                      {narration.trim() ? narration.slice(0, 80) + '...' : 'Subtitles & captions'}
                    </p>
                  </div>
                </div>

                {/* Player Controls Bar */}
                <div className="player-controls-wrapper">
                  
                  {/* Progress Timeline Bar */}
                  <div className="timeline-container">
                    <div className="timeline-scrubber-background">
                      <div className="timeline-progress-filled"></div>
                      <div className="timeline-scrubber-head"></div>
                    </div>
                  </div>

                  {/* Bottom Controls Row */}
                  <div className="controls-row">
                    {/* Left-side Actions */}
                    <div className="controls-left-group">
                      <button className="player-btn btn-play-pause" aria-label="Play">
                        <Play size={18} weight="fill" />
                      </button>
                      <button className="player-btn btn-volume" aria-label="Mute">
                        <SpeakerHigh size={18} weight="fill" />
                      </button>
                      <div className="time-stamp-display">
                        <span className="current-time">0:17</span> / <span className="total-duration">8:19</span>
                      </div>
                    </div>

                    {/* Right-side Actions */}
                    <div className="controls-right-group">
                      <button className="player-btn btn-autoplay" aria-label="Autoplay Toggle">
                        <Repeat size={18} />
                      </button>
                      <button className="player-btn btn-captions" aria-label="Subtitles">
                        <ClosedCaptioning size={18} />
                      </button>
                      <button className="player-btn btn-settings" aria-label="Settings">
                        <Gear size={18} />
                      </button>
                      <button className="player-btn btn-mini-player" aria-label="Miniplayer">
                        <PictureInPicture size={18} />
                      </button>
                      <button className="player-btn btn-fullscreen" aria-label="Fullscreen">
                        <CornersOut size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title of the Video rendered outside below the player */}
              <h2 
                style={{
                  fontFamily: fonts['Title Font'].fontFamily,
                  color: fonts['Title Font'].color,
                  fontWeight: fonts['Title Font'].bold ? 'bold' : 'normal',
                  fontStyle: fonts['Title Font'].italic ? 'italic' : 'normal',
                  textDecoration: fonts['Title Font'].underline ? 'underline' : 'none',
                  fontSize: `${Math.min(22, fonts['Title Font'].size / 2)}px`
                }}
                className="font-semibold line-clamp-1 px-0.5 text-gray-200 mt-3 w-full text-left"
              >
                {instructions.trim() ? instructions.slice(0, 100) : 'Video Title'}
              </h2>
            </div>
          </div>
        </div>

        {/* 2. Upload / Describe Background Box (Stretches full width) */}
        <div className="w-full flex-grow flex flex-col justify-between rounded-xl border border-gray-900 bg-gray-900/20 p-5 gap-3 min-h-[140px]">
          <div className="flex-grow w-full flex flex-col">
            <label className="text-[10px] font-bold text-gray-500 block mb-1">Upload/Describe Background</label>
            <textarea
              value={bgDescription}
              onChange={(e) => setBgDescription(e.target.value)}
              placeholder="Describe background scene aesthetics..."
              className="w-full flex-grow resize-none premium-input px-3.5 py-2.5 text-xs rounded-lg bg-gray-950/60 min-h-[60px]"
            />
          </div>
          <div className="flex items-center gap-3 self-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2 px-4 text-xs font-semibold rounded-lg transition-all duration-300 whitespace-nowrap"
            >
              <UploadSimple size={14} className="text-white" />
              Upload Background
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            {backgroundImage && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 whitespace-nowrap">Loaded</span>
            )}
          </div>
        </div>

        {/* 3. Bottom Row: Upload Assets & Generate (Stretches full width) */}
        <div className="w-full flex items-center justify-between gap-4 mt-1">
          <div>
            <button
              onClick={() => assetInputRef.current?.click()}
              className="flex items-center gap-2 premium-button-secondary py-2.5 px-5 text-xs rounded-lg hover:border-gray-700 transition-colors"
            >
              <UploadSimple size={16} className="text-purple-400" />
              Upload Assets
            </button>
            <input
              type="file"
              multiple
              ref={assetInputRef}
              onChange={handleAssetUpload}
              className="hidden"
            />
            {uploadedAssets.length > 0 && (
              <span className="text-[10px] text-gray-500 ml-2">
                ({uploadedAssets.length} assets selected)
              </span>
            )}
          </div>

          <button
            className="premium-button-primary py-2.5 px-10 text-xs font-semibold rounded-lg shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
          >
            Generate
          </button>
        </div>
      </main>
    </div>
  );
};

export default YoutubeVideoCreator;
