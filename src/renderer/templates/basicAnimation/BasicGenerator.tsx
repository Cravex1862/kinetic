import React from "react";
import {
  Lock,
  MagnifyingGlass,
  PlayCircle,
  Plus,
  Star,
  TrendUp,
  UploadSimple,
  User,
  Users,
  X,
  CheckCircle,
  Bell,
  Gear,
  ArrowRight,
  Users as UsersIcon,
} from "@phosphor-icons/react";
import logoIcon from "../../../../kinetic_brand/logo_transparent.svg";
import { runPipeline } from "@/renderer/agents/pipeline";
import { ProjectData } from "../../pages/AppRouter";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";
import {
  BrandStylingPanel,
} from "@/renderer/components/BrandStylingPanel";
import { VoiceoverAudioField } from "@/renderer/components/VoiceoverAudioField";
import { AudioUploadField } from "@/renderer/components/AudioUploadField";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import { MOCK_TOUR_PROJECT } from "@/renderer/constants";
import { AIsidebar } from "@/renderer/components/AIsidebar";
import {
  useGeneratorScaffold,
  SidebarHeader,
} from "../generatorScaffold";

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

  React.useEffect(() => {
    if (tourActive && !instructions) {
      setInstructions(
        "Create a clean kinetic dashboard animation with rising bar charts and sleek typography",
      );
    }
  }, [tourActive]);

  const handleGenerate = async () => {
    if (tourActive) {
      onGenerate(MOCK_TOUR_PROJECT as any);
      return;
    }
    if (!instructions.trim() && !narration.trim()) return;
    const controller = scaffold.createController();
    if (!controller) {
      await customAlert("Setup Required", "Please configure API key first using the settings menu");
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
        initialWidth={340}
        minWidth={280}
        maxWidth={500}
        className="border-r border-gray-900 bg-gray-950 p-4 gap-3 overflow-y-auto"
      >
        <SidebarHeader breadcrumb="Basic" onBack={handleBack} />

        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <h4 className="text-xs font-bold text-gray-400">
              Voiceover Script (optional)
            </h4>
            <input
              type="checkbox"
              checked={useNarration}
              onChange={(e) => setUseNarration(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600 outline-none"
            />
          </div>
          {useNarration && (
            <VoiceoverAudioField
              mode={voiceoverMode}
              onModeChange={setVoiceoverMode}
              scriptText={narration}
              onScriptTextChange={setNarration}
              audioFile={voiceoverAudioFile}
              onAudioFileChange={handleVoiceoverAudioChange}
              isTranscribing={isTranscribingVoiceover}
            />
          )}
        </section>

        <AudioUploadField
          audioFile={audioFile}
          beatCount={beatFrames.length}
          isAnalyzing={isAnalyzingAudio}
          onSelectAudio={handleSelectAudio}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Project Assets
            </span>
            <button
              onClick={() => assetInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white rounded-lg text-[10px] font-semibold transition-colors"
            >
              <UploadSimple size={12} />
              Upload
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
            <div className="flex flex-wrap gap-1 p-2 bg-gray-950/60 border border-gray-900 rounded-lg max-h-[60px] overflow-y-auto">
              {uploadedAssets.map((asset, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-[9px] text-gray-400"
                >
                  <span className="truncate max-w-[80px]">{asset}</span>
                  <button
                    onClick={() =>
                      setUploadedAssets((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="text-gray-500 hover:text-red-400"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <AIsidebar
          instructions={instructions}
          setInstructions={setInstructions}
          state={pipelineState || { status: "idle", progress: 0 }}
          isRefining={isRefining}
          handleRefinePrompt={handleRefinePrompt}
          placeholder="Describe custom layout or animation...."
          StatusProps={StatusProps}
        />
      </ResizableSidebar>

      <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950/40 justify-between h-full">
        <PreviewWindow title="Walkthrough Preview Canvas">
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

          <div className="relative z-10 w-full h-full p-6 flex items-center justify-center">
            <div className="w-full h-full max-w-5xl flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#0a0c14] shadow-[0_30px_80px_rgba(0,0,0,0.85)]">
              <div className="h-9 shrink-0 flex items-center gap-3 px-4 bg-[#131620] border-b border-white/[0.06] select-none">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center ml-2 text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  <svg className="ml-1.5 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </div>
                <div className="flex-1 max-w-sm mx-auto h-[22px] rounded-md bg-white/[0.05] border border-white/[0.04] flex items-center justify-center gap-1.5 overflow-hidden">
                  <Lock size={9} weight="fill" className="text-emerald-400 shrink-0" />
                  <span className="text-[10px] text-gray-400 tracking-wide truncate">app.kinetic.dev</span>
                </div>
                <Plus size={13} className="text-gray-500 shrink-0" />
              </div>

              <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-gradient-to-b from-[#0b0e17] via-[#0a0c14] to-[#0e0914]">
                <div
                  className="absolute -top-20 -right-16 w-72 h-72 rounded-full blur-[90px] opacity-20 pointer-events-none"
                  style={{ backgroundColor: cPrimary }}
                />
                <div
                  className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
                  style={{ backgroundColor: cAccent }}
                />

                <header className="relative z-10 shrink-0 h-11 px-5 flex items-center justify-between border-b border-white/[0.06]">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <img src={logoIcon} alt="" className="h-4 w-4 object-contain" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.5)) brightness(1.15)" }} />
                      <span className="text-[12px] font-extrabold tracking-tight text-white">Kinetic</span>
                      <span className="px-1.5 py-px rounded bg-white/[0.06] border border-white/[0.06] text-[6.5px] font-bold uppercase tracking-[0.15em] text-gray-400">Studio</span>
                    </div>
                    <nav className="hidden lg:flex items-center gap-4 text-[9.5px] font-medium">
                      <span className="text-white">Product</span>
                      <span className="text-gray-500 hover:text-gray-300 transition-colors">Templates</span>
                      <span className="text-gray-500 hover:text-gray-300 transition-colors">Pricing</span>
                      <span className="text-gray-500 hover:text-gray-300 transition-colors">Docs</span>
                    </nav>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 w-28 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05]">
                      <MagnifyingGlass size={9} className="text-gray-500 shrink-0" />
                      <span className="text-[8px] text-gray-600">Search...</span>
                    </div>
                    <div className="relative">
                      <Bell size={13} className="text-gray-400" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-[#0b0e17]" />
                    </div>
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full ring-2 ring-[#0b0e17] bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><User weight="fill" size={8} className="text-white" /></div>
                      <div className="w-5 h-5 rounded-full ring-2 ring-[#0b0e17] bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center"><User weight="fill" size={8} className="text-white" /></div>
                      <div className="w-5 h-5 rounded-full ring-2 ring-[#0b0e17] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><User weight="fill" size={8} className="text-white" /></div>
                    </div>
                    <button style={{ backgroundColor: cPrimary }} className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white shadow-md shadow-purple-900/40">Get Started</button>
                  </div>
                </header>

                <div className="relative z-10 flex-1 min-h-0 px-5 py-3 flex flex-col gap-3 overflow-hidden">
                  <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 items-stretch min-h-0">
                    <div className="flex flex-col justify-center gap-2 min-w-0">
                      <div
                        className="inline-flex items-center gap-1.5 self-start px-2 py-[3px] rounded-full border"
                        style={{ borderColor: `${cPrimary}40`, color: cPrimary, backgroundColor: `${cPrimary}14` }}
                      >
                        <span className="animate-pulse w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cPrimary }} />
                        <span className="text-[7px] font-bold uppercase tracking-widest">v2.4 · Realtime sync is live</span>
                      </div>
                      <h3 style={{ ...tokenFont("Title Font"), fontSize: "clamp(15px, 1.9vw, 23px)" }} className="font-extrabold tracking-tight leading-[1.1]">
                        Ship dashboards that feel alive.
                      </h3>
                      <p style={tokenFont("Paragraph")} className="text-[10px] leading-relaxed max-w-xs opacity-80">
                        Design tokens cascade through every scene, chart, and caption the moment you change them. No re-renders, no stale frames.
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button style={{ backgroundColor: cPrimary }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-lg shadow-purple-900/40 hover:opacity-90 transition-opacity">
                          Start free trial
                          <ArrowRight size={10} weight="bold" />
                        </button>
                        <button style={{ borderColor: cAccent, color: cAccent }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-transparent hover:bg-white/5 transition-colors">
                          <PlayCircle size={11} weight="fill" />
                          Watch demo
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5 pt-1">
                        <div className="flex -space-x-1.5">
                          <div className="w-[18px] h-[18px] rounded-full ring-2 ring-[#0a0c14] bg-gradient-to-br from-violet-500 to-fuchsia-600" />
                          <div className="w-[18px] h-[18px] rounded-full ring-2 ring-[#0a0c14] bg-gradient-to-br from-sky-500 to-indigo-600" />
                          <div className="w-[18px] h-[18px] rounded-full ring-2 ring-[#0a0c14] bg-gradient-to-br from-emerald-500 to-teal-600" />
                          <div className="w-[18px] h-[18px] rounded-full ring-2 ring-[#0a0c14] bg-gray-800 flex items-center justify-center text-[6px] font-bold text-gray-400">+9</div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Star key={i} size={8} weight="fill" className="text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[8px] text-gray-500">Loved by 12,400+ teams</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm p-3 flex flex-col justify-between min-h-0 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cSecondary }} />
                          <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400">Weekly Engagement</span>
                        </div>
                        <span className="px-1.5 py-px rounded-md bg-emerald-400/10 border border-emerald-400/20 text-[7px] font-bold text-emerald-400">+18.4%</span>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <span style={{ fontFamily: tokenFont("Heading").fontFamily, color: cSecondary }} className="text-xl font-extrabold tracking-tight leading-none">48,921</span>
                        <span className="text-[7px] text-gray-500 pb-0.5">sessions this week</span>
                      </div>
                      <svg viewBox="0 0 220 64" preserveAspectRatio="none" className="w-full h-14 mt-1">
                        <defs>
                          <linearGradient id="basicSparkFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={cSecondary} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={cSecondary} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="16" x2="220" y2="16" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="0" y1="32" x2="220" y2="32" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="0" y1="48" x2="220" y2="48" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth="1" />
                        <path d="M0 52 C18 46 26 50 40 42 C54 34 62 44 76 38 C90 32 100 36 114 28 C128 20 138 26 152 20 C166 14 176 18 190 12 L206 8 L206 64 L0 64 Z" fill="url(#basicSparkFill)" />
                        <path d="M0 52 C18 46 26 50 40 42 C54 34 62 44 76 38 C90 32 100 36 114 28 C128 20 138 26 152 20 C166 14 176 18 190 12 L206 8" fill="none" stroke={cAccent} strokeWidth="2" strokeLinecap="round" />
                        <circle cx="206" cy="8" r="6" fill={cAccent} opacity="0.25" />
                        <circle cx="206" cy="8" r="2.5" fill={cAccent} />
                      </svg>
                      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] pt-1.5 mt-1">
                        <div className="px-1"><span className="block text-[6px] uppercase tracking-wide text-gray-500">DAU</span><span className="text-[9px] font-bold text-gray-200">8,214</span></div>
                        <div className="px-1"><span className="block text-[6px] uppercase tracking-wide text-gray-500">Sessions</span><span className="text-[9px] font-bold text-gray-200">41.2k</span></div>
                        <div className="px-1"><span className="block text-[6px] uppercase tracking-wide text-gray-500">Avg Time</span><span className="text-[9px] font-bold text-gray-200">6m 12s</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 shrink-0">
                    {[
                      { label: "Active Users", value: "24,892", delta: "+12.6%", up: true },
                      { label: "MRR", value: "$184,200", delta: "+28.4%", up: true },
                      { label: "Retention", value: "96.2%", delta: "+1.2pt", up: true },
                      { label: "p95 Latency", value: "84ms", delta: "-31ms", up: false },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-[6.5px] uppercase tracking-wider font-bold text-gray-500 truncate">{stat.label}</span>
                          <span style={{ fontFamily: tokenFont("Heading").fontFamily }} className="text-[13px] font-extrabold text-gray-100 leading-tight">{stat.value}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[7px] font-bold ${stat.up ? "text-emerald-400" : "text-sky-400"}`}>{stat.delta}</span>
                          <div className="flex items-end gap-[2px] h-3">
                            {[40, 55, 45, 70, stat.up ? 90 : 35].map((h, i) => (
                              <div key={i} className="w-[3px] rounded-sm" style={{ height: `${h}%`, backgroundColor: stat.up ? cPrimary : "#38bdf8", opacity: 0.35 + i * 0.13 }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[1.45fr_1fr] gap-3 flex-1 min-h-[88px]">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-col min-h-0">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.05]">
                        <span className="text-[8px] uppercase tracking-wider font-bold text-gray-300">Deploys per Month</span>
                        <div className="flex items-center gap-3 text-[7px] text-gray-500">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cPrimary }} />Shipped</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cAccent }} />Peak</span>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 flex items-end justify-between gap-2 px-1 pt-2">
                        {[
                          { m: "Jan", v: 42, n: 128 }, { m: "Feb", v: 58, n: 176 }, { m: "Mar", v: 48, n: 149 },
                          { m: "Apr", v: 66, n: 201 }, { m: "May", v: 74, n: 228 }, { m: "Jun", v: 62, n: 190 },
                        ].map((d) => (
                          <div key={d.m} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                            <span className="text-[6px] font-semibold text-gray-500">{d.n}</span>
                            <div className="w-full max-w-[22px] rounded-t-md transition-all" style={{ height: `${d.v}%`, background: `linear-gradient(to top, ${cPrimary}55, ${cPrimary})`, opacity: 0.85 }} />
                            <span className="text-[6.5px] text-gray-600">{d.m}</span>
                          </div>
                        ))}
                        <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                          <span className="text-[6px] font-bold" style={{ color: cAccent }}>264</span>
                          <div className="w-full max-w-[22px] rounded-t-md animate-pulse" style={{ height: "92%", background: `linear-gradient(to top, ${cAccent}66, ${cAccent})`, boxShadow: `0 0 14px ${cAccent}66` }} />
                          <span className="text-[6.5px] text-gray-400 font-bold">Jul</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-col gap-1.5 min-h-0 overflow-hidden">
                      <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
                        <span className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-bold text-gray-300">
                          <span className="relative flex w-1.5 h-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
                          </span>
                          Live Activity
                        </span>
                        <span className="text-[6.5px] text-gray-600">auto-refresh</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.04] rounded-lg px-1.5 py-1">
                        <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${cPrimary}22` }}>
                          <TrendUp size={8} style={{ color: cPrimary }} weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0"><span className="block text-[7.5px] font-semibold text-gray-200 truncate">Enterprise plan upgraded</span></div>
                        <span className="text-[7px] font-bold text-emerald-400 shrink-0">+$2,400</span>
                        <span className="text-[6px] text-gray-600 shrink-0">2m</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.04] rounded-lg px-1.5 py-1">
                        <div className="w-4 h-4 rounded-md bg-emerald-400/10 flex items-center justify-center shrink-0">
                          <CheckCircle size={8} className="text-emerald-400" weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0"><span className="block text-[7.5px] font-semibold text-gray-200 truncate">Webhook #849 delivered</span></div>
                        <span className="text-[7px] font-bold text-purple-400 shrink-0">200 OK</span>
                        <span className="text-[6px] text-gray-600 shrink-0">4m</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.04] rounded-lg px-1.5 py-1">
                        <div className="w-4 h-4 rounded-md bg-amber-400/10 flex items-center justify-center shrink-0">
                          <UsersIcon size={8} className="text-amber-400" weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0"><span className="block text-[7.5px] font-semibold text-gray-200 truncate">New teammate invited</span></div>
                        <span className="text-[7px] font-bold text-amber-400 shrink-0">Pending</span>
                        <span className="text-[6px] text-gray-600 shrink-0">9m</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.04] rounded-lg px-1.5 py-1">
                        <div className="w-4 h-4 rounded-md bg-slate-400/10 flex items-center justify-center shrink-0">
                          <Gear size={8} className="text-slate-400" weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0"><span className="block text-[7.5px] font-semibold text-gray-200 truncate">API keys rotated</span></div>
                        <span className="text-[7px] font-bold text-emerald-400 shrink-0">Secured</span>
                        <span className="text-[6px] text-gray-600 shrink-0">14m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PreviewWindow>

        {pipelineState ? (
          <div className="flex flex-col gap-2 rounded-xl bg-gray-900 p-4 border border-gray-800">
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
          <div className="flex items-center justify-between bg-[#18181b] border-t border-[#27272a] px-4 py-2 text-[11px] text-gray-500">
            <span>Ready to render 1080p @ 30fps</span>
            <span>v1.0.0</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnimationGenerator;
