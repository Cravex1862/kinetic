import React, { useState, useEffect } from 'react';
import { BrowserFrame, SidebarLayout } from '../primitives/StructuralSDK';
import { BarChartCard } from '../primitives/ChartsSDK';
import { GlassmorphicCard } from '../primitives/CardSDK';
import type { GlowConfig } from '../primitives/types';
import { X, FloppyDisk, Copy, Trash, Check } from '@phosphor-icons/react';

export interface TiltPreset {
  id: string;
  name: string;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;
  translateZ: number;
  translateX: number;
  translateY: number;
  scale: number;
  frameWidth: number;
  frameHeight: number;
  glowColor: string;
  glowSpread: number;
  glowIntensity: number;
  url: string;
  createdAt: string;
}

interface TiltConfigurerProps {
  onClose: () => void;
  customAlert?: (title: string, message: string) => Promise<void>;
}

const DEFAULT_PRESET_FILE = 'C:/Users/kalic/Ashwin/SaaS testing/tilt_presets.json';
const FALLBACK_PRESET_FILE = 'tilt_presets.json';

export const TiltConfigurer: React.FC<TiltConfigurerProps> = ({ onClose, customAlert }) => {
  const [presetName, setPresetName] = useState('My 3D Angle');
  const [rotateX, setRotateX] = useState(18);
  const [rotateY, setRotateY] = useState(-6);
  const [rotateZ, setRotateZ] = useState(0);
  const [perspective, setPerspective] = useState(1200);
  const [translateZ, setTranslateZ] = useState(60);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [frameWidth, setFrameWidth] = useState(1150);
  const [frameHeight, setFrameHeight] = useState(650);
  const [glowColor, setGlowColor] = useState('rgba(6, 182, 212, 0.4)');
  const [glowSpread, setGlowSpread] = useState(35);
  const [glowIntensity, setGlowIntensity] = useState(5);
  const [url, setUrl] = useState('https://app.hyper-scale.io/live');

  const [presets, setPresets] = useState<TiltPreset[]>([]);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load existing presets from disk on mount
  useEffect(() => {
    const loadPresets = async () => {
      if (window.electronAPI) {
        try {
          const content = await window.electronAPI.readFile(DEFAULT_PRESET_FILE);
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) setPresets(parsed);
          }
        } catch {
          // Fallback to secondary location
          try {
            const content2 = await window.electronAPI.readFile(FALLBACK_PRESET_FILE);
            if (content2) {
              const parsed2 = JSON.parse(content2);
              if (Array.isArray(parsed2)) setPresets(parsed2);
            }
          } catch {
            console.log('No existing presets file found yet.');
          }
        }
      }
    };
    loadPresets();
  }, []);

  const handleSavePreset = async () => {
    const newPreset: TiltPreset = {
      id: `preset_${Date.now()}`,
      name: presetName.trim() || 'Untitled Preset',
      rotateX,
      rotateY,
      rotateZ,
      perspective,
      translateZ,
      translateX,
      translateY,
      scale,
      frameWidth,
      frameHeight,
      glowColor,
      glowSpread,
      glowIntensity,
      url,
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);

    const jsonString = JSON.stringify(updated, null, 2);

    if (window.electronAPI) {
      try {
        await window.electronAPI.writeFile(DEFAULT_PRESET_FILE, jsonString);
        await window.electronAPI.writeFile(FALLBACK_PRESET_FILE, jsonString);
      } catch (err) {
        console.error('Error writing preset file:', err);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectPreset = (p: TiltPreset) => {
    setPresetName(p.name);
    setRotateX(p.rotateX);
    setRotateY(p.rotateY);
    setRotateZ(p.rotateZ ?? 0);
    setPerspective(p.perspective);
    setTranslateZ(p.translateZ);
    setTranslateX(p.translateX ?? 0);
    setTranslateY(p.translateY ?? 0);
    setScale(p.scale ?? 1.0);
    setFrameWidth(p.frameWidth ?? 1150);
    setFrameHeight(p.frameHeight ?? 650);
    setGlowColor(p.glowColor ?? 'rgba(6, 182, 212, 0.4)');
    setGlowSpread(p.glowSpread ?? 35);
    setGlowIntensity(p.glowIntensity ?? 5);
    if (p.url) setUrl(p.url);
  };

  const handleDeletePreset = async (id: string) => {
    const filtered = presets.filter((p) => p.id !== id);
    setPresets(filtered);
    const jsonString = JSON.stringify(filtered, null, 2);
    if (window.electronAPI) {
      try {
        await window.electronAPI.writeFile(DEFAULT_PRESET_FILE, jsonString);
        await window.electronAPI.writeFile(FALLBACK_PRESET_FILE, jsonString);
      } catch (err) {
        console.error('Error updating preset file after delete:', err);
      }
    }
  };

  const handleCopyCode = () => {
    const codeSnippet = `// 3D Tilt Config: ${presetName}
rotateX: ${rotateX},
rotateY: ${rotateY},
rotateZ: ${rotateZ},
perspective: ${perspective},
translateZ: ${translateZ},
glowConfig: { enabled: true, color: '${glowColor}', spread: ${glowSpread}, intensity: ${glowIntensity} }`;

    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentGlow: GlowConfig = {
    enabled: true,
    color: glowColor,
    spread: glowSpread,
    intensity: glowIntensity,
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-950/95 text-white backdrop-blur-lg">
      {/* Sidebar Controls Panel */}
      <div className="w-[420px] h-full border-r border-gray-800 bg-gray-900/90 flex flex-col p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-purple-400">📐 3D Tilt Configurer</h2>
            <p className="text-xs text-gray-400">Tweak angles and save presets to JSON</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Name & Actions */}
        <div className="space-y-3 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Preset Name</label>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="e.g. Hero Isometric Right"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSavePreset}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg font-medium text-xs transition"
            >
              {savedSuccess ? <Check size={16} /> : <FloppyDisk size={16} />}
              {savedSuccess ? 'Saved to JSON!' : 'Save Preset to JSON'}
            </button>
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 px-3 rounded-lg text-xs transition"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* 3D Transform Sliders */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider border-b border-gray-800 pb-2">
            3D Rotations & Perspective
          </h3>

          {/* Rotate X */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Rotate X (Tilt Up/Down)</span>
              <span className="font-mono text-purple-400">{rotateX}°</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              value={rotateX}
              onChange={(e) => setRotateX(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Rotate Y */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Rotate Y (Side Angle)</span>
              <span className="font-mono text-purple-400">{rotateY}°</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              value={rotateY}
              onChange={(e) => setRotateY(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Rotate Z */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Rotate Z (Roll Spin)</span>
              <span className="font-mono text-purple-400">{rotateZ}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              value={rotateZ}
              onChange={(e) => setRotateZ(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Perspective */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Perspective (Lens Depth)</span>
              <span className="font-mono text-purple-400">{perspective}px</span>
            </div>
            <input
              type="range"
              min="400"
              max="3000"
              step="50"
              value={perspective}
              onChange={(e) => setPerspective(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Translate X */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Translate X (3D Push X)</span>
              <span className="font-mono text-purple-400">{translateX}px</span>
            </div>
            <input
              type="range"
              min="-400"
              max="400"
              value={translateX}
              onChange={(e) => setTranslateX(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Translate Y */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Translate Y (3D Push Y)</span>
              <span className="font-mono text-purple-400">{translateY}px</span>
            </div>
            <input
              type="range"
              min="-400"
              max="400"
              value={translateY}
              onChange={(e) => setTranslateY(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Translate Z */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Translate Z (3D Push Depth)</span>
              <span className="font-mono text-purple-400">{translateZ}px</span>
            </div>
            <input
              type="range"
              min="-400"
              max="400"
              value={translateZ}
              onChange={(e) => setTranslateZ(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider border-b border-gray-800 pb-2 pt-2">
            Dimensions & Position
          </h3>

          {/* Scale */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Scale Zoom</span>
              <span className="font-mono text-purple-400">{scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Width */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Frame Width</span>
              <span className="font-mono text-purple-400">{frameWidth}px</span>
            </div>
            <input
              type="range"
              min="800"
              max="1600"
              step="20"
              value={frameWidth}
              onChange={(e) => setFrameWidth(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Height */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Frame Height</span>
              <span className="font-mono text-purple-400">{frameHeight}px</span>
            </div>
            <input
              type="range"
              min="500"
              max="900"
              step="20"
              value={frameHeight}
              onChange={(e) => setFrameHeight(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider border-b border-gray-800 pb-2 pt-2">
            Glow & Ambient Effects
          </h3>

          {/* Glow Spread */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Glow Spread</span>
              <span className="font-mono text-purple-400">{glowSpread}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={glowSpread}
              onChange={(e) => setGlowSpread(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>

          {/* Glow Intensity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Glow Intensity</span>
              <span className="font-mono text-purple-400">{glowIntensity}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(Number(e.target.value))}
              className="w-full accent-purple-500 bg-gray-800 rounded h-1.5 cursor-pointer"
            />
          </div>
        </div>

        {/* Saved Presets List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
            Saved Presets ({presets.length})
          </h3>
          {presets.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No saved presets yet. Click Save to add one!</p>
          ) : (
            <div className="space-y-2">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-gray-950/80 hover:bg-gray-800 border border-gray-800 p-2.5 rounded-lg transition text-xs group cursor-pointer"
                  onClick={() => handleSelectPreset(p)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-purple-300">{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      X:{p.rotateX}° Y:{p.rotateY}° Z:{p.rotateZ ?? 0}° P:{p.perspective}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(p.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition rounded"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 h-full flex flex-col bg-gray-950 overflow-hidden relative">
        <div className="h-12 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6">
          <span className="text-xs font-medium text-gray-400">Live 3D Viewport Preview</span>
          <span className="text-xs font-mono text-purple-300 bg-transparent border border-purple-500/60 px-2 py-0.5 rounded">
            rotateX: {rotateX}° | rotateY: {rotateY}° | rotateZ: {rotateZ}° | perspective: {perspective}px
          </span>
        </div>

        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: '#030712',
            backgroundImage: `radial-gradient(#1E293B 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
        >
          <div
            style={{
              perspective: `${perspective}px`,
              perspectiveOrigin: '50% 50%',
              transformStyle: 'preserve-3d',
              width: frameWidth,
              height: frameHeight,
              transform: `scale(${scale}) translateX(${translateX}px) translateY(${translateY}px)`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <BrowserFrame
              osType="mac"
              url={url}
              width={frameWidth}
              height={frameHeight}
              borderRadius={20}
              glowConfig={currentGlow}
              rotateX={rotateX}
              rotateY={rotateY}
              rotateZ={rotateZ}
              perspective={perspective}
              translateZ={translateZ}
              translateX={translateX}
              translateY={translateY}
            >
              <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#0F172A' }}>
                <SidebarLayout
                  appName="HyperScale"
                  menuItems={[
                    { id: 'live', label: 'Live Metrics', active: true },
                    { id: 'analytics', label: 'Analytics' },
                    { id: 'reports', label: 'Reports' },
                    { id: 'settings', label: 'Settings' },
                  ]}
                  activeMenuItemId="live"
                  showCollapseButton={false}
                  showProfileFooter={true}
                  profileName="Alex Vance"
                  profileHandle="@alex"
                  isVerified={true}
                  width={260}
                  borderRadius={0}
                  padding={24}
                  backgroundColor="#0F172A"
                />

                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    padding: '32px',
                    backgroundColor: '#0B1120',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <BarChartCard
                    titleText="Quarterly Growth"
                    data={[
                      { label: 'Q1', value: 45, color: '#10B981' },
                      { label: 'Q2', value: 68, color: '#10B981' },
                      { label: 'Q3', value: 85, color: '#10B981' },
                      { label: 'Q4', value: 120, color: '#10B981' },
                    ]}
                    barColor="#10B981"
                    barSpacing={32}
                    barBorderRadius={8}
                    showGridLines={true}
                    yAxisTicks={[0, 40, 80, 120]}
                    xAxisTitle="Quarters"
                    yAxisTitle="Revenue ($K)"
                    height={420}
                    borderRadius={16}
                    padding={28}
                    backgroundColor="#0F172A"
                  />

                  <div
                    style={{
                      position: 'absolute',
                      top: '48px',
                      right: '48px',
                      zIndex: 20,
                      transform: 'translateZ(60px) rotateX(4deg)',
                    }}
                  >
                    <GlassmorphicCard
                      glowConfig={{
                        enabled: true,
                        color: 'rgba(168, 85, 247, 0.35)',
                        spread: 25,
                        intensity: 4,
                      }}
                      blur={20}
                      saturate={1.8}
                      borderOpacity={0.15}
                      width={280}
                      height={150}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontFamily: 'sans-serif', color: '#94A3B8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                          Performance
                        </span>
                        <span
                          style={{
                            background: 'linear-gradient(to right, #818CF8, #C084FC)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '28px',
                            fontWeight: '800',
                            fontFamily: 'sans-serif',
                          }}
                        >
                          +148% ARR
                        </span>
                      </div>
                      <div
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#34D399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '700',
                          marginTop: '10px',
                          width: 'fit-content',
                        }}
                      >
                        ● Live Active
                      </div>
                    </GlassmorphicCard>
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </div>
    </div>
  );
};
