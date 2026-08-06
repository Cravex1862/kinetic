import React from "react";
import type { ComponentNode } from "./semanticParser";
import { Stack, TreeStructure } from '@phosphor-icons/react';

interface SceneHierarchyPanelProps {
    nodes: ComponentNode[];
    selectedNodeId: string | null;
    onSelectNode: (id: string) => void;
}

export const SceneHierarchyPanel: React.FC<SceneHierarchyPanelProps> = ({
    nodes,
    selectedNodeId,
    onSelectNode,
}) => {
    return (
        <aside className="w-64 border-r border-gray-800 bg-gray-900/60 flex flex-col select-none text-xs overflow-hidden">
            <div className="p-3 border-b border-gray-800 flex items-center gap-2 font-bold text-gray-300 uppercase tracking-wider text-[10px]">
                <TreeStructure size={14} className="text-purple-400" />
                <span>Scene Hierarchy</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        onClick={() => onSelectNode(node.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${selectedNodeId === node.id
                                ? 'bg-transparent border border-purple-500 text-purple-300 font-bold'
                                : 'hover:bg-gray-800 text-gray-400 hover:text-white border border-transparent'
                            }`}
                    >
                        <Stack size={14} />
                        <span className="truncate">{node.label}</span>
                    </div>
                ))}
            </div>
        </aside>
    )
}
