import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkle, UploadSimple, Palette, FilmStrip, Play, SpeakerHigh, Gear, CornersOut, Repeat, ClosedCaptioning, PictureInPicture } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { BrandStylingPanel } from '@/renderer/components/BrandStylingPanel';
import { BackgroundSelection } from '@/renderer/components/BackgroundSelectorPanel';
import { ResizableSidebar } from '@/renderer/components/ResizableSidebar';
import { CustomInstructionsPanel } from '@/renderer/components/CustomInstructionsPanel';
import { AudioUploadField } from '@/renderer/components/AudioUploadField';
import { runBeatNetAI } from '@/renderer/utils/beatDetector';

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
  const [bgSelection, setBgSelection] = useState<BackgroundSelection>({ type: 'color', color: '#09090b', blurPx: 0 });
  const [scanning, setScanning] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [beatFrames, setBeatFrames] = useState<number[]>([]);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);

  const handleSelectAudio = async (file: File | null) => {
    setAudioFile(file);
    if (!file) {
      setBeatFrames([]);
      return;
    }
    setIsAnalyzingAudio(true);
    const predictions = await runBeatNetAI(file);
    const frames = predictions.map((p) => p.frame);
    setBeatFrames(frames);
    setIsAnalyzingAudio(false);
  };

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
      {/* LEFT SIDEBAR - Configuration Panel */}
      <ResizableSidebar initialWidth={380} minWidth={320} maxWidth={650} className="border-r border-gray-900 bg-gray-950 p-5 gap-4 overflow-y-auto">
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
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-400 mb-2">Upload Script</h4>
          <textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Enter YouTube video script..."
            className="w-full h-24 resize-none premium-input p-2.5 text-xs rounded-lg bg-gray-950"
          />
        </section>

        {/* Section 2: Styling & Brand Guidelines + Backgrounds */}
        <BrandStylingPanel
          fonts={fonts as any}
          setFonts={setFonts}
          swatches={swatches}
          setSwatches={setSwatches}
          availableFonts={availableFonts}
          bgSelection={bgSelection}
          onSelectBackground={setBgSelection}
        />
      </ResizableSidebar>

      {/* RIGHT MAIN AREA (Stretches to 75% width, content flows full width) */}
      <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950 justify-between h-full">
        
        {/* 1. Preview Window Box (Stretches full width, aspect-video 16:9) */}
        <div className="w-full aspect-video rounded-2xl border border-gray-800 bg-gray-900 p-5 relative overflow-hidden flex-shrink-0">
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
                    className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-8 select-none"
                  >
                    {/* Ambient Glowing Orbs */}
                    <div 
                      style={{ background: `radial-gradient(circle, ${swatches['Primary']}44 0%, transparent 70%)` }}
                      className="absolute -top-10 -left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-pulse"
                    />
                    <div 
                      style={{ background: `radial-gradient(circle, ${swatches['Secondary']}33 0%, transparent 70%)` }}
                      className="absolute -bottom-10 -right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-pulse"
                    />

                    {/* Top Motion Badge */}
                    <div className="absolute top-4 left-6 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md z-10 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] font-semibold text-gray-300 tracking-wider uppercase">
                        Kinetic Motion Engine • 60 FPS
                      </span>
                    </div>

                    {/* Center Motion Graphics Composition */}
                    <div className="relative z-10 w-full max-w-lg flex flex-col gap-4 items-center text-center">
                      
                      {/* Animated Title Block */}
                      <div className="flex flex-col items-center gap-1 transition-all duration-300 transform hover:scale-105">
                        <h2 
                          style={{
                            fontFamily: fonts['Title Font'].fontFamily,
                            color: fonts['Title Font'].color,
                            fontWeight: fonts['Title Font'].bold ? 'bold' : 'normal',
                            fontStyle: fonts['Title Font'].italic ? 'italic' : 'normal',
                            textDecoration: fonts['Title Font'].underline ? 'underline' : 'none',
                            fontSize: `${Math.min(36, fonts['Title Font'].size)}px`,
                            textShadow: `0 4px 20px ${swatches['Primary']}66`
                          }}
                          className="tracking-tight leading-tight"
                        >
                          {instructions.trim() ? instructions.slice(0, 45) : 'SaaS Motion Showcase'}
                        </h2>
                        
                        <p 
                          style={{
                            fontFamily: fonts['Heading'].fontFamily,
                            color: fonts['Heading'].color,
                            fontSize: `${Math.min(18, fonts['Heading'].size)}px`
                          }}
                          className="opacity-90 font-medium max-w-md"
                        >
                          {bgDescription.trim() ? bgDescription.slice(0, 60) : 'Automated 60 FPS Remotion Video Engine'}
                        </p>
                      </div>

                      {/* Animated Motion Chart Card */}
                      <div className="w-full bg-gray-950/80 border border-white/15 rounded-xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 relative overflow-hidden group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span 
                              style={{ backgroundColor: swatches['Primary'] }}
                              className="w-3 h-3 rounded-full shadow-lg" 
                            />
                            <span className="text-xs font-bold text-gray-200">Revenue Growth Index</span>
                          </div>
                          <span 
                            style={{ color: swatches['Accent'] || '#10b981' }}
                            className="text-xs font-mono font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10"
                          >
                            +148.5%
                          </span>
                        </div>

                        {/* Animated Bar Chart Rows */}
                        <div className="flex items-end justify-between h-20 pt-2 gap-2 border-b border-white/10 pb-2">
                          {[35, 65, 45, 90, 75, 100].map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              <div 
                                style={{ 
                                  height: `${val}%`,
                                  background: idx === 5 
                                    ? `linear-gradient(to top, ${swatches['Primary']}, ${swatches['Secondary']})` 
                                    : `${swatches['Primary']}77`
                                }}
                                className="w-full rounded-t transition-all duration-700 hover:brightness-125 shadow-md"
                              />
                              <span className="text-[9px] font-mono text-gray-400">M{idx + 1}</span>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Cursor Overlay */}
                        <div 
                          className="absolute bottom-4 right-8 pointer-events-none transition-all duration-1000 transform hover:translate-x-2"
                        >
                          <svg className="w-6 h-6 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3l7 18 3-7 7-3L3 3z" />
                          </svg>
                        </div>
                      </div>

                    </div>

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
                        {narration.trim() ? narration.slice(0, 80) + '...' : 'Subtitles & captions will sync dynamically with audio narration'}
                      </p>
                    </div>
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



        {/* 2. Main Content Inputs: Custom Instructions & Beat Sync Audio */}
        <div className="w-full flex flex-col gap-4 mt-2">
          <CustomInstructionsPanel
            instructions={instructions}
            setInstructions={setInstructions}
            placeholder="Describe YouTube animation styling instructions..."
          />

          <AudioUploadField
            audioFile={audioFile}
            beatCount={beatFrames.length}
            isAnalyzing={isAnalyzingAudio}
            onSelectAudio={handleSelectAudio}
          />
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
