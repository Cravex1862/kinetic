import React from 'react';

interface PreviewWindowProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
    title = "Walkthrough Preview Canvas",
    children,
    className = '',
}) => {
    return (
        <div className={`w-full aspect-video rounded-2xl border border-gray-900 bg-gray-900/10 p-5 backdrop-blur-md relative overflow-hidden flex flex-col flex-shrink-0 ${className}`}>
            <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="text-center text-xs text-gray-500 border-b border-gray-900/60 pb-3 tracking-wider font-semibold z-10 select-none">
                {title}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full mt-4">
                {children}
            </div>
        </div>
    );
};