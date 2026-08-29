import React from "react";
import {
  ArrowRight,
  ArrowLeft,
  CaretDown,
  Sparkle,
} from "@phosphor-icons/react";
import logoIcon from "../../../../kinetic_brand/logo_transparent.svg";
import { runPipeline } from "@/renderer/agents/pipeline";
import { ProjectData } from "../../pages/AppRouter";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import { useGeneratorScaffold } from "../generatorScaffold";

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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <Sparkle size={12} className="text-violet-400" weight="fill" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Assistant</span>
              </div>
              <div className="relative flex items-center bg-[#1a1a1e] border border-[#27272a] rounded-full p-2 justify-between gap-1">
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Describe the UI flow to demo..."
                  className="flex-1 bg-transparent border-none pl-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none rounded-full"
                />
                <button
                  onClick={handleRefinePrompt}
                  disabled={isRefining || !instructions.trim()}
                  className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-violet-900/20 disabled:opacity-30"
                >
                  {isRefining ? <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <ArrowRight size={14} weight="bold" />}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#27272a] p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-bold">T</span>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Typography</h3>
            </div>
            <div className="space-y-4">
              {(["Title Font", "Heading", "Paragraph"] as const).map((label) => {
                const f = (fonts as any)[label];
                if (!f) return null;
                return (
                  <div key={label} className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 capitalize">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <select value={f.fontFamily} onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], fontFamily: e.target.value } }))} className="w-full appearance-none bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-[11px] text-gray-300 focus:ring-1 focus:ring-violet-500 outline-none">
                          {availableFonts.map((font: string) => (<option key={font} value={font}>{font}</option>))}
                        </select>
                        <CaretDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                      </div>
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                        <input type="color" value={f.color} onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], color: e.target.value } }))} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                        <div className="w-full h-full pointer-events-none" style={{ backgroundColor: f.color }} />
                      </div>
                      <select value={f.size} onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], size: Number(e.target.value) } }))} className="w-12 bg-[#18181b] border border-[#27272a] rounded-lg px-1 py-2 text-[10px] text-gray-400 font-medium outline-none">
                        {Array.from({ length: 63 }, (_, i) => i + 10).map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>
                    <div className="flex gap-1.5">
                      {(["bold", "italic", "underline"] as const).map((prop) => (
                        <button key={prop} onClick={() => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], [prop]: !prev[label][prop] } }))} className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-colors ${f[prop] ? "bg-[#18181b] border border-violet-500/30" : "bg-[#18181b] border border-[#27272a] hover:bg-[#27272a]"}`}>
                          <span className={`text-[10px] text-violet-400 ${prop === "bold" ? "font-bold" : ""} ${prop === "italic" ? "italic" : ""} ${prop === "underline" ? "underline" : ""}`}>{prop === "bold" ? "B" : prop === "italic" ? "I" : "U"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#27272a] p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">&#9632;</span>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Brand Colors</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(swatches as any).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-2 py-1.5 hover:border-gray-700 transition-colors">
                  <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    <input type="color" value={color as string} onChange={(e) => setSwatches((prev: any) => ({ ...prev, [label]: e.target.value }))} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                    <div className="w-full h-full pointer-events-none" style={{ backgroundColor: color as string }} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-semibold text-gray-400 capitalize truncate">{label}</span>
                    <span className="text-[8px] text-gray-600 font-mono leading-none truncate">{color as string}</span>
                  </div>
                </div>
              ))}
            </div>
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
