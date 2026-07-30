import React from "react";
import { useCurrentFrame } from "remotion";

export interface GradientBackgroundProps {
    colors?: string[];
    type?: 'linear' | 'radial' | 'conic';
    angle?: number;
    stops?: number[];
    animate?: boolean;
    speed?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    colors = ['#0f172a', '#1e1b4b'],
    type = 'linear',
    angle = 135,
    stops,
    animate = false,
    speed = 0.5,
    style,
    children,
}) => {
    let frame = 0;
    try {
        frame = useCurrentFrame();
    }
    catch {
        frame = 0;
    }

    const currentAngle = animate ? (angle + frame * speed) % 360 : angle;

    const colorStops = colors.map((color, index) => {
        const stopPercent = stops && stops[index] !== undefined
            ? `${stops[index]}%`
            : `${index / Math.max(colors.length - 1, 1) * 100}%`;
        return `${color} ${stopPercent}`;
    }).join(', ');

    let backgroundString = '';
    if (type === 'radial') {
        backgroundString = `radial-gradient(circle at center, ${colorStops})`;
    }
    else if (type === 'conic') {
        backgroundString = `conic-gradient(from ${currentAngle}deg at 50% 50%, ${colorStops})`;
    }
    else {
        backgroundString = `linear-gradient(${currentAngle}deg, ${colorStops})`;
    }

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: backgroundString,
                overflow: 'hidden',
                ...style,
            }}
        >
            {children}
        </div>
    )
}