import React, { useState, useEffect } from 'react';
import { TextB, TextItalic, TextUnderline, Folder, ArrowLeft, Sparkle, UploadSimple, GithubLogo, Palette, X } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { BrowserFrame, SidebarLayout } from '../../primitives/StructuralSDK';
import { runPipeline } from '../../agents/pipeline';
import type { PipelineState } from '../../agents/types';
import { callLLM, getStoredConfig } from '../../agents/llmClient';
import type { ProjectData, AlertButton } from '../../pages/AppRouter';
import { BrandStylingPanel } from '@/renderer/components/BrandStylingPanel';
import { BackgroundSelection } from '@/renderer/components/BackgroundSelectorPanel';

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
            <aside className="w-1/5 min-w-[260px] max-w-[340px] flex-shrink-0 border-r border-gray-900 bg-gray-950 p-5 flex flex-col gap-4 overflow-y-auto">
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
                        <span className="text-sm font-bold text-white">SaaS Demo Studio</span>
                    </div>
                </header>

                {/* Section 1: Upload Script (Optional) */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-400">Voiceover Script (optional)</h4>
                    </div>
                    <textarea
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        placeholder="Enter voiceover script... Each paragraph becomes a scene in the demo."
                        className="w-full h-24 resize-none premium-input p-2.5 text-xs rounded-lg bg-gray-950/60"
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

                {/* Section 4: Custom Instructions */}
                <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">Custom Prompt Instructions</h4>
                    <div className="relative">
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Describe walkthrough flow (e.g. show user signup, then render analytics page)..."
                            className="w-full h-24 resize-none premium-input pl-3 pr-10 py-2 text-xs rounded-lg bg-gray-950/60"
                        />
                        <button onClick={handleRefinePrompt} disabled={isRefining || !instructions.trim()}
                            className='absolute bottom-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed'
                            title="Refine Prompt">
                            <Sparkle size={12} weight="fill" className='text-white' />
                        </button>
                    </div>
                </section>
            </aside>


            <main className="flex-grow flex flex-col p-6 gap-5 overflow-y-auto bg-gray-950/40 justify-between h-full">
                <div className="aspect-video relative overflow-hidden flex-shrink-0 max-h-[64vh] w-full max-w-[114vh] mx-auto rounded-2xl border border-gray-900 bg-gray-950">
                    <div className="w-full h-full relative">
                        {pipelineState ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-950/80 backdrop-blur-sm rounded-2xl border border-gray-900 z-20">
                                <div className="w-full max-w-md flex flex-col gap-3 p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl">
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
                            /* Interactive Styling Mockup Preview Canvas */
                            <BrowserFrame
                                glowConfig={{ enabled: false, color: '', intensity: 0, spread: 0 }}
                                url="kineticapp.dev/dashboard"
                                windowStyle="mac"
                                style={{
                                    backgroundColor: swatches['Background'] || '#030712',
                                    fontFamily: fonts['Paragraph'].fontFamily,
                                }}
                            >
                                <SidebarLayout
                                    glowConfig={{ enabled: false, color: '', intensity: 0, spread: 0 }}
                                    sidebarWidth={100}
                                    style={{
                                        backgroundColor: 'transparent'
                                    }}
                                    sidebarContent={
                                        <div className="flex flex-col h-full justify-between py-1 text-[8px] font-medium tracking-wide">
                                            <div className="space-y-4">
                                                {/* Brand Logo header */}
                                                <div className="flex items-center gap-1.5 px-1 pb-2 border-b border-gray-800/60">
                                                    <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} className="h-2 w-2 rounded-full" />
                                                    <span className="font-bold text-[8px] text-gray-200">Kinetic</span>
                                                </div>

                                                {/* Navigation Menu */}
                                                <div className="space-y-1.5">
                                                    {scannedExports && scannedExports.routes.length > 0 ? (
                                                        scannedExports.routes.slice(0, 4).map((route, idx) => (
                                                            <div
                                                                key={route}
                                                                style={idx === 0 ? { backgroundColor: `${swatches['Primary'] || '#8b5cf6'}20`, color: swatches['Primary'] || '#8b5cf6' } : {}}
                                                                className={`flex items-center gap-1 px-1.5 py-1 rounded ${idx === 0 ? '' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                <div style={{ backgroundColor: idx === 0 ? (swatches['Primary'] || '#8b5cf6') : 'transparent' }} className="h-1.5 w-1.5 rounded-full" />
                                                                <span className="capitalize">{route.replace(/^\//, '')}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <div style={{ backgroundColor: `${swatches['Primary'] || '#8b5cf6'}20`, color: swatches['Primary'] || '#8b5cf6' }} className="flex items-center gap-1 px-1.5 py-1 rounded">
                                                                <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6' }} className="h-1.5 w-1.5 rounded-full" />
                                                                <span>Overview</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 px-1.5 py-1 text-gray-500 hover:text-gray-300">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
                                                                <span>Analytics</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 px-1.5 py-1 text-gray-500 hover:text-gray-300">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
                                                                <span>Campaigns</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 px-1.5 py-1 text-gray-500 hover:text-gray-300">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
                                                                <span>Audience</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom settings item */}
                                            <div className="flex items-center gap-1 px-1.5 py-1 text-gray-600 border-t border-gray-800/40 pt-2">
                                                <span>Settings</span>
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
                                        className="p-3 flex flex-col gap-3 h-full min-h-0 w-full justify-between"
                                    >
                                        {/* Top Header Block */}
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <h1
                                                    style={{
                                                        fontFamily: fonts['Title Font'].fontFamily,
                                                        color: fonts['Title Font'].color,
                                                        fontWeight: fonts['Title Font'].bold ? 'bold' : 'normal',
                                                        fontStyle: fonts['Title Font'].italic ? 'italic' : 'normal',
                                                        textDecoration: fonts['Title Font'].underline ? 'underline' : 'none',
                                                        fontSize: `${Math.min(18, fonts['Title Font'].size / 2.2)}px`
                                                    }}
                                                    className="tracking-tight"
                                                >
                                                    {instructions.trim() ? instructions.slice(0, 35) : 'Analytics Dashboard'}
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
                                                    className="opacity-70 truncate max-w-[280px]"
                                                >
                                                    {narration.trim() ? narration.slice(0, 60) + '...' : 'Real-time performance metrics and overview.'}
                                                </p>
                                            </div>

                                            {/* Primary/Accent button mock */}
                                            <div
                                                style={{ backgroundColor: swatches['Accent'] || '#f59e0b' }}
                                                className="px-2 py-0.75 rounded text-[8px] font-semibold text-gray-950 shadow-sm cursor-pointer hover:opacity-90 whitespace-nowrap"
                                            >
                                                Export Report
                                            </div>
                                        </div>

                                        {/* Premium Glass Cards Row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-gray-900/50 border border-gray-800 rounded p-2 space-y-1">
                                                <span className="text-[7px] uppercase tracking-wider text-gray-500 block">Total Revenue</span>
                                                <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#8b5cf6' }} className="text-xs font-bold block">$24,150</span>
                                            </div>
                                            <div className="bg-gray-900/50 border border-gray-800 rounded p-2 space-y-1">
                                                <span className="text-[7px] uppercase tracking-wider text-gray-500 block">Active Users</span>
                                                <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#8b5cf6' }} className="text-xs font-bold block">1,842</span>
                                            </div>
                                            <div className="bg-gray-900/50 border border-gray-800 rounded p-2 space-y-1">
                                                <span className="text-[7px] uppercase tracking-wider text-gray-500 block">Conversion</span>
                                                <span style={{ fontFamily: fonts['Heading'].fontFamily, color: swatches['Secondary'] || '#8b5cf6' }} className="text-xs font-bold block">3.8%</span>
                                            </div>
                                        </div>

                                        {/* Mock Chart Area */}
                                        <div className="flex-1 min-h-0 bg-gray-950/60 border border-gray-900 rounded p-2 flex flex-col justify-between">
                                            <span className="text-[7px] uppercase tracking-wider text-gray-500 block mb-2">Usage Activity</span>
                                            <div className="flex-1 flex items-end gap-3 justify-center px-4">
                                                <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '40%' }} className="w-4 rounded-t opacity-80" />
                                                <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '65%' }} className="w-4 rounded-t opacity-85" />
                                                <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '85%' }} className="w-4 rounded-t opacity-90" />
                                                <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '50%' }} className="w-4 rounded-t opacity-80" />
                                                <div style={{ backgroundColor: swatches['Primary'] || '#8b5cf6', height: '95%' }} className="w-4 rounded-t opacity-100 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </SidebarLayout>
                            </BrowserFrame>
                        )}
                    </div>
                </div>



                {/* 3. Bottom Row: Upload Assets & Generate */}
                <div className="flex items-center justify-between gap-4 mt-1">
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
                                        <span key={comp} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px]">
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
