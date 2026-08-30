import React from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { DesignTokensPanel } from "@/renderer/components/DesignTokensPanel";
import logoIcon from "../../../../kinetic_brand/logo_transparent.svg";
import { runPipeline } from "@/renderer/agents/pipeline";
import { ProjectData } from "../../pages/AppRouter";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import { useGeneratorScaffold } from "../generatorScaffold";
import { AIsidebar } from "@/renderer/components/AIsidebar";

interface UiUxGeneratorProps {
  project: ProjectData | null;
  onBack: (updated?: ProjectData) => void;
  onGenerate: (data: ProjectData) => void;
  onUpdateProject?: (data: ProjectData) => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

const UiUxGenerator: React.FC<UiUxGeneratorProps> = ({
  onBack,
  onGenerate,
  project,
  customAlert,
}) => {
  const scaffold = useGeneratorScaffold({
    project,
    onBack,
    customAlert,
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
  } = scaffold as any;

  const [hasExpanded, setHasExpanded] = React.useState(false);
  const [shake, setShake] = React.useState(false);
  React.useEffect(() => {
    if (pipelineState && pipelineState.status !== "idle") setHasExpanded(true);
  }, [pipelineState]);

  const StatusProps = {
    fonts,
    setFonts,
    swatches,
    setSwatches,
    availableFonts,
    bgSelection,
    onSelectBackground: setBgSelection,
    customAlert,
    state: pipelineState || { status: "idle" as const, progress: 0 },
    onApproveStage: scaffold.approveCurrentStage,
    questions: [],
    onSubmitAnswers: () => {},
  };

  const handleGenerate = async () => {
    if (!instructions.trim()) return;
    const controller = scaffold.createController();
    if (!controller) {
      await customAlert("Setup Required", "Please configure API key first using settings");
      return;
    }
    setPipelineState({ status: "storyboarding", progress: 0 });
    const output = await runPipeline(instructions, "", controller, { skipRepoGate: true });
    if (output && output.assembled) {
      onGenerate({
        ...project,
        title: project?.title || "Untitled",
        prompt: instructions,
        narration: "",
        code: output.assembled,
        scenes: project?.scenes || [],
        fonts,
        colors: { ...swatches },
        bgSelection,
        bgDescription: "",
        unfinished: false,
        generationState: undefined,
        savePath: project?.savePath || "",
      });
    }
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
    await handleGenerate();
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
            <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors" title="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="kinetic" className="w-5 h-5" />
              <span className="text-sm tracking-tight text-white">kinetic</span>
              <span className="text-[11px] text-gray-500">/ UI/UX Walkthrough</span>
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
                    placeholder="Describe the UI flow to demo..."
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
          </div>
        </div>
      </ResizableSidebar>

      <main className="flex-1 flex flex-col bg-[#0a0c14] relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
          <PreviewWindow title="Walkthrough Preview">
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
                  : (bgSelection as any)?.type === "image" && (bgSelection as any).imageUrl
                    ? {
                        backgroundImage: `url(${(bgSelection as any).imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: `blur(${(bgSelection as any).blurPx || 0}px)`,
                        transform: (bgSelection as any).blurPx ? "scale(1.08)" : "none",
                      }
                    : (bgSelection as any)?.type === "gradient" && (bgSelection as any).gradient
                      ? { background: (bgSelection as any).gradient, filter: `blur(${(bgSelection as any).blurPx || 0}px)`, transform: (bgSelection as any).blurPx ? "scale(1.08)" : "none" }
                      : { backgroundColor: (bgSelection as any)?.color || "#09090b" }),
              }}
            />
            <div className="relative z-10 w-full h-full flex flex-col overflow-hidden p-6 gap-4">
              <div className="space-y-1.5">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: swatches["Primary"] || "#8b5cf6" }} />
                <h2
                  style={{
                    fontFamily: (fonts as any)["Title Font"]?.fontFamily,
                    color: (fonts as any)["Title Font"]?.color,
                    fontSize: Math.min(24, ((fonts as any)["Title Font"]?.size || 48) * 0.55),
                    fontWeight: (fonts as any)["Title Font"]?.bold ? 700 : 400,
                    fontStyle: (fonts as any)["Title Font"]?.italic ? "italic" : "normal",
                    textDecoration: (fonts as any)["Title Font"]?.underline ? "underline" : "none",
                  }}
                  className="tracking-tighter leading-none max-w-lg"
                >
                  {instructions.trim() ? instructions.slice(0, 48) : "Walk through your UI before you code it."}
                </h2>
                <h3
                  style={{
                    fontFamily: (fonts as any)["Heading"]?.fontFamily,
                    color: (fonts as any)["Heading"]?.color,
                    fontSize: Math.min(16, ((fonts as any)["Heading"]?.size || 32) * 0.5),
                    fontWeight: (fonts as any)["Heading"]?.bold ? 700 : 500,
                    fontStyle: (fonts as any)["Heading"]?.italic ? "italic" : "normal",
                    textDecoration: (fonts as any)["Heading"]?.underline ? "underline" : "none",
                  }}
                >
                  Heading preview — shows your heading font and color
                </h3>
                <p
                  style={{
                    fontFamily: (fonts as any)["Paragraph"]?.fontFamily,
                    color: (fonts as any)["Paragraph"]?.color,
                    fontSize: (fonts as any)["Paragraph"]?.size,
                    fontWeight: (fonts as any)["Paragraph"]?.bold ? 700 : 400,
                    fontStyle: (fonts as any)["Paragraph"]?.italic ? "italic" : "normal",
                    textDecoration: (fonts as any)["Paragraph"]?.underline ? "underline" : "none",
                  }}
                  className="max-w-md leading-relaxed text-sm"
                >
                  Paragraph sample updates live with your font and color choices.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(swatches).map(([label, color]) => (
                  <div key={label} className="rounded-xl border p-2 flex flex-col gap-1" style={{ backgroundColor: `${color}18`, borderColor: `${color}30` }}>
                    <div className="h-7 rounded-lg border border-white/10" style={{ backgroundColor: color as string }} />
                    <span className="text-[8px] font-bold tracking-widest uppercase truncate" style={{ color: color as string }}>{label}</span>
                    <span className="text-[8px] font-mono text-gray-500 truncate">{color as string}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3 flex flex-col gap-2" style={{ backgroundColor: `${swatches["Primary"] || "#8b5cf6"}14`, borderColor: `${swatches["Primary"] || "#8b5cf6"}30` }}>
                  <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: swatches["Primary"] || "#8b5cf6" }}>Onboarding</span>
                  <div className="h-12 rounded-lg border border-white/10 flex items-center justify-center text-[10px]" style={{ backgroundColor: "#ffffff08", color: swatches["Secondary"] || "#a78bfa" }}>Flow step 1</div>
                </div>
                <div className="rounded-xl border p-3 flex flex-col gap-2" style={{ backgroundColor: `${swatches["Accent"] || "#f59e0b"}14`, borderColor: `${swatches["Accent"] || "#f59e0b"}30` }}>
                  <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: swatches["Accent"] || "#f59e0b" }}>Dashboard</span>
                  <div className="h-12 rounded-lg border border-white/10 flex items-center justify-center text-[10px]" style={{ backgroundColor: "#ffffff08", color: swatches["Neutral"] || "#64748b" }}>Flow step 2</div>
                </div>
              </div>
            </div>
          </PreviewWindow>
        </div>
        {pipelineState ? (
          <div className="flex flex-col gap-2 mx-8 mb-2 rounded-xl bg-gray-900 p-4 border border-gray-800">
            <div className="flex justify-between text-xs font-semibold text-gray-500"><span className="capitalize">{(pipelineState as any).status.replace("-", " ")}</span><span>{Math.round((pipelineState as any).progress * 100)}%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-950"><div className={`h-full rounded-full transition-all duration-300 ${(pipelineState as any).status === "error" ? "bg-red-500" : "bg-violet-600"}`} style={{ width: `${Math.round((pipelineState as any).progress * 100)}%` }} /></div>
          </div>
        ) : (<div className="h-8 bg-[#18181b] border-t border-[#27272a] px-8 flex items-center justify-between text-[10px] text-gray-500 font-medium z-20"><span>Ready to render 1080p @ 30fps</span><span className="opacity-60">v1.0.0</span></div>)}
      </main>
    </div>
  );
};
export default UiUxGenerator;
