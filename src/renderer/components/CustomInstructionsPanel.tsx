import React from 'react';
import { Sparkle } from '@phosphor-icons/react';

interface InstructionProps {
    instructions: string;
    setInstructions: (val: string) => void;
    isRefining?: boolean;
    handleRefinePrompt?: () => void;
    placeholder?: string;
}

export const CustomInstructionsPanel: React.FC<InstructionProps> = ({
    instructions,
    setInstructions,
    isRefining = false,
    handleRefinePrompt,
    placeholder = "Describe custom layout or animation instructions..."
}) => {
    return (
        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <h4 className="text-xs font-bold text-gray-400">Custom Instructions</h4>
            </div>
            <div className="relative">
                <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-24 resize-none premium-input pl-3 pr-10 py-2.5 text-xs rounded-lg bg-gray-950/60 font-sans"
                />
                {handleRefinePrompt && (
                    <button
                        onClick={handleRefinePrompt}
                        disabled={isRefining || !instructions.trim()}
                        className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refine prompt instructions with AI"
                    >
                        {isRefining ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <Sparkle size={14} weight="fill" className="text-purple-300" />
                        )}
                    </button>
                )}
            </div>
        </section>
    );
};
