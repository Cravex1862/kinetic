import React, { useState } from "react";
import type { ComponentNode, EasingType } from "./semanticParser";
import { Sliders, TextAa, Palette, Crosshair, Diamond, FrameCorners, Eye } from '@phosphor-icons/react';
import { BackgroundSelectorPanel, BackgroundSelection } from '../../components/BackgroundSelectorPanel';

interface InspectorPanelProps {
    selectedNode: ComponentNode | null;
    currentFrame: number;
    onUpdateProp: (nodeId: string, propKey: string, value: any) => void;
    onToggleKeyframe: (nodeId: string, propKey: string) => void;
    onUpdateEasing?: (nodeId: string, propKey: string, easing: EasingType) => void;
    availableTargetIds: string[];
    bgSelection?: BackgroundSelection;
    onSelectBackground?: (bg: BackgroundSelection) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    selectedNode,
    currentFrame,
    onUpdateProp,
    onToggleKeyframe,
    onUpdateEasing,
    availableTargetIds,
    bgSelection,
    onSelectBackground,
}) => {
    const [activeTab, setActiveTab] = useState<'element' | 'background'>('element');

    const renderKeyframeDiamond = (propKey: string) => {
        if (!selectedNode) return null;
        const kfPoints = selectedNode.keyframes[propKey] || [];
        const isKeyframed = kfPoints.length > 0;
        const currentEasing = kfPoints[0]?.easing || 'easeOut';

        return (
            <div className="flex items-center gap-1">
                {isKeyframed && onUpdateEasing && (
                    <select
                        value={currentEasing}
                        onChange={(e) => onUpdateEasing(selectedNode.id, propKey, e.target.value as EasingType)}
                        className="bg-gray-950 text-[9px] text-purple-300 border border-purple-500/40 rounded px-1 py-0.5 outline-none cursor-pointer hover:border-purple-400"
                        title="Keyframe Easing Curve"
                    >
                        <option value="easeOut">Ease Out</option>
                        <option value="easeInOut">Ease In-Out</option>
                        <option value="easeIn">Ease In</option>
                        <option value="linear">Linear</option>
                        <option value="spring">Spring</option>
                    </select>
                )}
                <button
                    onClick={() => onToggleKeyframe(selectedNode.id, propKey)}
                    className="p-1 hover:bg-gray-800 rounded transition"
                    title={isKeyframed ? 'Remove Keyframe Track' : 'Enable Keyframing (Purple = Animated)'}
                >
                    <Diamond
                        size={14}
                        weight={isKeyframed ? 'fill' : 'regular'}
                        className={isKeyframed ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'text-gray-500 hover:text-gray-300'}
                    />
                </button>
            </div>
        );
    };

    return (
        <aside className="w-80 flex flex-col border-l border-gray-800 bg-gray-900/90 overflow-hidden select-none text-xs">
            {/* Top Tab Switcher */}
            <div className="flex border-b border-gray-800 bg-gray-950/60 p-1">
                <button
                    onClick={() => setActiveTab('element')}
                    className={`flex-1 py-1.5 text-center font-medium rounded transition ${
                        activeTab === 'element' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Element Props
                </button>
                <button
                    onClick={() => setActiveTab('background')}
                    className={`flex-1 py-1.5 text-center font-medium rounded transition ${
                        activeTab === 'background' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Video Background
                </button>
            </div>


            {activeTab === 'background' ? (
                <div className="p-4 overflow-y-auto flex-1">
                    <BackgroundSelectorPanel
                        currentSelection={bgSelection}
                        onSelectBackground={(bg) => onSelectBackground && onSelectBackground(bg)}
                    />
                </div>
            ) : !selectedNode ? (
                <div className="p-4 text-xs text-gray-500 flex items-center justify-center italic flex-1">
                    Select an element in the hierarchy or canvas to inspect properties.
                </div>
            ) : (
                <div className="p-4 overflow-y-auto space-y-6 flex-1">
                    {/* Header */}
                    <div className="border-b border-gray-800 pb-3">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Inspector</span>
                        <h3 className="text-sm font-bold text-white tracking-wide truncate">
                            {selectedNode.label}
                        </h3>
                        <span className="text-[10px] text-gray-500 font-mono">ID: {selectedNode.id}</span>
                    </div>

                    {/* Text & Content */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-gray-400 font-semibold uppercase text-[10px]">
                            <TextAa size={14} />
                            <span>Text & Content</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-gray-300">
                                <span>Text Value</span>
                                {renderKeyframeDiamond('textValue')}
                            </div>
                            <input
                                type="text"
                                value={selectedNode.props.textValue || ''}
                                onChange={(e) => onUpdateProp(selectedNode.id, 'textValue', e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* 3D Rotation Transforms */}
                    <div className="space-y-4 border-t border-gray-800/80 pt-4">
                        <div className="flex items-center gap-1.5 text-purple-300 font-semibold uppercase text-[10px]">
                            <Sliders size={14} />
                            <span>3D Rotation Transforms</span>
                        </div>

                        {[
                            { label: 'Rotate X', propKey: 'rotateX', min: -180, max: 180 },
                            { label: 'Rotate Y', propKey: 'rotateY', min: -180, max: 180 },
                            { label: 'Rotate Z', propKey: 'rotateZ', min: -180, max: 180 },
                        ].map(({ label, propKey, min, max }) => (
                            <div key={propKey} className="space-y-1">
                                <div className="flex items-center justify-between text-gray-300">
                                    <span>{label}</span>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            value={selectedNode.props[propKey] ?? 0}
                                            onChange={(e) => onUpdateProp(selectedNode.id, propKey, Number(e.target.value))}
                                            className="w-14 bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-right text-purple-400 font-mono text-xs outline-none focus:border-purple-500"
                                        />
                                        <span className="text-gray-500 text-[10px] font-mono">deg</span>
                                        {renderKeyframeDiamond(propKey)}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={min}
                                    max={max}
                                    value={selectedNode.props[propKey] ?? 0}
                                    onChange={(e) => onUpdateProp(selectedNode.id, propKey, Number(e.target.value))}
                                    className="w-full accent-purple-500 bg-gray-800 h-1 rounded cursor-pointer"
                                />
                            </div>
                        ))}

                        {/* 3D Position Offsets */}
                        <div className="pt-2 space-y-3">
                            <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1.5">3D Position Offsets</span>
                            {[
                                { label: 'Push X', propKey: 'translateX', min: -1000, max: 1000 },
                                { label: 'Push Y', propKey: 'translateY', min: -1000, max: 1000 },
                                { label: 'Push Z', propKey: 'translateZ', min: -1000, max: 1000 },
                            ].map(({ label, propKey, min, max }) => (
                                <div key={propKey} className="space-y-1">
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span>{label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                value={selectedNode.props[propKey] ?? 0}
                                                onChange={(e) => onUpdateProp(selectedNode.id, propKey, Number(e.target.value))}
                                                className="w-14 bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-right text-purple-400 font-mono text-xs outline-none focus:border-purple-500"
                                            />
                                            <span className="text-gray-500 text-[10px] font-mono">px</span>
                                            {renderKeyframeDiamond(propKey)}
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={min}
                                        max={max}
                                        value={selectedNode.props[propKey] ?? 0}
                                        onChange={(e) => onUpdateProp(selectedNode.id, propKey, Number(e.target.value))}
                                        className="w-full accent-purple-500 bg-gray-800 h-1 rounded cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Sizing & Layout */}
                    <div className="space-y-3 border-t border-gray-800/80 pt-4">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold uppercase text-[10px]">
                            <FrameCorners size={14} />
                            <span>Sizing & Layout</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-gray-300">
                                    <span>Width</span>
                                    {renderKeyframeDiamond('width')}
                                </div>
                                <input
                                    type="number"
                                    value={selectedNode.props.width ?? 1150}
                                    onChange={(e) => onUpdateProp(selectedNode.id, 'width', Number(e.target.value))}
                                    className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-white font-mono outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-gray-300">
                                    <span>Height</span>
                                    {renderKeyframeDiamond('height')}
                                </div>
                                <input
                                    type="number"
                                    value={selectedNode.props.height ?? 650}
                                    onChange={(e) => onUpdateProp(selectedNode.id, 'height', Number(e.target.value))}
                                    className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-white font-mono outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        {/* Scale */}
                        <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-gray-300">
                                <span>Scale</span>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        step="0.05"
                                        value={selectedNode.props.scale ?? 1.0}
                                        onChange={(e) => onUpdateProp(selectedNode.id, 'scale', Number(e.target.value))}
                                        className="w-14 bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-right text-cyan-400 font-mono text-xs outline-none focus:border-purple-500"
                                    />
                                    <span className="text-gray-500 text-[10px] font-mono">x</span>
                                    {renderKeyframeDiamond('scale')}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="3.0"
                                step="0.05"
                                value={selectedNode.props.scale ?? 1.0}
                                onChange={(e) => onUpdateProp(selectedNode.id, 'scale', Number(e.target.value))}
                                className="w-full accent-cyan-500 bg-gray-800 h-1 rounded cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Opacity & Appearance */}
                    <div className="space-y-3 border-t border-gray-800/80 pt-4">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-semibold uppercase text-[10px]">
                            <Eye size={14} />
                            <span>Opacity & Appearance</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-gray-300">
                                <span>Opacity</span>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={selectedNode.props.opacity ?? 1.0}
                                        onChange={(e) => onUpdateProp(selectedNode.id, 'opacity', Number(e.target.value))}
                                        className="w-14 bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-right text-emerald-400 font-mono text-xs outline-none focus:border-purple-500"
                                    />
                                    {renderKeyframeDiamond('opacity')}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={selectedNode.props.opacity ?? 1.0}
                                onChange={(e) => onUpdateProp(selectedNode.id, 'opacity', Number(e.target.value))}
                                className="w-full accent-emerald-500 bg-gray-800 h-1 rounded cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Motion Tracking Target */}
                    <div className="space-y-3 border-t border-gray-800/80 pt-4">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold uppercase text-[10px]">
                            <Crosshair size={14} />
                            <span>Motion Tracking Target</span>
                        </div>
                        <select
                            value={selectedNode.props.targetId || selectedNode.id}
                            onChange={(e) => onUpdateProp(selectedNode.id, 'targetId', e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1.5 text-white outline-none focus:border-purple-500"
                        >
                            {availableTargetIds.map((tId) => (
                                <option key={tId} value={tId}>
                                    {tId}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </aside>
    );
};