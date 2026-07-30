import React, { useState, useRef } from "react";
import type { ComponentNode } from "./semanticParser";
import { Play, Pause, Diamond, CaretRight, CaretDown, SkipBack, SkipForward, Rewind, FastForward } from '@phosphor-icons/react';

interface MultiTrackTimelineProps {
    nodes: ComponentNode[];
    frame: number;
    maxFrames: number;
    playing: boolean;
    onTogglePlay: () => void;
    onSeek: (frame: number) => void;
    onSelectNode: (id: string) => void;
    selectedNodeId: string | null;
    onMoveKeyframe?: (nodeId: string, propKey: string, pointIdx: number, newFrame: number) => void;
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
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [draggedKeyframe, setDraggedKeyframe] = useState<{ nodeId: string; propKey: string; idx: number } | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

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
            onMoveKeyframe(draggedKeyframe.nodeId, draggedKeyframe.propKey, draggedKeyframe.idx, targetFrame);
        }
    };

    const handleMouseUp = () => {
        setIsScrubbing(false);
        setDraggedKeyframe(null);
    };

    return (
        <div 
            className="h-56 border-t border-gray-800 bg-gray-900/90 flex flex-col select-none text-xs"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="h-9 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950/60 relative">
                {/* Left: Time & Frame counter */}
                <div className="flex items-center gap-2.5 w-56">
                    <span className="font-mono text-[11px] text-purple-400 font-semibold tracking-wide">
                        Time: {(frame / 30).toFixed(1)}s / {(maxFrames / 30).toFixed(1)}s
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">
                        ({frame} / {maxFrames}f)
                    </span>
                </div>

                {/* Center: DaVinci Resolve Transport Controls */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/90 border border-gray-800/80 px-2 py-0.5 rounded-lg shadow-inner">
                    {/* Jump First Frame */}
                    <button
                        onClick={() => onSeek(0)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Skip to Start (Frame 0)"
                    >
                        <SkipBack size={14} weight="fill" />
                    </button>

                    {/* Step Back 10 Frames */}
                    <button
                        onClick={() => onSeek(Math.max(0, frame - 10))}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Step Backward 10 Frames"
                    >
                        <Rewind size={14} weight="fill" />
                    </button>

                    {/* Play / Pause Toggle */}
                    <button
                        onClick={onTogglePlay}
                        className="flex h-6 w-6 items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-500 transition shadow-[0_0_8px_rgba(168,85,247,0.4)] active:scale-95 mx-1 cursor-pointer"
                        title={playing ? "Pause" : "Play"}
                    >
                        {playing ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" className="ml-0.5" />}
                    </button>

                    {/* Step Forward 10 Frames */}
                    <button
                        onClick={() => onSeek(Math.min(maxFrames, frame + 10))}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Step Forward 10 Frames"
                    >
                        <FastForward size={14} weight="fill" />
                    </button>

                    {/* Jump Last Frame */}
                    <button
                        onClick={() => onSeek(maxFrames)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition cursor-pointer"
                        title="Skip to End (Last Frame)"
                    >
                        <SkipForward size={14} weight="fill" />
                    </button>
                </div>

                {/* Right: Metadata */}
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
                    <span>30 FPS</span>
                </div>
            </div>


            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar Track Headers */}
                <div className="w-56 border-r border-gray-800 bg-gray-950/40 overflow-y-auto">
                    {nodes.map((node) => {
                        const isExpanded = Boolean(expandedNodes[node.id]);
                        const activePropEntries = Object.entries(node.keyframes).filter(([_, points]) => points && points.length > 0);

                        return (
                            <React.Fragment key={node.id}>
                                {/* Main Component Header Track */}
                                <div
                                    onClick={() => onSelectNode(node.id)}
                                    className={`h-8 px-2 flex items-center justify-between border-b border-gray-800/60 cursor-pointer transition ${selectedNodeId === node.id ? 'bg-purple-950/50 text-purple-300 font-semibold' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`}
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
                                        <span className="text-[9px] font-mono text-purple-400/80 bg-purple-950/60 px-1 rounded">
                                            {activePropEntries.length} kf
                                        </span>
                                    )}
                                </div>

                                {/* Expanded Sub-Track Headers (Only show keyframed properties) */}
                                {isExpanded && activePropEntries.map(([propKey]) => (
                                    <div
                                        key={propKey}
                                        className="h-6 pl-7 pr-2 flex items-center border-b border-gray-900/60 bg-gray-950/80 text-[10px] text-purple-300/80 font-mono"
                                    >
                                        <span>└ {formatPropName(propKey)}</span>
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Right Timeline Canvas Tracks */}
                <div
                    ref={trackRef}
                    className="flex-1 relative overflow-x-auto overflow-y-auto bg-gray-950/80 cursor-col-resize"
                    onMouseDown={handleTrackMouseDown}
                >
                    <div
                        style={{ left: `${(frame / maxFrames) * 100}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    />

                    {nodes.map((node) => {
                        const isExpanded = Boolean(expandedNodes[node.id]);
                        const activePropEntries = Object.entries(node.keyframes).filter(([_, points]) => points && points.length > 0);

                        return (
                            <React.Fragment key={node.id}>
                                {/* Main Component Keyframe Track */}
                                <div className="h-8 border-b border-gray-800/60 relative flex items-center">
                                    {Object.entries(node.keyframes).map(([propKey, points]) => points.map((pt, idx) => (
                                        <div
                                            key={`${propKey}-${idx}`}
                                            style={{ left: `${(pt.frame / maxFrames) * 100}%` }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setDraggedKeyframe({ nodeId: node.id, propKey, idx });
                                            }}
                                            className="absolute z-30 -translate-x-1/2 cursor-grab active:cursor-grabbing text-purple-400 hover:scale-125 transition-transform drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]"
                                        >
                                            <Diamond size={13} weight="fill" />
                                        </div>
                                    )))}
                                </div>

                                {/* Expanded Sub-Tracks */}
                                {isExpanded && activePropEntries.map(([propKey, points]) => (
                                    <div key={propKey} className="h-6 border-b border-gray-900/60 relative flex items-center bg-gray-950/40">
                                        {points.map((pt, idx) => (
                                            <div
                                                key={`${propKey}-sub-${idx}`}
                                                style={{ left: `${(pt.frame / maxFrames) * 100}%` }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setDraggedKeyframe({ nodeId: node.id, propKey, idx });
                                                }}
                                                className="absolute z-30 -translate-x-1/2 cursor-grab active:cursor-grabbing text-purple-300 hover:scale-125 transition-transform drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]"
                                            >
                                                <Diamond size={11} weight="fill" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};