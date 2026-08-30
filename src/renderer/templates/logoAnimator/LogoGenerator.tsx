import React, { useState, useEffect, useRef } from "react";
import { UploadSimple, ArrowLeft, Sparkle } from "@phosphor-icons/react";
import logoIcon from "../../../../kinetic_brand/logo_transparent.svg";
import { ProjectData } from "@/renderer/pages/AppRouter";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";
import { DesignTokensPanel } from "@/renderer/components/DesignTokensPanel";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import {
  runLogoPipeline,
  LOGO_STYLE_PRESETS,
  LogoStylePreset,
} from "./logoPipeline";
import { getStoredConfig } from "@/renderer/agents/llmClient";
import { useGeneratorScaffold } from "../generatorScaffold";

interface LogoGeneratorProps {
  project: ProjectData | null;
  onBack: (updated?: ProjectData) => void;
  onGenerate: (data: ProjectData) => void;
  onUpdateProject?: (data: ProjectData) => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

const STATUS_LABELS: Record<string, string> = {
  storyboarding: "Preparing logo...",
  designing: "Creating animation...",
  animating: "Adding motion...",
  assembling: "Verifying & assembling...",
  "component-building": "Building components...",
  verifying: "Checking output...",
  done: "Complete!",
  error: "Error",
};

export const LogoGenerator: React.FC<LogoGeneratorProps> = ({
  onBack,
  onGenerate,
  onUpdateProject,
  project,
  customAlert,
}) => {
  const scaffold = useGeneratorScaffold({
    project,
    onBack,
    customAlert,
    defaultPrompt:
      "Create a smooth 3d spinning logo reveal with glowing neon particles and backdrop shadows",
    refineSystemPrompt: undefined,
    extraBackFields: {},
  });

  const {
    instructions,
    setInstructions,
    fonts,
    setFonts,
    swatches,
    setSwatches,
    availableFonts,
    isRefining,
    bgSelection,
    setBgSelection,
    pipelineState,
    setPipelineState,
    handleRefinePrompt,
    handleBack,
  } = scaffold;

  const [logoFileUrl, setLogoFileUrl] = useState<string>(
    (project as any)?.logoUrl || "",
  );
  const [logoFileName, setLogoFileName] = useState<string>(
    (project as any)?.logoFileName || "",
  );
  const [customSvgContent, setCustomSvgContent] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<LogoStylePreset>(
    LOGO_STYLE_PRESETS[1],
  );
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [animKey, setAnimKey] = useState<number>(1);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [hasExpanded, setHasExpanded] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (pipelineState && pipelineState.status !== "idle") setHasExpanded(true);
  }, [pipelineState]);

  useEffect(() => {
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
    if (preset.id !== "custom") {
      triggerPreviewAnimation();
    } else {
      setIsAnimating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".svg")) {
      await customAlert("Invalid File", "Only SVG files are supported. Please upload a .svg vector file.");
      return;
    }
    const url = URL.createObjectURL(file);
    setLogoFileUrl(url);
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCustomSvgContent(event.target.result);
      }
    };
    reader.readAsText(file);
    if (selectedStyle.id !== "custom") {
      triggerPreviewAnimation();
    }
  };

  const handleRefineWithStyle = async () => {
    if (!instructions.trim()) return;
    await handleRefinePrompt();
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handlePillSubmit = async () => {
    if (!instructions.trim()) {
      triggerShake();
      return;
    }
    setHasExpanded(true);
    await handleGenerateClick();
  };

  const handleBackWithLogo = () => {
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
      await customAlert(
        "Missing Instructions",
        "Please enter an animation prompt before generating.",
      );
      return;
    }
    setPipelineState({ status: "storyboarding", progress: 0.02 });
    const config = getStoredConfig();
    if (!config) {
      await customAlert("Setup Required", "Please configure API key first using the settings menu");
      setPipelineState(null);
      return;
    }
    const output = await runLogoPipeline({
      prompt: instructions,
      stylePreset: selectedStyle,
      logoFileUrl,
      logoFileName,
      fonts,
      colors: swatches,
      bgSelection: bgSelection as any,
      config,
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
        title: project?.title || "Logo Animation",
        prompt: instructions,
        narration: "",
        code: output,
        scenes: [
          {
            id: "scene_1",
            description: `Logo reveal: ${selectedStyle.label}`,
            duration: 150,
          },
        ],
        showVisualizer: false,
        fonts,
        colors: swatches,
        bgSelection,
        logoUrl: logoFileUrl,
        logoFileName,
        unfinished: false,
        generationState: undefined,
        savePath: project?.savePath || "",
      } as any);
    }
  };

  const renderLogoAsset = (
    extraClassName = "",
    extraStyle?: React.CSSProperties,
  ) => {
    if (customSvgContent) {
      return (
        <div
          className={`max-h-[220px] max-w-[380px] flex items-center justify-center [&>svg]:max-h-[220px] [&>svg]:max-w-[380px] [&>svg]:w-full [&>svg]:h-auto [&>svg]:object-contain ${extraClassName}`}
          style={extraStyle}
          dangerouslySetInnerHTML={{ __html: customSvgContent }}
        />
      );
    }
    return (
      <img
        src={logoFileUrl || logoIcon}
        alt={logoFileName || "Kinetic Logo Preview"}
        className={`max-h-[220px] max-w-[380px] object-contain ${extraClassName}`}
        style={extraStyle}
      />
    );
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white page-enter">
      <ResizableSidebar
        initialWidth={380}
        minWidth={320}
        maxWidth={500}
        className="border-r border-[#27272a] bg-[#121212] overflow-y-auto"
      >
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackWithLogo}
              className="text-gray-400 hover:text-white transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="kinetic" className="w-5 h-5" />
              <span className="text-sm tracking-tight text-white">kinetic</span>
              <span className="text-[11px] text-gray-500">/ Logo Animator</span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-gray-500 bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">v0.4.2</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" /> AI Assistant
              </span>
            </div>
            <div
              className={`relative bg-[#1a1a1e] border border-[#27272a] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
                hasExpanded
                  ? "rounded-2xl p-3 flex flex-col gap-3 translate-y-1 shadow-xl shadow-violet-900/10"
                  : "rounded-full p-2 flex items-center justify-between gap-1"
              } ${shake ? "animate-shake border-red-500/50" : ""}`}
            >
              {!hasExpanded ? (
                <>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePillSubmit();
                      }
                    }}
                    placeholder="Describe logo reveal (e.g. glowing 3D spin, particle burst)..."
                    className="flex-1 bg-transparent border-none pl-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none rounded-full"
                  />
                  <button
                    onClick={handlePillSubmit}
                    disabled={isRefining}
                    className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-violet-900/20 disabled:opacity-30 flex-shrink-0"
                  >
                    {isRefining ? (
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wide text-gray-400">
                    <span>{pipelineState ? STATUS_LABELS[pipelineState.status] || pipelineState.status : "Ready"}</span>
                    <span className="text-violet-400">{pipelineState ? `${Math.round((pipelineState.progress || 0) * 100)}%` : ""}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]">
                    <div
                      className="h-full bg-violet-600 transition-all duration-500"
                      style={{ width: `${(pipelineState?.progress || 0) * 100}%` }}
                    />
                  </div>
                  {pipelineState?.error && <div className="text-xs text-red-400">{pipelineState.error}</div>}
                  <div className="text-[10px] text-gray-500">{selectedStyle.label} • {logoFileName || "default logo"}</div>
                </div>
              )}
            </div>
            {hasExpanded && pipelineState?.status === "error" && (
              <button onClick={() => setHasExpanded(false)} className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-bold">
                Dismiss
              </button>
            )}
          </div>

          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
              hasExpanded ? "max-h-0 opacity-0 -translate-y-2 pointer-events-none" : "max-h-[4000px] opacity-100 translate-y-0"
            }`}
          >
            <div className="border-t border-[#27272a] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  Logo Asset
                </h4>
                {logoFileName && (
                  <span className="text-[10px] text-gray-500 truncate max-w-[140px]" title={logoFileName}>
                    {logoFileName}
                  </span>
                )}
              </div>
              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept=".svg,image/svg+xml" className="hidden" />
              <div
                onClick={() => logoInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 border border-dashed border-[#27272a] rounded-xl bg-[#18181b] hover:bg-[#1a1a1e] hover:border-violet-500/50 cursor-pointer transition-all gap-2 group"
              >
                {logoFileUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={logoFileUrl} alt="Uploaded logo preview" className="h-12 w-auto max-w-[160px] object-contain" />
                    <span className="text-[11px] text-violet-400 font-medium group-hover:underline">Change SVG</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="h-9 w-9 rounded-xl bg-[#1a1a1e] border border-[#27272a] flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                      <UploadSimple size={18} />
                    </div>
                    <span className="text-xs font-semibold text-gray-300">Click or drop SVG vector</span>
                    <span className="text-[10px] text-gray-500">SVG required</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#27272a] p-4 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Sparkle size={12} className="text-violet-400" />
                Animation Style
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {LOGO_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectStylePreset(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      selectedStyle.id === preset.id
                        ? "bg-violet-600 text-white border border-violet-500"
                        : "bg-[#18181b] border border-[#27272a] text-gray-400 hover:border-gray-700 hover:text-gray-300"
                    }`}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{selectedStyle.description}</p>
            </div>

            <DesignTokensPanel
              fonts={fonts}
              setFonts={setFonts}
              swatches={swatches}
              setSwatches={setSwatches}
              availableFonts={availableFonts}
            />
          </div>
        </div>
      </ResizableSidebar>

      <main className="flex-1 flex flex-col bg-[#0a0c14] relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
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
              0% { clip-path: inset(0 100% 0 0); filter: grayscale(1) contrast(4) brightness(0.6) invert(0.1); opacity: 0.3; transform: scale(0.97); }
              60% { clip-path: inset(0 0% 0 0); filter: grayscale(1) contrast(3) brightness(0.7); opacity: 0.95; transform: scale(1.02); }
              100% { clip-path: inset(0 0% 0 0); filter: grayscale(0) contrast(1) brightness(1); opacity: 1; transform: scale(1); }
            }
            @keyframes logo-cinematic-zoom {
              0% { transform: scale(3.5); opacity: 0; filter: blur(30px); }
              100% { transform: scale(1); opacity: 1; filter: blur(0px); }
            }
          `}</style>

          <div
            className="absolute inset-0 z-0 transition-all duration-300 overflow-hidden"
            style={{
              ...(bgSelection?.color === "transparent"
                ? {
                    backgroundImage:
                      "linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                    backgroundColor: "#09090b",
                  }
                : bgSelection?.type === "image" && bgSelection.imageUrl
                  ? {
                      backgroundImage: `url(${bgSelection.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: `blur(${bgSelection.blurPx || 0}px)`,
                      transform: bgSelection.blurPx ? "scale(1.08)" : "none",
                    }
                  : bgSelection?.type === "gradient" && bgSelection.gradient
                    ? {
                        background: bgSelection.gradient,
                        filter: `blur(${bgSelection.blurPx || 0}px)`,
                        transform: bgSelection.blurPx ? "scale(1.08)" : "none",
                      }
                    : {
                        backgroundColor: bgSelection?.color || "#09090b",
                      }),
            }}
          />

          <div className="relative z-10 w-full h-full flex items-center justify-center p-8 transition-all">
            {selectedStyle.id === "shatter-reform" && isAnimating ? (
              <div
                key={animKey}
                onClick={() => triggerPreviewAnimation()}
                title="Click logo to replay preview animation"
                className="cursor-pointer relative max-h-[220px] max-w-[380px]"
              >
                <div
                  style={{
                    clipPath: "polygon(0 0, 62% 0, 44% 48%, 0 68%)",
                    animation: "logo-shatter-tl 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards",
                  }}
                >
                  {renderLogoAsset("drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]")}
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(62% 0, 100% 0, 100% 54%, 44% 48%)",
                    animation: "logo-shatter-tr 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards",
                  }}
                >
                  {renderLogoAsset("drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]")}
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(0 68%, 44% 48%, 56% 100%, 0 100%)",
                    animation: "logo-shatter-bl 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards",
                  }}
                >
                  {renderLogoAsset("drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]")}
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(44% 48%, 100% 54%, 100% 100%, 56% 100%)",
                    animation: "logo-shatter-br 3.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards",
                  }}
                >
                  {renderLogoAsset("drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]")}
                </div>
              </div>
            ) : selectedStyle.id === "particle-burst" && isAnimating ? (
              <div
                key={animKey}
                onClick={() => triggerPreviewAnimation()}
                title="Click logo to replay preview animation"
                className="cursor-pointer relative flex items-center justify-center max-h-[220px] max-w-[380px]"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 360) / 24;
                  const rad = (angle * Math.PI) / 180;
                  const startDist = 180 + (i % 3) * 40;
                  const startX = Math.cos(rad) * startDist;
                  const startY = Math.sin(rad) * startDist;
                  const colors = ["#8b5cf6", "#a78bfa", "#f59e0b", "#38bdf8", "#ec4899", "#10b981"];
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
                        ["--startX" as any]: `${startX}px`,
                        ["--startY" as any]: `${startY}px`,
                      }}
                    />
                  );
                })}
                {renderLogoAsset("", {
                  animation: "logo-particle-burst-reveal 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                })}
              </div>
            ) : (
              <div
                key={animKey}
                onClick={() =>
                  selectedStyle.id !== "custom" && triggerPreviewAnimation()
                }
                title="Click logo to replay preview animation"
                className="cursor-pointer flex flex-col items-center gap-2"
                style={{
                  animation:
                    isAnimating && selectedStyle.id !== "custom"
                      ? selectedStyle.id === "3d-spin"
                        ? "logo-3d-spin 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards"
                        : selectedStyle.id === "particle-burst"
                          ? "logo-particle-burst 3.5s ease-out forwards"
                          : selectedStyle.id === "neon-glow"
                            ? "logo-neon-glow 3.5s ease-in-out forwards"
                            : selectedStyle.id === "bounce-drop"
                              ? "logo-bounce-drop 3.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                              : selectedStyle.id === "glitch-reveal"
                                ? "logo-glitch-reveal 3.5s steps(6, end) forwards"
                                : selectedStyle.id === "stroke-draw"
                                  ? "logo-stroke-draw 3.5s ease-out forwards"
                                  : selectedStyle.id === "cinematic-zoom"
                                    ? "logo-cinematic-zoom 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                                    : "logo-scale-fade 3.5s ease-out forwards"
                      : undefined,
                }}
              >
                {renderLogoAsset("drop-shadow-[0_15px_35px_rgba(139,92,246,0.4)]")}
              </div>
            )}
          </div>
        </PreviewWindow>
        </div>

        <footer className="flex items-center justify-between bg-[#18181b] border-t border-[#27272a] px-8 py-3 gap-4">
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
            <span className="px-2.5 py-1 rounded-md border border-[#27272a] bg-[#121212] text-gray-400">5s @ 30 FPS</span>
            <span className="px-2.5 py-1 rounded-md border border-[#27272a] bg-[#121212] text-gray-500">{selectedStyle.label}</span>
          </div>

          <button
            onClick={handleGenerateClick}
            disabled={
              !!pipelineState &&
              pipelineState.status !== "done" &&
              pipelineState.status !== "error" &&
              pipelineState.status !== "idle"
            }
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkle size={14} className="text-white" weight="fill" />
            Generate
          </button>
        </footer>
      </main>
    </div>
  );
};
