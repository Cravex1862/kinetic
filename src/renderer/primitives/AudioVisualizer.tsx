import React, { useEffect, useState } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AudioAnalyzer } from '../utils/audioAnalyzer';
import { useFrame } from './useFrame';

const globalAnalyzer = new AudioAnalyzer();
let isLoaded = false;

export interface AudioVisualizerProps {
    audioUrl: string;
    glowColor?: string;
    frame?: number;
    fps?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    audioUrl,
    glowColor = "#6366f1",
    frame: propFrame,
    fps: propFps,
}) => {
    const frame = useFrame(propFrame);
    let fps = propFps;
    if (fps === undefined) {
        try {
            const config = useVideoConfig();
            fps = config.fps;
        } catch {
            fps = 30;
        }
    }
    const [ready, setReady] = useState(isLoaded);

    useEffect(() => {
        if (!isLoaded && audioUrl) {
            globalAnalyzer.load(audioUrl).then(() => {
                isLoaded = true;
                setReady(true);
            });
        }
    }, [audioUrl]);

    const loudness = ready ? globalAnalyzer.getFrameData(frame, fps) : 0;

    const lines = [];
    for (let i = 0; i < 10; i++) {

        const y = 100 + (i * 40);

        const bend = Math.sin((i / 10) * Math.PI) * (loudness * 200);

        const path = `M 0, ${y} Q 500, ${y - bend} 1000, ${y}`;

        lines.push(
            <path
                key={i}
                d={path}
                fill='transparent'
                stroke={glowColor}
                strokeWidth={2 + (loudness * 5)}
                style={{ filter: `drop-shadow(0 0 ${10 + (loudness * 30)}px ${glowColor})` }} />

        );
    }

    return (
        <div className="absolute inset-0 bg-gray-950 overflow-hidden flex items-center justify-center pointer-events-none">
            <svg viewBox='0 0 1000 600' className='w-full h-full opacity-60'>
                {lines}
            </svg>
        </div>
    );
}; 
