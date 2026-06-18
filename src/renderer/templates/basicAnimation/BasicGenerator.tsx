import React, { useState } from 'react';
import { TextB, TextItalic, TextUnderline, UploadSimple, ArrowUp } from '@phosphor-icons/react';
import { runPipeline } from './BasicPipeline';
import type { PipelineState } from '../../agents/types';

interface AnimationGeneratorProps {
    onBack: () => void;
    onGenerate: (data: {
        title: string;
        prompt: string;
        narration: string;
        scenes?: import('../../agents/types').SceneOutput[];
        showVisualizer?: boolean;
    }) => void;
}

const SIZE_OPTIONS = Array.from({ length: 63 }, (_, i) => i + 10);

type FontRow = 'Title Font' | 'Heading' | 'Paragraph';

interface FontSettings {
    fontFamily: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    color: string;
    size: number;
}

const defaultFonts: Record<FontRow, FontSettings> = {
    'Title Font': { fontFamily: 'Inter', bold: true, italic: false, underline: false, color: '#ffffff', size: 48 },
    Heading: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#e2e8f0', size: 32 },
    Paragraph: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#94a3b8', size: 14 },
};

const colorSwatches = [
    { label: 'Primary', defaultColor: '#6366f1' },
    { label: 'Secondary', defaultColor: '#8b5cf6' },
    { label: 'Accent', defaultColor: '#f59e0b' },
    { label: 'Background', defaultColor: '#0f172a' },
    { label: 'Neutral', defaultColor: '#64748b' },
    { label: 'Semantic', defaultColor: '#3b82f6' },
    { label: 'Error', defaultColor: '#ef4444' },
    { label: 'Success', defaultColor: '#22c55e' },
];

const AnimationGenerator: React.FC<AnimationGeneratorProps> = ({ onBack, onGenerate }) => {
    const [instructions, setInstructions] = useState('');
    const [narration, setNarration] = useState('');
    const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
    const [fonts, setFonts] = useState<Record<FontRow, FontSettings>>(defaultFonts);
    const [swatches, setSwatches] = useState<Record<string, string>>(
        Object.fromEntries(colorSwatches.map((s) => [s.label, s.defaultColor])),
    );
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans']);

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


    const toggleFontProp = (row: FontRow, prop: 'bold' | 'italic' | 'underline') => {
        setFonts((prev) => ({
            ...prev,
            [row]: { ...prev[row], [prop]: !prev[row][prop] },
        }));
    };

    const setFontColor = (row: FontRow, color: string) => {
        setFonts((prev) => ({
            ...prev,
            [row]: { ...prev[row], color },
        }));
    };

    const setFontSize = (row: FontRow, size: number) => {
        setFonts((prev) => ({
            ...prev,
            [row]: { ...prev[row], size },
        }));
    };

    const setFontFamily = (row: FontRow, fontFamily: string) => {
        setFonts((prev) => ({
            ...prev,
            [row]: { ...prev[row], fontFamily },
        }));
    };
    
    
    const handleGenerate = async () => {
        if (!instructions.trim() && !narration.trim()) return;
        setPipelineState({ status: 'storyboarding', progress: 0 });
        const output = await runPipeline(instructions, narration, setPipelineState);
        if (output && output.length > 0) {
            onGenerate({ title: 'Untitled',
                         prompt: instructions,
                         narration, 
                         scenes: output,
                         showVisualizer  });
        }
    };

    const renderFontRow = (label: FontRow) => {
        const f = fonts[label];
        return (
            <div key={label} className="space-y-2">
                <span className="text-xs font-medium text-gray-400">{label}</span>
                <div className="flex gap-1.5">
                    <select value={f.fontFamily} onChange={(e) => setFontFamily(label, e.target.value)} className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white outline-none">
                        {availableFonts.map((font) => <option key={font} value={font}>{font}</option>)}
                    </select>
                    <button
                        onClick={() => {
                            const newFont = prompt('Enter custom font family name:');
                            if (newFont && newFont.trim() && !availableFonts.includes(newFont.trim())) {
                                const trimmed = newFont.trim();
                                setAvailableFonts((prev) => [...prev, trimmed]);
                                setFontFamily(label, trimmed);
                            }
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-xs text-gray-400 hover:text-white transition-colors"
                        title="Add Custom Font"
                    >
                        +
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {/* B / I / U */}
                    <div className="flex overflow-hidden rounded-md border border-gray-700">
                        <button
                            onClick={() => toggleFontProp(label, 'bold')}
                            className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${f.bold ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <TextB size={14} weight="bold" />
                        </button>
                        <button
                            onClick={() => toggleFontProp(label, 'italic')}
                            className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${f.italic ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <TextItalic size={14} />
                        </button>
                        <button
                            onClick={() => toggleFontProp(label, 'underline')}
                            className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${f.underline ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <TextUnderline size={14} />
                        </button>
                    </div>

                    {/* Color picker */}
                    <input
                        type="color"
                        value={f.color}
                        onChange={(e) => setFontColor(label, e.target.value)}
                        className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                        title={f.color}
                    />

                    {/* Size dropdown */}
                    <select
                        value={f.size}
                        onChange={(e) => setFontSize(label, Number(e.target.value))}
                        className="w-16 rounded-md border border-gray-700 bg-gray-900 px-1.5 py-1 text-xs text-white outline-none"
                    >
                        {SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Left Panel — Config */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-800">
                {/* Header */}
                <header className="flex items-center gap-2 border-b border-gray-800 px-6 py-3">
                    <button
                        onClick={onBack}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
                    >
                        &larr;
                    </button>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold">K</div>
                    <span className="text-sm font-semibold text-white">kinetic</span>
                    <span className="text-sm text-gray-600">/</span>
                    <span className="text-sm text-gray-400">Basic Animation</span>
                </header>
                <div className="flex flex-1 flex-col p-6 overflow-hidden gap-4 min-h-0">
 
                    {/* Instructions Section */}
                    <section className="flex flex-1 flex-col min-h-0">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Instructions</h3>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Describe the animation you want to create..."
                            className="w-full flex-1 resize-none rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-indigo-500 min-h-0"
                        />
                    </section>
 
                    {/* Narration Section */}
                    <section className="flex flex-1 flex-col min-h-0">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Narration Script</h3>
                        <textarea
                            value={narration}
                            onChange={(e) => setNarration(e.target.value)}
                            placeholder="Enter voiceover script... (Each paragraph becomes a scene)"
                            className="w-full flex-1 resize-none rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-indigo-500 min-h-0"
                        />
                    </section>

                    {/* Generate Button / Progress */}
                    {pipelineState ? (
                        <div className="flex flex-col gap-2 rounded-lg bg-gray-900 p-4 border border-gray-800">
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                <span className="capitalize">{pipelineState.status.replace('-', ' ')}</span>
                                <span>{Math.round(pipelineState.progress * 100)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${pipelineState.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.round(pipelineState.progress * 100)}%` }}
                                />
                            </div>
                            {pipelineState.error && (
                                <div className="text-xs text-red-400 mt-2">{pipelineState.error}</div>
                            )}
                            {(pipelineState.status === 'error' || pipelineState.status === 'done') && (
                                <button
                                    onClick={() => setPipelineState(null)}
                                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className='flex flex-col gap-4'>
                            <div className='flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/30 px-3 py-2.5'>
                                <span className='text-sm font-medium text-gray-400'>Enable Audio Visualizer</span>
                                <input 
                                    type='checkbox' 
                                    checked={showVisualizer} 
                                    onChange={(e) => setShowVisualizer(e.target.checked)} 
                                    className='h-4 w-4 rounded border-gray-700 bg-gray-900 text-indigo-600 accent-indigo-600 outline-none'
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                            >
                                Generate
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel — Typography + Colors */}
            <div className="flex w-80 flex-col overflow-y-auto border-l border-gray-800 bg-gray-900/30 p-5">
                {/* Typography Section */}
                <section className="mb-8">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Typography</h3>
                    <div className="space-y-5">
                        {renderFontRow('Title Font')}
                        {renderFontRow('Heading')}
                        {renderFontRow('Paragraph')}
                    </div>
                </section>

                {/* Colors Section */}
                <section>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Colors</h3>
                    <div className="space-y-3">
                        {colorSwatches.map((s) => (
                            <div key={s.label} className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={swatches[s.label]}
                                    onChange={(e) =>
                                        setSwatches((prev) => ({ ...prev, [s.label]: e.target.value }))
                                    }
                                    className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                />
                                <span className="flex-1 text-xs text-gray-400">{s.label}</span>
                                <span className="text-xs text-gray-600">{swatches[s.label]}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AnimationGenerator;
