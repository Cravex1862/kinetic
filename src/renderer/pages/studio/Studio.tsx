import React, { useState, useEffect, useRef } from 'react';
import type { ProjectData } from '../AppRouter';
import { ArrowLeft, DownloadSimple, CheckCircle, XCircle, CircleNotch, FolderOpen, X, Video, Microphone } from '@phosphor-icons/react';
import { VoiceoverModal } from './VoiceoverModal';
import { parseSceneCodeToNodes, updateCodeWithNodeProps, ComponentNode, EasingType } from './semanticParser';
import { generateFCPXML } from '../../utils/fcpxmlExporter';
import { InspectorPanel } from './InspectorPanel';
import { MultiTrackTimeline } from './MultiTrackTimeline';
import { SceneHierarchyPanel } from './SceneHierarchyPanel';
import VideoComposition from '@/renderer/scenes/VideoComposition';
import { Player, PlayerRef } from '@remotion/player';
import { sanitizeCompositionCode } from '../../agents/pipeline';
import { getStoredConfig, callLLM } from '../../agents/llmClient';
import { TimelineCommentPins } from './TimelineCommentPins';
import { buildTargetedCommentPrompt } from './scopedAiEdit';
import { TimelineCommentPin } from './semanticParser';

interface StudioProps {
    project: ProjectData;
    onBack: () => void;
    onRename: (newTitle: string) => void;
    onUpdateProject: (updated: ProjectData) => void;
    customAlert: (title: string, message: string) => Promise<void>;
}

import { BackgroundSelection } from '../../components/BackgroundSelectorPanel';

export const Studio: React.FC<StudioProps> = ({
    project,
    onBack,
    onRename,
    onUpdateProject,
    customAlert,
}) => {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showVoiceoverModal, setShowVoiceoverModal] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<{ frame: number; total: number; status: string } | null>(null);
    const [exportResult, setExportResult] = useState<{ success: boolean; error?: string; outputPath?: string } | null>(null);
    const [exportWidth, setExportWidth] = useState(1920);
    const [exportHeight, setExportHeight] = useState(1080);
    const [exportFps, setExportFps] = useState(30);
    const [exportFormat, setExportFormat] = useState<'mp4' | 'fcpxml'>('mp4');
    const [exportFilename, setExportFilename] = useState(`${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_render.mp4`);

    const handleStartExport = async () => {
        setExporting(true);
        setExportResult(null);
        const duration = (project as any).durationInFrames || durationInFrames || 150;

        if (exportFormat === 'fcpxml') {
            try {
                const xmlFilename = exportFilename.replace(/\.mp4$/i, '.xml');
                const outputPath = `C:\\Users\\kalic\\Downloads\\${xmlFilename}`;

                const clips = nodes.map((node, i) => ({
                    id: node.id || `node-${i}`,
                    name: node.label || (node as any).type || `Layer_${i + 1}`,
                    srcPath: `Assets/${node.label || (node as any).type || 'Component'}_${i + 1}.png`,
                    trackType: 'video' as const,
                    trackIndex: i + 1,
                    startFrame: 0,
                    durationInFrames: duration,
                }));

                const xmlContent = generateFCPXML(project.title, exportWidth, exportHeight, exportFps, clips);

                const api = (window as any).electronAPI;
                if (api?.writeFile) {
                    await api.writeFile(outputPath, xmlContent);
                }
                setExportResult({ success: true, outputPath });
            } catch (err: any) {
                setExportResult({ success: false, error: err.message || 'FCPXML export failed' });
            } finally {
                setExporting(false);
            }
            return;
        }

        setExportProgress({ frame: 0, total: duration, status: 'Initializing Remotion Engine...' });


        const api = (window as any).electronAPI;
        const outputPath = `C:\\Users\\kalic\\Downloads\\${exportFilename}`;

        let removeListener: (() => void) | null = null;
        if (api?.onRenderProgress) {
            removeListener = api.onRenderProgress((prog: any) => {
                setExportProgress({
                    frame: prog.frame || 0,
                    total: prog.total || duration,
                    status: prog.status || 'Rendering Frames...'
                });
            });
        }

        try {
            let res;
            if (api?.exportVideo) {
                res = await api.exportVideo({
                    compositionId: 'Scene1',
                    outputPath,
                    fps: exportFps,
                    width: exportWidth,
                    height: exportHeight,
                    framesPerScene: [duration],
                    props: { bgSelection },

                });
            } else {
                for (let f = 1; f <= duration; f += 5) {
                    await new Promise(r => setTimeout(r, 50));
                    setExportProgress({ frame: f, total: duration, status: `Rendering frame ${f} of ${duration}` });
                }
                res = { success: true };
            }

            if (res && res.success) {
                setExportResult({ success: true, outputPath });
            } else {
                setExportResult({ success: false, error: res?.error || 'Render failed' });
            }
        } catch (err: any) {
            setExportResult({ success: false, error: err.message || 'Render failed' });
        } finally {
            if (removeListener) removeListener();
            setExporting(false);
        }
    };


    const [frame, setFrame] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [durationInFrames, setDurationInFrames] = useState(1800); // Default 60s (1800 frames), uncapped
    const [compKey, setCompKey] = useState(0);
    const [nodes, setNodes] = useState<ComponentNode[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [bgSelection, setBgSelection] = useState<BackgroundSelection>({ type: 'color', color: '#09090b' });
    const playerRef = useRef<PlayerRef>(null);
    const [commentPins, setCommentPins] = useState<TimelineCommentPin[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastWrittenCodeRef = useRef<string>('');

    const [dynamicComponent, setDynamicComponent] = useState<React.ComponentType | null>(null);
    const lastSyncedCodeRef = React.useRef<string>('');
    const lastSyncedPathRef = React.useRef<string>('');
    // Sync project.code to VideoComposition.tsx whenever project code or project changes
    useEffect(() => {
        const syncCode = async () => {
            if (!project?.code || !window.electronAPI?.writeFile) return;
            const cleanCode = sanitizeCompositionCode(project.code);
            if (!cleanCode) return;

            if (lastSyncedCodeRef.current === cleanCode) return;
            lastSyncedCodeRef.current = cleanCode;
            lastSyncedPathRef.current = project?.savePath || '';

            await window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', cleanCode);
            setTimeout(() => {
                setCompKey((k) => k + 1);
            }, 100);
        };
        syncCode();
    }, [project?.code, project?.savePath, project?.title]);

    useEffect(() => {
        const loadNodes = async () => {
            let codeToParse = project?.code || '';
            if (!codeToParse && window.electronAPI?.readFile) {
                const diskCode = await window.electronAPI.readFile('src/renderer/scenes/VideoComposition.tsx');
                if (diskCode) codeToParse = diskCode;
            }
            const parsed = parseSceneCodeToNodes(codeToParse);
            setNodes(parsed);
            setSelectedNodeId((prev) => {
                if (prev && parsed.some(n => n.id === prev)) return prev;
                return parsed.length > 0 ? parsed[0].id : null;
            });
        };
        loadNodes();
    }, [project?.code, project?.savePath]);

    useEffect(() => {
        if (!project?.code) return;
        const sequenceMatches = [...project.code.matchAll(/durationInFrames=\{?(\d+)\}?/gi)];
        if (sequenceMatches.length > 0) {
            const totalCalculatedFrames = sequenceMatches.reduce((sum, match) => sum + parseInt(match[1], 10), 0);
            if (totalCalculatedFrames > 0) {
                setDurationInFrames(totalCalculatedFrames);
            }
        }
    }, [project?.code]);

    const handleAddCommentPin = (targetFrame: number, text: string) => {
        const newPin: TimelineCommentPin = {
            id: `pin-${Date.now()}`,
            frame: targetFrame,
            text,
            targetNodeId: selectedNodeId || undefined,
            resolved: false,
            createdAt: Date.now(),
        };
        setCommentPins((prev) => [...prev, newPin])
    };

    const handleResolveCommentPin = (pinId: string) => {
        setCommentPins((prev) => prev.map((pin) => (pin.id === pinId ? { ...pin, resolved: !pin.resolved } : pin)));
    };

    const [isAiFixing, setIsAiFixing] = useState<string | null>(null);

    const handleFixWithAI = async (pin: TimelineCommentPin) => {
        setIsAiFixing(pin.id);
        const activeNode = nodes.find((n) => n.id === pin.targetNodeId) || nodes[0];
        const scopedPrompt = buildTargetedCommentPrompt(pin, activeNode, project.code);

        try {
            const config = getStoredConfig();
            if (config && config.apiKey && project.code) {
                const systemPrompt = `You are an expert Remotion code animator AI agent. Execute the following targeted section edit request for frame ${pin.frame}: "${pin.text}". Modify keyframe values or layout parameters strictly at frame ${pin.frame}. Return pure TSX code inside a markdown code block.`;
                const response = await callLLM(config, systemPrompt, scopedPrompt);
                const generatedCode = response.content || (response as any).code;
                if (generatedCode && window.electronAPI?.writeFile) {
                    const sanitized = sanitizeCompositionCode(generatedCode);
                    await window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', sanitized);
                    setCompKey((k) => k + 1);
                }
            } else if (activeNode) {
                // Fallback: Create/update a keyframe marker at the target frame for the active element
                const defaultProp = 'translateY';
                handleUpdateProp(activeNode.id, defaultProp, (activeNode.props[defaultProp] ?? 0) + 10);
            }
        } catch (err) {
            console.error("Targeted AI fix failed:", err);
        } finally {
            setIsAiFixing(null);
            handleResolveCommentPin(pin.id);
        }
    };

    const syncCodeAndAutoSave = (updatedNodes: ComponentNode[]) => {
        if (!project.code) return;
        const newCode = updateCodeWithNodeProps(project.code, updatedNodes);
        if (newCode === lastWrittenCodeRef.current) return;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => {
            lastWrittenCodeRef.current = newCode;
            const compiled = sanitizeCompositionCode(newCode);
            if (!compiled) return;

            if (window.electronAPI?.writeFile) {
                window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', compiled);

                if (project.savePath) {
                    const updatedProject: ProjectData = {
                        ...project,
                        code: newCode,
                    };
                    window.electronAPI.writeFile(project.savePath, JSON.stringify(updatedProject, null, 2));
                    onUpdateProject(updatedProject);
                }
            }
        }, 150);
    };


    useEffect(() => {
        if (!playing) {
            playerRef.current?.pause();
            return;
        }

        playerRef.current?.play();
    }, [playing]);

    const lastFrameUpdateRef = useRef<number>(0);

    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        const onFrameUpdate = (e: any) => {
            const currentF = Math.round(e.detail.frame);

            if (playing) {
                const now = performance.now();
                if (now - lastFrameUpdateRef.current > 80 || currentF >= durationInFrames) {
                    lastFrameUpdateRef.current = now;
                    setFrame(currentF);
                }
            } else {
                setFrame(currentF);
            }

            if (currentF >= durationInFrames) {
                player.pause();
                setPlaying(false);
            }
        };

        player.addEventListener('frameupdate', onFrameUpdate);
        return () => {
            player.removeEventListener('frameupdate', onFrameUpdate);
        };
    }, [durationInFrames, playing]);


    const undoStackRef = useRef<ComponentNode[][]>([]);
    const redoStackRef = useRef<ComponentNode[][]>([]);

    const pushHistory = (currentNodes: ComponentNode[]) => {
        if (currentNodes.length === 0) return;
        undoStackRef.current.push(JSON.parse(JSON.stringify(currentNodes)));
        if (undoStackRef.current.length > 50) {
            undoStackRef.current.shift();
        }
        redoStackRef.current = [];
    };

    const handleUndo = () => {
        if (undoStackRef.current.length === 0) return;
        const prevNodes = undoStackRef.current.pop()!;
        redoStackRef.current.push(JSON.parse(JSON.stringify(nodes)));
        setNodes(prevNodes);
        syncCodeAndAutoSave(prevNodes);
    };

    const handleRedo = () => {
        if (redoStackRef.current.length === 0) return;
        const nextNodes = redoStackRef.current.pop()!;
        undoStackRef.current.push(JSON.parse(JSON.stringify(nodes)));
        setNodes(nextNodes);
        syncCodeAndAutoSave(nextNodes);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
                return;
            }

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;
            if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    handleRedo();
                } else {
                    e.preventDefault();
                    handleUndo();
                }
            } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes]);

    const handleMoveKeyframe = (nodeId: string, propKey: string, pointIdx: number, newFrame: number): number => {
        let newIdx = pointIdx;
        pushHistory(nodes);
        setNodes((prev) => {
            const updatedNodes = prev.map((node) => {
                if (node.id !== nodeId) return node;
                const points = node.keyframes[propKey] || [];
                if (!points[pointIdx]) return node;

                const targetFrame = Math.max(0, Math.min(durationInFrames, newFrame));
                const targetPoint = { ...points[pointIdx], frame: targetFrame };

                const remainingPoints = points.filter((_, idx) => idx !== pointIdx);
                const updatedPoints = [...remainingPoints, targetPoint].sort((a, b) => a.frame - b.frame);

                // Ensure keyframe points never occupy the exact same frame number
                for (let i = 1; i < updatedPoints.length; i++) {
                    if (updatedPoints[i].frame <= updatedPoints[i - 1].frame) {
                        updatedPoints[i].frame = updatedPoints[i - 1].frame + 1;
                    }
                }

                newIdx = updatedPoints.findIndex((pt) => pt === targetPoint || (pt.frame === targetPoint.frame && pt.value === targetPoint.value));

                return {
                    ...node,
                    keyframes: { ...node.keyframes, [propKey]: updatedPoints }
                };
            });

            syncCodeAndAutoSave(updatedNodes);
            return updatedNodes;
        });
        return newIdx;
    };

    const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
    const availableTargetIds = nodes.map((n) => n.id);

    const handleUpdateProp = (nodeId: string, propKey: string, value: any) => {
        pushHistory(nodes);
        setNodes((prev) => {
            const updatedNodes = prev.map((node) => {
                if (node.id !== nodeId) return node;

                const hasKeyframes = Boolean(node.keyframes[propKey] && node.keyframes[propKey].length > 0);
                let updatedKeyframes = { ...node.keyframes };

                if (hasKeyframes) {
                    const points = [...(node.keyframes[propKey] || [])];
                    const existingIdx = points.findIndex((pt) => pt.frame === frame);

                    if (existingIdx >= 0) {
                        points[existingIdx] = { frame, value };
                    } else {
                        points.push({ frame, value });
                        points.sort((a, b) => a.frame - b.frame);
                    }
                    updatedKeyframes[propKey] = points;
                }

                return {
                    ...node,
                    props: { ...node.props, [propKey]: value },
                    keyframes: updatedKeyframes,
                };
            });

            syncCodeAndAutoSave(updatedNodes);
            return updatedNodes;
        });
    };

    const handleToggleKeyframe = (nodeId: string, propKey: string) => {
        pushHistory(nodes);
        setNodes((prev) => {
            const updatedNodes = prev.map((node) => {
                if (node.id !== nodeId) return node;
                const exists = Boolean(node.keyframes[propKey]);
                const nextKeyframes = { ...node.keyframes };
                if (exists) {
                    delete nextKeyframes[propKey];
                } else {
                    nextKeyframes[propKey] = [
                        { frame, value: node.props[propKey] ?? 0 }
                    ];
                }

                return { ...node, keyframes: nextKeyframes };
            });

            syncCodeAndAutoSave(updatedNodes);
            return updatedNodes;
        });
    };

    const handleUpdateEasing = (nodeId: string, propKey: string, easing: EasingType) => {
        pushHistory(nodes);
        setNodes((prev) => {
            const updatedNodes = prev.map((node) => {
                if (node.id !== nodeId) return node;
                const points = node.keyframes[propKey] || [];
                const updatedPoints = points.map((pt) => ({ ...pt, easing }));
                return {
                    ...node,
                    keyframes: { ...node.keyframes, [propKey]: updatedPoints }
                };
            });

            syncCodeAndAutoSave(updatedNodes);
            return updatedNodes;
        });
    };




    return (
        <div className='flex flex-col h-screen bg-gray-950 text-white select-none overflow-hidden'>
            <header className='h-12 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between px-4'>
                <div className='flex items-center gap-3'>
                    <button
                        onClick={onBack}
                        className='p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition'>
                        <ArrowLeft size={18} />
                    </button>
                    <span className='font-bold text-sm text-purple-300'>{project.title}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowVoiceoverModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-medium text-xs transition cursor-pointer"
                    >
                        <Microphone size={15} className="text-purple-400" />
                        <span>Voiceover AI</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowExportModal(true);
                            setExportResult(null);
                            setExportProgress(null);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-[0_0_12px_rgba(168,85,247,0.4)] active:scale-95 cursor-pointer"
                    >
                        <DownloadSimple size={15} weight="bold" />
                        <span>Export Video</span>
                    </button>
                </div>
            </header>

            <div className='flex-1 flex overflow-hidden'>
                <SceneHierarchyPanel
                    nodes={nodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                />

                <main data-tour="result-preview" className='flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-gray-950'>
                    <div className="w-full max-w-[1150px] aspect-video relative rounded-xl overflow-hidden shadow-2xl border border-gray-800/80">
                        <Player
                            key={`${project?.savePath || 'proj'}_${compKey}_${durationInFrames}_${JSON.stringify(bgSelection || {})}`}
                            ref={playerRef}
                            component={VideoComposition}
                            inputProps={{ bgSelection }}

                            durationInFrames={durationInFrames}
                            compositionWidth={1920}
                            compositionHeight={1080}
                            fps={30}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                </main>


                <InspectorPanel
                    selectedNode={selectedNode}
                    currentFrame={frame}
                    onUpdateProp={handleUpdateProp}
                    onToggleKeyframe={handleToggleKeyframe}
                    onUpdateEasing={handleUpdateEasing}
                    availableTargetIds={availableTargetIds}
                    bgSelection={bgSelection}
                    onSelectBackground={(newBg) => {
                        setBgSelection(newBg);
                        setCompKey((k) => k + 1);
                        onUpdateProject({ ...project, bgSelection: newBg });
                    }}
                />


            </div>

            <TimelineCommentPins
                pins={commentPins}
                maxFrames={durationInFrames}
                currentFrame={frame}
                onAddPin={handleAddCommentPin}
                onResolvePin={handleResolveCommentPin}
                onFixWithAI={handleFixWithAI}
            />


            <MultiTrackTimeline
                nodes={nodes}
                frame={frame}
                maxFrames={durationInFrames}
                playing={playing}
                onTogglePlay={() => setPlaying((p) => !p)}
                onSeek={(f) => {
                    playerRef.current?.seekTo(f);
                    setFrame(f);
                }}
                onSelectNode={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
                onMoveKeyframe={handleMoveKeyframe}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted((m) => !m)}
            />

            {/* Export Video Modal & Progress Overlay */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <div className="flex items-center gap-2">
                                <Video size={20} className="text-purple-400" />
                                <h3 className="font-bold text-base text-white">Export Video Composition</h3>
                            </div>
                            {!exporting && (
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="p-1 text-gray-400 hover:text-white rounded"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Rendering Progress View */}
                        {exporting ? (
                            <div className="space-y-6 py-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-purple-300 font-medium">
                                        <CircleNotch size={18} className="animate-spin text-purple-400" />
                                        <span>{exportProgress?.status || 'Rendering Video...'}</span>
                                    </div>
                                    <span className="font-mono text-purple-400 font-bold">
                                        {Math.round(((exportProgress?.frame || 0) / (exportProgress?.total || durationInFrames)) * 100)}%
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-950 h-3 rounded-full overflow-hidden p-0.5 border border-gray-800">
                                    <div
                                        style={{ width: `${Math.min(100, Math.round(((exportProgress?.frame || 0) / (exportProgress?.total || durationInFrames)) * 100))}%` }}
                                        className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                    <span>Frame: {exportProgress?.frame || 0} / {exportProgress?.total || durationInFrames}</span>
                                    <span>FPS: {exportFps}</span>
                                </div>
                            </div>
                        ) : exportResult ? (
                            /* Result View */
                            <div className="space-y-6 py-4 text-center">
                                {exportResult.success ? (
                                    <div className="space-y-3">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                            <CheckCircle size={28} />
                                        </div>
                                        <h4 className="text-lg font-bold text-white">Render Completed Successfully!</h4>
                                        <p className="text-xs text-gray-400 font-mono break-all bg-gray-950 p-2.5 rounded border border-gray-800">
                                            {exportResult.outputPath}
                                        </p>
                                        <div className="pt-3 flex justify-center gap-3">
                                            <button
                                                onClick={() => {
                                                    const api = (window as any).electronAPI;
                                                    if (api?.showItemInFolder && exportResult.outputPath) {
                                                        api.showItemInFolder(exportResult.outputPath);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                                            >
                                                <FolderOpen size={16} />
                                                <span>Open Output Folder</span>
                                            </button>
                                            <button
                                                onClick={() => setShowExportModal(false)}
                                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                            <XCircle size={28} />
                                        </div>
                                        <h4 className="text-lg font-bold text-white">Render Failed</h4>
                                        <p className="text-xs text-red-300 font-mono bg-red-950/40 p-2.5 rounded border border-red-800/40 text-left">
                                            {exportResult.error}
                                        </p>
                                        <div className="pt-3 flex justify-center gap-3">
                                            <button
                                                onClick={handleStartExport}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                                            >
                                                Retry Render
                                            </button>
                                            <button
                                                onClick={() => setShowExportModal(false)}
                                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Export Form Settings View */
                            <div className="space-y-4 text-xs">
                                <div className="space-y-1">
                                    <label className="text-gray-300 font-semibold">Export Format</label>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as 'mp4' | 'fcpxml')}
                                        className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                                    >
                                        <option value="mp4">MP4 Video Render (H.264)</option>
                                        <option value="fcpxml">DaVinci Resolve / Premiere Pro (.xml Package)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-gray-300 font-semibold">Output Filename</label>
                                    <input
                                        type="text"
                                        value={exportFilename}
                                        onChange={(e) => setExportFilename(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white font-mono outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-gray-300 font-semibold">Resolution</label>
                                        <select
                                            value={`${exportWidth}x${exportHeight}`}
                                            onChange={(e) => {
                                                const [w, h] = e.target.value.split('x').map(Number);
                                                setExportWidth(w);
                                                setExportHeight(h);
                                            }}
                                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                                        >
                                            <option value="3840x2160">4K Ultra HD (3840x2160)</option>
                                            <option value="1920x1080">1080p Full HD (1920x1080)</option>
                                            <option value="1280x720">720p HD (1280x720)</option>

                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-gray-300 font-semibold">Frame Rate</label>
                                        <select
                                            value={exportFps}
                                            onChange={(e) => setExportFps(Number(e.target.value))}
                                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                                        >
                                            <option value="30">30 FPS (Standard)</option>
                                            <option value="60">60 FPS (Smooth)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStartExport}
                                        className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition shadow-[0_0_12px_rgba(168,85,247,0.4)] active:scale-95 cursor-pointer"

                                    >
                                        <DownloadSimple size={16} weight="bold" />
                                        <span>Start Render</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <VoiceoverModal
                isOpen={showVoiceoverModal}
                onClose={() => setShowVoiceoverModal(false)}
                onTranscribeComplete={(subs, text) => {
                    customAlert('Voiceover Transcribed', `Parsed ${subs.length} spoken phrases/words. Ready for scene synchronization!`);
                }}
            />
        </div>
    );
};

export default Studio;