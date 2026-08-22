import React, { useState, useEffect, useRef } from "react";
import { ChatCircleDots, CheckCircle, Sparkle } from '@phosphor-icons/react';
import type { TimelineCommentPin } from "./semanticParser";

interface TimelineCommentPinProps {
    pins: TimelineCommentPin[];
    maxFrames: number;
    currentFrame: number;
    onAddPin: (frame: number, text: string) => void;
    onResolvePin: (pinId: string) => void;
    onFixWithAI: (pin: TimelineCommentPin) => void;
}

export const TimelineCommentPins: React.FC<TimelineCommentPinProps> = ({
    pins,
    maxFrames,
    currentFrame,
    onAddPin,
    onResolvePin,
    onFixWithAI,
}) => {
    const [newCommentText, setNewCommentText] = useState('');
    const [showInputBox, setShowInputBox] = useState(false);
    const [activePinId, setActivePinId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowInputBox(false);
                setActivePinId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        onAddPin(currentFrame, newCommentText.trim());
        setNewCommentText('');
        setShowInputBox(false);
    };

    return (
        <div ref={containerRef} className="relative w-full h-7 bg-gray-950 border-b border-gray-800 flex items-center px-3 select-none z-40">
            {/* Button */}
            <div className="relative flex-shrink-0">
                <button
                    onClick={() => setShowInputBox(!showInputBox)}
                    className="px-2.5 py-1 rounded text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition flex items-center gap-1">
                    + Pin Comment at f{currentFrame}
                </button>

                {showInputBox && (
                    <form
                        onSubmit={handleAddSubmit}
                        className="absolute top-8 left-0 z-50 bg-gray-900 border border-purple-500 rounded-xl p-2.5 flex items-center gap-2 shadow-2xl">
                        <input
                            type="text"
                            placeholder={`Comment for frame ${currentFrame}...`}
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            className="bg-gray-950 border border-gray-800 text-xs px-2.5 py-1.5 rounded-lg text-white outline-none focus:border-purple-500 w-64"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition">
                            Add
                        </button>
                    </form>
                )}
            </div>

            {/* Pins Track Bar (Starts next to button) */}
            <div className="relative flex-1 h-full ml-3 flex items-center">
                {pins.map((pin) => {
                    const leftPercent = Math.max(0, Math.min(100, (pin.frame / maxFrames) * 100));
                    const isActive = activePinId === pin.id;

                    // Smart popover position clamping
                    let popoverAlignClass = 'left-1/2 -translate-x-1/2';
                    if (leftPercent < 25) {
                        popoverAlignClass = 'left-0 translate-x-0';
                    } else if (leftPercent > 75) {
                        popoverAlignClass = 'right-0 left-auto translate-x-0';
                    }

                    return (
                        <div
                            key={pin.id}
                            style={{ left: `${leftPercent}%` }}
                            className="absolute z-30 -translate-x-1/2 flex items-center justify-center"
                        >
                            <button
                                onClick={() => setActivePinId(isActive ? null : pin.id)}
                                className={`p-0.5 rounded-full transition ${pin.resolved
                                    ? 'text-emerald-400 hover:scale-125'
                                    : 'text-purple-400 hover:scale-125'
                                    }`}
                                title={`Frame ${pin.frame}: ${pin.text}`}
                            >
                                <ChatCircleDots size={16} weight="fill" />
                            </button>

                            {isActive && (
                                <div className={`absolute top-7 w-64 bg-gray-900 border border-gray-800 rounded-xl p-3.5 shadow-2xl z-50 space-y-2.5 text-xs ${popoverAlignClass}`}>
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                        <span className="font-mono text-purple-400 font-bold text-xs">
                                            Frame {pin.frame}
                                        </span>
                                        {pin.resolved && (
                                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                                <CheckCircle size={12} />
                                                Resolved
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-200 leading-relaxed font-sans">{pin.text}</p>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        {!pin.resolved && (
                                            <button
                                                onClick={() => onFixWithAI(pin)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition shadow-sm">
                                                <Sparkle size={13} />
                                                <span>Fix with AI</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onResolvePin(pin.id)}
                                            className="px-2.5 py-1.5 rounded-lg border border-gray-800 hover:border-gray-600 bg-gray-950 text-gray-400 hover:text-white text-[11px] font-medium transition"
                                        >
                                            {pin.resolved ? 'Reopen' : 'Mark Resolved'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};