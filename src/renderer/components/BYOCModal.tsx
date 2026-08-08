import React, { useState } from "react";
import { Copy, Check, ArrowRight, X, Sparkle, ArrowSquareOut, FastForward } from '@phosphor-icons/react';
export interface BYOCModalProps {
    promptText: string;
    stageName?: string;
    onSubmit: (response: string) => void;
    onCancel: () => void;
    onSkip?: () => void;
}

export const BYOCModal: React.FC<BYOCModalProps> = ({
    promptText,
    stageName = 'Pipeline Stage',
    onSubmit,
    onCancel,
    onSkip,
}) => {
    const [copied, setCopied] = useState(false);
    const [pastedResponse, setPastedResponse] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleIngest = () => {
        if (!pastedResponse.trim()) return;

        const cleaned = pastedResponse
            .replace(/```[a-z]*\n?/gi, '')
            .replace(/```/g, '')
            .trim();
        onSubmit(cleaned);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-900 bg-gray-900/40">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500 text-purple-300 bg-transparent">
                            <Sparkle size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Bring Your Own Chat (BYOC Mode)</h3>
                            <p className="text-[11px] text-purple-400 font-mono">{stageName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-900 rounded-lg transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto max-h-[75wh]">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">1</span>
                                Copy Prompt to Clipboard
                            </label>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                readOnly
                                value={promptText}
                                rows={5}
                                className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-[11px] font-mono text=gray=300 focus:outline-none resize-none select-all" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 pb-1">
                        <span className="text-[11px] text-gray-500">Open Free Chat:</span>
                        <a
                            href="https://chatgpt.com"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-purple-400 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg transition">
                            ChatGPT <ArrowSquareOut size={12} />
                        </a>
                        <a
                            href="https://claude.ai"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-purple-400 bg-gray-900 border border-gray px-2.5 py-1 rounded-lg transition"
                        >
                            Claude <ArrowSquareOut size={12} />
                        </a>
                        <a
                            href="https://gemini.google.com"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-purple-400 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg transition">
                            Gemini <ArrowSquareOut size={12} />
                        </a>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">2</span>
                        </label>
                        <textarea
                            value={pastedResponse}
                            onChange={(e) => setPastedResponse(e.target.value)}
                            rows={6}
                            placeholder="Paste response or code from ChatGPT / Claude / Gemini..."
                            className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-xl p-3 text-xs font-mono text-gray-200 focus:outline transition resize-none placeholder:text-gray-600"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-900 bg-gray-900/20">
                    <button
                        onClick={onSkip || (() => onSubmit('SKIP'))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-white bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 rounded-lg transition"
                        title="Skip this verification stage and proceed"
                    >
                        <FastForward size={14} />
                        <span>Skip Verification</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 transition">
                            Cancel
                        </button>
                        <button
                            onClick={handleIngest}
                            disabled={!pastedResponse.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-lg shadow-purple-900/30 transition"
                        >
                            <span>Ingest & Continue</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};