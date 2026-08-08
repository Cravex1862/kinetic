import React, { useState, useEffect } from 'react';
import { X, Microphone, CircleNotch, Play, Pause, CheckCircle, UploadSimple, Copy, FileText } from '@phosphor-icons/react';
import { extractAudioFeatures, groupWordChunksIntoPhrases } from '../utils/audioUtils';

export const AudioTesterModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
    
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [statusText, setStatusText] = useState<string>('');
    const [transcriptResult, setTranscriptResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'phrases' | 'corrected'>('phrases');

    // Global shortcut Ctrl+Shift+V listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setAudioUrl(URL.createObjectURL(selected));
            setTranscriptResult(null);
            setError(null);
        }
    };

    const handleRunTest = async () => {
        if (!file) return;
        setIsTranscribing(true);
        setError(null);
        setStatusText('Stage 1/2: Extracting 16kHz audio features...');

        try {
            const float32Array = await extractAudioFeatures(file);
            setStatusText(`Audio ready! (${float32Array.length.toLocaleString()} samples @ 16kHz). Initializing Whisper...`);

            const worker = new Worker(new URL('../agents/whisperWorker.ts', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { status, data, result, error: workerErr } = e.data;
                if (status === 'progress') {
                    if (data?.status === 'init') {
                        setStatusText('Stage 1/2: Loading Whisper Base ONNX model from Hugging Face...');
                    } else if (data?.status === 'transcribing') {
                        setStatusText('Stage 1/2: Transcribing audio & calculating word-level timestamps...');
                    } else if (data?.status === 'correcting' || data?.name?.includes('Stage 2')) {
                        setStatusText('Stage 2/2: Running Grammar & Typo Synthesis ONNX Model (~40MB)...');
                    } else if (data?.name) {
                        setStatusText(`Running: ${data.name}`);
                    }
                } else if (status === 'complete') {
                    setIsTranscribing(false);
                    setTranscriptResult(result);
                    setStatusText('Both stages complete! 100% finished.');
                    worker.terminate();
                } else if (status === 'error') {
                    setIsTranscribing(false);
                    setError(workerErr || 'Transcription failed');
                    worker.terminate();
                }
            };

            worker.postMessage({ action: 'transcribe', audioData: float32Array });
        } catch (err: any) {
            setIsTranscribing(false);
            setError(err.message || 'Failed to process audio file');
        }
    };

    const handleCopy = () => {
        if (!transcriptResult) return;
        const phrases = groupWordChunksIntoPhrases(transcriptResult.chunks || []);
        const formatted = phrases.map((p) => {
            return `[${p.startSec.toFixed(2)}s - ${p.endSec.toFixed(2)}s] ${p.text}`;
        }).join('\n');

        navigator.clipboard.writeText(formatted || transcriptResult.text || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-gray-950 border border-purple-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] relative flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                            <Microphone size={24} weight="bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-white">Temporary Audio Testing Lab</h3>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                                    Ctrl+Shift+V
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">Test Whisper Tiny audio parsing, timestamps & features</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Upload & Controls */}
                <div className="space-y-4 overflow-y-auto pr-1">
                    <label className="border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-900/40 group">
                        <UploadSimple size={32} className="text-gray-500 group-hover:text-purple-400 transition mb-2" />
                        <span className="text-sm font-semibold text-gray-200">
                            {file ? file.name : 'Click to select M4A, MP3, WAV, or AAC audio file'}
                        </span>
                        {file && (
                            <span className="text-xs text-gray-400 mt-1">
                                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        )}
                        <input type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.flac" onChange={handleFileSelect} className="hidden" />
                    </label>

                    {audioUrl && (
                        <div className="flex items-center justify-between bg-gray-900 p-3 rounded-xl border border-gray-800">
                            <audio
                                src={audioUrl}
                                ref={(ref) => setAudioRef(ref)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            <button
                                onClick={() => {
                                    if (!audioRef) return;
                                    if (isPlaying) audioRef.pause();
                                    else audioRef.play();
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition"
                            >
                                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
                            </button>

                            <button
                                onClick={handleRunTest}
                                disabled={isTranscribing}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-lg shadow-emerald-900/20"
                            >
                                {isTranscribing ? (
                                    <>
                                        <CircleNotch size={14} className="animate-spin" />
                                        <span>Running Whisper AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <Microphone size={14} />
                                        <span>Run Transcription Test</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {statusText && (
                        <div className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex items-center gap-2">
                            {isTranscribing && <CircleNotch size={14} className="animate-spin text-purple-400" />}
                            <span>{statusText}</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Output Results Log */}
                    {transcriptResult && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-emerald-400" />
                                    <span className="text-xs font-bold text-white">Parsed Timestamps & Text</span>
                                </div>

                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-md transition"
                                >
                                    {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    <span>{copied ? 'Copied!' : 'Copy Timestamps'}</span>
                                </button>
                            </div>

                            <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 max-h-56 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-1">
                                {groupWordChunksIntoPhrases(transcriptResult.chunks || []).map((phrase: any, i: number) => {
                                    return (
                                        <div key={i} className="flex gap-3 hover:bg-gray-900/60 p-1 rounded transition">
                                            <span className="text-purple-400 shrink-0">
                                                [{phrase.startSec.toFixed(2)}s - {phrase.endSec.toFixed(2)}s]
                                            </span>
                                            <span className="text-gray-200">{phrase.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
