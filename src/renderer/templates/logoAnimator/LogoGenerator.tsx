import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, UploadSimple, Warning, Image as ImageIcon, Sparkle, Info } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { callLLM, getStoredConfig } from "@/renderer/agents/llmClient";
import { ProjectData } from "@/renderer/pages/AppRouter";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";
import { BrandStylingPanel, FontSettings } from "@/renderer/components/BrandStylingPanel";
import { CustomInstructionsPanel } from "@/renderer/components/CustomInstructionsPanel";
import { PipelineState } from "@/renderer/agents/types";
import { BackgroundSelection } from "@/renderer/components/BackgroundSelectorPanel";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import {
  runLogoPipeline,
  LOGO_STYLE_PRESETS,
  LogoStylePreset,
  isMultimodalCapable,
  isSvgFile
} from "./logoPipeline";

interface LogoGeneratorProps {
  project: ProjectData | null;
  onBack: (updated?: ProjectData) => void;
  onGenerate: (data: ProjectData) => void;
  onUpdateProject?: (data: ProjectData) => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

type FontRow = 'Title Font' | 'Heading' | 'Paragraph';

const defaultFonts: Record<FontRow, FontSettings> = {
  'Title Font': { fontFamily: 'Inter', bold: true, italic: false, underline: false, color: '#fff', size: 48 },
  Heading: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#e2e8f0', size: 32 },
  Paragraph: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#94a3b8', size: 14 },
};

const defaultSwatches: Record<string, string> = {
  Primary: '#8b5cf6',
  Secondary: '#a78bfa',
  Accent: '#f59e0b',
  Background: '#030712',
  GlowColor: 'rgba(139, 92, 246, 0.5)',
};

const STATUS_LABELS: Record<string, string> = {
  'laying-out': 'Preparing logo...',
  'designing': 'Creating animation...',
  'animating': 'Adding motion...',
  'compiling': 'Verifying & assembling...',
  'storyboarding': 'Starting up...',
  'done': 'Complete!',
  'error': 'Error',
};

export const LogoGenerator: React.FC<LogoGeneratorProps> = ({
  onBack,
  onGenerate,
  onUpdateProject,
  project,
  customAlert,
}) => {
  const [instructions, setInstructions] = useState(
    project?.prompt || 'Create a smooth 3d spinning logo reveal with glowing neon particles and backdrop shadows'
  );
  const [fonts, setFonts] = useState<Record<string, any>>(project?.fonts as any || defaultFonts);
  const [swatches, setSwatches] = useState<Record<string, string>>(project?.colors || defaultSwatches);
  const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans', 'Outfit']);
  const [isRefining, setIsRefining] = useState(false);
  const [bgSelection, setBgSelection] = useState<BackgroundSelection>(project?.bgSelection || { type: 'color', color: '#09090b', blurPx: 0 });
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [logoFileUrl, setLogoFileUrl] = useState<string>((project as any)?.logoUrl || '');
  const [logoFileName, setLogoFileName] = useState<string>((project as any)?.logoFileName || '');
  const [selectedStyle, setSelectedStyle] = useState<LogoStylePreset>(LOGO_STYLE_PRESETS[1]); // Default to 3D Spin
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [animKey, setAnimKey] = useState<number>(1);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Detect multimodal capability of the current model
  const currentConfig = getStoredConfig();
  const isModelMultimodal = currentConfig ? isMultimodalCapable(currentConfig.provider, currentConfig.model) : false;
  const logoIsSvg = logoFileName ? isSvgFile(logoFileName) : false;

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

    // Trigger initial 3.5s preview animation on load
    triggerPreviewAnimation();
  }, []);

  const triggerPreviewAnimation = () => {
    setIsAnimating(true);
    setAnimKey((prev) => prev + 1);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 3500);
  };

  const handleSelectStylePreset = (preset: LogoStylePreset) => {
    setSelectedStyle(preset);
    if (preset.id !== 'custom') {
      triggerPreviewAnimation();
    } else {
      setIsAnimating(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoFileUrl(url);
      setLogoFileName(file.name);
      if (selectedStyle.id !== 'custom') {
        triggerPreviewAnimation();
      }
    }
  };

  const handleRefinePrompt = async () => {
    if (!instructions.trim()) return;
    const config = getStoredConfig();
    if (!config) {
      await customAlert('Setup Required', 'Please configure API key first using the settings menu');
      return;
    }
    setIsRefining(true);
    try {
      const systemPrompt =
        "You are an AI prompt engineer for logo motion-graphics animations. " +
        "Refine the user's logo animation concept to be vivid, professional, and detailed for keyframe rendering. " +
        `The selected animation style is "${selectedStyle.label}" (${selectedStyle.description}). ` +
        "Keep total animation time within 5 seconds (150 frames @ 30fps). " +
        "Return ONLY the refined prompt text with no intro or wrapper text.";
      const response = await callLLM(config, systemPrompt, instructions);
      if (response.error) {
        await customAlert("AI Error", `Error refining prompt: ${response.error}`);
      } else if (response.content) {
        setInstructions(response.content.trim());
      }
    } catch (err) {
      await customAlert("AI Error", `Failed to refine prompt: ${err}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleBack = () => {
    if (project) {
      onBack({
        ...project,
        prompt: instructions,
        fonts,
        colors: swatches,
        bgSelection,
        logoUrl: logoFileUrl,
        logoFileName,
      } as any);
    } else {
      onBack();
    }
  };

  const handleGenerateClick = async () => {
    if (!instructions.trim()) {
      await customAlert("Missing Instructions", "Please enter an animation prompt before generating.");
      return;
    }

    // Warn if non-multimodal model with a non-SVG logo
    if (logoFileName && !logoIsSvg && !isModelMultimodal) {
      await customAlert(
        "SVG Required",
        "Your current AI model does not support images. Only SVG logos are supported with text-only models. Please upload an SVG file or switch to a multimodal model (GPT-4o, Gemini, Claude 3+) in Settings."
      );
      return;
    }

    setPipelineState({ status: 'storyboarding', progress: 0.02 });

    const output = await runLogoPipeline({
      prompt: instructions,
      stylePreset: selectedStyle,
      logoFileUrl,
      logoFileName,
      fonts,
      colors: swatches,
      bgSelection: bgSelection as any,
      savePath: project?.savePath,
      projectTitle: project?.title,
      onState: setPipelineState,
      onCheckpoint: (checkpoint) => {
        if (onUpdateProject && project) {
          onUpdateProject({
            ...project,
            ...checkpoint,
            fonts,
            colors: swatches,
            bgSelection,
            logoUrl: logoFileUrl,
            logoFileName,
          } as any);
        }
      },
    });

    if (output && output.length > 0) {
      onGenerate({
        ...project,
        title: project?.title || 'Logo Animation',
        prompt: instructions,
        narration: '',
        code: output,
        scenes: [{ id: 'scene_1', description: `Logo reveal: ${selectedStyle.label}`, duration: 150 }],
        showVisualizer: false,
        fonts,
        colors: swatches,
        bgSelection,
        logoUrl: logoFileUrl,
        logoFileName,
        unfinished: false,
        generationState: undefined,
        savePath: project?.savePath || '',
      } as any);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white page-enter">
      {/* LEFT COLUMN: Controls Sidebar */}
      <ResizableSidebar initialWidth={380} minWidth={320} maxWidth={650} className="border-r border-gray-900 bg-gray-950 p-5 gap-4 overflow-y-auto">
        <header className="flex items-center gap-2 border-b border-gray-900 pb-3">
          <button
            onClick={handleBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-900 hover:text-purple-400"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            title="Return to Dashboard"
          >
            <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45)) brightness(1.15)' }} />
            <span className="text-sm font-bold text-white">kinetic</span>
          </button>
          <span className="text-sm text-gray-700">/</span>
          <span className="text-sm text-purple-400 font-semibold">Logo</span>
        </header>

        {/* Context-Aware Notice Badge */}
        <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 leading-relaxed ${isModelMultimodal
          ? 'border-emerald-500/40 bg-gray-900 text-emerald-200'
          : 'border-amber-500/40 bg-gray-900 text-amber-200'
          }`}>
          {isModelMultimodal ? (
            <>
              <Info size={16} className="flex-shrink-0 text-emerald-400 mt-0.5" />
              <span>Your model supports images — SVG, PNG, JPG, and WebP logos are all supported.</span>
            </>
          ) : (
            <>
              <Warning size={16} className="flex-shrink-0 text-amber-400 mt-0.5" />
              <span>Your model does not support images. Only <strong>.svg</strong> logos are supported. Switch to a multimodal model (GPT-4o, Gemini, Claude 3+) for full image support.</span>
            </>
          )}
        </div>

        {/* Logo File Upload Section */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-purple-400" />
              Logo Asset
            </h4>
            {logoFileName && (
              <span className="text-[11px] text-gray-400 truncate max-w-[140px]" title={logoFileName}>
                {logoFileName}
              </span>
            )}
          </div>

          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept=".svg,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />

          <div
            onClick={() => logoInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-800 rounded-lg bg-gray-950 hover:bg-gray-900 hover:border-purple-500 cursor-pointer transition-all gap-2 group"
          >
            {logoFileUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img src={logoFileUrl} alt="Uploaded logo preview" className="h-12 w-auto max-w-[160px] object-contain drop-shadow-md" />
                <span className="text-[11px] text-purple-400 font-medium group-hover:underline">Change logo image</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="h-9 w-9 rounded-full bg-gray-900 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <UploadSimple size={18} />
                </div>
                <span className="text-xs font-semibold text-gray-300">Click or drop SVG / Image logo</span>
                <span className="text-[10px] text-gray-500">Supports SVG, PNG, JPG, WebP</span>
              </div>
            )}
          </div>
        </section>

        {/* Animation Style Selector */}
        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Sparkle size={14} className="text-purple-400" />
            Animation Style
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {LOGO_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectStylePreset(preset)}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${selectedStyle.id === preset.id
                  ? 'border-2 border-purple-500 text-purple-300 bg-transparent font-bold'
                  : 'border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300 bg-transparent'
                  }`}
                title={preset.description}
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
          {selectedStyle && (
            <p className="text-[10px] text-gray-500 leading-relaxed pl-1">
              {selectedStyle.description}
            </p>
          )}
        </section>

        {/* Brand Styling Panel */}
        <BrandStylingPanel
          fonts={fonts}
          setFonts={setFonts}
          swatches={swatches}
          setSwatches={setSwatches}
          availableFonts={availableFonts}
          bgSelection={bgSelection}
          onSelectBackground={setBgSelection}
        />
      </ResizableSidebar>

      {/* RIGHT COLUMN: Preview Canvas & Execution */}
      <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950 justify-between h-full">
        {/* Preview Canvas */}
        <PreviewWindow title="Logo Reveal Canvas">
          <style>{`
            @keyframes logo-3d-spin {
              0% { transform: perspective(800px) rotateY(-180deg) rotateX(15deg) scale(0.3); opacity: 0; filter: blur(10px); }
              50% { transform: perspective(800px) rotateY(90deg) rotateX(-5deg) scale(1.1); opacity: 1; filter: blur(0px); }
              100% { transform: perspective(800px) rotateY(0deg) rotateX(0deg) scale(1); opacity: 1; filter: blur(0px); }
            }
            @keyframes particle-spark-fly {
              0% { transform: translate(var(--startX), var(--startY)) scale(1.6); opacity: 0; filter: blur(3px); }
              25% { opacity: 1; filter: blur(0px); }
              45% { transform: translate(0, 0) scale(0.3); opacity: 1; filter: drop-shadow(0 0 10px #8b5cf6); }
              52% { transform: translate(0, 0) scale(3.5); opacity: 0; filter: blur(12px); }
              100% { transform: translate(0, 0) scale(0); opacity: 0; }
            }
            @keyframes logo-particle-burst-reveal {
              0% { transform: scale(0.01); opacity: 0; filter: brightness(4) blur(20px); }
              42% { transform: scale(0.01); opacity: 0; filter: brightness(4) blur(20px); }
              50% { transform: scale(1.3); opacity: 1; filter: brightness(2.5) blur(4px) drop-shadow(0 0 50px #8b5cf6); }
              70% { transform: scale(0.96); opacity: 1; filter: brightness(1.2) drop-shadow(0 0 25px #8b5cf6); }
              100% { transform: scale(1); opacity: 1; filter: brightness(1) drop-shadow(0 15px 35px rgba(139,92,246,0.4)); }
            }
            @keyframes logo-neon-glow {
              0% { opacity: 0; filter: drop-shadow(0 0 0px transparent); transform: scale(0.85); }
              40% { opacity: 1; filter: drop-shadow(0 0 40px #8b5cf6) drop-shadow(0 0 80px #a78bfa); transform: scale(1.08); }
              100% { opacity: 1; filter: drop-shadow(0 0 20px rgba(139,92,246,0.6)); transform: scale(1); }
            }
            @keyframes logo-bounce-drop {
              0% { transform: translateY(-220px) scaleY(1.4) scaleX(0.6); opacity: 0; }
              55% { transform: translateY(25px) scaleY(0.75) scaleX(1.25); opacity: 1; }
              75% { transform: translateY(-12px) scaleY(1.1) scaleX(0.9); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes logo-scale-fade {
              0% { transform: scale(0.15); opacity: 0; filter: blur(25px); }
              100% { transform: scale(1); opacity: 1; filter: blur(0px); }
            }
            @keyframes logo-glitch-reveal {
              0% { transform: translate(-15px, 10px) skewX(25deg); opacity: 0; filter: invert(0.8) hue-rotate(90deg); }
              20% { transform: translate(15px, -8px) skewX(-25deg); opacity: 0.6; }
              40% { transform: translate(-8px, 4px) skewX(12deg); opacity: 0.8; }
              70% { transform: translate(4px, -2px) skewX(-5deg); opacity: 0.95; }
              100% { transform: translate(0, 0) skewX(0deg); opacity: 1; filter: none; }
            }
            @keyframes logo-shatter-tl {
              0% { transform: translate(-240px, -200px) rotate(-45deg) scale(0.2); opacity: 0; }
              45% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
            }
            @keyframes logo-shatter-tr {
              0% { transform: translate(240px, -200px) rotate(45deg) scale(0.2); opacity: 0; }
              45% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
            }
            @keyframes logo-shatter-bl {
              0% { transform: translate(-240px, 200px) rotate(-35deg) scale(0.2); opacity: 0; }
              45% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
            }
            @keyframes logo-shatter-br {
              0% { transform: translate(240px, 200px) rotate(35deg) scale(0.2); opacity: 0; }
              45% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
              100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
            }
            @keyframes logo-stroke-draw {
              0% {
                clip-path: inset(0 100% 0 0);
                filter: grayscale(1) contrast(4) brightness(0.6) invert(0.1);
                opacity: 0.3;
                transform: scale(0.97);
              }
              60% {
                clip-path: inset(0 0% 0 0);
                filter: grayscale(1) contrast(3) brightness(0.7);
                opacity: 0.95;
                transform: scale(1.02);
              }
              100% {
                clip-path: inset(0 0% 0 0);
                filter: grayscale(0) contrast(1) brightness(1);
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes logo-cinematic-zoom {
              0% { transform: scale(3.5); opacity: 0; filter: blur(30px); }
              100% { transform: scale(1); opacity: 1; filter: blur(0px); }
            }
          `}</style>

          <div
            className="absolute inset-0 z-0 transition-all duration-300 flex items-center justify-center overflow-hidden"
            style={{
              ...(bgSelection?.type === 'color' && { backgroundColor: bgSelection.color }),
              ...(bgSelection?.type === 'gradient' && { backgroundImage: (bgSelection as any).gradient }),
              ...(bgSelection?.type === 'image' && (bgSelection as any).imageUrl && {
                backgroundImage: `url(${(bgSelection as any).imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: bgSelection.blurPx ? `blur(${bgSelection.blurPx}px)` : undefined,
              }),
            }}
          >
            {/* Centered Logo Preview */}
            <div className="relative z-10 flex flex-col items-center justify-center p-8 transition-all">
              {selectedStyle.id === 'shatter-reform' && isAnimating ? (
                <div
                  key={animKey}
                  onClick={() => triggerPreviewAnimation()}
                  title="Click logo to replay preview animation"
                  className="cursor-pointer relative max-h-[220px] max-w-[380px]"
                >
                  {/* Fragment 1: Top-Left Jagged Shard */}
                  <img
                    src={logoFileUrl || logoIcon}
                    alt="Fragment TL"
                    className="max-h-[220px] max-w-[380px] object-contain drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]"
                    style={{
                      clipPath: 'polygon(0 0, 62% 0, 44% 48%, 0 68%)',
                      animation: 'logo-shatter-tl 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
                    }}
                  />
                  {/* Fragment 2: Top-Right Jagged Shard */}
                  <img
                    src={logoFileUrl || logoIcon}
                    alt="Fragment TR"
                    className="absolute inset-0 max-h-[220px] max-w-[380px] object-contain drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]"
                    style={{
                      clipPath: 'polygon(62% 0, 100% 0, 100% 54%, 44% 48%)',
                      animation: 'logo-shatter-tr 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
                    }}
                  />
                  {/* Fragment 3: Bottom-Left Jagged Shard */}
                  <img
                    src={logoFileUrl || logoIcon}
                    alt="Fragment BL"
                    className="absolute inset-0 max-h-[220px] max-w-[380px] object-contain drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]"
                    style={{
                      clipPath: 'polygon(0 68%, 44% 48%, 56% 100%, 0 100%)',
                      animation: 'logo-shatter-bl 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
                    }}
                  />
                  {/* Fragment 4: Bottom-Right Jagged Shard */}
                  <img
                    src={logoFileUrl || logoIcon}
                    alt="Fragment BR"
                    className="absolute inset-0 max-h-[220px] max-w-[380px] object-contain drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]"
                    style={{
                      clipPath: 'polygon(44% 48%, 100% 54%, 100% 100%, 56% 100%)',
                      animation: 'logo-shatter-br 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
                    }}
                  />
                </div>
              ) : selectedStyle.id === 'particle-burst' && isAnimating ? (
                <div
                  key={animKey}
                  onClick={() => triggerPreviewAnimation()}
                  title="Click logo to replay preview animation"
                  className="cursor-pointer relative flex items-center justify-center max-h-[220px] max-w-[380px]"
                >
                  {/* 24 Particle Sparks flying inward */}
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i * 360) / 24;
                    const rad = (angle * Math.PI) / 180;
                    const startDist = 180 + (i % 3) * 40;
                    const startX = Math.cos(rad) * startDist;
                    const startY = Math.sin(rad) * startDist;
                    const colors = ['#8b5cf6', '#a78bfa', '#f59e0b', '#38bdf8', '#ec4899', '#10b981'];
                    const color = colors[i % colors.length];
                    const size = 6 + (i % 4) * 2;

                    return (
                      <div
                        key={i}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: color,
                          boxShadow: `0 0 12px ${color}, 0 0 20px ${color}`,
                          animation: `particle-spark-fly 3.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                          animationDelay: `${(i % 5) * 0.04}s`,
                          ['--startX' as any]: `${startX}px`,
                          ['--startY' as any]: `${startY}px`,
                        }}
                      />
                    );
                  })}

                  {/* Shockwave Burst + Logo Reveal */}
                  <img
                    src={logoFileUrl || logoIcon}
                    alt={logoFileName || "Kinetic Logo Preview"}
                    className="max-h-[220px] max-w-[380px] object-contain"
                    style={{
                      animation: 'logo-particle-burst-reveal 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  />
                </div>
              ) : (
                <div
                  key={animKey}
                  onClick={() => selectedStyle.id !== 'custom' && triggerPreviewAnimation()}
                  title="Click logo to replay preview animation"
                  className="cursor-pointer flex flex-col items-center gap-2"
                  style={{
                    animation: (isAnimating && selectedStyle.id !== 'custom')
                      ? (
                        selectedStyle.id === '3d-spin' ? 'logo-3d-spin 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards' :
                        selectedStyle.id === 'particle-burst' ? 'logo-particle-burst 3.5s ease-out forwards' :
                        selectedStyle.id === 'neon-glow' ? 'logo-neon-glow 3.5s ease-in-out forwards' :
                        selectedStyle.id === 'bounce-drop' ? 'logo-bounce-drop 3.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' :
                        selectedStyle.id === 'glitch-reveal' ? 'logo-glitch-reveal 3.5s steps(6, end) forwards' :
                        selectedStyle.id === 'stroke-draw' ? 'logo-stroke-draw 3.5s ease-out forwards' :
                        selectedStyle.id === 'cinematic-zoom' ? 'logo-cinematic-zoom 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' :
                        'logo-scale-fade 3.5s ease-out forwards'
                      )
                      : undefined,
                  }}
                >
                  <img
                    src={logoFileUrl || logoIcon}
                    alt={logoFileName || "Kinetic Logo Preview"}
                    className="max-h-[220px] max-w-[380px] object-contain drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]"
                  />
                </div>
              )}
            </div>
          </div>
        </PreviewWindow>

        {/* Custom Instructions Panel */}
        <div className="w-full">
          <CustomInstructionsPanel
            instructions={instructions}
            setInstructions={setInstructions}
            isRefining={isRefining}
            handleRefinePrompt={handleRefinePrompt}
            placeholder="Describe your logo animation (e.g., 3D spin, glowing particle reveal, stroke draw-in)..."
          />
        </div>

        {/* Bottom Action Footer */}
        <footer className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4 gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-transparent text-purple-300 border border-purple-500/50">
              5s @ 30 FPS
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent text-gray-400 border border-gray-800">
              {selectedStyle.label}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-grow justify-end">
            {pipelineState && pipelineState.status !== 'idle' && (
              <div className="flex flex-col gap-1 w-52">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>{STATUS_LABELS[pipelineState.status] || pipelineState.status}</span>
                  <span>{Math.round((pipelineState.progress || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-500 ease-out"
                    style={{ width: `${(pipelineState.progress || 0) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateClick}
              disabled={!!pipelineState && pipelineState.status !== 'done' && pipelineState.status !== 'error' && pipelineState.status !== 'idle'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkle size={16} className="text-purple-200" />
              <span>Generate</span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};