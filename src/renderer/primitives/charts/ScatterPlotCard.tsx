import React from "react";
import { Easing } from 'remotion';
import { useFrame } from '../useFrame';
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface ScatterPlotPoint {
    x: number;
    y: number;
    size?: number;
    color?: string;
    label?: string;
}

export interface ScatterPlotCardProps {
    width?: number;
    height?: number;
    titleText?: string;
    titleConfig?: TextFormatConfig;
    data: ScatterPlotPoint[];
    pointColor?: string;
    pointSize?: number;
    gridRows?: number;
    gridCols?: number;
    gridColor?: string;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    animDuration?: number;
    frame?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

export const ScatterPlotCard: React.FC<ScatterPlotCardProps> = ({
    width,
    height = 400,
    titleText,
    titleConfig,
    data = [],
    pointColor = '#8b5cf6',
    pointSize = 12,
    gridRows = 6,
    gridCols = 10,
    gridColor = 'rgba(139, 92, 246, 0.15)',
    xMin,
    xMax,
    yMin,
    yMax,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 24,
    animDuration = 45,
    frame: propFrame,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
}) => {

    const frame = useFrame(propFrame);

    const rawXs = data.map(d => d.x);
    const rawYs = data.map(d => d.y);
    const computedXMin = xMin !== undefined ? xMin : Math.min(...rawXs, 0);
    const computedXMax = xMax !== undefined ? xMax : Math.max(...rawXs, 100);
    const computedYMin = yMin !== undefined ? yMin : Math.min(...rawYs, 0);
    const computedYMax = yMax !== undefined ? yMax : Math.max(...rawYs, 100);

    const xRange = Math.max(computedXMax - computedXMin, 1);
    const yRange = Math.max(computedYMax - computedYMin, 1);

    const gridDuration = animDuration * 0.4;
    const gridProgress = Math.min(frame / gridDuration, 1);
    const gridOpacity = Easing.ease(gridProgress);

    const cardStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: `${height}px`,
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    }

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '28px',
        margin: 0,
        ...textFormatToStyle(titleConfig),
    }

    const chartHeight = height - (padding * 2) - (titleText ? 60 : 20);

    return (
        <div style={cardStyle} className="transition-all duration-300">

            {titleText && <h3 style={titleStyle}>{titleText}</h3>}

            <div style={{ flex: 1, height: `${chartHeight}px`, position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    {Array.from({ length: gridCols + 1 }).map((_, colIdx) => {
                        const pctX = (colIdx / gridCols) * 100;
                        return (
                            <line
                                key={`col-${colIdx}`}
                                x1={`${pctX}%`}
                                y1="0%"
                                x2={`${pctX}%`}
                                y2="100%"
                                stroke={gridColor}
                                strokeWidth={1}
                                strokeOpacity={gridOpacity}
                            />
                        );
                    })}

                    {Array.from({ length: gridRows + 1 }).map((_, rowIdx) => {
                        const pctY = (rowIdx / gridRows) * 100;
                        return (
                            <line key={`row-${rowIdx}`}
                                x1="0%"
                                y1={`${pctY}%`}
                                x2="100%"
                                y2={`${pctY}%`}
                                stroke={gridColor}
                                strokeWidth={1}
                                strokeOpacity={gridOpacity}
                            />
                        )
                    })}

                    {data.map((point, idx) => {
                        const xPct = ((point.x - computedXMin) / xRange) * 100;
                        const yPct = 100 - ((point.y - computedYMin) / yRange) * 100;

                        const startDelay = gridDuration + (idx * 3);
                        const pointProgress = Math.min(Math.max(0, frame - startDelay) / (animDuration - startDelay), 1);

                        const pointScale = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(pointProgress);

                        const currentSize = point.size || pointSize;
                        const currentColor = point.color || pointColor;

                        return (
                            <circle
                                key={idx}
                                cx={`${xPct}%`}
                                cy={`${yPct}%`}
                                r={currentSize}
                                fill={currentColor}
                                stroke={backgroundColor}
                                strokeWidth={2}
                                style={{
                                    transform: `scale(${pointScale})`,
                                    transformOrigin: `${xPct}% ${yPct}%`,
                                    transition: 'transform 0.1s ease',
                                }}
                            />
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}