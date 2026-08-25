import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import logoIcon from "../../../kinetic_brand/logo_transparent.svg";
import { callLLM, getStoredConfig } from "@/renderer/agents/llmClient";
import { extractAudioFeatures } from "@/renderer/utils/audioUtils";
import { runBeatNetAI } from "@/renderer/utils/beatDetector";
import { FontSettings } from "@/renderer/components/BrandStylingPanel";
import type { PipelineState, AgentConfig, PipelineController } from "@/renderer/agents/types";
import { BackgroundSelection } from "@/renderer/components/BackgroundSelectorPanel";
import { ProjectData } from "@/renderer/pages/AppRouter";

export type FontRow = "Title Font" | "Heading" | "Paragraph";

export const DEFAULT_FONTS: Record<FontRow, FontSettings> = {
  "Title Font": {
    fontFamily: "Inter",
    bold: true,
    italic: false,
    underline: false,
    color: "#ffffff",
    size: 48,
  },
  Heading: {
    fontFamily: "Inter",
    bold: false,
    italic: false,
    underline: false,
    color: "#e2e8f0",
    size: 32,
  },
  Paragraph: {
    fontFamily: "Inter",
    bold: false,
    italic: false,
    underline: false,
    color: "#94a3b8",
    size: 14,
  },
};

export const COLOR_SWATCHES = [
  { label: "Primary", defaultColor: "#8b5cf6" },
  { label: "Secondary", defaultColor: "#a78bfa" },
  { label: "Accent", defaultColor: "#f59e0b" },
  { label: "Background", defaultColor: "#030712" },
  { label: "Neutral", defaultColor: "#64748b" },
  { label: "Semantic", defaultColor: "#3b82f6" },
  { label: "Error", defaultColor: "#ef4444" },
  { label: "Success", defaultColor: "#22c55e" },
];

export function initialSwatches(
  projectColors?: Record<string, string>,
): Record<string, string> {
  return (
    projectColors ||
    Object.fromEntries(COLOR_SWATCHES.map((s) => [s.label, s.defaultColor]))
  );
}

interface ScaffoldOptions {
  project: ProjectData | null;
  onBack: (updated?: ProjectData) => void;
  customAlert: (title: string, message: string) => Promise<void>;
  defaultPrompt?: string;
  refineSystemPrompt?: string;
  extraBackFields?: Record<string, unknown>;
}

export function useGeneratorScaffold({
  project,
  onBack,
  customAlert,
  defaultPrompt,
  refineSystemPrompt = "You are an AI prompt engineer for motion-graphics video generation. Take the user's basic description of the video animation they want to create and refine it to be descriptive, detailed, professional, and optimized for generating high-quality animation frames. Return ONLY the refined prompt text, with no introductory, greeting or meta text.",
  extraBackFields = {},
}: ScaffoldOptions) {
  const [instructions, setInstructions] = useState(
    project?.prompt || defaultPrompt || "",
  );
  const [narration, setNarration] = useState(project?.narration || "");
  const [useNarration, setUseNarration] = useState(!!project?.narration);
  const [voiceoverMode, setVoiceoverMode] = useState<"text" | "audio">("text");
  const [voiceoverAudioFile, setVoiceoverAudioFile] = useState<File | null>(
    null,
  );
  const [isTranscribingVoiceover, setIsTranscribingVoiceover] =
    useState(false);
  const [fonts, setFonts] = useState<Record<string, FontSettings>>(
    (project?.fonts as Record<string, FontSettings>) || DEFAULT_FONTS,
  );
  const [swatches, setSwatches] = useState<Record<string, string>>(
    initialSwatches(project?.colors),
  );
  const [availableFonts, setAvailableFonts] = useState<string[]>([
    "Inter",
    "Roboto",
    "Poppins",
    "DM Sans",
  ]);
  const [isRefining, setIsRefining] = useState(false);
  const [bgDescription, setBgDescription] = useState(
    project?.bgDescription || "",
  );
  const [backgroundImage, setBackgroundImage] = useState(
    project?.colors?.backgroundImage || "",
  );
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [bgSelection, setBgSelection] = useState<BackgroundSelection>(
    (project?.bgSelection as BackgroundSelection) || {
      type: "color",
      color: "#09090b",
      blurPx: 0,
    },
  );
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(
    null,
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [beatFrames, setBeatFrames] = useState<number[]>([]);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const assetInputRef = useRef<HTMLInputElement>(null);

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

  const handleVoiceoverAudioChange = useCallback(async (file: File | null) => {
    setVoiceoverAudioFile(file);
    if (!file) return;
    setIsTranscribingVoiceover(true);
    try {
      const float32Array = await extractAudioFeatures(file);
      const worker = new Worker(
        new URL("../../agents/whisperWorker.ts", import.meta.url),
        { type: "module" },
      );
      worker.onmessage = (e) => {
        const { status, result } = e.data;
        if (status === "complete") {
          setIsTranscribingVoiceover(false);
          worker.terminate();
          const chunks = result?.chunks || [];
          const formattedScript = chunks
            .map((c: { timestamp: number[]; text: string }) => {
              const startSec = Array.isArray(c.timestamp)
                ? c.timestamp[0]
                : 0;
              const endSec = Array.isArray(c.timestamp)
                ? c.timestamp[1] || startSec + 1.5
                : startSec + 1.5;
              return `[${startSec.toFixed(1)}s - ${endSec.toFixed(1)}s] ${c.text.trim()}`;
            })
            .join("\n");
          setNarration(formattedScript || result.text || "");
          setUseNarration(true);
        } else if (status === "error") {
          setIsTranscribingVoiceover(false);
          worker.terminate();
        }
      };
      worker.postMessage({ action: "transcribe", audioData: float32Array });
    } catch {
      setIsTranscribingVoiceover(false);
    }
  }, []);

  const handleSelectAudio = useCallback(async (file: File | null) => {
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
  }, []);

  const handleAssetUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const newAssets: string[] = [];
        for (let i = 0; i < files.length; i++) {
          newAssets.push(files[i].name);
        }
        setUploadedAssets((prev) => [...prev, ...newAssets]);
      }
    },
    [],
  );

  const handleRefinePrompt = useCallback(async () => {
    if (!instructions.trim()) return;
    const config = getStoredConfig();
    if (!config) {
      await customAlert(
        "Setup Required",
        "Please configure API key first using the settings menu",
      );
      return;
    }
    setIsRefining(true);
    try {
      const response = await callLLM(config, refineSystemPrompt, instructions);
      if (response.error) {
        await customAlert(
          "AI error",
          `Error refining prompt: ${response.error}`,
        );
      } else if (response.content) {
        setInstructions(response.content.trim());
      }
    } catch (err) {
      await customAlert("AI error", `Failed to refine prompt: ${err}`);
    } finally {
      setIsRefining(false);
    }
  }, [instructions, customAlert, refineSystemPrompt]);

  const capturePipelineState = useCallback(
    (s: PipelineState) => {
      setPipelineState(s);
    },
    [],
  );

  const activeApproveRef = useRef<((data?: unknown) => void) | null>(null);

  const createController = useCallback(
    (configOverride?: AgentConfig): PipelineController | null => {
      const config = configOverride ?? getStoredConfig();
      if (!config) return null;

      let resolver: ((data?: unknown) => void) | null = null;

      const waitForApproval = (): Promise<unknown> =>
        new Promise((resolve) => {
          resolver = resolve;
        });

      const approveStage = (data?: unknown) => {
        resolver?.(data);
        resolver = null;
      };

      activeApproveRef.current = approveStage;

      return { config, onState: capturePipelineState, waitForApproval, approveStage };
    },
    [capturePipelineState],
  );

  const tokenFont = useCallback(
    (row: FontRow): React.CSSProperties => {
      const f = fonts[row] as FontSettings | undefined;
      return {
        fontFamily: f?.fontFamily,
        color: f?.color,
        fontWeight: f?.bold ? 700 : 400,
        fontStyle: f?.italic ? "italic" : "normal",
        textDecoration: f?.underline ? "underline" : "none",
      };
    },
    [fonts],
  );

  const handleBackWithSave = useCallback(() => {
    if (project) {
      onBack({
        ...project,
        prompt: instructions,
        narration,
        fonts,
        colors: { ...swatches, backgroundImage },
        bgDescription,
        showVisualizer,
        bgSelection,
        ...extraBackFields,
      });
    } else {
      onBack();
    }
  }, [
    project,
    onBack,
    instructions,
    useNarration,
    narration,
    fonts,
    swatches,
    backgroundImage,
    bgDescription,
    showVisualizer,
    bgSelection,
    extraBackFields,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBackWithSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBackWithSave]);

  return {
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
    setAvailableFonts,
    isRefining,
    bgDescription,
    setBgDescription,
    backgroundImage,
    setBackgroundImage,
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
    capturePipelineState,
    createController,
    tokenFont,
    handleBack: handleBackWithSave,
    approveCurrentStage: (data?: unknown) => activeApproveRef.current?.(data),
  };
}

interface SidebarHeaderProps {
  breadcrumb: string;
  onBack: () => void;
}

export function SidebarHeader({ breadcrumb, onBack }: SidebarHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-gray-900 pb-3">
      <button
        onClick={onBack}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-900 hover:text-purple-400"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={onBack}
        className="flex items-center gap-2 hover:opacity-85 transition-opacity"
        title="Return to Dashboard"
      >
        <img
          src={logoIcon}
          className="h-6 w-6 object-contain"
          alt="Kinetic"
          style={{
            filter:
              "drop-shadow(0 0 10px rgba(139, 92, 246, 0.45)) brightness(1.15)",
          }}
        />
        <span className="text-sm font-bold text-white">kinetic</span>
      </button>
      <span className="text-sm text-gray-700">/</span>
      <span className="text-sm text-gray-400">{breadcrumb}</span>
    </header>
  );
}
