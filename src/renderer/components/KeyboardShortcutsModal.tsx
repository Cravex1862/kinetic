import React, { useEffect } from 'react';
import { X, Keyboard, ArrowLeft, Sparkle, Eye, Lightning } from '@phosphor-icons/react';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const shortcutCategories = [
        {
            title: 'Navigation & Routing',
            icon: <ArrowLeft size={16} className="text-purple-400" />,
            shortcuts: [
                { keys: ['Ctrl', ','], description: 'Open Settings Page from anywhere' },
                { keys: ['Esc'], description: 'Return to Template Selector / Close Settings & Modals' },
                { keys: ['Esc'], description: 'Exit Template Generator back to Template Selector' },
            ]
        },
        {
            title: 'Video Generation & Creation',
            icon: <Sparkle size={16} className="text-emerald-400" />,
            shortcuts: [
                { keys: ['Ctrl', 'Enter'], description: 'Trigger Video Generation inside any template' },
                { keys: ['Cmd', 'Enter'], description: 'Trigger Video Generation (macOS)' },
            ]
        },
        {
            title: 'Tools & Overlays',
            icon: <Eye size={16} className="text-cyan-400" />,
            shortcuts: [
                { keys: ['Ctrl', 'Shift', 'I'], description: 'Toggle Minecraft Primitives Global Demo Overlay' },
                { keys: ['?'], description: 'Toggle Keyboard Shortcuts Menu' },
                { keys: ['Ctrl', '/'], description: 'Toggle Keyboard Shortcuts Menu' },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
            <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl flex flex-col gap-6 relative">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Keyboard size={22} weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
                            <p className="text-xs text-gray-400">Essential shortcuts to boost your video creation workflow</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
                    {shortcutCategories.map((cat, catIdx) => (
                        <div key={catIdx} className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 tracking-wider">
                                {cat.icon}
                                <span>{cat.title}</span>
                            </div>
                            <div className="flex flex-col gap-2 bg-gray-900/40 border border-gray-900 rounded-xl p-3">
                                {cat.shortcuts.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-900/50 last:border-0">
                                        <span className="text-xs text-gray-400 font-medium">{item.description}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((k, kIdx) => (
                                                <kbd
                                                    key={kIdx}
                                                    className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-[11px] font-mono font-bold text-purple-300 shadow-sm"
                                                >
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-900 pt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Lightning size={14} className="text-amber-400" />
                        Press <kbd className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono text-[10px] text-gray-300">Esc</kbd> anytime to close this modal
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors text-xs"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};
