import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  House,
  ChartBar,
  Users,
  FolderSimple,
  Gear,
  SquaresFour,
  Bell,
  CheckCircle,
  DotsThree,
  MagnifyingGlass,
  Plus,
  TrendUp,
  Sparkle,
  X,
  UploadSimple,
} from "@phosphor-icons/react";
import logoIcon from "../../../../kinetic_brand/logo_transparent.svg";
import { runPipeline } from "../../agents/pipeline";
import type { PipelineState } from "../../agents/types";
import type { ProjectData, AlertButton } from "../../pages/AppRouter";
import { VoiceoverAudioField } from "@/renderer/components/VoiceoverAudioField";
import { AudioUploadField } from "@/renderer/components/AudioUploadField";
import { ResizableSidebar } from "@/renderer/components/ResizableSidebar";
import { AIsidebar } from "@/renderer/components/AIsidebar";
import { FontSettings } from "@/renderer/components/BrandStylingPanel";
import { useGeneratorScaffold } from "../generatorScaffold";
import { PreviewWindow } from "@/renderer/components/PreviewWindow";

interface AnimationGeneratorProps {
  project: ProjectData | null;
  onBack: (updatedProject?: ProjectData) => void;
  onGenerate: (data: ProjectData) => void;
  onUpdateProject?: (data: ProjectData) => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: AlertButton[]) => Promise<unknown>;
}

const SIZE_OPTIONS = Array.from({ length: 63 }, (_, i) => i + 10);
type FontRow = "Title Font" | "Heading" | "Paragraph";

const SaaSGenerator: React.FC<AnimationGeneratorProps> = ({
  onBack,
  onGenerate,
  onUpdateProject,
  project,
  customAlert,
  customConfirm,
}) => {
  const scaffold = useGeneratorScaffold({ project, onBack, customAlert });

  const {
    instructions,
    setInstructions,
    narration,
    setNarration,
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
    setAvailableFonts,
    bgDescription,
    backgroundImage,
    uploadedAssets,
    setUploadedAssets,
    showVisualizer,
    setShowVisualizer,
    bgSelection,
    setBgSelection,
    pipelineState,
    setPipelineState,
    audioFile,
    beatFrames,
    isAnalyzingAudio,
    handleSelectAudio,
    handleAssetUpload,
    assetInputRef,
    handleRefinePrompt,
    handleBack,
  } = scaffold;

  const [repoLink, setRepoLink] = useState("");
  const [scannedExports, setScannedExports] = useState<ScrapedFindings | null>(null);
  const [repoPack, setRepoPack] = useState<RepoPackResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRepoPath, setSelectedRepoPath] = useState("");
  const [showDetailedPanel, setShowDetailedPanel] = useState(false);

  useEffect(() => {
    const fetchFonts = async () => {
      if (window.electronAPI?.getSystemFonts) {
        const sysFonts = await window.electronAPI.getSystemFonts();
        if (sysFonts && sysFonts.length > 0) setAvailableFonts(sysFonts);
      }
    };
    fetchFonts();
  }, []);

  useEffect(() => {
    const activeFamilies = [
      (fonts as Record<string, FontSettings>)["Title Font"]?.fontFamily,
      (fonts as Record<string, FontSettings>)["Heading"]?.fontFamily,
      (fonts as Record<string, FontSettings>)["Paragraph"]?.fontFamily,
    ];
    activeFamilies.forEach((family) => {
      if (family && !availableFonts.includes(family)) {
        const formattedName = family.replace(/\s+/g, "+");
        const linkId = `gfont-${formattedName.toLowerCase()}`;
        if (!document.getElementById(linkId)) {
          const fontLink = document.createElement("link");
          fontLink.id = linkId;
          fontLink.rel = "stylesheet";
          fontLink.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;
          document.head.appendChild(fontLink);
        }
      }
    });
  }, [fonts, availableFonts]);

  React.useEffect(() => {
    if ("queryLocalFonts" in window) {
      (window as unknown as { queryLocalFonts: () => Promise<Array<{ family: string }>> })
        .queryLocalFonts()
        .then((fontsList) => {
          const families = Array.from(new Set(fontsList.map((f) => f.family)));
          families.sort();
          if (families.length > 0) setAvailableFonts(families);
        })
        .catch(() => {});
    }
  }, []);

  const analyzeColors = (colors: string[]) => {
    let primary = "#8b5cf6";
    let accent = "#a67bf5ff";
    let background = "#030712";
    let error = "#ef4444";
    const hexToHsl = (hex: string) => {
      let r = parseInt(hex.slice(1, 3), 16) / 255;
      let g = parseInt(hex.slice(3, 5), 16) / 255;
      let b = parseInt(hex.slice(5, 7), 16) / 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h: h * 360, s: s * 100, l: l * 100 };
    };
    colors.forEach((col) => {
      if (!col.match(/^#[0-9a-fA-F]{6}$/)) return;
      const { h, s, l } = hexToHsl(col);
      if ((h < 15 || h > 345) && s > 50 && l > 30) error = col;
      else if (s < 15 && l < 15) background = col;
      else if (s > 40 && l > 20 && l < 80) {
        if (primary === "#8b5cf6") primary = col;
        else if (accent === "#f59e0b" && col !== primary) accent = col;
      }
    });
    return { primary, accent, background, error };
  };

  const buildRepoContext = (findings: ScrapedFindings, pack: RepoPackResult | null): string => {
    const parts: string[] = ["[Product Codebase Summary]"];
    if (findings.routes.length > 0) parts.push(`Routes:\n${findings.routes.slice(0, 25).map((r) => `- ${r}`).join("\n")}`);
    if (findings.components.length > 0) parts.push(`Components:\n${findings.components.slice(0, 40).map((c) => `- ${c}`).join("\n")}`);
    if (findings.colors.length > 0) parts.push(`Brand colors: ${findings.colors.slice(0, 20).join(", ")}`);
    if (findings.fonts.length > 0) parts.push(`Fonts: ${findings.fonts.slice(0, 10).join(", ")}`);
    if (pack && pack.content) parts.push(`[Full Source Pack — generated by repomix]\n${pack.content}`);
    return parts.join("\n\n");
  };

  const completeRepoScan = async (results: ScrapedFindings, source: string) => {
    setScannedExports(results);
    const roles = analyzeColors(results.colors);
    setSwatches((prev) => ({ ...prev, Primary: roles.primary, Accent: roles.accent, Background: roles.background, Error: roles.error }));
    if (results.fonts.length > 0) setFonts((prev) => ({ ...prev, "Title Font": { ...prev["Title Font"], fontFamily: results.fonts[0] } }));
    let pack: RepoPackResult | null = null;
    if (window.electronAPI?.packRepo) {
      try { pack = await window.electronAPI.packRepo(source); } catch (err) { console.error("Repomix packing failed:", err); }
    }
    setRepoPack(pack);
    scaffold.approveCurrentStage({ confirmed: true, repoContext: buildRepoContext(results, pack) });
    const packNote = pack ? ` Repomix packed ${pack.totalFiles} files.` : "";
    await customAlert("Scan Complete", `Found ${results.components.length} components and ${results.routes.length} routes.${packNote} Generation will use this context.`);
  };

  const handleSelectFolder = async () => {
    if (!window.electronAPI?.selectDirectory) { await customAlert("Feature Unavailable", "Selecting Directories is only supported inside the desktop app"); return; }
    const dir = await window.electronAPI.selectDirectory();
    if (!dir) return;
    setSelectedRepoPath(dir);
    setScanning(true);
    try {
      if (!window.electronAPI?.scanRepo) return;
      const results = await window.electronAPI.scanRepo(dir);
      if (!results || (results.components.length === 0 && results.colors.length === 0 && results.routes.length === 0)) {
        await customAlert("Scan Complete", "Scan completed but no components or colors were detected. Try Skip to continue without repo context."); return;
      }
      await completeRepoScan(results, dir);
    } catch (err) { console.error(err); await customAlert("Scan Error", "Failed to scan selected directory."); }
    finally { setScanning(false); }
  };

  const handleCloneAndScan = async () => {
    if (!repoLink.trim()) return;
    if (!window.electronAPI?.cloneScan) { await customAlert("Feature Unavailable", "Cloning Repositories is only supported inside the desktop app"); return; }
    setScanning(true);
    try {
      const results = await window.electronAPI.cloneScan(repoLink.trim());
      if (!results || (results.components.length === 0 && results.colors.length === 0 && results.routes.length === 0)) {
        await customAlert("Scan Complete", "Clone succeeded but no components or colors were detected. Try Skip to continue without repo context."); return;
      }
      setSelectedRepoPath(repoLink.trim());
      await completeRepoScan(results, repoLink.trim());
    } catch (err) { console.error(err); await customAlert("Scan Error", "Failed to clone and scan repository."); }
    finally { setScanning(false); }
  };

  const handleSkipRepoScan = () => { scaffold.approveCurrentStage({ confirmed: false }); };

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!instructions.trim() && !narration.trim()) return;
    const controller = scaffold.createController();
    if (!controller) { await customAlert("Setup Required", "Please configure API key first using the settings menu"); return; }
    setRepoPack(null); setScannedExports(null); setPipelineState(null); setIsGenerating(true);
    try {
      const output = await runPipeline(instructions, narration, controller, {});
      if (output && output.assembled) {
        onGenerate({
          ...project, title: project?.title || "Untitled", prompt: instructions, narration: narration, code: output.assembled,
          scenes: project?.scenes || [], showVisualizer, fonts, colors: { ...swatches, backgroundImage }, bgSelection, bgDescription,
          unfinished: false, generationState: undefined, savePath: project?.savePath || "",
        });
      }
    } finally { setIsGenerating(false); }
  };

  const toggleFontProp = (row: FontRow, prop: "bold" | "italic" | "underline") => {
    setFonts((prev) => ({ ...prev, [row]: { ...prev[row], [prop]: !prev[row][prop] } }));
  };
  const setFontColor = (row: FontRow, color: string) => { setFonts((prev) => ({ ...prev, [row]: { ...prev[row], color } })); };
  const setFontSize = (row: FontRow, size: number) => { setFonts((prev) => ({ ...prev, [row]: { ...prev[row], size } })); };
  const setFontFamily = (row: FontRow, fontFamily: string) => { setFonts((prev) => ({ ...prev, [row]: { ...prev[row], fontFamily } })); };
  const renderFontRow = (label: FontRow) => {
    const f = (fonts as Record<string, FontSettings>)[label];
    return (
      <div key={label} className="space-y-1.5">
        <span className="text-[10px] font-semibold text-gray-500 capitalize">{label}</span>
        <div className="flex gap-1.5">
          <select value={f.fontFamily} onChange={(e) => setFontFamily(label, e.target.value)} className="flex-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-white outline-none">
            {availableFonts.map((font) => (<option key={font} value={font} className="bg-gray-950 text-white">{font}</option>))}
          </select>
        </div>
        {scannedExports && scannedExports.fonts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {scannedExports.fonts.slice(0, 4).map((font) => (
              <button key={font} type="button" onClick={() => setFontFamily(label, font)} className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors ${f.fontFamily === font ? "bg-violet-600 text-white border-violet-500" : "bg-gray-950/60 text-gray-500 border-gray-900 hover:text-gray-300"}`}>{font}</button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-gray-800">
            <button onClick={() => toggleFontProp(label, "bold")} className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.bold ? "bg-violet-600 text-white" : "bg-gray-950 text-gray-400 hover:text-gray-200"}`}><span className="font-bold">B</span></button>
            <button onClick={() => toggleFontProp(label, "italic")} className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.italic ? "bg-violet-600 text-white" : "bg-gray-950 text-gray-400 hover:text-gray-200"}`}><span className="italic">I</span></button>
            <button onClick={() => toggleFontProp(label, "underline")} className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.underline ? "bg-violet-600 text-white" : "bg-gray-950 text-gray-400 hover:text-gray-200"}`}><span className="underline">U</span></button>
          </div>
          <input type="color" value={f.color} onChange={(e) => setFontColor(label, e.target.value)} className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0" title={f.color} />
          <select value={f.size} onChange={(e) => setFontSize(label, Number(e.target.value))} className="w-14 rounded border border-gray-800 bg-gray-900 px-1 py-0.5 text-xs text-white">
            {SIZE_OPTIONS.map((s) => (<option key={s} value={s} className="bg-gray-950 text-white">{s}</option>))}
          </select>
        </div>
      </div>
    );
  };

  const repoScanProps = {
    repoLink, setRepoLink, scanning, selectedRepoPath, scannedExports, packStats: repoPack,
    onScanGit: handleCloneAndScan, onSelectFolder: handleSelectFolder, onViewReport: () => setShowDetailedPanel(true), onSkip: handleSkipRepoScan,
  };

  const StatusProps = {
    fonts, setFonts, swatches, setSwatches, availableFonts, bgSelection, onSelectBackground: setBgSelection,
    customAlert, state: pipelineState || { status: "idle" as const, progress: 0 }, onApproveStage: scaffold.approveCurrentStage, questions: [], onSubmitAnswers: () => {}, repoScan: repoScanProps,
  };

  const cPrimary = swatches["Primary"] || "#8b5cf6";

  return (
    <div className="flex h-screen bg-gray-950 text-white page-enter">
      <ResizableSidebar initialWidth={380} minWidth={320} maxWidth={500} className="border-r border-[#27272a] bg-[#121212] overflow-y-auto">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors" title="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="kinetic" className="w-5 h-5" />
              <span className="text-sm tracking-tight text-white">kinetic</span>
              <span className="text-[11px] text-gray-500">/ SaaS Demo</span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-gray-500 bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">v0.4.2</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 px-1">
              <Sparkle size={12} className="text-violet-400" weight="fill" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Assistant</span>
            </div>
            <div className="relative flex items-center bg-[#1a1a1e] border border-[#27272a] rounded-full p-2 justify-between gap-1 mt-2">
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Describe walkthrough flow..."
                className="flex-1 bg-transparent border-none pl-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none rounded-full"
              />
              <button onClick={handleRefinePrompt} disabled={isRefining || !instructions.trim()} className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-violet-900/20 disabled:opacity-30">
                {isRefining ? <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <ArrowRight size={14} weight="bold" />}
              </button>
            </div>
          </div>

          <div className="border-t border-[#27272a] p-4 space-y-4">
            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm font-bold">T</span><h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Typography</h3></div>
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
                          {availableFonts.map((font: string) => <option key={font} value={font}>{font}</option>)}
                        </select>
                        <CaretDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                      </div>
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                        <input type="color" value={f.color} onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], color: e.target.value } }))} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                        <div className="w-full h-full pointer-events-none" style={{ backgroundColor: f.color }} />
                      </div>
                      <select value={f.size} onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], size: Number(e.target.value) } }))} className="w-12 bg-[#18181b] border border-[#27272a] rounded-lg px-1 py-2 text-[10px] text-gray-400 font-medium outline-none">
                        {Array.from({ length: 63 }, (_, i) => i + 10).map((s) => <option key={s} value={s}>{s}</option>)}
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
            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm">&#9632;</span><h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Brand Colors</h3></div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(swatches).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-2 py-1.5 hover:border-gray-700 transition-colors">
                  <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    <input type="color" value={color} onChange={(e) => setSwatches((prev: any) => ({ ...prev, [label]: e.target.value }))} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                    <div className="w-full h-full pointer-events-none" style={{ backgroundColor: color }} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-semibold text-gray-400 capitalize truncate">{label}</span>
                    <span className="text-[8px] text-gray-600 font-mono leading-none truncate">{color}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#27272a] p-4 space-y-4">
            <div className="flex items-center gap-2"><Sparkle size={12} className="text-violet-400" /><h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Repo Scan</h3></div>
            <AIsidebar hidePrompt instructions={instructions} setInstructions={setInstructions} state={pipelineState || { status: "idle", progress: 0 }} isRefining={isRefining} handleRefinePrompt={handleRefinePrompt} placeholder="Describe walkthrough flow (e.g. show user signup, then render analytics page)..." StatusProps={StatusProps} />
          </div>

          <div className="border-t border-[#27272a] p-4 space-y-4">
            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm">&#9835;</span><h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Voiceover</h3></div>
            <VoiceoverAudioField mode={voiceoverMode} onModeChange={setVoiceoverMode} scriptText={narration} onScriptTextChange={setNarration} audioFile={voiceoverAudioFile} onAudioFileChange={handleVoiceoverAudioChange} isTranscribing={isTranscribingVoiceover} />
          </div>

          <div className="border-t border-[#27272a] p-4 space-y-4">
            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm">&#9633;</span><h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Soundtrack</h3></div>
            <AudioUploadField audioFile={audioFile} beatCount={beatFrames.length} isAnalyzing={isAnalyzingAudio} onSelectAudio={handleSelectAudio} />
          </div>
        </div>
      </ResizableSidebar>

      <main className="flex-1 flex flex-col bg-[#0a0c14] relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
          <PreviewWindow title="SaaS Preview">
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
                  {instructions.trim() ? instructions.slice(0, 48) : "Your SaaS, walked through live."}
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
                  Heading preview — your heading font and color
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
                  {narration.trim() ? narration.slice(0, 90) + "..." : "Paragraph preview updates live. Background and palette below reflect your tokens."}
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
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border p-2 flex flex-col gap-1" style={{ backgroundColor: `${swatches["Primary"] || "#8b5cf6"}14`, borderColor: `${swatches["Primary"] || "#8b5cf6"}30` }}>
                  <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: swatches["Primary"] || "#8b5cf6" }}>Metric</span>
                  <span className="text-[13px] font-extrabold" style={{ color: swatches["Secondary"] || "#a78bfa" }}>$184k</span>
                  <span className="text-[8px] font-bold" style={{ color: swatches["Success"] || "#22c55e" }}>+28% live</span>
                </div>
                <div className="rounded-xl border p-2 flex flex-col gap-1" style={{ backgroundColor: `${swatches["Accent"] || "#f59e0b"}14`, borderColor: `${swatches["Accent"] || "#f59e0b"}30` }}>
                  <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: swatches["Accent"] || "#f59e0b" }}>Users</span>
                  <span className="text-[13px] font-extrabold" style={{ color: swatches["Primary"] || "#8b5cf6" }}>4,892</span>
                  <span className="text-[8px] font-bold" style={{ color: swatches["Neutral"] || "#64748b" }}>active now</span>
                </div>
                <div className="rounded-xl border p-2 flex flex-col gap-1" style={{ backgroundColor: `${swatches["Error"] || "#ef4444"}10`, borderColor: `${swatches["Error"] || "#ef4444"}20` }}>
                  <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: swatches["Error"] || "#ef4444" }}>Status</span>
                  <span className="text-[13px] font-extrabold" style={{ color: swatches["Semantic"] || "#3b82f6" }}>Live</span>
                  <span className="text-[8px] font-mono text-gray-500">sync</span>
                </div>
              </div>
            </div>
          </PreviewWindow>
        </div>

        <div className="px-8 pb-3 flex items-center justify-between gap-4">
          <button onClick={() => assetInputRef.current?.click()} className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-white transition-colors">
            <UploadSimple size={14} /> Upload assets
          </button>
          <input type="file" multiple ref={assetInputRef} onChange={handleAssetUpload} className="hidden" />
          <button onClick={handleGenerate} disabled={!!pipelineState && pipelineState.status !== "idle" && pipelineState.status !== "done" && pipelineState.status !== "error" || isGenerating || scanning} className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>

        {pipelineState && pipelineState.status !== "idle" ? (
          <div className="flex flex-col gap-2 mx-8 mb-2 rounded-xl bg-gray-900 p-4 border border-gray-800">
            <div className="flex justify-between text-xs font-semibold text-gray-500"><span className="capitalize">{pipelineState.status === "repoScan" ? "Waiting for repo scan" : pipelineState.status.replace("-", " ")}</span><span>{Math.round(pipelineState.progress * 100)}%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-950"><div className={`h-full rounded-full transition-all duration-300 ${pipelineState.status === "error" ? "bg-red-500" : "bg-violet-600"}`} style={{ width: `${Math.round(pipelineState.progress * 100)}%` }} /></div>
          </div>
        ) : (<div className="h-8 bg-[#18181b] border-t border-[#27272a] px-8 flex items-center justify-between text-[10px] text-gray-500 font-medium z-20"><span>Ready to render 1080p @ 30fps</span><span className="opacity-60">v1.0.0</span></div>)}
      </main>

      {showDetailedPanel && scannedExports && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-[450px] h-full bg-gray-950 border-l border-gray-900 p-6 flex flex-col gap-6 overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-900 pb-3">
              <div className="flex items-center gap-2"><Sparkle size={18} className="text-emerald-400" /><h3 className="text-sm font-bold text-white">Full Codebase Scrape Report</h3></div>
              <button onClick={() => setShowDetailedPanel(false)} className="h-6 w-6 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white"><X size={16} /></button>
            </div>
            {scannedExports.routes.length > 0 && <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Routes ({scannedExports.routes.length})</span><div className="flex flex-wrap gap-1">{scannedExports.routes.map((route) => <span key={route} className="px-2 py-0.5 rounded bg-gray-900/80 text-gray-300 border border-gray-800 text-[9px] font-mono">{route}</span>)}</div></div>}
            {scannedExports.colors.length > 0 && <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Colors ({scannedExports.colors.length})</span><div className="flex flex-wrap gap-1.5">{scannedExports.colors.map((color) => <div key={color} className="flex items-center gap-1.5 bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-[10px] text-gray-300 font-mono"><div style={{ backgroundColor: color }} className="w-3 h-3 rounded-full border border-white/10" />{color}</div>)}</div></div>}
            {scannedExports.fonts.length > 0 && <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Fonts ({scannedExports.fonts.length})</span><div className="flex flex-wrap gap-1">{scannedExports.fonts.map((font) => <span key={font} className="px-2 py-0.5 rounded bg-gray-900/80 text-gray-300 border border-gray-800 text-[9px] font-sans">{font}</span>)}</div></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSGenerator;
