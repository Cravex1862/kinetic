import React, { useState, useEffect } from 'react';
import { TextB, TextItalic, TextUnderline, Folder, ArrowLeft, Sparkle, UploadSimple, GithubLogo, Palette, X, House, ChartBar, Users, FolderSimple, Gear, SquaresFour } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { BrowserFrame, SidebarLayout } from '../../primitives/StructuralSDK';
import { runPipeline } from '../../agents/pipeline';
import type { PipelineState } from '../../agents/types';
import { callLLM, getStoredConfig } from '../../agents/llmClient';
import type { ProjectData, AlertButton } from '../../pages/AppRouter';
import { BrandStylingPanel } from '@/renderer/components/BrandStylingPanel';
import { BackgroundSelection } from '@/renderer/components/BackgroundSelectorPanel';
import { VoiceoverAudioField } from '@/renderer/components/VoiceoverAudioField';
import { CustomInstructionsPanel } from '@/renderer/components/CustomInstructionsPanel';
import { AudioUploadField } from '@/renderer/components/AudioUploadField';
import { runBeatNetAI } from '@/renderer/utils/beatDetector';
import { ResizableSidebar } from '@/renderer/components/ResizableSidebar';

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
    const [scanning, setScanning] = useState(false);
    const [selectedRepoPath, setSelectedRepoPath] = useState('');
    const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
    const [showDetailedPanel, setShowDetailedPanel] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [beatFrames, setBeatFrames] = useState<number[]>([]);
    const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);

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

    const handleSelectFolder = async () => {

        if (!window.electronAPI?.selectDirectory) {
            await customAlert("Feature Unavailble", "Selecting Directories is only supported inside the desktop app");
            return;
        }

        const dir = await window.electronAPI.selectDirectory();
        if (dir) {
            setSelectedRepoPath(dir);

            setScanning(true);

            try {

                if (window.electronAPI?.scanRepo) {
                    const results = await window.electronAPI.scanRepo(dir);

                    if (results && (results.components.length > 0 || results.colors.length > 0 || results.routes.length > 0)) {
                        setScannedExports(results);

                        const roles = analyzeColors(results.colors);
                        setSwatches(prev => ({
                            ...prev,
                            Primary: roles.primary,
                            Accent: roles.accent,
                            Background: roles.background,
                            Error: roles.error
                        }))

                        if (results.fonts.length > 0) {
                            setFonts(prev => ({
                                ...prev,
                                'Title Font': { ...prev['Title Font'], fontFamily: results.fonts[0] }
                            }));
                        }

                        const listStr = results.components.slice(0, 10).map((item: string) => `-${item}`).join('\n');

                        setInstructions(prev => `${prev}\n\n[Scanned Codebase Context]\nMapped Components/routes:\n${listStr}`);

                        await customAlert("Scan Complete", `Successfully scanned Directory! Found ${results.components.length} components.`);
                    } else {
                        await customAlert("Scan Complete", "Scan completed successfully but no components or colors were detected.");
                    }
                }
            } catch (err) {
                console.error(err);
                await customAlert("Scan Error", "Failed to scan selected directory.");
            } finally {
                setScanning(false);
            }
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
            if (results && (results.components.length > 0 || results.colors.length > 0 || results.routes.length > 0)) {
                setScannedExports(results);

                if (results.colors.length > 0) {
                    setSwatches(prev => ({ ...prev, Primary: results.colors[0] }));
                }

                if (results.fonts.length > 0) {
                    setFonts(prev => ({
                        ...prev,
                        'Title Font': { ...prev['Title Font'], fontFamily: results.fonts[0] }
                    }));
                }

                const listStr = results.components.slice(0, 10).map((item: string) => `-${item}`).join('\n');
                setInstructions(prev => `${prev}\n\n[Scanned Codebase Context]\nMapped Components/routes:\n${listStr}`);
                await customAlert("Scan Complete", `Successfully cloned and scanned repository! Found ${results.components.length} components.`);
            } else {
                await customAlert("Scan Complete", "Scan completed successfully but no components or colors were detected.");
            }
        } catch (err) {
            console.error(err);
            await customAlert("Scan Error", "Failed to clone and scan repository.");
        } finally {
            setScanning(false);
        }
    }


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
            narration,
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
                narration: narration,
                code: output,
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
                    <div className="flex items-center gap-2">
                        <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" />
                        <span className="text-sm font-bold text-white">kinetic <span className="text-gray-500 font-normal">/ saas</span></span>
                    </div>
                </header>

                {/* Section 1: Upload Script (Optional) */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
                    <VoiceoverAudioField
                        mode={voiceoverMode}
                        onModeChange={setVoiceoverMode}
                        scriptText={narration}
                        onScriptTextChange={setNarration}
                        audioFile={voiceoverAudioFile}
                        onAudioFileChange={setVoiceoverAudioFile}
                    />
                </section>

                {/* Section 2: Enter repo link or Upload repo */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-gray-400">Scrape Product Codebase</h4>

                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <GithubLogo className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                value={repoLink}
                                onChange={(e) => setRepoLink(e.target.value)}
                                placeholder="Enter Git repository link..."
                                className="w-full premium-input pl-9 pr-3 py-1.5 text-xs rounded-lg bg-gray-950/60"
                            />
                        </div>
                        {repoLink.trim() && (
                            <button
                                onClick={handleCloneAndScan}
                                disabled={scanning}
                                className="px-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                                {scanning ? 'Cloning...' : 'Scrape'}
                            </button>
                        )}
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-900" />
                        </div>
                        <span className="relative bg-gray-950 px-2 text-[10px] text-gray-600">Or</span>
                    </div>

                    <button
                        onClick={handleSelectFolder}
                        disabled={scanning}
                        className="flex items-center justify-center gap-2 w-full premium-button-secondary py-2 text-xs rounded-lg hover:border-emerald-500/30 transition-colors"
                    >
                        <Folder size={16} className="text-emerald-400" />
                        {scanning ? 'Scanning Files...' : selectedRepoPath ? 'Change Selected Directory' : 'Upload Local Repo'}
                    </button>

                    {selectedRepoPath && (
                        <div className="text-[10px] text-gray-500 bg-gray-950/80 p-2 rounded border border-gray-900 truncate">
                            <span className="text-emerald-400 font-semibold">Loaded:</span> {selectedRepoPath}
                        </div>
                    )}
                    {scannedExports && (
                        <div className="mt-3 p-3 bg-gray-950/60 rounded-lg border border-gray-900 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[10px] text-gray-400">
                                <span>Components: <b className="text-purple-400">{scannedExports.components.length}</b></span>
                                <span>Colors: <b className="text-emerald-400">{scannedExports.colors.length}</b></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailedPanel(true)}
                                className="w-full py-1 text-[9px] font-bold tracking-wide bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors"
                            >
                                View Full Scraped Report
                            </button>
                        </div>
                    )}
                </section>

                {/* Reusable Styling Accordion Block */}
                <BrandStylingPanel
                    fonts={fonts as any}
                    setFonts={setFonts}
                    swatches={swatches}
                    setSwatches={setSwatches}
                    availableFonts={availableFonts}
                    bgSelection={bgSelection}
                    onSelectBackground={setBgSelection}
                />
            </ResizableSidebar>


            <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950/40 justify-between h-full">
                {/* Grid Grey Stage with New Browser Frame Preview Canvas */}
                <div className="aspect-video relative overflow-hidden flex-shrink-0 max-h-[64vh] w-full max-w-[114vh] mx-auto rounded-2xl border border-gray-800/80 bg-gray-900/95 p-5 flex items-center justify-center shadow-2xl">
                    {/* Background Soft Gray Ambient Radial Glow & Grid Overlay */}
                    <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                    <div className="w-full h-full relative flex items-center justify-center [perspective:1200px]">
                        {pipelineState ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-950/80 backdrop-blur-sm rounded-2xl border border-gray-900 z-20">
                                <div className="w-full max-w-md flex flex-col gap-3 p-6 rounded-2xl border-2 border-purple-500 bg-gray-950/90 backdrop-blur-xl">
                                    <div className="flex justify-between text-xs font-bold text-purple-300">
                                        <span className="capitalize">{pipelineState.status.replace('-', ' ')}</span>
                                        <span>{Math.round(pipelineState.progress * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-950">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                                            style={{ width: `${Math.round(pipelineState.progress * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* 3D Tilted Interactive Mockup Canvas with Sharp Subpixel Text & Crisp GPU Rasterization */
                            <div className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out [transform-style:preserve-3d] [backface-visibility:hidden] [will-change:transform] antialiased [transform:rotateX(6deg)_rotateY(-4deg)_scale(0.98)] hover:[transform:rotateX(0deg)_rotateY(0deg)_scale(1)] shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] rounded-xl border border-purple-500/20 overflow-hidden">
                                <BrowserFrame
                                    glowConfig={{ enabled: false, color: '', intensity: 0, spread: 0 }}
                                    url="app.kinetic.dev/dashboard"
                                    osType="mac"
                                    style={{
                                        backgroundColor: swatches['Background'] || '#0f172a',
                                        fontFamily: fonts['Paragraph'].fontFamily,
                                    }}
                                >
                                    <SidebarLayout
                                        sidebarWidth={175}
                                        style={{
                                            backgroundColor: '#090d16'
                                        }}
                                        sidebarContent={
                                            <div className="flex flex-col h-full justify-between p-3 text-[9.5px] font-medium tracking-wide">
                                                <div className="space-y-4">
                                                    {/* Brand Logo & Name */}
                                                    <div className="flex items-center gap-2.5 px-1 pb-2 border-b border-gray-800/80">
                                                        <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} className="h-5 w-5 rounded-md flex items-center justify-center font-black text-[10px] text-white shadow-sm">K</div>
                                                        <span className="font-extrabold text-xs text-white tracking-tight">Kinetic App</span>
                                                    </div>

                                                    {/* Navigation Menu with Phosphor Icons */}
                                                    <div className="space-y-1.5">
                                                        <div style={{ backgroundColor: `${swatches['Primary'] || '#8b5cf6'}25`, color: swatches['Primary'] || '#8b5cf6' }} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold">
                                                            <House size={14} weight="fill" className="text-purple-400" />
                                                            <span>Dashboard</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 px-2.5 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                            <ChartBar size={14} />
                                                            <span>Analytics</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 px-2.5 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                            <Users size={14} />
                                                            <span>Customers</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 px-2.5 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg transition-colors">
                                                            <FolderSimple size={14} />
                                                            <span>Projects</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom User Profile Badge & Settings */}
                                                <div className="space-y-2 border-t border-gray-800/80 pt-2.5">
                                                    <div className="flex items-center gap-2.5 px-2 py-1 text-gray-400 hover:text-gray-200 rounded-lg">
                                                        <Gear size={14} />
                                                        <span>Settings</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-lg border border-gray-800">
                                                        <div className="h-6 w-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[9px] border border-purple-400">
                                                            AK
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-white text-[9px] font-bold truncate">Ashwin K.</span>
                                                            <span className="text-gray-500 text-[7.5px] truncate">Pro Workspace</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <div
                                            style={{
                                                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                            className="p-3.5 flex flex-col gap-3 h-full min-h-0 w-full justify-between bg-slate-900/95"
                                        >
                                            {/* Header Bar */}
                                            <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
                                                <div className="flex items-center gap-2 bg-gray-950/80 px-2.5 py-1 rounded-lg border border-gray-800 text-[8.5px] text-gray-400 w-52">
                                                    <span className="text-gray-500">🔍</span>
                                                    <span className="truncate">Search metrics, customers, routes...</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} className="px-2.5 py-1 rounded-lg text-[8px] font-bold text-white shadow-md shadow-purple-500/20 whitespace-nowrap cursor-pointer">
                                                        + New Campaign
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Page Title & Subtitle */}
                                            <div className="space-y-0.5">
                                                <h1
                                                    style={{
                                                        fontFamily: fonts['Title Font'].fontFamily,
                                                        color: fonts['Title Font'].color,
                                                        fontWeight: fonts['Title Font'].bold ? 'bold' : 'normal',
                                                        fontStyle: fonts['Title Font'].italic ? 'italic' : 'normal',
                                                        textDecoration: fonts['Title Font'].underline ? 'underline' : 'none',
                                                        fontSize: `${Math.min(18, fonts['Title Font'].size / 2.3)}px`
                                                    }}
                                                    className="tracking-tight font-bold"
                                                >
                                                    {instructions.trim() ? instructions.slice(0, 42) : 'SaaS Product Analytics'}
                                                </h1>
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

                                            {/* 3 Real-time Metric Glass Cards */}
                                            <div className="grid grid-cols-3 gap-2.5">
                                                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-2 space-y-1 shadow-sm">
                                                    <span className="text-[7px] uppercase tracking-wider text-gray-400 block font-bold">ARR Revenue</span>
                                                    <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#a78bfa' }} className="text-sm font-extrabold block">$184,200</span>
                                                    <span className="text-[6.5px] text-emerald-400 font-bold block">↑ +28.4% this month</span>
                                                </div>
                                                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-2 space-y-1 shadow-sm">
                                                    <span className="text-[7px] uppercase tracking-wider text-gray-400 block font-bold">Active Customers</span>
                                                    <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#a78bfa' }} className="text-sm font-extrabold block">4,892</span>
                                                    <span className="text-[6.5px] text-purple-400 font-bold block">99.9% Platform Uptime</span>
                                                </div>
                                                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-2 space-y-1 shadow-sm">
                                                    <span className="text-[7px] uppercase tracking-wider text-gray-400 block font-bold">Conversion Rate</span>
                                                    <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#a78bfa' }} className="text-sm font-extrabold block">5.14%</span>
                                                    <span className="text-[6.5px] text-emerald-400 font-bold block">↑ +1.8% vs benchmark</span>
                                                </div>
                                            </div>

                                            {/* Main Content Area: Usage Analytics Bar Chart + Live Stream */}
                                            <div className="grid grid-cols-5 gap-2.5 flex-1 min-h-0">
                                                {/* Bar Chart Container */}
                                                <div className="col-span-3 bg-gray-950/90 border border-gray-800 rounded-xl p-2.5 flex flex-col justify-between">
                                                    <div className="flex justify-between items-center text-[7.5px] text-gray-400 border-b border-gray-800/60 pb-1.5">
                                                        <span className="font-bold text-gray-200 uppercase tracking-wider text-[7px]">Monthly Active Usage</span>
                                                        <span className="text-purple-400 font-bold">6-Month Velocity</span>
                                                    </div>
                                                    <div className="flex-1 flex items-end gap-2.5 justify-center px-3 pt-2">
                                                        <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '45%' }} className="w-4 rounded-t-md opacity-80" />
                                                        <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '65%' }} className="w-4 rounded-t-md opacity-85" />
                                                        <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '80%' }} className="w-4 rounded-t-md opacity-90" />
                                                        <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '55%' }} className="w-4 rounded-t-md opacity-80" />
                                                        <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '90%' }} className="w-4 rounded-t-md opacity-95" />
                                                        <div style={{ backgroundColor: swatches['Accent'] || '#f59e0b', height: '100%' }} className="w-4 rounded-t-md animate-pulse shadow-lg" />
                                                    </div>
                                                </div>

                                                {/* Live Stream Audit List */}
                                                <div className="col-span-2 bg-gray-950/90 border border-gray-800 rounded-xl p-2 flex flex-col gap-1.5 text-[7px]">
                                                    <span className="font-bold text-gray-200 uppercase tracking-wider text-[6.5px] border-b border-gray-800 pb-1 block">Live Audit Stream</span>
                                                    <div className="space-y-1.5 overflow-hidden">
                                                        <div className="flex justify-between items-center bg-gray-900/90 p-1.5 rounded-lg border border-gray-800">
                                                            <span className="text-gray-200 font-medium truncate">Enterprise License</span>
                                                            <span className="text-emerald-400 font-bold text-[6.5px]">+$2,400</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-gray-900/90 p-1.5 rounded-lg border border-gray-800">
                                                            <span className="text-gray-200 font-medium truncate">Webhook #849</span>
                                                            <span className="text-purple-400 font-bold text-[6.5px]">200 OK</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-gray-900/90 p-1.5 rounded-lg border border-gray-800">
                                                            <span className="text-gray-200 font-medium truncate">New Team Member</span>
                                                            <span className="text-amber-400 font-bold text-[6.5px]">Joined</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </SidebarLayout>
                                </BrowserFrame>
                            </div>
                        )}
                    </div>
                </div>



                {/* Main Content Inputs: Custom Instructions & Beat Sync Audio */}
                <div className="w-full flex flex-col gap-4 mt-2">
                    <CustomInstructionsPanel
                        instructions={instructions}
                        setInstructions={setInstructions}
                        isRefining={isRefining}
                        handleRefinePrompt={handleRefinePrompt}
                        placeholder="Describe walkthrough flow (e.g. show user signup, then render analytics page)..."
                    />

                    <AudioUploadField
                        audioFile={audioFile}
                        beatCount={beatFrames.length}
                        isAnalyzing={isAnalyzingAudio}
                        onSelectAudio={handleSelectAudio}
                    />
                </div>

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
                        disabled={!!pipelineState}
                        className="premium-button-primary py-2.5 px-10 text-xs font-semibold rounded-lg shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
                    >
                        Generate
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
