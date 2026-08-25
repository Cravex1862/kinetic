import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ArrowLeft, Pause, Play, ArrowsClockwise } from "@phosphor-icons/react";
import { Player, PlayerRef } from "@remotion/player";
import { SafeComposition } from "../scenes/SafeComposition";
import type { ProjectData } from "./AppRouter";
import { AIsidebar } from "../components/AIsidebar";
import type { BackgroundSelection } from "../components/BackgroundSelectorPanel";
import type { FontSettings } from "../components/BrandStylingPanel";
import { runPipeline } from "../agents/pipeline";
import type { PipelineState } from "../agents/types";
import { getStoredConfig } from "../agents/llmClient";

interface StudioPageProps {
    project: ProjectData;
    onBack: () => void;
    onRename: (newTitle: string) => void;
    onUpdateProject: (updated: ProjectData) => void;
    customAlert: (title: string, message: string) => Promise<void>;
}

const FPS = 30;
const SPEEDS = [0.5, 1, 2];

const formatTime = (frames: number): string => {
    const totalSeconds = Math.floor(frames / FPS);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const StudioPage: React.FC<StudioPageProps> = ({
    project,
    onBack,
    onRename,
    onUpdateProject,
    customAlert,
}) => {
    const playerRef = useRef<PlayerRef>(null);

    const [title, setTitle] = useState(project.title);
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loop, setLoop] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [instructions, setInstructions] = useState("");
    const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const [fonts, setFonts] = useState<Record<string, FontSettings>>(
        () => (project.fonts as Record<string, FontSettings>) || {},
    );
    const [swatches, setSwatches] = useState<Record<string, string>>(
        () =>
            (project.colors as Record<string, string>) || {
                Primary: "#8b5cf6",
                Secondary: "#a78bfa",
                Accent: "#f59e0b",
            },
    );
    const [bgSelection, setBgSelection] = useState<BackgroundSelection>(
        () =>
            (project.bgSelection as BackgroundSelection) || {
                type: "color",
                color: "#09090b",
                blurPx: 0,
            },
    );

    const durationInFrames = useMemo(() => {
        const scenes = project.scenes as Array<{ duration?: number }> | undefined;
        const total = Array.isArray(scenes)
            ? scenes.reduce(
                  (sum, s) => sum + (typeof s?.duration === "number" ? s.duration : 0),
                  0,
              )
            : 0;
        return total > 0 ? total : 150;
    }, [project.scenes]);

    useEffect(() => {
        let raf: number;
        const tick = () => {
            const player = playerRef.current;
            if (player) {
                setFrame(player.getCurrentFrame());
                setIsPlaying(player.isPlaying());
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const togglePlay = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;
        if (player.isPlaying()) {
            player.pause();
        } else {
            player.play();
        }
    }, []);

    const handleSeek = (value: number) => {
        playerRef.current?.seekTo(value);
        setFrame(value);
    };

    const captureState = useCallback((next: PipelineState) => {
        setPipelineState(next);
    }, []);

    const activeApproveRef = useRef<((data?: unknown) => void) | null>(null);

    const handleRun = async () => {
        if (isRunning || !instructions.trim()) return;
        const config = getStoredConfig();
        if (!config) {
            await customAlert("Setup Required", "Please configure API key first using the settings menu");
            return;
        }
        let resolver: ((data?: unknown) => void) | null = null;
        const waitForApproval = () => new Promise<unknown>((resolve) => { resolver = resolve; });
        const approveStage = (data?: unknown) => { resolver?.(data); resolver = null; };
        activeApproveRef.current = approveStage;
        const controller = { config, onState: captureState, waitForApproval, approveStage };

        setIsRunning(true);
        setPipelineState({ status: "storyboarding", progress: 0 });
        try {
            const output = await runPipeline(instructions, project.narration || "", controller, {
                skipRepoGate: true,
            });
            if (output && output.assembled && onUpdateProject) {
                onUpdateProject({
                    ...project,
                    prompt: instructions,
                    code: output.assembled,
                    unfinished: false,
                });
            }
        } finally {
            setIsRunning(false);
        }
    };

    const commitTitle = () => {
        const trimmed = title.trim();
        if (trimmed && trimmed !== project.title) {
            onRename(trimmed);
        } else {
            setTitle(project.title);
        }
    };

    const StatusProps = {
        fonts,
        setFonts,
        swatches,
        setSwatches,
        availableFonts: ["Inter", "Roboto", "Poppins", "DM Sans"],
        bgSelection,
        onSelectBackground: setBgSelection,
        customAlert,
        state: pipelineState || ({ status: "idle", progress: 0 } as PipelineState),
        onApproveStage: (data?: unknown) => activeApproveRef.current?.(data),
        questions: [],
        onSubmitAnswers: () => {},
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#07070d] text-white">
            <aside className="flex w-[360px] shrink-0 flex-col border-r border-gray-900 bg-[#0b0b14] p-3">
                <div className="min-h-0 grow">
                    <AIsidebar
                        initialStates={[]}
                        instructions={instructions}
                        setInstructions={setInstructions}
                        placeholder="Describe the changes you want to make..."
                        StatusProps={StatusProps}
                        state={pipelineState || ({ status: "idle", progress: 0 } as PipelineState)}
                    />
                </div>
                <button
                    onClick={handleRun}
                    disabled={isRunning || !instructions.trim()}
                    className="mt-2 flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-600 text-xs font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <svg
                        className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    {isRunning ? "Working..." : "Edit Video"}
                </button>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-12 shrink-0 items-center gap-3 border-b border-gray-900 px-4">
                    <button
                        onClick={onBack}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
                        title="Back to dashboard"
                    >
                        <ArrowLeft size={15} weight="bold" />
                    </button>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={commitTitle}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="w-64 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-bold outline-none transition-colors hover:border-gray-800 focus:border-violet-600 focus:bg-gray-950/60"
                    />
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                        {formatTime(durationInFrames)} · {FPS} fps · 1920×1080
                    </span>
                </header>

                <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                    <div className="h-full w-full overflow-hidden rounded-xl border border-gray-900 bg-black shadow-[0_0_60px_rgba(0,0,0,0.6)]">
                        <Player
                            ref={playerRef}
                            component={SafeComposition}
                            inputProps={{ bgSelection }}
                            durationInFrames={durationInFrames}
                            fps={FPS}
                            compositionWidth={1920}
                            compositionHeight={1080}
                            controls={false}
                            loop={loop}
                            playbackRate={speed}
                            style={{ width: "100%", height: "100%" }}
                            acknowledgeRemotionLicense
                        />
                    </div>
                </div>

                <footer className="flex h-16 shrink-0 items-center gap-4 border-t border-gray-900 bg-[#0b0b14] px-5">
                    <button
                        onClick={togglePlay}
                        disabled={!loop && frame >= durationInFrames - 1 && !isPlaying}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.45)] transition-all hover:bg-violet-500 hover:shadow-[0_0_22px_rgba(139,92,246,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isPlaying ? (
                            <Pause size={17} weight="fill" />
                        ) : (
                            <Play size={17} weight="fill" className="translate-x-[1px]" />
                        )}
                    </button>

                    <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-gray-400">
                        {formatTime(frame)}
                    </span>

                    <input
                        type="range"
                        min={0}
                        max={Math.max(durationInFrames - 1, 1)}
                        value={Math.min(frame, durationInFrames - 1)}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-800 accent-violet-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(139,92,246,0.7)]"
                    />

                    <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-600">
                        {formatTime(durationInFrames)}
                    </span>

                    <button
                        onClick={() => setLoop((prev) => !prev)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                            loop
                                ? "bg-violet-600/20 text-violet-400"
                                : "text-gray-500 hover:bg-gray-900 hover:text-gray-300"
                        }`}
                        title={loop ? "Looping on" : "Looping off"}
                    >
                        <ArrowsClockwise size={14} weight="bold" />
                    </button>

                    <div className="flex shrink-0 overflow-hidden rounded-md border border-gray-800">
                        {SPEEDS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className={`px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                                    speed === s
                                        ? "bg-violet-600 text-white"
                                        : "bg-transparent text-gray-500 hover:text-gray-300"
                                }`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default StudioPage;
