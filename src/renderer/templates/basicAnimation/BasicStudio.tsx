import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectData } from '../../pages/AppRouter';
import {
    TextB, TextItalic, TextUnderline, Play, Pause,
    SkipBack, SkipForward, CaretDoubleLeft, CaretDoubleRight, Gear, CaretDown,
    ArrowLeft, Palette, TextAa
} from '@phosphor-icons/react';
import VideoComposition from '../../scenes/VideoComposition';
import { Player, PlayerRef } from '@remotion/player';
import { sanitizeCompositionCode } from '../../agents/pipeline';
import { AudioVisualizer } from '../../primitives/AudioVisualizer';
import { RenderProgressScreen } from '../../scenes/RenderProgressScreen';

interface StudioProps {
    project: ProjectData;
    onBack: () => void;
    onRename: (newTitle: string) => void;
    onUpdateProject: (updated: ProjectData) => void;
    customAlert: (title: string, message: string) => Promise<void>;
    customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

const FPS = 30;
const RESOLUTIONS = [
    { label: '4k', w: 3840, h: 2160 },
    { label: '1080p', w: 1920, h: 1080 },
    { label: '720p', w: 1280, h: 720 },
    { label: '480p', w: 854, h: 480 },
];
type FontRow = 'Title' | 'Heading' | 'Paragraph';
interface FS { fontFamily: string; bold: boolean; italic: boolean; underline: boolean; color: string; size: number; }

const DEF_FONTS: Record<FontRow, FS> = {
    Title: { fontFamily: 'Inter', bold: true, italic: false, underline: false, color: '#ffffff', size: 48 },
    Heading: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#e2e8f0', size: 32 },
    Paragraph: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#94a3b8', size: 14 },
};

const SIZES = Array.from({ length: 63 }, (_, i) => i + 10);

const Btn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`flex h-6 w-6 items-center justify-center text-xs transition-colors rounded ${active ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'}`}>{children}</button>
);

const BasicStudio: React.FC<StudioProps> = ({ project, onBack, onRename, onUpdateProject, customAlert, customConfirm }) => {
    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [res, setRes] = useState(RESOLUTIONS[1]);
    const [scale, setScale] = useState(1);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleLeftMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftSidebarWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(480, startWidth + (moveEvent.clientX - startX)));
            setLeftSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [leftSidebarWidth]);

    const handleRightMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = rightSidebarWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(240, Math.min(500, startWidth - (moveEvent.clientX - startX)));
            setRightSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [rightSidebarWidth]);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const scaleX = width / 1024;
                const scaleY = height / 576;
                const newScale = Math.min(scaleX, scaleY);
                setScale(newScale);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const [fonts, setFonts] = useState<Record<FontRow, FS>>(project.fonts as Record<FontRow, FS> || DEF_FONTS);
    const [colors, setColors] = useState<Record<string, string>>(project.colors || { Primary: '#6366f1', Secondary: '#8b5cf6', Accent: '#f59e0b', Background: '#0f172a' });
    const [globalAudioUrl, setGlobalAudioUrl] = useState<string>('');
    const [showVisualizer, setShowVisualizer] = useState(project.showVisualizer ?? false);
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans', 'Montserrat', 'Outfit']);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(project.title);
    const [renderProgress, setRenderProgress] = useState<{ frame: number; total: number; status: 'rendering' | 'done' | 'error'; error?: string } | null>(null);

    const updFont = (row: FontRow, patch: Partial<FS>) => setFonts((p) => ({ ...p, [row]: { ...p[row], ...patch } }));

    const handleApply = async () => {
        onUpdateProject({
            ...project,
            showVisualizer,
            fonts,
            colors,
        } as any);
        await customAlert("Save Project", "Project styling saved successfully");
    };

    const maxFrames = 300;



    const playerRef = React.useRef<PlayerRef>(null);

    useEffect(() => {
        if (!playerRef.current) return;
        if (playing) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    }, [playing]);

    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;
        const onFrameUpdate = (e: any) => {
            setFrame(e.detail.frame);
        };
        player.addEventListener('frameupdate', onFrameUpdate);
        return () => {
            player.removeEventListener('frameupdate', onFrameUpdate);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName;
            if (e.code === 'Space' && activeTag !== 'INPUT' && activeTag !== 'SELECT' && activeTag !== 'TEXTAREA') {
                e.preventDefault();
                setPlaying((p) => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleExport = useCallback(async () => {
        if (!window.electronAPI) {
            await customAlert("Export Feature", 'Export available in desktop app');
            return;
        }

        setRenderProgress({ frame: 0, total: 100, status: 'rendering' });

        const removeListener = window.electronAPI.onRenderProgress((progress) => {
            setRenderProgress({
                frame: progress.frame,
                total: progress.totalFrames,
                status: 'rendering'
            });
        });

        window.electronAPI.renderVideo({
            compositionId: 'VideoComposition',
            outputPath: `${project.title.replace(/\s+/g, '_')}.mp4`,
        }).then((res) => {
            removeListener();
            if (res.success) {
                setRenderProgress({ frame: 100, total: 100, status: 'done' });
            } else {
                setRenderProgress({ frame: 0, total: 100, status: 'error', error: res.error });
            }
        }).catch((err) => {
            removeListener();
            setRenderProgress({ frame: 0, total: 100, status: 'error', error: String(err) });
        });
    }, [project.title, customAlert]);

    const renderFontRow = (label: FontRow) => {
        const f = fonts[label] || DEF_FONTS[label];
        return (
            <div key={label} className="space-y-1.5">
                <span className="text-[10px] font-semibold text-gray-500 capitalize">{label}</span>
                <div className="flex gap-1.5">
                    <select value={f.fontFamily} onChange={(e) => updFont(label, { fontFamily: e.target.value })} className="flex-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-white outline-none">
                        {availableFonts.map((font) => <option key={font} value={font} className="bg-gray-950 text-white">{font}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="flex overflow-hidden rounded border border-gray-800">
                        <Btn active={f.bold} onClick={() => updFont(label, { bold: !f.bold })}><TextB size={12} weight="bold" /></Btn>
                        <Btn active={f.italic} onClick={() => updFont(label, { italic: !f.italic })}><TextItalic size={12} /></Btn>
                        <Btn active={f.underline} onClick={() => updFont(label, { underline: !f.underline })}><TextUnderline size={12} /></Btn>
                    </div>
                    <input type="color" value={f.color} onChange={(e) => updFont(label, { color: e.target.value })} className="h-6 w-6 cursor-pointer rounded border border-gray-800 bg-transparent p-0" />
                    <select value={f.size} onChange={(e) => updFont(label, { size: Number(e.target.value) })} className="rounded border border-gray-800 bg-gray-900 px-1.5 py-1 text-xs text-white outline-none">
                        {SIZES.map((s) => <option key={s} value={s} className="bg-gray-950 text-white">{s}</option>)}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white select-none">
            {renderProgress && (
                <RenderProgressScreen
                    progress={renderProgress}
                    onClose={() => setRenderProgress(null)}
                />
            )}

            {/* LEFT SIDEBAR */}
            <aside style={{ width: `${leftSidebarWidth}px` }} className="flex flex-shrink-0 flex-col border-r border-gray-800 bg-gray-900/40 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-gray-800 p-4">
                    <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    {isEditingName ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full rounded border border-purple-500/50 bg-gray-950 px-2 py-1 text-xs text-white outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (tempName.trim()) onRename(tempName.trim());
                                        setIsEditingName(false);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <span
                            onClick={() => { setTempName(project.title); setIsEditingName(true); }}
                            className="truncate text-sm font-medium text-white cursor-pointer hover:text-purple-400"
                            title="Click to Rename"
                        >
                            {project.title}
                        </span>
                    )}
                </div>
                <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-6">
                    <section>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Soundtrack</h3>
                        <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/50 p-4 transition-colors hover:bg-gray-800">
                            <span className="text-xs text-purple-400">Upload MP3 / WAV</span>
                            <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setGlobalAudioUrl(url);
                                    }
                                }}
                            />
                        </label>
                        {globalAudioUrl && <audio src={globalAudioUrl} className="mt-2 w-full h-8" controls />}
                    </section>

                    <section className="space-y-3 border-t border-gray-800/60 pt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prompt Details</h3>
                        <p className="text-xs text-gray-300 bg-gray-950/60 p-3 rounded-lg border border-gray-800/80 leading-relaxed font-sans">
                            {project.prompt || "No prompt instruction specified"}
                        </p>
                    </section>
                </div>
            </aside>

            {/* RESIZE HANDLE LEFT */}
            <div className="w-1 cursor-col-resize bg-gray-900 hover:bg-purple-500/50 transition-colors self-stretch z-10 flex-shrink-0" onMouseDown={handleLeftMouseDown} />

            {/* CENTER CANVAS & PLAYER */}
            <main className="flex flex-1 flex-col overflow-hidden bg-gray-950">
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-2">
                    <select value={res.label} onChange={(e) => setRes(RESOLUTIONS.find((r) => r.label === e.target.value) ?? RESOLUTIONS[1])} className="rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none">
                        {RESOLUTIONS.map((r) => <option key={r.label} value={r.label}>{r.label} ({r.w}&times;{r.h})</option>)}
                    </select>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500">
                            Export MP4
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center bg-gray-950 p-6 relative">
                    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden relative">
                        <div
                            style={{
                                width: '1024px',
                                height: '576px',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) scale(${scale})`,
                                transformOrigin: 'center center',
                                backgroundColor: colors.Background || '#0f172a',
                                flexShrink: 0,
                            }}
                            className="rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden flex items-center justify-center"
                        >
                            {showVisualizer && globalAudioUrl && (
                                <AudioVisualizer
                                    audioUrl={globalAudioUrl}
                                    glowColor={colors.Primary || '#6366f1'}
                                    frame={frame}
                                    fps={FPS}
                                />
                            )}
                            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                                <Player
                                    ref={playerRef}
                                    component={VideoComposition}
                                    durationInFrames={300}
                                    compositionWidth={1920}
                                    compositionHeight={1080}
                                    fps={30}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TIMELINE PLAYER CONTROLS */}
                <div className="border-t border-gray-800 bg-gray-900/80 px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                        {[
                            { icon: CaretDoubleLeft, title: 'Skip to start', action: () => { playerRef.current?.seekTo(0); playerRef.current?.pause(); setFrame(0); setPlaying(false); } },
                            { icon: SkipBack, title: 'Previous frame', action: () => { const nf = Math.max(0, frame - 1); playerRef.current?.seekTo(nf); setFrame(nf); } },
                            { icon: null, title: playing ? 'Pause' : 'Play', action: () => setPlaying((p) => !p), isPlay: true },
                            { icon: SkipForward, title: 'Next frame', action: () => { const nf = Math.min(maxFrames - 1, frame + 1); playerRef.current?.seekTo(nf); setFrame(nf); } },
                            { icon: CaretDoubleRight, title: 'Skip to end', action: () => { const nf = maxFrames - 1; playerRef.current?.seekTo(nf); playerRef.current?.pause(); setFrame(nf); setPlaying(false); } },
                        ].map((b, i) =>
                            b.isPlay ? (
                                <button key={i} onClick={b.action} className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600 text-sm text-white transition-colors hover:bg-purple-500" title={b.title}>
                                    {playing ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                            ) : (
                                <button key={i} onClick={b.action} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300" title={b.title}>
                                    {React.createElement(b.icon!, { size: 14 })}
                                </button>
                            )
                        )}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="w-10 text-right text-[10px] text-gray-500">{frame}</span>
                        <div className="relative flex-1">
                            <input
                                type="range"
                                min={0}
                                max={maxFrames - 1}
                                value={frame}
                                onChange={(e) => { const nf = Number(e.target.value); playerRef.current?.seekTo(nf); setFrame(nf); }}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-purple-600 outline-none"
                            />
                        </div>
                        <span className="w-10 text-[10px] text-gray-500">{maxFrames}</span>
                    </div>
                </div>
            </main>

            {/* RESIZE HANDLE RIGHT */}
            <div className="w-1 cursor-col-resize bg-gray-900 hover:bg-purple-500/50 transition-colors self-stretch z-10 flex-shrink-0" onMouseDown={handleRightMouseDown} />

            {/* RIGHT SIDEBAR: BRAND & STYLING PANEL */}
            <aside style={{ width: `${rightSidebarWidth}px` }} className="flex flex-shrink-0 flex-col border-l border-gray-800 bg-gray-900/40 p-4 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-4">
                    <Palette size={16} className="text-purple-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Styling & Brand Guidelines</h3>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto">
                    {/* TYPOGRAPHY SECTION */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                            <TextAa size={14} className="text-purple-400" />
                            Typography
                        </h4>
                        <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                            {renderFontRow('Title')}
                            {renderFontRow('Heading')}
                            {renderFontRow('Paragraph')}
                        </div>
                    </div>

                    {/* PALETTE COLORS SECTION */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400">Palette Colors</h4>
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                            {Object.entries(colors).map(([key, val]) => {
                                if (key === 'backgroundImage') return null;
                                return (
                                    <div key={key} className="flex items-center gap-2 rounded bg-gray-900/80 p-2 border border-gray-800/80">
                                        <input
                                            type="color"
                                            value={val}
                                            onChange={(e) => setColors((p) => ({ ...p, [key]: e.target.value }))}
                                            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                                        />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[10px] font-semibold text-gray-300 truncate">{key}</span>
                                            <span className="text-[9px] text-gray-500 font-mono">{val}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-800 mt-auto">
                    <button
                        onClick={handleApply}
                        className="w-full rounded-lg bg-purple-600 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-500 shadow-lg shadow-purple-600/20"
                    >
                        Apply Changes
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default BasicStudio;
