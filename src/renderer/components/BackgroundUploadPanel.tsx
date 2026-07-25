import React, { useRef } from 'react';
import { UploadSimple } from '@phosphor-icons/react';

interface BackgroundProps {
    bgDescription: string;
    setBgDescription: (val: string) => void;
    backgroundImage: string;
    setBackgroundImage: (val: string) => void;
}

export const BackgroundUploadPanel: React.FC<BackgroundProps> = ({
    bgDescription,
    setBgDescription,
    backgroundImage,
    setBackgroundImage
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setBackgroundImage(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <div className="flex items-center gap-2">
                    <UploadSimple size={16} className="text-emerald-400" />
                    <h4 className="text-xs font-bold text-gray-400">Describe & Upload Background</h4>
                </div>
            </div>

            <textarea
                value={bgDescription}
                onChange={(e) => setBgDescription(e.target.value)}
                placeholder="Describe background scene aesthetics..."
                className="w-full h-16 resize-none premium-input p-2.5 text-[10px] rounded-lg bg-gray-950/60 font-sans"
            />
            <div className="flex gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow flex items-center justify-center gap-1.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-semibold transition-colors"
                >
                    <UploadSimple size={12} />
                    Upload Background
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                />
            </div>
            {backgroundImage && (
                <div className="flex items-center justify-between bg-gray-950/60 border border-gray-900 p-2 rounded-lg">
                    <span className="text-[9px] text-gray-400 truncate max-w-[150px]">Loaded Image</span>
                    <button
                        onClick={() => setBackgroundImage('')}
                        className="text-red-400 hover:text-red-300 text-[9px] font-bold"
                    >
                        Remove
                    </button>
                </div>
            )}
        </section>
    );
};