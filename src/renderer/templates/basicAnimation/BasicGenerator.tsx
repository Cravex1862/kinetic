import React, { useState } from 'react';
import { TextB, TextItalic, TextUnderline, UploadSimple, ArrowUp, ArrowLeft, Sparkle } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { runPipeline } from './BasicPipeline';
import type { PipelineState } from '../../agents/types';
import { callLLM, getStoredConfig } from '../../agents/llmClient';

import type { ProjectData } from '../../pages/AppRouter';

interface AnimationGeneratorProps {
    project: ProjectData | null;
    onBack: (updatedProject?: ProjectData) => void;
    onGenerate: (data: ProjectData) => void;
    onUpdateProject?: (data: ProjectData) => void;
    customAlert: (title: string, message: string) => Promise<void>;
    customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
    tourActive?: boolean;
    tourStep?: number;
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
    { label: 'Primary', defaultColor: '#8b5cf6' }, // Updated default primary to purple
    { label: 'Secondary', defaultColor: '#a78bfa' }, // Updated secondary to light purple
    { label: 'Accent', defaultColor: '#f59e0b' },
    { label: 'Background', defaultColor: '#030712' }, // Updated to obsidian background
    { label: 'Neutral', defaultColor: '#64748b' },
    { label: 'Semantic', defaultColor: '#3b82f6' },
    { label: 'Error', defaultColor: '#ef4444' },
    { label: 'Success', defaultColor: '#22c55e' },
];

const AnimationGenerator: React.FC<AnimationGeneratorProps> = ({ onBack, onGenerate, onUpdateProject, project, customAlert, customConfirm, tourActive, tourStep }) => {
    const [instructions, setInstructions] = useState(() => {
        if (project?.prompt) return project.prompt;
        if (tourActive) return 'Create a SaaS dashboard walkthrough showing user metrics rising.';
        return '';
    });
    const [narration, setNarration] = useState(project?.narration || '');
    const [useNarration, setUseNarration] = useState(!!project?.narration);

    React.useEffect(() => {
        if (tourActive && !instructions) {
            setInstructions('Create a SaaS dashboard walkthrough showing user metrics rising.');
        }
    }, [tourActive]);
    const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
    const [fonts, setFonts] = useState<Record<FontRow, FontSettings>>(project?.fonts as any || defaultFonts);
    const [swatches, setSwatches] = useState<Record<string, string>>(project?.colors || Object.fromEntries(colorSwatches.map((s) => [s.label, s.defaultColor])),
    );
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans']);

    const [rightPanelWidth, setRightPanelWidth] = useState(320);
    const [isRefining, setIsRefining] = useState(false);
    const [bgDescription, setBgDescription] = useState(project?.bgDescription || '');
    const [backgroundImage, setBackgroundImage] = useState(project?.colors?.backgroundImage || '');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleBack = () => {
        if (project) {
            onBack({
                ...project,
                prompt: instructions,
                narration: useNarration ? narration : '',
                fonts,
                colors: { ...swatches, backgroundImage },
                bgDescription,
                showVisualizer
            });
        } else {
            onBack();
        }
    };

    const handleResume = async () => {
        if (!project || !project.generationState) return;
        setPipelineState({ status: 'storyboarding', progress: 0.1 });
        const resumeState = {
            scenes: project.generationState.scenes,
            componentTrees: project.generationState.componentTrees,
            animationPlans: project.generationState.animationPlans,
            copies: project.generationState.copies,
        };
        const onCheckpoint = (checkpoint: any) => {
            if (onUpdateProject && project) {
                onUpdateProject({
                    ...project,
                    ...checkpoint,
                    fonts,
                    colors: { ...swatches, backgroundImage },
                    bgDescription,
                    showVisualizer
                });
            }
        };
        const output = await runPipeline(
            instructions,
            useNarration ? narration : '',
            setPipelineState,
            project.savePath,
            resumeState,
            onCheckpoint,
            project.title
        );
        if (output && output.length > 0) {
            onGenerate({
                ...project,
                prompt: instructions,
                narration: useNarration ? narration : '',
                scenes: output,
                showVisualizer,
                fonts,
                colors: { ...swatches, backgroundImage },
                bgDescription,
                unfinished: false,
                generationState: undefined,
            })
        }
    };

    const handleRightMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = rightPanelWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(240, Math.min(460, startWidth - (moveEvent.clientX - startX)));
            setRightPanelWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleRefinePrompt = async () => {
        if (!instructions.trim()) return;
        const config = getStoredConfig();
        if (!config) {
            await customAlert("Setup Required", 'Please configure API keys first using the settings menu');
            return;
        }
        setIsRefining(true);
        try {
            const systemPrompt = "You are an AI prompt engineer for motion-graphics video generation. " +
                "Take the user's basic description of the video animation they want to create and refine it to be descriptive, " +
                "detailed, professional, and optimized for generating high-quality animation frames. " +
                "Keep it concise but visually descriptive (e.g. mention layouts, layout flows, shapes and motion style). " +
                "Return ONLY the refined prompt text, with no introductory, greeting, or meta text. Do not wrap it in quotes.";

            const response = await callLLM(config, systemPrompt, instructions);
            if (response.error) {
                await customAlert("AI Error", `Error refining prompt: ${response.error}`);
            }
            else if (response.content) {
                setInstructions(response.content.trim());
            }
        }
        catch (err) {
            await customAlert("AI Error", `Failed to refine prompt: ${err}`);
        }
        finally {
            setIsRefining(false);
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setBackgroundImage(base64);
            };
            reader.readAsDataURL(file);
        }
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
        const finalNarration = useNarration ? narration : '';
        if (!instructions.trim() && !finalNarration.trim()) return;
        setPipelineState({ status: 'storyboarding', progress: 0 });
        const onCheckpoint = (checkpoint: any) => {
            if (onUpdateProject && project) {
                onUpdateProject({
                    ...project,
                    ...checkpoint,
                    fonts,
                    colors: { ...swatches, backgroundImage },
                    bgDescription,
                    showVisualizer
                });
            }
        };
        const output = await runPipeline(
            instructions,
            finalNarration,
            setPipelineState,
            project?.savePath,
            undefined,
            onCheckpoint,
            project?.title
        );
        if (output && output.length > 0) {
            onGenerate({
                ...project,
                title: project?.title || 'Untitled',
                prompt: instructions,
                narration: finalNarration,
                scenes: output,
                showVisualizer,
                fonts,
                colors: { ...swatches, backgroundImage },
                bgDescription,
                unfinished: false,
                generationState: undefined,
                savePath: project?.savePath || ''
            });
        }
    };

    const renderFontRow = (label: FontRow) => {
        const f = fonts[label];
        return (
            <div key={label} className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">{label}</span>
                <div className="flex gap-1.5">
                    <select value={f.fontFamily} onChange={(e) => setFontFamily(label, e.target.value)} className="flex-1 premium-input px-2 py-1.5 text-xs rounded-md">
                        {availableFonts.map((font) => <option key={font} value={font} className="bg-gray-950 text-white">{font}</option>)}
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
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-800 bg-gray-900 text-xs text-gray-400 hover:text-white transition-colors"
                        title="Add Custom Font"
                    >
                        +
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {/* B / I / U */}
                    <div className="flex overflow-hidden rounded-md border border-gray-800">
                        <button
                            onClick={() => toggleFontProp(label, 'bold')}
                            className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${f.bold ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <TextB size={14} weight="bold" />
                        </button>
                        <button
                            onClick={() => toggleFontProp(label, 'italic')}
                            className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${f.italic ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <TextItalic size={14} />
                        </button>
                        <button
                            onClick={() => toggleFontProp(label, 'underline')}
                            className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${f.underline ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
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
                        className="w-16 premium-input px-1.5 py-1 text-xs rounded-md"
                    >
                        {SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-gray-950 text-white">
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white page-enter">
            {/* Left Panel — Config */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-900 bg-gray-950">
                {/* Header */}
                <header className="flex items-center gap-2 border-b border-gray-900 px-6 py-3">
                    <button
                        onClick={handleBack}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-900 hover:text-purple-400"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 hover:opacity-85 transition-opacity"
                        title="Return to Dashboard"
                    >
                        <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45)) brightness(1.15)' }} />
                        <span className="text-sm font-bold text-white">kinetic</span>
                    </button>
                    <span className="text-sm text-gray-700">/</span>
                    <span className="text-sm text-gray-400">Basic Animation</span>
                </header>

                <div className="flex flex-1 flex-col p-6 overflow-hidden gap-4 min-h-0">

                    {/* Instructions Section */}
                    <section className={`flex flex-col min-h-0 ${useNarration ? 'flex-1' : 'flex-[1_0_0%]'}`}>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Instructions</h3>
                        <div className="relative flex-1 min-h-0" data-tour="prompt-input">
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Describe the animation you want to create..."
                                className="w-full h-full resize-none premium-input pl-3 pr-10 py-2.5 text-sm rounded-lg"
                            />
                            <button onClick={handleRefinePrompt} disabled={isRefining || !instructions.trim()}
                                className='absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-md bg-purple-600/80 text-purple-200 transition-colors hover:bg-purple-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                title="Refine Prompt with AI">
                                {isRefining ? (
                                    <svg
                                        className="animate-spin h-3.5 w-3.5 text-white"
                                        fill="none"
                                        viewBox='0 0 24 24'>
                                        <circle
                                            className='opacity-25'
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4" />
                                        <path className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>)
                                    : (
                                        <Sparkle size={14}
                                            weight="fill"
                                            className='text-purple-300' />
                                    )}
                            </button>
                        </div>
                    </section>


                    {/* Narration Section */}
                    <section className={`flex flex-col min-h-0 ${useNarration ? 'flex-1' : 'flex-none'}`} >
                        <div className='flex items-center justify-between mb-2'>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Narration Script</h3>
                            <input type='checkbox' checked={useNarration} onChange={(e) => setUseNarration(e.target.checked)} className='h-4 w-4 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600 outline-none' />
                        </div>
                        {useNarration && (
                            <textarea
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                placeholder="Enter voiceover script... (Each paragraph becomes a scene)"
                                className="w-full flex-1 resize-none premium-input px-3 py-2 text-sm rounded-lg min-h-0"
                            />
                        )}
                    </section>

                    {/* Generate Button / Progress */}
                    {pipelineState ? (
                        <div className="flex flex-col gap-2 rounded-xl bg-gray-900/30 p-4 border border-gray-800">
                            <div className="flex justify-between text-xs font-semibold text-gray-500">
                                <span className="capitalize">{pipelineState.status.replace('-', ' ')}</span>
                                <span>{Math.round(pipelineState.progress * 100)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-900">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${pipelineState.status === 'error' ? 'bg-red-500' : 'bg-purple-600'}`}
                                    style={{ width: `${Math.round(pipelineState.progress * 100)}%` }}
                                />
                            </div>
                            {pipelineState.error && (
                                <div className="text-xs text-red-400 mt-2">{pipelineState.error}</div>
                            )}
                            {(pipelineState.status === 'error' || pipelineState.status === 'done') && (
                                <button
                                    onClick={() => setPipelineState(null)}
                                    className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold"
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className='flex flex-col gap-4'>
                            <div className='flex items-center justify-between rounded-xl border border-gray-850 bg-gray-900/20 px-4 py-3'>
                                <span className='text-sm font-semibold text-gray-400'>Enable Audio Visualizer</span>
                                <input
                                    type='checkbox'
                                    checked={showVisualizer}
                                    onChange={(e) => setShowVisualizer(e.target.checked)}
                                    className='h-4 w-4 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600 outline-none'
                                />
                            </div>
                            {project?.unfinished ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerate}
                                        className="flex-1 rounded-lg border border-gray-800 bg-gray-900/10 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                                    >
                                        Start Over
                                    </button>
                                    <button
                                        onClick={handleResume}
                                        className="flex-[2] premium-button-primary py-2.5 text-sm font-bold rounded-lg"
                                    >
                                        Resume Generation
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    data-tour="generate-btn"
                                    className="premium-button-primary py-2.5 text-sm font-bold rounded-lg"
                                >
                                    Generate
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="w-1 cursor-col-resize bg-gray-800/40 hover:bg-purple-600 transition-colors self-stretch z-10 flex-shrink-0" onMouseDown={handleRightMouseDown} />
            <aside style={{ width: `${rightPanelWidth}px` }}
                className='flex flex-shrink-0 flex-col overflow-y-auto border-l border-gray-900 bg-gray-950 p-5'>
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
                <section className="mb-6">
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
                                <span className="text-xs text-gray-500">{swatches[s.label]}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className='mt-6 pt-6 border-t border-gray-900'>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Background Image</h3>
                    <div className='relative'>
                        <input type="text"
                            value={bgDescription}
                            onChange={e => {
                                setBgDescription(e.target.value)
                            }}
                            placeholder='Describe Background'
                            className='w-full premium-input pl-3 pr-10 py-2 text-xs rounded-lg'
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className='absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-900 text-gray-400 hover:text-white transition-colors'
                            title='Upload Background Image'
                        >
                            <Sparkle size={14}
                                weight='fill'
                                className='text-purple-300' />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className='hidden' />
                    </div>
                    {backgroundImage && (
                        <div className='mt-3 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/30 p-2.5 text-xs'>
                            <span className='text-gray-400 truncate max-w-[150px]'>Image loaded</span>
                            <button
                                onClick={() => setBackgroundImage('')}
                                className='text-red-400 hover:text-red-300 font-semibold'>
                                Remove
                            </button>
                        </div>
                    )}
                </section>
            </aside>
        </div>
    );
};

export default AnimationGenerator;
