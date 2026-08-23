import React, { useState } from 'react';
import { X, Microphone, CircleNotch, CheckCircle, UploadSimple, Subtitles } from '@phosphor-icons/react';
import { extractAudioFeatures } from '../../renderer/utils/audioUtils';

interface VoiceoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTranscribeComplete: (subtitles: Array<{ text: string; startFrame: number; endFrame: number }>, fullTranscript: string) => void;
}

export const VoiceoverModal: React.FC<VoiceoverModalProps> = ({ isOpen, onClose, onTranscribeComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleStartTranscribe = async () => {
        if (!file) return;
        setIsTranscribing(true);
        setError(null);
        setStatusMessage('Extracting 16kHz audio features...');

        try {
            const float32Array = await extractAudioFeatures(file);

            setStatusMessage('Initializing Whisper AI (WebWorker)...');
            const worker = new Worker(new URL('../../agents/whisperWorker.ts', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { status, data, result, error: workerError } = e.data;
                if (status === 'progress') {
                    if (data?.status === 'transcribing') {
                        setStatusMessage('Transcribing spoken voiceover...');
                    } else if (data?.status === 'init') {
                        setStatusMessage('Loading Whisper Tiny AI Model...');
                    }
                } else if (status === 'complete') {
                    setIsTranscribing(false);
                    worker.terminate();

                    const chunks = result?.chunks || [];
                    const fps = 30;
                    
                    const subtitles = chunks.map((chunk: any) => {
                        const startSec = Array.isArray(chunk.timestamp) ? chunk.timestamp[0] : 0;
                        const endSec = Array.isArray(chunk.timestamp) ? (chunk.timestamp[1] || startSec + 1.5) : startSec + 1.5;
                        return {
                            text: chunk.text.trim(),
                            startFrame: Math.floor(startSec * fps),
                            endFrame: Math.ceil(endSec * fps),
                        };
                    });

                    onTranscribeComplete(subtitles, result.text || '');
                    onClose();
                } else if (status === 'error') {
                    setIsTranscribing(false);
                    setError(workerError || 'Transcription failed');
                    worker.terminate();
                }
            };

            worker.postMessage({ action: 'transcribe', audioData: float32Array });
        } catch (err: any) {
            setIsTranscribing(false);
            setError(err.message || 'Audio extraction failed');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    disabled={isTranscribing}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                        <Microphone size={22} weight="bold" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-white">Voiceover AI Parser</h3>
                        <p className="text-xs text-gray-400">Transcribe voiceover with Whisper Tiny for sync</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-950/50 group">
                        <UploadSimple size={28} className="text-gray-500 group-hover:text-purple-400 transition mb-2" />
                        <span className="text-xs font-semibold text-gray-300">
                            {file ? file.name : 'Choose MP3 / WAV / AAC Audio File'}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">Runs 100% locally via WebAssembly</span>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isTranscribing}
                        />
                    </label>

                    {statusMessage && (
                        <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                            <CircleNotch size={16} className="animate-spin" />
                            <span>{statusMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isTranscribing}
                            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStartTranscribe}
                            disabled={!file || isTranscribing}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-lg shadow-purple-900/20"
                        >
                            {isTranscribing ? (
                                <>
                                    <CircleNotch size={14} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Subtitles size={16} />
                                    <span>Parse Voiceover</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
