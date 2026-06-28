import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectData } from '../../pages/AppRouter';
import {
    TextB, TextItalic, TextUnderline, Play, Pause,
    SkipBack, SkipForward, CaretDoubleLeft, CaretDoubleRight, Gear, CaretDown,
    ArrowLeft,
} from '@phosphor-icons/react';
import logoWithText from '../../../../kinetic_brand/logo_transparent_with_text.svg';
import { ComponentRenderer } from '../../scenes/ComponentRenderer';
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
const SIZES = Array.from({ length: 63 }, (_, i) => i + 10);
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

const Btn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`flex h-6 w-6 items-center justify-center text-xs transition-colors ${active ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'}`}>{children}</button>
);

const Studio: React.FC<StudioProps> = ({ project, onBack, onRename, onUpdateProject, customAlert, customConfirm }) => {
    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [res, setRes] = useState(RESOLUTIONS[0]);
    const [scale, setScale] = useState(1);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(280);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleLeftMouseDown = (e: React.MouseEvent) => {
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
    };

    const handleRightMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = rightSidebarWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(480, startWidth - (moveEvent.clientX - startX)));
            setRightSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    interface FlatComponentInfo {
        node: any;
        path: number[];
    }

    const getFlatComponents = (nodes: any[]): FlatComponentInfo[] => {
        const result: FlatComponentInfo[] = [];

        const recurse = (currentNodes: any[], currentPath: number[]) => {
            currentNodes.forEach((node, idx) => {
                const path = [...currentPath, idx];
                result.push({ node, path });
                if (node.children && Array.isArray(node.children)) {
                    recurse(node.children, path);
                }
            });
        };

        recurse(nodes, []);
        return result;
    };

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
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

    const [colorOpen, setColorOpen] = useState(true);
    const [typoOpen, setTypoOpen] = useState(true);
    const [fonts, setFonts] = useState<Record<FontRow, FS>>(project.fonts || DEF_FONTS);
    const [colors, setColors] = useState<Record<string, string>>(project.colors || { Primary: '#6366f1', Secondary: '#8b5cf6', Accent: '#f59e0b', Background: '#0f172a' });
    const [globalAudioUrl, setGlobalAudioUrl] = useState<string>('');
    const [showVisualizer, setShowVisualizer] = useState(project.showVisualizer ?? false);
    const [visualizerVariant, setVisualVariant] = useState<'wave' | 'bars' | 'circle'>(project.visualizerVariant || 'wave');
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans']);
    const [localScenes, setLocalScenes] = useState<any[]>(project.scenes ?? []);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(project.title);
    const [renderProgress, setRenderProgress] = useState<{ frame: number; total: number; status: 'rendering' | 'done' | 'error'; error?: string } | null>(null);
    const handleApply = async () => {
        onUpdateProject({
            ...project,
            scenes: localScenes,
            showVisualizer,
            fonts,
            colors,
            visualizerVariant
        });
        await customAlert("Save Project", "Project saved successfully");
    };
    React.useEffect(() => {
        if ('queryLocalFonts' in window) {
            (window as any).queryLocalFonts()
                .then((fontsList: any[]) => {
                    const families = Array.from(new Set(fontsList.map((f) => f.family))) as string[];
                    families.sort();
                    if (families.length > 0) {
                        setAvailableFonts(families);
                    }
                })
                .catch(() => { });
        }
    }, []);

    const scenes = localScenes ?? [];
    const maxFrames = scenes.reduce((s, c) => s + c.duration, 0) || 150;
    let activeScene = 0;
    let sceneStartFrame = 0;
    if (scenes.length > 0) {
        let acc = 0;
        for (let i = 0; i < scenes.length; i++) {
            if (frame < acc + scenes[i].duration) { activeScene = i; sceneStartFrame = acc; break; }
            acc += scenes[i].duration;
        }
    }
    const localFrame = frame - sceneStartFrame;

    useEffect(() => {
        if (!playing) return;
        const t = setInterval(() => setFrame((f) => (f >= maxFrames ? 0 : f + 1)), 1000 / FPS);
        return () => clearInterval(t);
    }, [playing, maxFrames]);

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

        const removeListener = window.electronAPI.onRenderProgress((_event, progress) => {
            setRenderProgress({
                frame: progress.frame,
                total: progress.total,
                status: 'rendering'
            });
        });


        const seperator = project.savePath.includes('\\') ? '\\' : '/';
        const parts = project.savePath.split(seperator);
        parts[parts.length - 1] = `${project.title}.mp4`;
        const absoluteOutputPath = parts.join(seperator);

        window.electronAPI.exportVideo({
            compositionId: 'SceneSequence',
            outputPath: absoluteOutputPath,
            framesPerScene: scenes.map((s) => s.duration),
            fps: FPS,
            width: res.w,
            height: res.h,
            props: {
                scenes,
                fonts,
                colors,
                showVisualizer,
                globalAudioUrl,
            }
        }).then((res) => {
            removeListener();

            if (res.success) {
                setRenderProgress({ frame: 100, total: 100, status: 'done' });
            }
            else {
                setRenderProgress({ frame: 0, total: 100, status: 'error', error: res.error });
            }
        }).catch((err) => {
            removeListener();
            setRenderProgress({ frame: 0, total: 100, status: 'error', error: String(err) });
        })
    }, [project.title, scenes, fonts, colors, showVisualizer, globalAudioUrl, res]);




    const upd = (row: FontRow, patch: Partial<FS>) => setFonts((p) => ({ ...p, [row]: { ...p[row], ...patch } }));

    const renderFontRow = (label: FontRow) => {
        const f = fonts[label];
        return (
            <div key={label} className="space-y-2">
                <span className="text-xs font-medium text-gray-400">{label}</span>
                <div className="flex gap-1.5">
                    <select value={f.fontFamily} onChange={(e) => upd(label, { fontFamily: e.target.value })} className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white outline-none">
                        {availableFonts.map((font) => <option key={font} value={font}>{font}</option>)}
                    </select>
                    <button
                        onClick={() => {
                            const newFont = prompt('Enter custom font family name:');
                            if (newFont && newFont.trim() && !availableFonts.includes(newFont.trim())) {
                                const trimmed = newFont.trim();
                                setAvailableFonts((prev) => [...prev, trimmed]);
                                upd(label, { fontFamily: trimmed });
                            }
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-xs text-gray-400 hover:text-white transition-colors"
                        title="Add Custom Font"
                    >
                        +
                    </button>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="flex overflow-hidden rounded-md border border-gray-700">
                        <Btn active={f.bold} onClick={() => upd(label, { bold: !f.bold })}><TextB size={12} weight="bold" /></Btn>
                        <Btn active={f.italic} onClick={() => upd(label, { italic: !f.italic })}><TextItalic size={12} /></Btn>
                        <Btn active={f.underline} onClick={() => upd(label, { underline: !f.underline })}><TextUnderline size={12} /></Btn>
                    </div>
                    <input type="color" value={f.color} onChange={(e) => upd(label, { color: e.target.value })} className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                    <select value={f.size} onChange={(e) => upd(label, { size: Number(e.target.value) })} className="w-14 rounded-md border border-gray-700 bg-gray-900 px-1 py-1 text-xs text-white outline-none">
                        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
        );
    };

    const cur = scenes[activeScene];
    const updateComponentProp = (path: number[], propKey: string, propValue: any) => {
        setLocalScenes(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            let current = copy[activeScene].components;
            for (let i = 0; i < path.length; i++) {
                const idx = path[i];
                if (i === path.length - 1) {
                    current[idx].props[propKey] = propValue;
                } else {
                    current = current[idx].children;
                }
            }
            return copy;
        });
    };
    return (

        <div className="flex h-screen bg-gray-950 text-white">
            <aside
                style={{ width: `${leftSidebarWidth}px` }}
                className="flex flex-shrink-0 flex-col border-r border-gray-800 bg-gray-900/40"
            >
                <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
                    <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300">
                        <ArrowLeft size={16} />
                    </button>
                    {isEditingName ? (
                        <div className='flex items-center gap-1.5 min-w-0'>
                            <input type='text' value={tempName} onChange={(e) => setTempName(e.target.value)} className='rounded border border-gray-700 bg-gray-950 px-2 py-0.5 text-xs text-white outline-none w-32 focus:border-indigo-500'>

                            </input>
                            <button
                                onClick={() => {
                                    if (tempName.trim()) {
                                        onUpdateProject({ ...project, title: tempName.trim() });
                                    }
                                    setIsEditingName(false);
                                }}
                                className='flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-xs text-white hover:bg-indigo-500'>
                                &#10003;
                            </button>
                        </div>
                    ) : (
                        <span
                            onClick={() => {
                                setTempName(project.title);
                                setIsEditingName(true);
                            }}
                            className='truncate text-sm font-medium text-white cursor-pointer hover:text-purple-400'
                            title='Click to Rename'>
                            {project.title}
                        </span>
                    )}

                </div>
                <div className="flex flex-1 flex-col overflow-y-auto p-4">
                    <section className="mb-6">
                        <h3 className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                            Soundtrack
                        </h3>
                        <label className='flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/50 p-4 transition-colors hover:bg-gray-800' >
                            <span className='text-xs text-purple-400'>Upload MP3 / WAV</span>
                            <input
                                type='file'
                                accept='audio/*'
                                className='hidden'
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setGlobalAudioUrl(url);
                                        navigator.clipboard.writeText(url);
                                    }
                                }
                                } />
                        </label>
                        {globalAudioUrl && (
                            <>
                                <audio src={globalAudioUrl} className='mt-2 w-full h-8' controls />
                                <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2">
                                    <span className="text-xs text-gray-400">Show Visualizer</span>
                                    <input
                                        type="checkbox"
                                        checked={showVisualizer}
                                        onChange={(e) => setShowVisualizer(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-gray-700 bg-gray-950 text-purple-600 focus:ring-0 outline-none accent-purple-600"
                                    />
                                </div>
                            </>
                        )}
                        {showVisualizer && (
                            <div className='mt-2 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2'>
                                <span className='text-xs text-gray-400'>Visualizer Type</span>
                                <select value={visualizerVariant} onChange={(e) => {
                                    setVisualVariant(e.target.value as any);
                                }} className='rounded border border-gray-700 bg-gray-950 px-2 py-0.5 text-xs text-white outline-none'>

                                    <option value="wave">Wave</option>
                                    <option value="bars">Bars</option>
                                    <option value="circle">Circle</option>
                                </select>
                            </div>
                        )}
                    </section>
                    <section className="mb-4">
                        <button onClick={() => setTypoOpen((o) => !o)} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Typography <CaretDown size={12} className={`transition-transform ${typoOpen ? '' : '-rotate-90'}`} />
                        </button>
                        {typoOpen && <div className="mt-3 space-y-4">{renderFontRow('Title')}{renderFontRow('Heading')}{renderFontRow('Paragraph')}</div>}
                    </section>
                    <section className="mb-4">
                        <button onClick={() => setColorOpen((o) => !o)} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Colors <CaretDown size={12} className={`transition-transform ${colorOpen ? '' : '-rotate-90'}`} />

                        </button>
                        {colorOpen && <div className="mt-3 space-y-3">{Object.entries(colors).map(([l, v]) => (
                            <div key={l} className="flex items-center gap-2">
                                <input type="color" value={v} onChange={(e) => setColors((p) => ({ ...p, [l]: e.target.value }))} className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                                <span className="flex-1 text-xs text-gray-400">{l}</span>
                                <span className="text-[10px] text-gray-600">{v}</span>
                            </div>
                        ))}</div>}
                    </section>
                    <div className="mt-auto pt-4">
                        <button onClick={handleApply} className="w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500">Apply</button>
                    </div>
                </div>
            </aside>
            {/* Draggable Divider for Left Sidebar */}
            <div
                className="w-1 cursor-col-resize bg-gray-900 hover:bg-purple-500/50 transition-colors self-stretch z-10 flex-shrink-0"
                onMouseDown={handleLeftMouseDown}
            />

            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-2">
                    <select value={res.label} onChange={(e) => setRes(RESOLUTIONS.find((r) => r.label === e.target.value) ?? RESOLUTIONS[0])} className="rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none">
                        {RESOLUTIONS.map((r) => <option key={r.label} value={r.label}>{r.label} ({r.w}&times;{r.h})</option>)}
                    </select>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500">Export MP4</button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"><Gear size={16} /></button>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center bg-gray-950 p-6 relative" data-tour="result-preview">
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
                                backgroundImage: colors.backgroundImage ? `url(${colors.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                flexShrink: 0,
                            }}
                            className="rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden flex items-center justify-center"
                        >
                            <style>
                                {`
                                .font-title, h1, h2 {
                                font-family: '${fonts.Title.fontFamily}', sans-serif ; }
                                .font-heading, h3, h4 {
                                font-family: '${fonts.Heading.fontFamily}', sans-serif ; }
                                .font-paragraph, p, span, div {
                                font-family: '${fonts.Paragraph.fontFamily}', sans-serif ; }
                                `}
                            </style>
                            {showVisualizer && globalAudioUrl && (
                                <AudioVisualizer
                                    audioUrl={globalAudioUrl}
                                    glowColor={colors.Primary}
                                    frame={localFrame}
                                    fps={FPS}
                                />
                            )}
                            {cur ? (
                                <div
                                    style={{
                                        opacity: localFrame < 5 ? localFrame / 5 : localFrame > cur.duration - 5 ? (cur.duration - localFrame) / 5 : 1,
                                        transform: localFrame > cur.duration - 5 ? `translateX(${(cur.duration - 5 - localFrame) * 20}px)` : 'none',
                                        transition: 'none',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    className="relative"
                                >
                                    {cur.components.map((node: any, i: number) => (
                                        <ComponentRenderer key={i} node={node} keyframes={cur.keyframes} localFrame={localFrame} />
                                    ))}
                                    {/* Debug Overlay */}
                                    <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1 rounded bg-black/50 p-2 text-[10px] text-white z-50">
                                        <div>Scene {activeScene + 1}/{scenes.length}</div>
                                        <div>Frame {localFrame}/{cur.duration} (Total: {frame}/{maxFrames})</div>
                                        <div className="text-gray-300">{cur.description}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <img src={logoWithText} className="h-24 object-contain" alt="kinetic" style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.6)) brightness(1.2)' }} />
                                    {scenes.length === 0 && <span className="text-xs text-gray-700">No scenes generated</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 bg-gray-900/80 px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                        {[
                            { icon: CaretDoubleLeft, title: 'Skip to start', action: () => { setFrame(0); setPlaying(false); } },
                            { icon: SkipBack, title: 'Previous frame', action: () => setFrame(Math.max(0, frame - 1)) },
                            { icon: null, title: playing ? 'Pause' : 'Play', action: () => setPlaying((p) => !p), isPlay: true },
                            { icon: SkipForward, title: 'Next frame', action: () => setFrame(Math.min(Math.max(maxFrames - 1, 0), frame + 1)) },
                            { icon: CaretDoubleRight, title: 'Skip to end', action: () => { setFrame(Math.max(maxFrames - 1, 0)); setPlaying(false); } },
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
                            <input type="range" min={0} max={Math.max(maxFrames - 1, 0)} value={frame} onChange={(e) => { setFrame(Number(e.target.value)); setPlaying(false); }} className="w-full accent-purple-500" />
                            {scenes.length > 1 && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1">
                                    {scenes.map((s, i) => {
                                        const start = scenes.slice(0, i).reduce((a, c) => a + c.duration, 0);
                                        return <div key={s.sceneId} className={`h-1 rounded-full transition-colors ${i === activeScene ? 'bg-purple-500' : 'bg-gray-700'}`} style={{ position: 'absolute', left: `${(start / maxFrames) * 100}%`, width: `${(s.duration / maxFrames) * 100}%` }} />;
                                    })}
                                </div>
                            )}
                        </div>
                        <span className="w-10 text-left text-[10px] text-gray-500">{maxFrames}</span>
                    </div>
                </div>
            </main>
            {cur && (
                <>
                    {/* Draggable Divider for Right Sidebar */}
                    <div
                        className="w-1 cursor-col-resize bg-gray-900 hover:bg-purple-500/50 transition-colors self-stretch z-10 flex-shrink-0"
                        onMouseDown={handleRightMouseDown}
                    />
                    <aside
                        style={{ width: `${rightSidebarWidth}px` }}
                        className="flex flex-shrink-0 flex-col border-l border-gray-800 bg-gray-900/40 p-4 overflow-y-auto"
                    >
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Component Inspector</h3>
                        <div className="space-y-4">
                            {getFlatComponents(cur.components).map(({ node, path }, index) => {
                                const indent = path.length - 1;
                                return (
                                    <div key={index} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-3">
                                        <div className="border-b border-gray-800 pb-1.5 flex justify-between items-center">
                                            <span className="text-xs font-bold text-purple-400">
                                                {indent > 0 ? '— '.repeat(indent) : ''}{node.type}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {node.props.id ? `#${node.props.id}` : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {Object.entries(node.props).map(([key, val]) => {
                                                if (typeof val === 'number') {

                                                    let min = 0;
                                                    let max = 100;
                                                    let step = 1;
                                                    if (key === "lat" || key === "pinLat") {
                                                        min = -90;
                                                        max = 90;
                                                        step = 0.0001;
                                                    }
                                                    else if (key === 'lng' || key === "pinLng") {
                                                        min = -180;
                                                        max = 180;
                                                        step = 0.0001;
                                                    }
                                                    else if (key === 'zoom') {
                                                        min = 0;
                                                        max = 20;
                                                        step = 0.1;
                                                    }
                                                    else if (key === "routeProgress") {
                                                        min = 0;
                                                        max = 1;
                                                        step = 0.01;
                                                    }
                                                    else if (key === "pinScale") {
                                                        min = 0.1;
                                                        max = 5;
                                                        step = 0.1;
                                                    }
                                                    return (
                                                        <div key={key} className="space-y-1">
                                                            <div className="flex justify-between text-[10px] text-gray-400">
                                                                <span>{key}</span>
                                                                <span>{typeof val === 'number' && (key.includes('lat') || key.includes('lng')) ? Number(val).toFixed(4) : val}</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={min}
                                                                max={max}
                                                                step={step}
                                                                value={val}
                                                                onChange={(e) => updateComponentProp(path, key, Number(e.target.value))}
                                                                className="w-full h-1 bg-gray-800 rounded accent-purple-500"
                                                            />
                                                        </div>
                                                    );
                                                }
                                                if (typeof val === 'boolean') {
                                                    return (
                                                        <div key={key} className="flex justify-between items-center text-[10px] text-gray-400">
                                                            <span>{key}</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={val}
                                                                onChange={(e) => {
                                                                    updateComponentProp(path, key, e.target.checked);
                                                                }}
                                                                className="h-3.5 w-3.5 rounded border border-gray-750 bg-gray-950 text-purple-600 focus:ring-0 outline-none accent-purple-600"
                                                            />
                                                        </div>
                                                    );
                                                }
                                                if (typeof val === "string") {
                                                    if (key === "styleVariant") {
                                                        return (
                                                            <div key={key}
                                                                className="flex justify-between items-center text-[10px] text-gray-400">
                                                                <span>{key}</span>
                                                                <select
                                                                    value={val}
                                                                    onChange={(e) => updateComponentProp(path, key, e.target.value)}
                                                                    className='rounded border border-gray-700 bg-gray-950 px-2 py-0.5 text-[10px] text-white outline-none'>
                                                                    <option value="standard">
                                                                        Standard
                                                                    </option>
                                                                    <option value="dark">
                                                                        Dark
                                                                    </option>
                                                                    <option value="neon">
                                                                        Neon
                                                                    </option>
                                                                </select>
                                                            </div>
                                                        )
                                                    }
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                </>
            )}
            <RenderProgressScreen progress={renderProgress} onClose={() => setRenderProgress(null)} />
        </div>
    );
};

export default Studio;
