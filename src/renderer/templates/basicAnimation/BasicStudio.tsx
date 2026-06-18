import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectData } from '../../pages/AppRouter';
import {
    TextB, TextItalic, TextUnderline, Play, Pause,
    SkipBack, SkipForward, CaretDoubleLeft, CaretDoubleRight, Gear, CaretDown,
} from '@phosphor-icons/react';
import { ComponentRenderer } from '../../scenes/ComponentRenderer';
import { AudioVisualizer } from '../../primitives/AudioVisualizer';

interface StudioProps { project: ProjectData; 
    onBack: () => void;
    onRename: (newTitle: string) => void;
 }

const FPS = 30;
const SIZES = Array.from({ length: 63 }, (_, i) => i + 10);
const RESOLUTIONS = [
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
    <button onClick={onClick} className={`flex h-6 w-6 items-center justify-center text-xs transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'}`}>{children}</button>
);

const Studio: React.FC<StudioProps> = ({ project, onBack, onRename }) => {
    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [res, setRes] = useState(RESOLUTIONS[0]);
    const [colorOpen, setColorOpen] = useState(true);
    const [typoOpen, setTypoOpen] = useState(true);
    const [fonts, setFonts] = useState<Record<FontRow, FS>>(DEF_FONTS);
    const [colors, setColors] = useState<Record<string, string>>({ Primary: '#6366f1', Secondary: '#8b5cf6', Accent: '#f59e0b', Background: '#0f172a' });
    const [globalAudioUrl, setGlobalAudioUrl] = useState<string>('');
    const [showVisualizer, setShowVisualizer] = useState(project.showVisualizer ?? false);
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans']);
    const [localScenes, setLocalScenes] = useState<any[]>(project.scenes ?? []);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(project.title);

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
                .catch(() => {});
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

    const handleExport = useCallback(() => {
        if (window.electronAPI?.exportVideo) {
            window.electronAPI.exportVideo({ compositionId: 'SceneSequence', outputPath: `${project.title}.mp4`, framesPerScene: scenes.map((s) => s.duration), fps: FPS, width: res.w, height: res.h });
        } else alert('Export available in Electron runtime.');
    }, [project.title, scenes, res]);

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
    const updateComponentProp = (componentIndex : number, propKey : string, propValue : any) => {
        setLocalScenes(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            copy[activeScene].components[componentIndex].props[propKey] = propValue;
            return copy;
        });
    };
    return (
        
        <div className="flex h-screen bg-gray-950 text-white">
            <aside className="flex w-[280px] flex-shrink-0 flex-col border-r border-gray-800 bg-gray-900/40">
                <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
                    <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300">&larr;</button>
                    {isEditingName ? (
                        <div className='flex items-center gap-1.5 min-w-0'>
                            <input type='text' value={tempName} onChange={(e)=> setTempName(e.target.value)} className='rounded border border-gray-700 bg-gray-950px-2 py-0.5 text-xs text-white outline-none w-32 focus:border-indigo-500'>

                            </input>
                            <button 
                                onClick={() => {
                                    if(tempName.trim()){
                                        onRename(tempName.trim());
                                    }
                                    setIsEditingName(false);
                                }}
                                className='flex h-5 w-5 items-center justify-center rounded bg-ingigo-600 text-xs text-white hover:bg-indigo-500'>
                                    &#10003;
                                </button>
                </div>
                    ) : (
                        <span 
                            onClick={()=> {
                                setTempName(project.title);
                                setIsEditingName(true);
                            }}
                            className='truncate text-sm font-medium text-white cursor-pointer hover:text-indigo-400'
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
                            <span className='text-xs text-indigo-400'>Upload MP3 / WAV</span>
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
                                        className="h-3.5 w-3.5 rounded border-gray-700 bg-gray-950 text-indigo-600 focus:ring-0 outline-none"
                                    />
                                </div>
                            </>
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
                        <button className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">Apply</button>
                    </div>
                </div>
            </aside>

            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-2">
                    <select value={res.label} onChange={(e) => setRes(RESOLUTIONS.find((r) => r.label === e.target.value) ?? RESOLUTIONS[0])} className="rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-white outline-none">
                        {RESOLUTIONS.map((r) => <option key={r.label} value={r.label}>{r.label} ({r.w}&times;{r.h})</option>)}
                    </select>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500">Export MP4</button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"><Gear size={16} /></button>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center bg-gray-950 p-6">
                    <div className="flex aspect-video w-full max-w-5xl items-center justify-center rounded-xl border border-gray-700 bg-gray-900 shadow-2xl relative overflow-hidden">
                        {showVisualizer && globalAudioUrl && (
                            <AudioVisualizer audioUrl={globalAudioUrl} />
                        )}
                        {cur ? (
                            <div
                                style={{
                                    opacity: localFrame < 5 ? localFrame / 5 : localFrame > cur.duration -5 ? (cur.duration -5 ) ? `translateX(${(cur.duration) - 5 - localFrame *10}px)` : `none`,
                                    transition : `none`,
                                }}
                                className="w-full h-full relative"
                                >
                                
                                {cur.components.map((node, i) => (
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
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold shadow-lg shadow-indigo-600/25">K</div>
                                <span className="text-sm text-gray-600">kinetic</span>
                                {scenes.length === 0 && <span className="text-xs text-gray-700">No scenes generated</span>}
                            </div>
                        )}
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
                                <button key={i} onClick={b.action} className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm text-white transition-colors hover:bg-indigo-500" title={b.title}>
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
                            <input type="range" min={0} max={Math.max(maxFrames - 1, 0)} value={frame} onChange={(e) => { setFrame(Number(e.target.value)); setPlaying(false); }} className="w-full accent-indigo-500" />
                            {scenes.length > 1 && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1">
                                    {scenes.map((s, i) => {
                                        const start = scenes.slice(0, i).reduce((a, c) => a + c.duration, 0);
                                        return <div key={s.sceneId} className={`h-1 rounded-full transition-colors ${i === activeScene ? 'bg-indigo-500' : 'bg-gray-700'}`} style={{ position: 'absolute', left: `${(start / maxFrames) * 100}%`, width: `${(s.duration / maxFrames) * 100}%` }} />;
                                    })}
                                </div>
                            )}
                        </div>
                        <span className="w-10 text-left text-[10px] text-gray-500">{maxFrames}</span>
                    </div>
                </div>
            </main>
            {cur && (
                <aside className="flex w-[280px] flex-shrink-0 flex-col border-l border-gray-800 bg-gray-900/40 p-4 overflow-y-auto">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Component Inspector</h3>
                    <div className="space-y-4">
                        {cur.components.map((node, componentIdx) => (
                            <div key={componentIdx} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-3">
                                <div className="border-b border-gray-800 pb-1.5">
                                    <span className="text-xs font-bold text-indigo-400">
                                        {node.type}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(node.props).map(([key, val]) => {
                                        if (typeof val === 'number') {
                                            return (
                                                <div key={key} className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-gray-400">
                                                        <span>{key}</span>
                                                        <span>{val}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        value={val}
                                                        onChange={(e) => updateComponentProp(componentIdx, key, Number(e.target.value))}
                                                        className="w-full h-1 bg-gray-800 rounded accent-indigo-500"
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
                                                            updateComponentProp(componentIdx, key, e.target.checked);
                                                        }}
                                                        className="h-3.5 w-3.5 rounded border border-gray-750 bg-gray-950 text-indigo-600 focus:ring-0 outline-none"
                                                    />
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            )}
        </div>
    );
};

export default Studio;
