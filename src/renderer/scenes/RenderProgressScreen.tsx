import React from 'react';

interface RenderProgress {
    frame: number;
    total: number;
    status: 'rendering' | 'done' | 'error';
    error?: string;
}

interface RenderProgressScreenProps {
    progress: RenderProgress | null;
    onClose: () => void;
}

export const RenderProgressScreen: React.FC<RenderProgressScreenProps> = ({ progress, onClose }) => {
    if (!progress) return null;

    const { frame, total, status, error } = progress;
    const percentage = total > 0 ? Math.min(Math.round((frame / total) * 100), 100) : 0;

    // Circumference of the progress circle (2 * PI * r) where r = 34
    const circumference = 2 * Math.PI * 34;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300">
            <div className="relative max-w-md w-full mx-4 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
                
                {/* Close Button for Done/Error states */}
                {(status === 'done' || status === 'error') && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 p-1.5 rounded-lg transition-all"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* RENDERING STATE */}
                {status === 'rendering' && (
                    <div className="w-full flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-6">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    className="stroke-gray-800"
                                    strokeWidth="6"
                                    fill="transparent"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    className="stroke-indigo-500 transition-all duration-300"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xs font-semibold text-white">
                                {percentage}%
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1 tracking-wide font-heading">
                            Rendering Video
                        </h3>
                        <p className="text-xs text-gray-400 mb-5 font-paragraph">
                            Please keep the app open. Compiling animation frames...
                        </p>
                        
                        <div className="w-full mb-2">
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700 mb-2">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="w-full flex justify-between text-[10px] text-gray-500 font-paragraph">
                                <span>Frame {frame} / {total}</span>
                                <span>{percentage}% Complete</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* DONE STATE */}
                {status === 'done' && (
                    <div className="w-full flex flex-col items-center py-4">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-wide font-heading">
                            Export Completed!
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 font-paragraph">
                            Your video has been compiled and saved next to your project file.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Back to Studio
                        </button>
                    </div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                    <div className="w-full flex flex-col items-center py-4">
                        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-wide font-heading">
                            Export Failed
                        </h3>
                        <p className="text-xs text-gray-400 mb-4 font-paragraph">
                            An error occurred during video rendering:
                        </p>
                        <div className="w-full bg-rose-950/20 border border-rose-900/35 rounded-lg p-3 text-left mb-6 overflow-x-auto max-h-24">
                            <code className="text-[10px] text-rose-400 font-mono whitespace-pre-wrap break-all">
                                {error || 'Unknown error'}
                            </code>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors border border-gray-700"
                        >
                            Close
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};