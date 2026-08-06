import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, UploadSimple, X } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { runPipeline } from '@/renderer/agents/pipeline';
import { callLLM, getStoredConfig } from '@/renderer/agents/llmClient';
import { ProjectData } from '../../pages/AppRouter';
import { PreviewWindow } from '@/renderer/components/PreviewWindow';
import { BrandStylingPanel, FontSettings } from '@/renderer/components/BrandStylingPanel';
import { CustomInstructionsPanel } from '@/renderer/components/CustomInstructionsPanel';
import { PipelineState } from '@/renderer/agents/types';
import { BackgroundSelection } from '@/renderer/components/BackgroundSelectorPanel';
import { BrowserFrame, HeroMetricCard } from '@/renderer/primitives/StructuralSDK';
import { BarChart } from '@/renderer/primitives/ChartsSDK';

import { AudioUploadField } from '@/renderer/components/AudioUploadField';
import { VoiceoverAudioField } from '@/renderer/components/VoiceoverAudioField';
import { runBeatNetAI } from '@/renderer/utils/beatDetector';
import { ResizableSidebar } from '@/renderer/components/ResizableSidebar';

interface AnimationGeneratorProps {
    project: ProjectData | null;
    onBack: (updated?: ProjectData) => void;
    onGenerate: (data: ProjectData) => void;
    onUpdateProject?: (data: ProjectData) => void;
    customAlert: (title: string, message: string) => Promise<void>;
    customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
    tourActive?: boolean;
    tourStep?: number;
}

type FontRow = "Title Font" | 'Heading' | 'Paragraph';

const defaultFonts: Record<FontRow, FontSettings> = {
    'Title Font': { fontFamily: 'Inter', bold: true, italic: false, underline: false, color: '#ffffff', size: 48 },
    Heading: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#e2e8f0', size: 32 },
    Paragraph: { fontFamily: 'Inter', bold: false, italic: false, underline: false, color: '#94a3b8', size: 14 },
};

const colorSwatches = [
    { label: 'Primary', defaultColor: '#8b5cf6' },
    { label: 'Secondary', defaultColor: '#a78bfa' },
    { label: 'Accent', defaultColor: '#f59e0b' },
    { label: 'Background', defaultColor: '#030712' },
    { label: 'Neutral', defaultColor: '#64748b' },
    { label: 'Semantic', defaultColor: '#3b82f6' },
    { label: 'Error', defaultColor: '#ef4444' },
    { label: 'Success', defaultColor: '#22c55e' },
];

const AnimationGenerator: React.FC<AnimationGeneratorProps> = ({
    onBack,
    onGenerate,
    onUpdateProject,
    project,
    customAlert,
    customConfirm,
    tourActive
}) => {
    const [instructions, setInstructions] = useState(project?.prompt || '');
    const [narration, setNarration] = useState(project?.narration || '');
    const [useNarration, setUseNarration] = useState(!!project?.narration);
    const [voiceoverMode, setVoiceoverMode] = useState<'text' | 'audio'>('text');
    const [voiceoverAudioFile, setVoiceoverAudioFile] = useState<File | null>(null);
    const [fonts, setFonts] = useState<Record<string, any>>(project?.fonts as any || defaultFonts);
    const [swatches, setSwatches] = useState<Record<string, string>>(project?.colors || Object.fromEntries(colorSwatches.map((s) => [s.label, s.defaultColor])));
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans']);
    const [isRefining, setIsRefining] = useState(false);
    const [bgDescription, setBgDescription] = useState(project?.bgDescription || '');
    const [backgroundImage, setBackgroundImage] = useState(project?.colors?.backgroundImage || '');
    const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [bgSelection, setBgSelection] = useState<BackgroundSelection>({ type: 'color', color: '#09090b', blurPx: 0 });
    const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [beatFrames, setBeatFrames] = useState<number[]>([]);
    const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
    const assetInputRef = useRef<HTMLInputElement>(null);

    const handleSelectAudio = async (file: File | null) => {
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
    };

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

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newAssets: string[] = [];
            for (let i = 0; i < files.length; i++) {
                newAssets.push(files[i].name);
            }
            setUploadedAssets(prev => [...prev, ...newAssets]);
        }
    };

    const handleRefinePrompt = async () => {
        if (!instructions.trim()) return;
        const config = getStoredConfig();
        if (!config) {
            await customAlert('Setup Required', "Please configure API key first using the settings menu");
            return;
        }
        setIsRefining(true);
        try {
            const systemPrompt = "You are an AI prompt engineer for motion-graphics video generation. " +
                "Take the user's basic description of the video animation they want to create and refine it to be descriptive, " +
                "detailed, professional, and optimized for generating high-quality animation frames. " +
                "Return ONLY the refined prompt text, with no introductory, greeting or meta text";

            const response = await callLLM(config, systemPrompt, instructions);
            if (response.error) {
                await customAlert("AI error", `Error refining prompt: ${response.error}`);
            }
            else if (response.content) {
                setInstructions(response.content.trim());
            }
        }
        catch (err) {
            await customAlert("AI error", `Failed to refine prompt: ${err}`);
        }
        finally {
            setIsRefining(false);
        }
    };

    const handleBack = () => {
        if (project) {
            onBack({
                ...project,
                prompt: instructions,
                narration: useNarration ? narration : '',
                fonts,
                colors: { ...swatches, backgroundImage },
                bgDescription,
                showVisualizer,
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
                code: output,
                scenes: project?.scenes || [],
                showVisualizer,
                fonts,
                colors: { ...swatches, backgroundImage },
                bgDescription,
                unfinished: false,
                generationState: undefined,
            });
        }
    };

    const handleGenerate = async () => {
        if (!instructions.trim() && !narration.trim()) return;
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
            useNarration ? narration : '',
            setPipelineState,
            project?.savePath,
            project?.generationState,
            onCheckpoint,
            project?.title
        );
        if (output && output.length > 0) {
            onGenerate({
                ...project,
                title: project?.title || 'Untitled',
                prompt: instructions,
                narration: useNarration ? narration : '',
                code: output,
                scenes: project?.scenes || [],
                showVisualizer,
                fonts,
                colors: { ...swatches, backgroundImage },
                bgSelection,
                bgDescription,
                unfinished: false,
                generationState: undefined,
                savePath: project?.savePath || '',
            });
        }
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white page-enter">
            <ResizableSidebar initialWidth={380} minWidth={320} maxWidth={650} className="border-r border-gray-900 bg-gray-950 p-5 gap-4 overflow-y-auto">
                <header className="flex items-center gap-2 border-b border-gray-900 pb-3">
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
                    <span className="text-sm text-gray-400">Basic</span>
                </header>

                {/* Upload Script Panel block */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                        <h4 className="text-xs font-bold text-gray-400">Voiceover Script (optional)</h4>
                        <input type="checkbox" checked={useNarration} onChange={(e) => setUseNarration(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600 outline-none" />
                    </div>
                    {useNarration && (
                        <VoiceoverAudioField
                            mode={voiceoverMode}
                            onModeChange={setVoiceoverMode}
                            scriptText={narration}
                            onScriptTextChange={setNarration}
                            audioFile={voiceoverAudioFile}
                            onAudioFileChange={setVoiceoverAudioFile}
                        />
                    )}
                </section>

                {/* Reusable Styling Accordion Block */}
                <BrandStylingPanel
                    fonts={fonts}
                    setFonts={setFonts}
                    swatches={swatches}
                    setSwatches={setSwatches}
                    availableFonts={availableFonts}
                    bgSelection={bgSelection}
                    onSelectBackground={setBgSelection}
                />

                {/* Reusable Instructions Panel Block */}
                <CustomInstructionsPanel
                    instructions={instructions}
                    setInstructions={setInstructions}
                    isRefining={isRefining}
                    handleRefinePrompt={handleRefinePrompt}
                    placeholder="Describe custom layout or animation instructions..."
                />
            </ResizableSidebar>

            {/* RIGHT COLUMN: Walkthrough Canvas area and trigger button elements */}
            <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950/40 justify-between h-full">

                {/* Walkthrough Preview Browser Component */}
                <PreviewWindow title="Walkthrough Preview Canvas">
                    {/* Isolated Background Layer */}
                    <div
                        className="absolute inset-0 z-0 transition-all duration-300 overflow-hidden"
                        style={{
                            ...(bgSelection?.color === 'transparent'
                                ? {
                                    backgroundImage:
                                        'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                                    backgroundSize: '16px 16px',
                                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                                    backgroundColor: '#09090b',
                                }
                                : bgSelection?.type === 'image' && bgSelection.imageUrl
                                ? {
                                    backgroundImage: `url(${bgSelection.imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: `blur(${bgSelection.blurPx || 0}px)`,
                                    transform: bgSelection.blurPx ? 'scale(1.08)' : 'none',
                                }
                                : bgSelection?.type === 'gradient' && bgSelection.gradient
                                ? {
                                    background: bgSelection.gradient,
                                    filter: `blur(${bgSelection.blurPx || 0}px)`,
                                    transform: bgSelection.blurPx ? 'scale(1.08)' : 'none',
                                }
                                : {
                                    backgroundColor: bgSelection?.color || '#09090b',
                                }),
                        }}
                    />

                    {/* Foreground Content inside Expanded BrowserFrame */}
                    <div className="relative z-10 w-full h-full p-6 flex items-center justify-center">
                        <div className="w-full h-full max-w-5xl flex flex-col justify-center">
                            <BrowserFrame url="app.kinetic.dev" osType="mac" width="100%" height="100%">
                                <div className="p-6 space-y-5 text-white bg-gray-950/85 backdrop-blur-md rounded-b-xl border-t border-gray-800 h-[calc(100%-36px)] flex flex-col justify-between overflow-y-auto">
                                    <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} />
                                            <span
                                                style={{
                                                    fontFamily: fonts['Title Font']?.fontFamily,
                                                    color: fonts['Title Font']?.color || swatches['Primary'] || '#8b5cf6',
                                                    fontWeight: fonts['Title Font']?.bold ? 'bold' : 'normal',
                                                    fontStyle: fonts['Title Font']?.italic ? 'italic' : 'normal',
                                                    textDecoration: fonts['Title Font']?.underline ? 'underline' : 'none',
                                                }}
                                                className="text-lg tracking-wide font-bold"
                                            >
                                                Kinetic Studio Demo
                                            </span>
                                        </div>
                                        <div className="flex gap-2.5">
                                            <button
                                                style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }}
                                                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
                                            >
                                                Get Started
                                            </button>
                                            <button
                                                style={{ borderColor: swatches['Accent'] || '#f59e0b', color: swatches['Accent'] || '#f59e0b' }}
                                                className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-transparent hover:bg-white/5 transition-colors"
                                            >
                                                Documentation
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3
                                            style={{
                                                fontFamily: fonts['Heading']?.fontFamily,
                                                color: fonts['Heading']?.color || '#f8fafc',
                                                fontWeight: fonts['Heading']?.bold ? 'bold' : 'normal',
                                                fontStyle: fonts['Heading']?.italic ? 'italic' : 'normal',
                                                textDecoration: fonts['Heading']?.underline ? 'underline' : 'none',
                                            }}
                                            className="text-base font-bold"
                                        >
                                            Real-Time Design Token Preview
                                        </h3>
                                        <p
                                            style={{
                                                fontFamily: fonts['Paragraph']?.fontFamily,
                                                color: fonts['Paragraph']?.color || '#94a3b8',
                                            }}
                                            className="text-xs leading-relaxed max-w-xl"
                                        >
                                            Selected fonts, color swatches, and background wallpapers cascade live across all video scenes and components.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 flex-1 items-center">
                                        <HeroMetricCard
                                            primaryText="12,480 Active Users"
                                            captionText="+18.4% growth this month"
                                            trend="up"
                                            glowConfig={{ enabled: false, color: swatches['Primary'] || '#8b5cf6', intensity: 10, spread: 5 }}
                                        />
                                        <div className="h-44 w-full">
                                            <BarChart
                                                data={[
                                                    { label: 'Jan', value: 40, color: swatches['Primary'] || '#8b5cf6' },
                                                    { label: 'Feb', value: 65, color: swatches['Secondary'] || '#3b82f6' },
                                                    { label: 'Mar', value: 85, color: swatches['Accent'] || '#f59e0b' },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </BrowserFrame>
                        </div>
                    </div>
                </PreviewWindow>



                {/* Bottom row asset managers, beat-sync audio, and generate states triggers */}
                <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-gray-900">
                    <AudioUploadField
                        audioFile={audioFile}
                        beatCount={beatFrames.length}
                        isAnalyzing={isAnalyzingAudio}
                        onSelectAudio={handleSelectAudio}
                    />

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400">Project Assets</span>
                            <button
                                onClick={() => assetInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                                <UploadSimple size={14} />
                                Upload Assets
                            </button>
                            <input
                                type="file"
                                ref={assetInputRef}
                                multiple
                                onChange={handleAssetUpload}
                                className="hidden"
                            />
                        </div>
                        {/* List items representing files uploaded */}
                        {uploadedAssets.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-950/60 border border-gray-900 rounded-lg max-h-[80px] overflow-y-auto">
                                {uploadedAssets.map((asset, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-[9px] text-gray-400">
                                        <span className="truncate max-w-[100px]">{asset}</span>
                                        <button
                                            onClick={() => setUploadedAssets(prev => prev.filter((_, i) => i !== index))}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Progress tracking bars */}
                    {pipelineState ? (
                        <div className="flex flex-col gap-2 rounded-xl bg-gray-900 p-4 border border-gray-800">
                            <div className="flex justify-between text-xs font-semibold text-gray-500">
                                <span className="capitalize">{pipelineState.status.replace('-', ' ')}</span>
                                <span>{Math.round(pipelineState.progress * 100)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-950">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${pipelineState.status === 'error' ? 'bg-red-500' : 'bg-violet-600'}`}
                                    style={{ width: `${Math.round(pipelineState.progress * 100)}%` }}
                                />
                            </div>
                            {pipelineState.error && (
                                <div className="text-xs text-red-400 mt-2">{pipelineState.error}</div>
                            )}
                            {(pipelineState.status === 'error' || pipelineState.status === 'done') && (
                                <button
                                    onClick={() => setPipelineState(null)}
                                    className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-bold self-start"
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400">Enable Audio Visualizer</span>
                                <input
                                    type="checkbox"
                                    checked={showVisualizer}
                                    onChange={(e) => setShowVisualizer(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-gray-800 bg-gray-950 text-purple-600 accent-purple-600 outline-none"
                                />
                            </div>
                            {project?.unfinished && project?.generationState ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerate}
                                        className="px-4 py-2 rounded-lg border border-gray-800 bg-gray-900 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                                    >
                                        Start Over
                                    </button>
                                    <button
                                        onClick={handleResume}
                                        className="premium-button-primary px-5 py-2 text-xs font-bold rounded-lg"
                                    >
                                        Resume Generation
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    className="premium-button-primary px-6 py-2 text-xs font-bold rounded-lg"
                                >
                                    Generate
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AnimationGenerator;