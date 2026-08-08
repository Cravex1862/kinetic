import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import flubber from 'flubber';
import type { StyleConfig, GlowConfig } from "./types";
import { configToStyle } from "./types";

export const SVG_PRESETS = {
    circle: 'M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z',
    square: 'M 15 15 L 85 15 L 85 85 L 15 85 Z',
    triangle: 'M 50 15 L 85 85 L 15 85 Z',
    checkmark: 'M 20 52 L 40 72 L 80 28 L 88 36 L 40 88 L 12 60 Z',
    play: 'M 25 15 L 85 50 L 25 85 Z',
    pause: 'M 20 15 L 42 15 L 42 85 L 20 85 Z M 58 15 L 80 15 L 80 85 L 58 85 Z',
    star: 'M 50 10 L 61 35 L 88 35 L 66 52 L 74 78 L 50 62 L 26 78 L 34 52 L 12 35 L 39 35 Z',
    cross: 'M 25 15 L 50 40 L 75 15 L 85 25 L 60 50 L 85 75 L 75 85 L 50 60 L 25 85 L 15 75 L 40 50 L 15 25 Z',
};

export interface VectorMorphProps {
    fromPath: string;
    toPath: string;
    startFrame?: number;
    duration?: number;
    width?: number;
    height?: number;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    easing?: 'ease-in-out' | 'ease-out' | 'ease-in' | 'linear' | 'bounce';
    style?: StyleConfig;
    glowConfig?: GlowConfig;
}

export const VectorMorph: React.FC<VectorMorphProps> = ({
    fromPath,
    toPath,
    startFrame = 0,
    duration = 30,
    width = 100,
    height = 100,
    viewBox = '0 0 100 100',
    fill = '#8b5cf6',
    stroke = 'none',
    strokeWidth = 0,
    easing = 'ease-in-out',
    style,
    glowConfig,
}) => {
    const frame = useCurrentFrame();

    const progress = useMemo(() => {
        const relativeFrame = frame - startFrame;
        if (relativeFrame <= 0) return 0;
        if (relativeFrame >= duration) return 1;

        const raw = relativeFrame / duration;
        if (easing === 'linear') return raw;
        if (easing === 'ease-in') return Easing.in(Easing.quad)(raw);
        if (easing === 'ease-out') return Easing.out(Easing.quad)(raw);
        if (easing === 'bounce') return Easing.bounce(raw);
        return Easing.inOut(Easing.quad)(raw);
    }, [frame, startFrame, duration, easing]);

    const interpolator = useMemo(() => {
        try {
            return flubber.interpolate(fromPath, toPath, { maxSegmentLength: 2 });
        }
        catch (err) {
            console.warn('VectorMorph path topology mismatch, using step fallback:', err);
            return (p: number) => (p < 0.5 ? fromPath : toPath);
        }
    }, [fromPath, toPath]);

    const currentPath = interpolator(progress);
    const userStyles = configToStyle(style);

    return (
        <svg
            width={width}
            height={height}
            viewBox={viewBox}
            className="overflow-visible"
            style={{
                willChange: 'transform',
                ...userStyles,
            }}
        >
            <path
                d={currentPath}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}