import React from "react";
import {
  Plus,
  X,
  ArrowLeft,
} from "@phosphor-icons/react";
import logoIcon from "../../../../kinetic_brand/logo_transparent.svg";
import { runPipeline } from "@/renderer/agents/pipeline";
import { ProjectData } from "../../pages/AppRouter";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import { MOCK_TOUR_PROJECT } from "@/renderer/constants";
import { useGeneratorScaffold } from "../generatorScaffold";
import { AudioUploadField } from "@/renderer/components/AudioUploadField";
import { DesignTokensPanel } from "@/renderer/components/DesignTokensPanel";
import { VoiceoverAudioField } from "@/renderer/components/VoiceoverAudioField";
import { MusicNotes, Stack, File } from "@phosphor-icons/react";
import { AIsidebar } from "@/renderer/components/AIsidebar";

interface AnimationGeneratorProps {
  project: ProjectData | null;
  onBack: (updated?: ProjectData) => void;
  onGenerate: (data: ProjectData) => void;
  onUpdateProject?: (data: ProjectData) => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (
    title: string,
    message: string,
    buttons?: any[],
  ) => Promise<any>;
  tourActive?: boolean;
  tourStep?: number;
}

const AnimationGenerator: React.FC<AnimationGeneratorProps> = ({
  onBack,
  onGenerate,
  onUpdateProject,
  project,
  customAlert,
  customConfirm,
  tourActive,
}) => {
  const scaffold = useGeneratorScaffold({
    project,
    onBack,
    customAlert,
  });

  const {
    instructions,
    setInstructions,
    narration,
    setNarration,
    useNarration,
    setUseNarration,
    voiceoverMode,
    setVoiceoverMode,
    voiceoverAudioFile,
    isTranscribingVoiceover,
    handleVoiceoverAudioChange,
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
    backgroundImage,
    bgDescription,
    audioFile,
    beatFrames,
    isAnalyzingAudio,
    handleSelectAudio,
    handleAssetUpload,
    assetInputRef,
    handleRefinePrompt,
    capturePipelineState,
    tokenFont,
    handleBack,
    uploadedAssets,
    setUploadedAssets,
    showVisualizer,
    setShowVisualizer,
  } = scaffold;

  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const [hasExpanded, setHasExpanded] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  React.useEffect(() => {
    if (pipelineState && pipelineState.status !== "idle") setHasExpanded(true);
  }, [pipelineState]);

  React.useEffect(() => {
    if (tourActive && !instructions) {
      setInstructions(
        "Create a clean kinetic dashboard animation with rising bar charts and sleek typography",
      );
    }
  }, [tourActive]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handlePillSubmit = async () => {
    if (!instructions.trim() && !narration.trim()) {
      triggerShake();
      return;
    }
    setHasExpanded(true);
    await handleGenerate();
  };

  const handleGenerate = async () => {
    if (tourActive) {
      onGenerate(MOCK_TOUR_PROJECT as any);
      return;
    }
    if (!instructions.trim() && !narration.trim()) return;
    const controller = scaffold.createController();
    if (!controller) {
      await customAlert(
        "Setup Required",
        "Please configure API key first using the settings menu",
      );
      return;
    }
    setPipelineState({ status: "storyboarding", progress: 0 });
    const output = await runPipeline(
      instructions,
      useNarration ? narration : "",
      controller,
      { skipRepoGate: true },
    );
    if (output && output.assembled) {
      onGenerate({
        ...project,
        title: project?.title || "Untitled",
        prompt: instructions,
        narration: useNarration ? narration : "",
        code: output.assembled,
        scenes: project?.scenes || [],
        showVisualizer,
        fonts,
        colors: { ...swatches, backgroundImage },
        bgSelection,
        bgDescription,
        unfinished: false,
        generationState: undefined,
        savePath: project?.savePath || "",
      });
    }
  };

  const StatusProps = {
    fonts: fonts,
    setFonts: setFonts,
    swatches: swatches,
    setSwatches: setSwatches,
    availableFonts: availableFonts,
    bgSelection: bgSelection,
    onSelectBackground: setBgSelection,
    customAlert: customAlert,
    state: pipelineState || { status: "idle" as const, progress: 0 },
    onApproveStage: scaffold.approveCurrentStage,
    questions: [],
    onSubmitAnswers: () => {},
  };

  const cPrimary = swatches["Primary"] || "#8b5cf6";
  const cSecondary = swatches["Secondary"] || "#a78bfa";
  const cAccent = swatches["Accent"] || "#f59e0b";

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
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="kinetic" className="w-5 h-5" />
              <span className="text-sm tracking-tight text-white">kinetic</span>
            </div>
          </div>
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
                  : "rounded-full p-1 flex items-center justify-between gap-1"
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
                    placeholder="Describe your vision..."
                    className="flex-1 bg-transparent border-none pl-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none rounded-full"
                  />
                  <button
                    onClick={handlePillSubmit}
                    disabled={isRefining}
                    className="w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-violet-900/20 disabled:opacity-30 flex-shrink-0"
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
                <AIsidebar
                  instructions={instructions}
                  setInstructions={setInstructions}
                  state={pipelineState || { status: "idle", progress: 0 }}
                  isRefining={isRefining}
                  handleRefinePrompt={handleRefinePrompt}
                  StatusProps={StatusProps}
                />
              )}
            </div>
          </div>

          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
              hasExpanded ? "max-h-0 opacity-0 -translate-y-2 pointer-events-none" : "max-h-[2000px] opacity-100 translate-y-0"
            }`}
          >
            <DesignTokensPanel fonts={fonts} setFonts={setFonts} swatches={swatches} setSwatches={setSwatches} availableFonts={availableFonts} />

            <div className="border-t border-[#27272a] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <MusicNotes size={14} className="text-gray-400" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Voiceover</h3>
              </div>
              <VoiceoverAudioField
                mode={voiceoverMode}
                onModeChange={setVoiceoverMode}
                scriptText={narration}
                onScriptTextChange={setNarration}
                audioFile={voiceoverAudioFile}
                onAudioFileChange={handleVoiceoverAudioChange}
                isTranscribing={isTranscribingVoiceover}
              />
            </div>

            <div className="border-t border-[#27272a] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <MusicNotes size={14} className="text-gray-400" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Soundtrack
                </h3>
              </div>
              <AudioUploadField audioFile={audioFile} beatCount={beatFrames.length} isAnalyzing={isAnalyzingAudio} onSelectAudio={handleSelectAudio} />
            </div>

            <div className="border-t border-[#27272a] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stack size={14} className="text-gray-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Assets
                  </h3>
                </div>
                <button
                  onClick={() => assetInputRef.current?.click()}
                  className="p-1 text-violet-400 hover:bg-violet-400/10 rounded"
                >
                  <Plus size={14} />
                </button>
                <input
                  type="file"
                  ref={assetInputRef}
                  multiple
                  onChange={handleAssetUpload}
                  className="hidden"
                />
              </div>
              {uploadedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedAssets.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1 bg-[#18181b] border border-[#27272a] rounded-md"
                    >
                      <File size={14} className="text-violet-400" weight="fill" />
                      <span className="text-[10px] text-gray-300 font-medium truncate max-w-[80px]">
                        {asset}
                      </span>
                      <button
                        onClick={() =>
                          setUploadedAssets((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-gray-600 hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ResizableSidebar>

      <main className="flex-1 flex flex-col bg-[#0a0c14] relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
          <PreviewWindow title="">
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
                          transform: bgSelection.blurPx
                            ? "scale(1.08)"
                            : "none",
                        }
                      : { backgroundColor: bgSelection?.color || "#09090b" }),
              }}
            />

            <div className="relative z-10 w-full h-full flex flex-col overflow-hidden p-8 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-1 rounded-full" style={{ backgroundColor: swatches["Primary"] || "#8b5cf6" }} />
                <h2
                  style={{
                    fontFamily: fonts["Title Font"]?.fontFamily,
                    color: fonts["Title Font"]?.color,
                    fontSize: Math.min(32, (fonts["Title Font"]?.size || 48) * 0.7),
                    fontWeight: fonts["Title Font"]?.bold ? 700 : 400,
                    fontStyle: fonts["Title Font"]?.italic ? "italic" : "normal",
                    textDecoration: fonts["Title Font"]?.underline ? "underline" : "none",
                  }}
                  className="tracking-tighter leading-none max-w-lg"
                >
                  {instructions.trim() ? instructions.slice(0, 56) : "Set your type and palette, see it live."}
                </h2>
                <h3
                  style={{
                    fontFamily: fonts["Heading"]?.fontFamily,
                    color: fonts["Heading"]?.color,
                    fontSize: Math.min(18, (fonts["Heading"]?.size || 32) * 0.6),
                    fontWeight: fonts["Heading"]?.bold ? 700 : 500,
                    fontStyle: fonts["Heading"]?.italic ? "italic" : "normal",
                    textDecoration: fonts["Heading"]?.underline ? "underline" : "none",
                  }}
                >
                  Heading style preview — clean and readable
                </h3>
                <p
                  style={{
                    fontFamily: fonts["Paragraph"]?.fontFamily,
                    color: fonts["Paragraph"]?.color,
                    fontSize: fonts["Paragraph"]?.size,
                    fontWeight: fonts["Paragraph"]?.bold ? 700 : 400,
                    fontStyle: fonts["Paragraph"]?.italic ? "italic" : "normal",
                    textDecoration: fonts["Paragraph"]?.underline ? "underline" : "none",
                  }}
                  className="max-w-md leading-relaxed"
                >
                  Paragraph sample: this updates as you change fonts and colors. Background comes from your selection.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {Object.entries(swatches).map(([label, color]) => (
                  <div key={label} className="rounded-xl border border-white/10 p-2 flex flex-col gap-1.5" style={{ backgroundColor: `${color}18`, borderColor: `${color}30` }}>
                    <div className="h-8 rounded-lg border border-white/10" style={{ backgroundColor: color as string }} />
                    <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: color as string }}>{label}</span>
                    <span className="text-[9px] font-mono text-gray-400 truncate">{color as string}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: swatches["Primary"] || "#8b5cf6" }}>Primary button</span>
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold border" style={{ borderColor: swatches["Secondary"] || "#a78bfa", color: swatches["Secondary"] || "#a78bfa" }}>Secondary</span>
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: swatches["Accent"] || "#f59e0b" }}>Accent</span>
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: swatches["Error"] || "#ef4444" }}>Error</span>
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: swatches["Success"] || "#22c55e" }}>Success</span>
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold border" style={{ borderColor: swatches["Neutral"] || "#64748b", color: swatches["Neutral"] || "#64748b" }}>Neutral</span>
              </div>
            </div>
          </PreviewWindow>
        </div>

        {pipelineState ? (
          <div className="flex flex-col gap-2 mx-8 mb-2 rounded-xl bg-gray-900 p-4 border border-gray-800">
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span className="capitalize">
                {pipelineState.status.replace("-", " ")}
              </span>
              <span>{Math.round(pipelineState.progress * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-950">
              <div
                className={`h-full rounded-full transition-all duration-300 ${pipelineState.status === "error" ? "bg-red-500" : "bg-violet-600"}`}
                style={{
                  width: `${Math.round(pipelineState.progress * 100)}%`,
                }}
              />
            </div>
            {pipelineState.error && (
              <div className="text-xs text-red-400 mt-2">
                {pipelineState.error}
              </div>
            )}
            {(pipelineState.status === "error" ||
              pipelineState.status === "done") && (
              <button
                onClick={() => setPipelineState(null)}
                className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-bold self-start"
              >
                Dismiss
              </button>
            )}
          </div>
        ) : (
          <div className="h-8 bg-[#18181b] border-t border-[#27272a] px-8 flex items-center justify-between text-[10px] text-gray-500 font-medium z-20">
            <span>Ready to render 1080p @ 30fps</span>
            <span className="opacity-60">v1.0.0</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnimationGenerator;
