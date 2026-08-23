import React, { useState, useEffect } from 'react';
import { TextB, TextItalic, TextUnderline, Folder, ArrowLeft, Sparkle, UploadSimple, GithubLogo, Palette, X, House, ChartBar, Users, FolderSimple, Gear, SquaresFour, Bell, CaretDown, CheckCircle, DotsThree, MagnifyingGlass, Plus, TrendUp } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { runPipeline, approveCurrentStage } from '../../agents/pipeline';
import { pipelineHistory } from '../../utils/pipelineHistoryStore';
import type { PipelineState } from '../../agents/types';
import { callLLM, getStoredConfig } from '../../agents/llmClient';
import type { ProjectData, AlertButton } from '../../pages/AppRouter';
import { BackgroundSelection } from '@/renderer/components/BackgroundSelectorPanel';
import { VoiceoverAudioField } from '@/renderer/components/VoiceoverAudioField';
import { extractAudioFeatures } from '@/renderer/utils/audioUtils';
import { AudioUploadField } from '@/renderer/components/AudioUploadField';
import { runBeatNetAI } from '@/renderer/utils/beatDetector';
import { ResizableSidebar } from '@/renderer/components/ResizableSidebar';
import { AIsidebar } from '@/renderer/components/AIsidebar';

interface AnimationGeneratorProps {
    project: ProjectData | null;
    onBack: (updatedProject?: ProjectData) => void;
    onGenerate: (data: ProjectData) => void;
    onUpdateProject?: (data: ProjectData) => void;
    customAlert: (title: string, message: string) => Promise<void>;
    customConfirm: (title: string, message: string, buttons?: AlertButton[]) => Promise<unknown>;
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
    { label: 'Primary', defaultColor: '#8b5cf6' },
    { label: 'Secondary', defaultColor: '#a78bfa' },
    { label: 'Accent', defaultColor: '#f59e0b' },
    { label: 'Background', defaultColor: '#030712' },
    { label: 'Neutral', defaultColor: '#64748b' },
    { label: 'Semantic', defaultColor: '#3b82f6' },
    { label: 'Error', defaultColor: '#ef4444' },
    { label: 'Success', defaultColor: '#22c55e' },
];

const SaaSGenerator: React.FC<AnimationGeneratorProps> = ({ onBack, onGenerate, onUpdateProject, project, customAlert, customConfirm }) => {
    const [instructions, setInstructions] = useState(project?.prompt || '');
    const [narration, setNarration] = useState(project?.narration || '');
    const [voiceoverMode, setVoiceoverMode] = useState<'text' | 'audio'>('text');
    const [voiceoverAudioFile, setVoiceoverAudioFile] = useState<File | null>(null);
    const [isTranscribingVoiceover, setIsTranscribingVoiceover] = useState(false);
    const [repoLink, setRepoLink] = useState('');
    const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
    const [fonts, setFonts] = useState<Record<FontRow, FontSettings>>(project?.fonts as Record<FontRow, FontSettings> || defaultFonts);
    const [swatches, setSwatches] = useState<Record<string, string>>(project?.colors || Object.fromEntries(colorSwatches.map((s) => [s.label, s.defaultColor])));
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [availableFonts, setAvailableFonts] = useState<string[]>(['Inter', 'Roboto', 'Poppins', 'DM Sans']);
    const [bgSelection, setBgSelection] = useState<BackgroundSelection>({ type: 'color', color: '#09090b', blurPx: 0 });

    const [isRefining, setIsRefining] = useState(false);
    const [bgDescription, setBgDescription] = useState(project?.bgDescription || '');
    const [backgroundImage, setBackgroundImage] = useState(project?.colors?.backgroundImage || '');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const assetInputRef = React.useRef<HTMLInputElement>(null);

    const [scannedExports, setScannedExports] = useState<ScrapedFindings | null>(null);
    const [repoPack, setRepoPack] = useState<RepoPackResult | null>(null);
    const [scanning, setScanning] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedRepoPath, setSelectedRepoPath] = useState('');
    const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
    const [showDetailedPanel, setShowDetailedPanel] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [beatFrames, setBeatFrames] = useState<number[]>([]);
    const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);

    const handleVoiceoverAudioChange = async (file: File | null) => {
        setVoiceoverAudioFile(file);
        if (!file) return;

        setIsTranscribingVoiceover(true);
        try {
            const float32Array = await extractAudioFeatures(file);
            const worker = new Worker(new URL('../../agents/whisperWorker.ts', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { status, result } = e.data;
                if (status === 'complete') {
                    setIsTranscribingVoiceover(false);
                    worker.terminate();

                    const chunks = result?.chunks || [];
                    const formattedScript = chunks.map((c: any) => {
                        const startSec = Array.isArray(c.timestamp) ? c.timestamp[0] : 0;
                        const endSec = Array.isArray(c.timestamp) ? (c.timestamp[1] || startSec + 1.5) : startSec + 1.5;
                        return `[${startSec.toFixed(1)}s - ${endSec.toFixed(1)}s] ${c.text.trim()}`;
                    }).join('\n');

                    setNarration(formattedScript || result.text || '');
                } else if (status === 'error') {
                    setIsTranscribingVoiceover(false);
                    worker.terminate();
                }
            };

            worker.postMessage({ action: 'transcribe', audioData: float32Array });
        } catch (err) {
            setIsTranscribingVoiceover(false);
        }
    };

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

    // Load active layout fonts from Google Fonts API dynamically if they are not installed locally on system
    useEffect(() => {
        // Collect font-family names currently in use across layout selectors
        const activeFamilies = [
            fonts['Title Font']?.fontFamily,
            fonts['Heading']?.fontFamily,
            fonts['Paragraph']?.fontFamily
        ];
        activeFamilies.forEach(family => {
            // If the font family is specified but not present in local system fonts list
            if (family && !availableFonts.includes(family)) {
                // Format family string to conform to Google Fonts URL space encoding
                const formattedName = family.replace(/\s+/g, '+');
                const linkId = `gfont-${formattedName.toLowerCase()}`;
                // Preemptively check to prevent injecting identical font link tags
                if (!document.getElementById(linkId)) {
                    const fontLink = document.createElement('link');
                    fontLink.id = linkId;
                    fontLink.rel = 'stylesheet';
                    fontLink.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;
                    document.head.appendChild(fontLink);
                }
            }
        });
    }, [fonts, availableFonts]);

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

        colors.forEach(col => {
            if (!col.match(/^#[0-9a-fA-F]{6}$/)) return;
            const { h, s, l } = hexToHsl(col);

            if ((h < 15 || h > 345) && s > 50 && l > 30) {
                error = col;
            }
            else if (s < 15 && l < 15) {
                background = col;
            }
            else if (s > 40 && l > 20 && l < 80) {
                if (primary === '#8b5cf6') {
                    primary = col;
                }
                else if (accent === '#f59e0b' && col !== primary) {
                    accent = col;
                }
            }

        });
        return { primary, accent, background, error };
    }

    const buildRepoContext = (findings: ScrapedFindings, pack: RepoPackResult | null): string => {
        const parts: string[] = ['[Product Codebase Summary]'];
        if (findings.routes.length > 0) {
            parts.push(`Routes:\n${findings.routes.slice(0, 25).map((r) => `- ${r}`).join('\n')}`);
        }
        if (findings.components.length > 0) {
            parts.push(`Components:\n${findings.components.slice(0, 40).map((c) => `- ${c}`).join('\n')}`);
        }
        if (findings.colors.length > 0) {
            parts.push(`Brand colors: ${findings.colors.slice(0, 20).join(', ')}`);
        }
        if (findings.fonts.length > 0) {
            parts.push(`Fonts: ${findings.fonts.slice(0, 10).join(', ')}`);
        }
        if (pack && pack.content) {
            parts.push(`[Full Source Pack — generated by repomix]\n${pack.content}`);
        }
        return parts.join('\n\n');
    };

    const completeRepoScan = async (results: ScrapedFindings, source: string) => {
        setScannedExports(results);

        const roles = analyzeColors(results.colors);
        setSwatches(prev => ({
            ...prev,
            Primary: roles.primary,
            Accent: roles.accent,
            Background: roles.background,
            Error: roles.error
        }));

        if (results.fonts.length > 0) {
            setFonts(prev => ({
                ...prev,
                'Title Font': { ...prev['Title Font'], fontFamily: results.fonts[0] }
            }));
        }

        let pack: RepoPackResult | null = null;
        if (window.electronAPI?.packRepo) {
            try {
                pack = await window.electronAPI.packRepo(source);
            } catch (err) {
                console.error('Repomix packing failed:', err);
            }
        }
        setRepoPack(pack);

        approveCurrentStage({
            confirmed: true,
            repoContext: buildRepoContext(results, pack)
        });

        const packNote = pack ? ` Repomix packed ${pack.totalFiles} files.` : '';
        await customAlert("Scan Complete", `Found ${results.components.length} components and ${results.routes.length} routes.${packNote} Generation will use this context.`);
    };

    const handleSelectFolder = async () => {

        if (!window.electronAPI?.selectDirectory) {
            await customAlert("Feature Unavailble", "Selecting Directories is only supported inside the desktop app");
            return;
        }

        const dir = await window.electronAPI.selectDirectory();
        if (!dir) return;

        setSelectedRepoPath(dir);
        setScanning(true);

        try {
            if (!window.electronAPI?.scanRepo) return;
            const results = await window.electronAPI.scanRepo(dir);
            if (!results || (results.components.length === 0 && results.colors.length === 0 && results.routes.length === 0)) {
                await customAlert("Scan Complete", "Scan completed but no components or colors were detected. Try Skip to continue without repo context.");
                return;
            }
            await completeRepoScan(results, dir);
        } catch (err) {
            console.error(err);
            await customAlert("Scan Error", "Failed to scan selected directory.");
        } finally {
            setScanning(false);
        }
    }

    const handleCloneAndScan = async () => {

        if (!repoLink.trim()) return;

        if (!window.electronAPI?.cloneScan) {
            await customAlert("Feature Unavailble", "Cloning Repositories is only supported inside the desktop app");
            return;
        }

        setScanning(true);
        try {
            const results = await window.electronAPI.cloneScan(repoLink.trim());
            if (!results || (results.components.length === 0 && results.colors.length === 0 && results.routes.length === 0)) {
                await customAlert("Scan Complete", "Clone succeeded but no components or colors were detected. Try Skip to continue without repo context.");
                return;
            }
            setSelectedRepoPath(repoLink.trim());
            await completeRepoScan(results, repoLink.trim());
        } catch (err) {
            console.error(err);
            await customAlert("Scan Error", "Failed to clone and scan repository.");
        } finally {
            setScanning(false);
        }
    }

    const handleSkipRepoScan = () => {
        approveCurrentStage({ confirmed: false });
    };


    const handleBack = () => {
        if (project) {
            onBack({
                ...project,
                prompt: instructions,
                narration,
                fonts,
                colors: { ...swatches, backgroundImage },
                bgDescription,
                showVisualizer
            });
        } else {
            onBack();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleBack();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [instructions, narration, fonts, swatches, backgroundImage, bgDescription, showVisualizer, project]);

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
            await customAlert("Setup Required", 'Please configure API keys first using the settings menu');
            return;
        }
        setIsRefining(true);
        try {
            const systemPrompt = "You are an AI prompt engineer for motion-graphics video generation. " +
                "Take the user's basic description of the video animation they want to create and refine it to be descriptive, " +
                "detailed, professional, and optimized for generating high-quality animation frames. " +
                "Return ONLY the refined prompt text, with no introductory, greeting, or meta text.";

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

    const capturePipelineState = (s: PipelineState) => {
        setPipelineState(s);
        pipelineHistory.record(s);
    };

    const handleGenerate = async () => {
        if (isGenerating) return;
        if (!instructions.trim() && !narration.trim()) return;
        setRepoPack(null);
        setScannedExports(null);
        setPipelineState(null);
        pipelineHistory.reset();
        setIsGenerating(true);
        try {
            const output = await runPipeline(
                instructions,
                narration,
                capturePipelineState,
                {}
            );
            if (output && output.assembled) {
            onGenerate({
                ...project,
                title: project?.title || 'Untitled',
                prompt: instructions,
                narration: narration,
                code: output.assembled,
                scenes: project?.scenes || [],
                showVisualizer,
                fonts,
                colors: { ...swatches, backgroundImage },
                bgSelection,
                bgDescription,
                unfinished: false,
                generationState: undefined,
                savePath: project?.savePath || ''
            });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const renderFontRow = (label: FontRow) => {
        const f = fonts[label];
        return (
            <div key={label} className="space-y-1.5">
                <span className="text-[10px] font-semibold text-gray-500 capitalize">{label}</span>
                <div className="flex gap-1.5">
                    <select value={f.fontFamily} onChange={(e) => setFontFamily(label, e.target.value)} className="flex-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-white outline-none">
                        {availableFonts.map((font) => <option key={font} value={font} className="bg-gray-950 text-white">{font}</option>)}
                    </select>
                </div>
                {scannedExports && scannedExports.fonts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {scannedExports.fonts.slice(0, 4).map((font) => (
                            <button
                                key={font}
                                type="button"
                                onClick={() => setFontFamily(label, font)}
                                className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors ${f.fontFamily === font
                                    ? 'bg-violet-600 text-white border-violet-500'
                                    : 'bg-gray-950/60 text-gray-500 border-gray-900 hover:text-gray-300'
                                    }`}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded border border-gray-800">
                        <button
                            onClick={() => toggleFontProp(label, 'bold')}
                            className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.bold ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
                        >
                            <TextB size={12} weight="bold" />
                        </button>
                        <button
                            onClick={() => toggleFontProp(label, 'italic')}
                            className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.italic ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
                        >
                            <TextItalic size={12} />
                        </button>
                        <button
                            onClick={() => toggleFontProp(label, 'underline')}
                            className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.underline ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
                        >
                            <TextUnderline size={12} />
                        </button>
                    </div>

                    <input
                        type="color"
                        value={f.color}
                        onChange={(e) => setFontColor(label, e.target.value)}
                        className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                        title={f.color}
                    />

                    <select
                        value={f.size}
                        onChange={(e) => setFontSize(label, Number(e.target.value))}
                        className="w-14 rounded border border-gray-800 bg-gray-900 px-1 py-0.5 text-xs text-white"
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

    const repoScanProps = {
        repoLink: repoLink,
        setRepoLink: setRepoLink,
        scanning: scanning,
        selectedRepoPath: selectedRepoPath,
        scannedExports: scannedExports,
        packStats: repoPack,
        onScanGit: handleCloneAndScan,
        onSelectFolder: handleSelectFolder,
        onViewReport: () => setShowDetailedPanel(true),
        onSkip: handleSkipRepoScan
    };

    let StatusProps = {
        fonts: fonts,
        setFonts: setFonts,
        swatches: swatches,
        setSwatches: setSwatches,
        availableFonts: availableFonts,
        bgSelection: bgSelection,
        onSelectBackground: setBgSelection,
        customAlert: customAlert,
        state: pipelineState || { status: 'idle' as const, progress: 0 },
        onApproveStage: approveCurrentStage,
        questions: [],
        onSubmitAnswers: () => {},
        repoScan: repoScanProps
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white page-enter">
            {/* LEFT SIDEBAR - Configuration Panel */}
            <ResizableSidebar initialWidth={380} minWidth={320} maxWidth={650} className="border-r border-gray-900 bg-gray-950 p-5 gap-4 overflow-y-auto">
                {/* Header */}
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
                    <span className="text-sm text-gray-400">SaaS</span>
                </header>

                {/* Section 1: Upload Script (Optional) */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
                    <VoiceoverAudioField
                        mode={voiceoverMode}
                        onModeChange={setVoiceoverMode}
                        scriptText={narration}
                        onScriptTextChange={setNarration}
                        audioFile={voiceoverAudioFile}
                        onAudioFileChange={handleVoiceoverAudioChange}
                        isTranscribing={isTranscribingVoiceover}
                    />
                </section>

                {/* Section 1b: Beat-sync Audio */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
                    <AudioUploadField
                        audioFile={audioFile}
                        beatCount={beatFrames.length}
                        isAnalyzing={isAnalyzingAudio}
                        onSelectAudio={handleSelectAudio}
                    />
                </section>

                <AIsidebar
                    instructions={instructions}
                    setInstructions={setInstructions}
                    state={pipelineState || { status: 'idle', progress: 0 }}
                    isRefining={isRefining}
                    handleRefinePrompt={handleRefinePrompt}
                    placeholder="Describe walkthrough flow (e.g. show user signup, then render analytics page)..."
                    StatusProps={StatusProps}
                />
            </ResizableSidebar>


            <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950/40 justify-between h-full">
                {/* Grid Grey Stage with New Browser Frame Preview Canvas */}
                <div className="aspect-video relative overflow-hidden flex-shrink-0 max-h-[64vh] w-full max-w-[114vh] mx-auto rounded-2xl border border-gray-800/80 bg-gray-900/95 p-5 flex items-center justify-center shadow-2xl">
                    {/* Background Dynamic Selection Layer */}
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

                    <div className="w-full h-full relative z-10 flex items-center justify-center [perspective:1200px]">
                            /* 3D Tilted Interactive Mockup Canvas with Sharp Subpixel Text & Crisp GPU Rasterization */
                            <div className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out [transform-style:preserve-3d] [backface-visibility:hidden] [will-change:transform] antialiased [transform:rotateX(6deg)_rotateY(-4deg)_scale(0.98)] hover:[transform:rotateX(0deg)_rotateY(0deg)_scale(1)] shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] rounded-xl border border-purple-500/20 overflow-hidden">
                                <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: swatches['Background'] || '#0f172a', fontFamily: fonts['Paragraph'].fontFamily }}>
                                    <div className="h-8 shrink-0 flex items-center gap-3 px-3.5 bg-black/40 border-b border-white/[0.06] select-none">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                                        </div>
                                        <div className="flex items-center ml-1 text-gray-600">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-40"><path d="M9 18l6-6-6-6" /></svg>
                                        </div>
                                        <div className="flex-1 max-w-[320px] mx-auto h-[22px] rounded-md bg-white/[0.05] border border-white/[0.04] flex items-center justify-center gap-1.5 overflow-hidden">
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="#34d399" className="shrink-0"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke="#34d399" strokeWidth="2.4" /></svg>
                                            <span className="text-[9px] text-gray-400 tracking-wide truncate">app.kinetic.dev/dashboard</span>
                                        </div>
                                        <Plus size={11} className="text-gray-600 shrink-0" />
                                    </div>

                                    <div className="flex-1 min-h-0 flex">
                                        <aside className="w-[164px] shrink-0 min-h-0 overflow-hidden flex flex-col justify-between py-3 px-2.5 text-[9px] font-medium tracking-wide border-r border-white/[0.05]" style={{ backgroundColor: '#080b12' }}>
                                            <div className="space-y-3 min-h-0">
                                                <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/[0.05]">
                                                    <img src={logoIcon} alt="Kinetic" className="h-4 w-4 object-contain shrink-0" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5)) brightness(1.15)' }} />
                                                    <span className="flex-1 font-extrabold text-[10.5px] text-white tracking-tight truncate">Kinetic App</span>
                                                    <CaretDown size={9} className="text-gray-600 shrink-0" />
                                                </div>
                                                <div className="flex items-center gap-1.5 h-6 px-2 rounded-md bg-white/[0.03] border border-white/[0.05]">
                                                    <MagnifyingGlass size={9} className="text-gray-600 shrink-0" />
                                                    <span className="text-[8px] text-gray-600 truncate">Quick find...</span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="block px-1 pb-1 text-[6.5px] font-bold uppercase tracking-[0.18em] text-gray-600">Main</span>
                                                    <div style={{ backgroundColor: `${swatches['Primary'] || '#8b5cf6'}25`, color: swatches['Primary'] || '#8b5cf6' }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg font-semibold">
                                                        <House size={12} weight="fill" />
                                                        <span>Dashboard</span>
                                                        <span style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} className="ml-auto w-3.5 h-3 rounded-sm flex items-center justify-center text-[6px] font-bold text-white">8</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                        <ChartBar size={12} />
                                                        <span>Analytics</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                        <Users size={12} />
                                                        <span>Customers</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                        <FolderSimple size={12} />
                                                        <span>Projects</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="block px-1 pb-1 text-[6.5px] font-bold uppercase tracking-[0.18em] text-gray-600">Workspace</span>
                                                    <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                        <SquaresFour size={12} />
                                                        <span>Integrations</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                        <Gear size={12} />
                                                        <span>Settings</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 shrink-0 border-t border-white/[0.05] pt-2.5">
                                                <div className="px-1">
                                                    <div className="flex justify-between text-[6.5px] text-gray-500 mb-1">
                                                        <span>Storage</span>
                                                        <span className="font-bold text-gray-400">68%</span>
                                                    </div>
                                                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: '68%', backgroundColor: swatches['Primary'] || '#8b5cf6' }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-lg border border-white/[0.06]">
                                                    <div style={{ background: `linear-gradient(135deg, ${swatches['Primary'] || '#8b5cf6'}, ${swatches['Accent'] || '#f59e0b'})` }} className="h-6 w-6 rounded-full text-white font-bold flex items-center justify-center text-[8px] shrink-0">
                                                        DU
                                                    </div>
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-white text-[9px] font-bold truncate">Demo User</span>
                                                        <span className="text-gray-500 text-[7.5px] truncate">Pro Workspace</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </aside>

                                        <div
                                            className="flex-1 min-w-0 min-h-0 relative flex flex-col"
                                            style={{
                                                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            <header className="h-9 shrink-0 px-3 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-sm">
                                                <div className="flex items-center gap-1.5 text-[8.5px]">
                                                    <span className="text-gray-500">Dashboard</span>
                                                    <span className="text-gray-700">/</span>
                                                    <span className="text-gray-200 font-semibold">Overview</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="hidden md:flex items-center gap-1.5 h-6 w-36 px-2 rounded-md bg-white/[0.04] border border-white/[0.06]">
                                                        <MagnifyingGlass size={9} className="text-gray-500 shrink-0" />
                                                        <span className="text-[8px] text-gray-500 truncate">Search metrics...</span>
                                                    </div>
                                                    <div className="relative text-gray-400">
                                                        <Bell size={12} />
                                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
                                                    </div>
                                                    <button style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-bold text-white shadow-md shadow-purple-900/30 whitespace-nowrap cursor-pointer">
                                                        <Plus size={8} weight="bold" />
                                                        New Campaign
                                                    </button>
                                                </div>
                                            </header>

                                            <div className="flex-1 min-h-0 p-3 flex flex-col gap-2.5 justify-between overflow-hidden">
                                                <div className="space-y-0.5 shrink-0">
                                                    <div className="flex items-end justify-between gap-2">
                                                        <h1
                                                            style={{
                                                                fontFamily: fonts['Title Font'].fontFamily,
                                                                color: fonts['Title Font'].color,
                                                                fontWeight: fonts['Title Font'].bold ? 'bold' : 'normal',
                                                                fontStyle: fonts['Title Font'].italic ? 'italic' : 'normal',
                                                                textDecoration: fonts['Title Font'].underline ? 'underline' : 'none',
                                                                fontSize: `${Math.min(17, fonts['Title Font'].size / 2.5)}px`
                                                            }}
                                                            className="tracking-tight font-bold"
                                                        >
                                                            {instructions.trim() ? instructions.slice(0, 42) : 'SaaS Product Analytics'}
                                                        </h1>
                                                        <span className="shrink-0 mb-0.5 px-1.5 py-px rounded-md bg-emerald-400/10 border border-emerald-400/20 text-[6.5px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                                    </div>
                                                    <p
                                                        style={{
                                                            fontFamily: fonts['Paragraph'].fontFamily,
                                                            color: fonts['Paragraph'].color,
                                                            fontWeight: fonts['Paragraph'].bold ? 'bold' : 'normal',
                                                            fontStyle: fonts['Paragraph'].italic ? 'italic' : 'normal',
                                                            textDecoration: fonts['Paragraph'].underline ? 'underline' : 'none',
                                                            fontSize: `${Math.min(9, fonts['Paragraph'].size / 1.4)}px`
                                                        }}
                                                        className="opacity-70 truncate max-w-lg"
                                                    >
                                                        {narration.trim() ? narration.slice(0, 75) + '...' : 'Live product walkthrough metrics, ARR growth, and customer engagement.'}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 shrink-0">
                                                    {[
                                                        { label: 'ARR Revenue', value: '$184,200', delta: '+28.4%', tone: 'text-emerald-400' },
                                                        { label: 'Active Customers', value: '4,892', delta: '+6.2%', tone: 'text-emerald-400' },
                                                        { label: 'Conversion Rate', value: '5.14%', delta: '+1.8pt', tone: 'text-purple-400' },
                                                        { label: 'Net Churn', value: '0.42%', delta: '-0.3pt', tone: 'text-sky-400' },
                                                    ].map((kpi) => (
                                                        <div key={kpi.label} className="bg-gray-950/80 border border-gray-800 rounded-xl p-2 shadow-sm min-w-0">
                                                            <span className="text-[6.5px] uppercase tracking-wider text-gray-400 block font-bold truncate">{kpi.label}</span>
                                                            <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#a78bfa' }} className="text-[13px] font-extrabold block leading-tight">{kpi.value}</span>
                                                            <div className="flex items-center justify-between mt-0.5 gap-1">
                                                                <span className={`text-[6.5px] font-bold whitespace-nowrap ${kpi.tone}`}>{kpi.delta}</span>
                                                                <div className="flex items-end gap-px h-2.5 shrink-0">
                                                                    {[35, 55, 45, 75, 95].map((h, i) => (
                                                                        <div key={i} className="w-[2.5px] rounded-sm" style={{ height: `${h}%`, backgroundColor: swatches['Primary'] || '#8b5cf6', opacity: 0.3 + i * 0.15 }} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-[1.6fr_1fr] gap-2.5 flex-1 min-h-[80px]">
                                                    <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-2.5 flex flex-col min-h-0">
                                                        <div className="flex justify-between items-center text-[7.5px] text-gray-400 border-b border-gray-800/60 pb-1.5 shrink-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-200 uppercase tracking-wider text-[7px]">Revenue Overview</span>
                                                                <span className="hidden sm:flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: swatches['Secondary'] || '#a78bfa' }} /><span className="text-[6.5px]">MRR</span></span>
                                                                <span className="hidden sm:flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: swatches['Accent'] || '#f59e0b' }} /><span className="text-[6.5px]">Goal</span></span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {['6M', '1Y', 'All'].map((t, i) => (
                                                                    <span key={t} className={`px-1.5 py-px rounded ${i === 0 ? 'bg-white/10 text-gray-200 font-bold' : 'text-gray-500'}`}>{t}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="flex-1 min-h-0 w-full mt-1.5">
                                                            <defs>
                                                                <linearGradient id="saasAreaFill" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stopColor={swatches['Secondary'] || '#a78bfa'} stopOpacity="0.35" />
                                                                    <stop offset="100%" stopColor={swatches['Secondary'] || '#a78bfa'} stopOpacity="0" />
                                                                </linearGradient>
                                                            </defs>
                                                            {[25, 55, 85].map((y) => (
                                                                <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth="1" />
                                                            ))}
                                                            <path d="M0 78 C24 70 40 82 60 72 C80 62 96 74 116 64 C136 54 152 62 172 50 C192 38 208 44 228 34 C248 26 264 32 284 22 L314 14 L314 100 L0 100 Z" fill="url(#saasAreaFill)" />
                                                            <path d="M0 88 C24 84 40 90 60 84 C80 78 96 86 116 80 C136 74 152 80 172 72 C192 66 208 70 228 62 C248 56 264 58 284 52 L314 48" fill="none" stroke={swatches['Accent'] || '#f59e0b'} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.55" strokeLinecap="round" />
                                                            <path d="M0 78 C24 70 40 82 60 72 C80 62 96 74 116 64 C136 54 152 62 172 50 C192 38 208 44 228 34 C248 26 264 32 284 22 L314 14" fill="none" stroke={swatches['Secondary'] || '#a78bfa'} strokeWidth="2" strokeLinecap="round" />
                                                            <circle cx="314" cy="14" r="5" fill={swatches['Accent'] || '#f59e0b'} opacity="0.25" />
                                                            <circle cx="314" cy="14" r="2.2" fill={swatches['Accent'] || '#f59e0b'} />
                                                        </svg>
                                                        <div className="flex justify-between px-0.5 shrink-0 pt-1 border-t border-gray-800/60">
                                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
                                                                <span key={m} className="text-[6px] text-gray-600">{m}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2.5 min-h-0">
                                                        <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-2 flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
                                                            <div className="flex items-center justify-between border-b border-gray-800 pb-1 shrink-0">
                                                                <span className="font-bold text-gray-200 uppercase tracking-wider text-[6.5px]">Live Audit Stream</span>
                                                                <DotsThree size={9} weight="bold" className="text-gray-600" />
                                                            </div>
                                                            <div className="space-y-1 overflow-hidden">
                                                                <div className="flex items-center gap-1.5 bg-gray-900/90 p-1 rounded-lg border border-gray-800">
                                                                    <TrendUp size={7} weight="bold" style={{ color: swatches['Primary'] || '#8b5cf6' }} className="shrink-0" />
                                                                    <span className="text-gray-200 font-medium truncate flex-1 text-[6.5px]">Enterprise License</span>
                                                                    <span className="text-emerald-400 font-bold text-[6.5px] shrink-0">+$2,400</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 bg-gray-900/90 p-1 rounded-lg border border-gray-800">
                                                                    <CheckCircle size={7} weight="bold" className="text-emerald-400 shrink-0" />
                                                                    <span className="text-gray-200 font-medium truncate flex-1 text-[6.5px]">Webhook #849</span>
                                                                    <span className="text-purple-400 font-bold text-[6.5px] shrink-0">200 OK</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 bg-gray-900/90 p-1 rounded-lg border border-gray-800">
                                                                    <Users size={7} weight="bold" className="text-amber-400 shrink-0" />
                                                                    <span className="text-gray-200 font-medium truncate flex-1 text-[6.5px]">New Team Member</span>
                                                                    <span className="text-amber-400 font-bold text-[6.5px] shrink-0">Joined</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-2 shrink-0">
                                                            <span className="block font-bold text-gray-200 uppercase tracking-wider text-[6.5px] pb-1.5 border-b border-gray-800">Top Regions</span>
                                                            <div className="mt-1.5 space-y-1">
                                                                {[
                                                                    { name: 'North America', pct: 64 },
                                                                    { name: 'Europe', pct: 22 },
                                                                    { name: 'APAC', pct: 14 },
                                                                ].map((r) => (
                                                                    <div key={r.name} className="flex items-center gap-1.5">
                                                                        <span className="w-12 shrink-0 text-[6px] text-gray-500 truncate">{r.name}</span>
                                                                        <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                                                                            <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: swatches['Secondary'] || '#a78bfa' }} />
                                                                        </div>
                                                                        <span className="w-5 text-right text-[6px] font-bold text-gray-400 shrink-0">{r.pct}%</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>

                {/* Pipeline Progress Bar */}
                {pipelineState && pipelineState.status !== 'done' && (
                    <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-purple-300">
                            <span className="capitalize">
                                {pipelineState.status === 'repoScan' ? 'Waiting for repo scan — check the sidebar' : pipelineState.status}
                            </span>
                            <span>{Math.round(pipelineState.progress * 100)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-950">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ${pipelineState.status === 'repoScan' ? 'animate-pulse' : ''}`}
                                style={{ width: `${Math.max(3, Math.round(pipelineState.progress * 100))}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* 3. Bottom Row: Upload Assets & Generate */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => assetInputRef.current?.click()}
                            className="flex items-center gap-2 premium-button-secondary py-2.5 px-5 text-xs rounded-lg hover:border-gray-700 transition-colors"
                        >
                            <UploadSimple size={16} className="text-purple-400" />
                            Upload custom assets
                        </button>
                        <input
                            type="file"
                            multiple
                            ref={assetInputRef}
                            onChange={handleAssetUpload}
                            className="hidden"
                        />
                        {uploadedAssets.length > 0 && (
                            <span className="text-[10px] text-gray-500 ml-2">
                                ({uploadedAssets.length} assets selected)
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!!pipelineState || isGenerating || scanning}
                        className="premium-button-primary py-2.5 px-10 text-xs font-semibold rounded-lg shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
                    >
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </main>

            {showDetailedPanel && scannedExports && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-[450px] h-full bg-gray-950 border-l border-gray-900 p-6 flex flex-col gap-6 overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkle size={18} className="text-emerald-400" />
                                <h3 className="text-sm font-bold text-white">Full Codebase Scrape Report</h3>
                            </div>
                            <button
                                onClick={() => setShowDetailedPanel(false)}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {scannedExports.routes.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Routes ({scannedExports.routes.length})</span>
                                <div className="flex flex-wrap gap-1">
                                    {scannedExports.routes.map((route) => (
                                        <span key={route} className="px-2 py-0.5 rounded bg-gray-900/80 text-gray-300 border border-gray-800 text-[9px] font-mono">
                                            {route}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {scannedExports.components.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Components ({scannedExports.components.length})</span>
                                <div className="flex flex-wrap gap-1">
                                    {scannedExports.components.map((comp) => (
                                        <span key={comp} className="px-2 py-0.5 rounded bg-transparent text-purple-300 border border-purple-500/60 text-[9px]">
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {scannedExports.colors.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Colors ({scannedExports.colors.length})</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {scannedExports.colors.map((color) => (
                                        <div key={color} className="flex items-center gap-1.5 bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-[10px] text-gray-300 font-mono">
                                            <div style={{ backgroundColor: color }} className="w-3 h-3 rounded-full border border-white/10" />
                                            {color}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {scannedExports.fonts.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-gray-500 tracking-wider block">Detected Fonts ({scannedExports.fonts.length})</span>
                                <div className="flex flex-wrap gap-1">
                                    {scannedExports.fonts.map((font) => (
                                        <span key={font} className="px-2 py-0.5 rounded bg-gray-900/80 text-gray-300 border border-gray-800 text-[9px] font-sans">
                                            {font}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SaaSGenerator;
