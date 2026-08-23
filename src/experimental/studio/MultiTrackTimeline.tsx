import React, { useState, useRef } from "react";
import type { ComponentNode } from "./semanticParser";
import type { BeatNetPrediction } from "../../renderer/utils/beatDetector";
import { Play, Pause, Diamond, CaretRight, CaretDown, SkipBack, SkipForward, Rewind, FastForward, MusicNotes } from '@phosphor-icons/react';

interface MultiTrackTimelineProps {
    nodes: ComponentNode[];
    frame: number;
    maxFrames: number;
    playing: boolean;
    onTogglePlay: () => void;
    onSeek: (frame: number) => void;
    onSelectNode: (id: string) => void;
    selectedNodeId: string | null;
    onMoveKeyframe?: (nodeId: string, propKey: string, pointIdx: number, newFrame: number) => number | void;
    beatPredictions?: BeatNetPrediction[];
    hasAudioTrack?: boolean;
    isMuted?: boolean;
    onToggleMute?: () => void;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
    nodes,
    frame,
    maxFrames,
    playing,
    onTogglePlay,
    onSeek,
    onSelectNode,
    selectedNodeId,
    onMoveKeyframe,
    beatPredictions = [],
    hasAudioTrack = false,
    isMuted = false,
    onToggleMute,
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [draggedKeyframe, setDraggedKeyframe] = useState<{ nodeId: string; propKey: string; idx: number } | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    const shouldShowAudioTrack = hasAudioTrack || (beatPredictions && beatPredictions.length > 0);

    const toggleNodeExpanded = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const formatPropName = (key: string): string => {
        const labels: Record<string, string> = {
            rotateX: 'Rotate X',
            rotateY: 'Rotate Y',
            rotateZ: 'Rotate Z',
            translateX: 'Push X',
            translateY: 'Push Y',
            translateZ: 'Push Z',
            perspective: 'Perspective',
            width: 'Width',
            height: 'Height',
            scale: 'Scale',
            opacity: 'Opacity',
        };
        return labels[key] || key;
    };

    const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (draggedKeyframe) return;
        setIsScrubbing(true);
        updateFrameFromMouse(e.clientX);
    };

    const updateFrameFromMouse = (clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const targetFrame = Math.round((offsetX / rect.width) * maxFrames);
        onSeek(Math.max(0, Math.min(maxFrames, targetFrame)));
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isScrubbing) {
            updateFrameFromMouse(e.clientX);
        } else if (draggedKeyframe && onMoveKeyframe && trackRef.current) {
            const rect = trackRef.current.getBoundingClientRect();
            const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const targetFrame = Math.round((offsetX / rect.width) * maxFrames);
            const newIdx = onMoveKeyframe(draggedKeyframe.nodeId, draggedKeyframe.propKey, draggedKeyframe.idx, targetFrame);
            if (typeof newIdx === 'number' && newIdx >= 0 && newIdx !== draggedKeyframe.idx) {
                setDraggedKeyframe({ ...draggedKeyframe, idx: newIdx });
            }
        }
    };

    const handleMouseUp = () => {
        setIsScrubbing(false);
        setDraggedKeyframe(null);
    };

    return (
        <div 
            className="h-64 border-t border-gray-800 bg-gray-900 flex flex-col select-none text-xs"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="h-9 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950 relative">
                <div className="flex items-center gap-2.5 w-56">
                    <span className="font-mono text-[11px] text-purple-400 font-semibold tracking-wide">
                        Time: {(frame / 30).toFixed(1)}s / {(maxFrames / 30).toFixed(1)}s
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">
                        ({frame} / {maxFrames}f)
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onSeek(0)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Skip to Start"
                    >
                        <SkipBack size={14} weight="fill" />
                    </button>
                    <button
                        onClick={() => onSeek(Math.max(0, frame - 10))}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Step Backward 10 Frames"
                    >
                        <Rewind size={14} weight="fill" />
                    </button>

                    <button
                        onClick={onTogglePlay}
                        className="flex h-6 w-6 items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-500 transition mx-1 cursor-pointer"
                        title={playing ? "Pause" : "Play"}
                    >
                        {playing ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" className="ml-0.5" />}
                    </button>

                    <button
                        onClick={() => onSeek(Math.min(maxFrames, frame + 10))}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Step Forward 10 Frames"
                    >
                        <FastForward size={14} weight="fill" />
                    </button>
                    <button
                        onClick={() => onSeek(maxFrames)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Skip to End"
                    >
                        <SkipForward size={14} weight="fill" />
                    </button>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                    <span>30 FPS</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-56 border-r border-gray-800 bg-gray-950 overflow-y-auto">
                    {nodes.map((node) => {
                        const isExpanded = Boolean(expandedNodes[node.id]);
                        const activePropEntries = Object.entries(node.keyframes).filter(([_, points]) => points && points.length > 0);

                        return (
                            <React.Fragment key={node.id}>
                                <div
                                    onClick={() => onSelectNode(node.id)}
                                    className={`h-8 px-2 flex items-center justify-between border-b border-gray-800 cursor-pointer transition ${selectedNodeId === node.id ? 'bg-gray-900 border-l-2 border-l-purple-500 text-purple-300 font-semibold' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
                                >
                                    <div className="flex items-center gap-1.5 truncate">
                                        {activePropEntries.length > 0 ? (
                                            <button
                                                onClick={(e) => toggleNodeExpanded(node.id, e)}
                                                className="p-0.5 text-gray-400 hover:text-white rounded"
                                            >
                                                {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
                                            </button>
                                        ) : (
                                            <span className="w-3" />
                                        )}
                                        <span className="truncate">{node.label}</span>
                                    </div>
                                    {activePropEntries.length > 0 && (
                                        <span className="text-[9px] font-mono text-purple-400 bg-gray-900 border border-purple-500/50 px-1 rounded">
                                            {activePropEntries.length} kf
                                        </span>
                                    )}
                                </div>

                                {isExpanded && activePropEntries.map(([propKey]) => (
                                    <div
                                        key={propKey}
                                        className="h-6 pl-7 pr-2 flex items-center border-b border-gray-900 bg-gray-950 text-[10px] text-purple-300 font-mono"
                                    >
                                        <span>└ {formatPropName(propKey)}</span>
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {shouldShowAudioTrack && (
                        <div className="h-10 px-2.5 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                                <MusicNotes size={14} />
                                <span>A1 Audio</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={onToggleMute}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                                        isMuted ? 'bg-red-600 text-white' : 'bg-gray-800 text-emerald-400 hover:bg-gray-700'
                                    }`}
                                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                                >
                                    M
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    ref={trackRef}
                    className="flex-1 relative overflow-x-auto overflow-y-auto bg-gray-950 cursor-col-resize"
                    onMouseDown={handleTrackMouseDown}
                >
                    <div
                        style={{ left: `${(frame / maxFrames) * 100}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-20 pointer-events-none"
                    />

                    {nodes.map((node) => {
                        const isExpanded = Boolean(expandedNodes[node.id]);
                        const activePropEntries = Object.entries(node.keyframes).filter(([_, points]) => points && points.length > 0);

                        return (
                            <React.Fragment key={node.id}>
                                <div className="h-8 border-b border-gray-800 relative flex items-center">
                                    {Object.entries(node.keyframes).map(([propKey, points]) => points.map((pt, idx) => (
                                        <div
                                            key={`${propKey}-${idx}`}
                                            style={{ left: `${(pt.frame / maxFrames) * 100}%` }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setDraggedKeyframe({ nodeId: node.id, propKey, idx });
                                            }}
                                            className="absolute z-30 -translate-x-1/2 cursor-grab active:cursor-grabbing text-purple-400 hover:scale-125 transition-transform"
                                        >
                                            <Diamond size={13} weight="fill" />
                                        </div>
                                    )))}
                                </div>

                                {isExpanded && activePropEntries.map(([propKey, points]) => (
                                    <div key={propKey} className="h-6 border-b border-gray-900 relative flex items-center bg-gray-950">
                                        {points.map((pt, idx) => (
                                            <div
                                                key={`${propKey}-sub-${idx}`}
                                                style={{ left: `${(pt.frame / maxFrames) * 100}%` }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setDraggedKeyframe({ nodeId: node.id, propKey, idx });
                                                }}
                                                className="absolute z-30 -translate-x-1/2 cursor-grab active:cursor-grabbing text-purple-300 hover:scale-125 transition-transform"
                                            >
                                                <Diamond size={11} weight="fill" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {shouldShowAudioTrack && (
                        <div className="h-10 border-b border-gray-800 relative flex items-center bg-gray-900 overflow-hidden px-2">
                            {/* Vertical Peak Spectrum Bar Lines */}
                            <div className="w-full h-full flex items-center justify-between opacity-85">
                                {Array.from({ length: 90 }).map((_, i) => {
                                    const h = Math.max(12, Math.round(Math.abs(Math.sin(i * 0.35) * 32 + Math.cos(i * 0.8) * 18)));
                                    return (
                                        <div
                                            key={`bar-${i}`}
                                            style={{ height: `${h}px` }}
                                            className="w-[2px] bg-emerald-500 rounded-sm"
                                        />
                                    );
                                })}
                            </div>

                            {/* Beat Markers Overlay */}
                            {beatPredictions.map((b, idx) => {
                                const leftPercent = (b.frame / maxFrames) * 100;
                                return (
                                    <div
                                        key={`audio-beat-${idx}`}
                                        style={{ left: `${leftPercent}%` }}
                                        className="absolute z-10 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                                        title={`Frame ${b.frame}: ${b.intensity}% Ooomph`}
                                    >
                                        <div
                                            className={`w-0.5 ${
                                                b.isDownbeat ? 'h-10 bg-emerald-400' : 'h-6 bg-purple-400'
                                            }`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};