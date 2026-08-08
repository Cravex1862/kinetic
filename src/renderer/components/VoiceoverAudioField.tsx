import React from "react";
import { TextT, MusicNotes, UploadSimple, Trash, Spinner, MusicNoteIcon } from '@phosphor-icons/react';

export interface VoiceoverAudioFieldProps {
    mode: 'text' | 'audio';
    onModeChange: (mode: 'text' | 'audio') => void;
    scriptText: string;
    onScriptTextChange: (text: string) => void;
    audioFile: File | null;
    onAudioFileChange: (file: File | null) => void;
    isTranscribing?: boolean;
}

export const VoiceoverAudioField: React.FC<VoiceoverAudioFieldProps> = ({
    mode,
    onModeChange,
    scriptText,
    onScriptTextChange,
    audioFile,
    onAudioFileChange,
    isTranscribing = false,
}) => {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAudioFileChange(file);
        }
    };

    return (
        <div className="space-y-3 bg-gray-900/60 border border-gray-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">
                    Voiceover & Animation Timing
                </label>
                <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800">
                    <button
                        type="button"
                        onClick={() => onModeChange('text')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition ${mode === 'text'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <TextT size={14} />
                        Timestamp Script
                    </button>
                    <button
                        type="button"
                        onClick={() => onModeChange('audio')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition ${mode === 'audio'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <MusicNotes size={14} />
                        Audio File
                    </button>
                </div>
            </div>

            {mode === 'text' && (
                <div className="space-y-1.5">
                    <textarea
                        value={scriptText}
                        onChange={(e) => onScriptTextChange(e.target.value)}
                        rows={4}
                        placeholder="Enter timestamped script... e.g.&#10;
                                    [00:02] Welcome to Kinetic. &#10;
                                    [00:05.5] Build Motion graphics in seconds."
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5
                                   text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono
                                    transition resize-none placeholder:text-gray-600"
                    />
                    <p className="text-[10px] text-gray-500">
                        Use <code className="text-purple-400 font-mono">[mm:ss]</code> or
                        <code className="text-purple-400 font-mono">[mm:ss.ms]</code> timestamps before
                        each line to set animation keyframes.
                    </p>
                </div>
            )}

            {mode === 'audio' && (
                <div>
                    {!audioFile ? (
                        <label className="flex flex-col items-center justify-center p-4 bg-gray-950 border border-dashed border-gray-800 hover:border-purple-500/60 rounded-lg cursor-pointer transition select-none group">
                            <UploadSimple size={24} className="text-purple-400 mb-1.5 group-hover:scale110 transition-transform" />
                            <span className="text-xs text-gray-300 font-medium">Upload Voiceover track</span>
                            <span className="text-[10px] text-gray-500 mt-0.5">Supports .mp3, .wav, .m4a, .ogg</span>
                            <input
                                type="file"
                                accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.flac"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-950 border border-purple-500/40 rounded-lg text-xs">
                            <div className="flex items-center gap-2.5">
                                <MusicNotes size={18} className="text-purple-400 shrink-0" />
                                <div className="truncate max-w-[220px]">
                                    <p className="text-gray-200 font-medium truncate">{audioFile.name}</p>
                                    <p className="text-[10px] text-gray-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>

                            {isTranscribing ? (
                                <div className="flex items-center gap-1.5 text-purple-400 text-[11px]">
                                    <Spinner size={14} className="animate-spin" />
                                    <span>Transcribing...</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onAudioFileChange(null)}
                                    className="p-1 hover:bg-gray-900 rounded text-gray-400 hover:text-red-400 transition"
                                    title="Remove audio file"
                                >
                                    <Trash size={15} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}