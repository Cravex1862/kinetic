import React from "react";
import { Easing } from 'remotion';
import { useFrame } from "../useFrame";
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from "../utils/styleHelpers";

export interface AreaSeries {
    label: string;
    values?: number[];
    color?: string;
    lineColor?: string;
    fillOpacity?: number;
}

export interface AreaChartCardProps {
    width?: number;
    height?: number;
    titleText?: string;
    titleConfig?: TextFormatConfig;
    labels?: string[];
    datasets: AreaSeries[];
    stacked?: boolean;
    showGridLines?: boolean;
    gridLinesColor?: string;
    yAxisTicks?: number[];
    xAxisTitle?: string;
    yAxisTitle?: string;
    axisTitleConfig?: TextFormatConfig;
    labelConfig?: TextFormatConfig;
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
    translateX?: number;
    translateY?: number;
}

const defaultColor = [
    { fill: 'rgba(59, 130, 246, 0.4)', stroke: '#3b82f6' },
    { fill: 'rgba(16, 185, 129, 0.4)', stroke: '#10b981' },
    { fill: 'rgba(139, 92, 246, 0.4)', stroke: '#8b5cf6' },
    { fill: 'rgba(245, 158, 11, 0.4)', stroke: '#f59e0b' },
];

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
    width = 600,
    height = 360,
    titleText = "Revenue Growth",
    titleConfig,
    labels = ["Q1", "Q2", "Q3", "Q4", "Q5"],
    datasets = [
        { label: "Product A", values: [20, 45, 60, 80, 110] },
        { label: "Product B", values: [15, 30, 40, 55, 75] }
    ],
    stacked = false,
    showGridLines = true,
    gridLinesColor = "rgba(255, 255, 255, 0.1)",
    yAxisTicks,
    xAxisTitle,
    yAxisTitle,
    axisTitleConfig,
    labelConfig,
    backgroundColor = "#18181b",
    borderRadius = 16,
    padding = 24,
    animDuration = 30,
    frame: frameProp,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
    translateX,
    translateY,
}) => {
    const currentFrame = useFrame(frameProp);
    const progress = Math.min(Math.max(currentFrame / animDuration, 0), 1);
    const easedProgress = Easing.cubic(progress);

    const cardStyle: React.CSSProperties = {
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        userSelect: "none",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: "sans-serif",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "20px",
        margin: 0,
        ...textFormatToStyle(titleConfig),
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: "sans-serif",
        color: "#a1a1aa",
        fontSize: "12px",
        textAlign: "center",
        ...textFormatToStyle(labelConfig),
    };

    const axisTitleStyle: React.CSSProperties = {
        fontFamily: "sans-serif",
        color: "#71717a",
        fontSize: "11px",
        fontWeight: "600",
        ...textFormatToStyle(axisTitleConfig),
    };

    const numPoints = labels.length;

    let maxVal = 1;
    if (stacked) {
        for (let i = 0; i < numPoints; i++) {
            let sum = 0;
            datasets.forEach(ds => {
                sum += (ds.values && ds.values[i]) ? ds.values[i] : 0;
            });
            if (sum > maxVal) maxVal = sum;
        }
    } else {
        datasets.forEach(ds => {
            if (ds.values) {
                ds.values.forEach(v => {
                    if (v > maxVal) maxVal = v;
                });
            }
        });
    }

    const ticks = yAxisTicks || [0, Math.round(maxVal / 2), maxVal];
    const chartHeight = height - (padding * 2) - (titleText ? 40 : 10) - (xAxisTitle ? 40 : 20);
    const chartWidth = width - (padding * 2) - 40;

    let accumulatedValues = new Array(numPoints).fill(0);

    const pathDatasets = datasets.map((dataset, dsIdx) => {
        const fill = dataset.color || defaultColor[dsIdx % defaultColor.length].fill;
        const stroke = dataset.lineColor || defaultColor[dsIdx % defaultColor.length].stroke;
        const opacity = dataset.fillOpacity ?? 0.4;

        const topPoints: { x: number; y: number }[] = [];
        const bottomPoints: { x: number; y: number }[] = [];

        for (let i = 0; i < numPoints; i++) {
            const val = (dataset.values && dataset.values[i]) ? dataset.values[i] : 0;
            const x = (i / (numPoints - 1)) * chartWidth;

            if (stacked) {
                const prevBase = accumulatedValues[i];
                const newBase = prevBase + val;
                accumulatedValues[i] = newBase;

                const yTop = chartHeight - (newBase / maxVal) * chartHeight;
                const yBottom = chartHeight - (prevBase / maxVal) * chartHeight;

                topPoints.push({ x, y: yTop });
                bottomPoints.push({ x, y: yBottom });
            } else {
                const yTop = chartHeight - (val / maxVal) * chartHeight;
                topPoints.push({ x, y: yTop });
                bottomPoints.push({ x, y: chartHeight });
            }
        }

        let AreaPathString = '';
        if (topPoints.length > 0) {
            AreaPathString = `M ${topPoints[0].x} ${topPoints[0].y} L ${topPoints.map(p => `${p.x} ${p.y}`).join(' L ')} L ${bottomPoints[numPoints - 1].x} ${bottomPoints[numPoints - 1].y} L ${bottomPoints.slice().reverse().map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
        }

        const linePathString = topPoints.reduce((acc, point, idx) => {
            return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
        }, '');

        return {
            topPoints,
            bottomPoints,
            areaPathString: AreaPathString,
            linePathString,
            fill,
            stroke,
            opacity
        };
    });

    return (
        <div style={cardStyle}>
            {titleText && <h3 style={titleStyle}>{titleText}</h3>}

            <div style={{ display: 'flex', flex: 1, gap: '12px', height: `${chartHeight}px`, position: 'relative' }}>
                <div style={{ flex: 1, height: '100%', position: 'relative', borderLeft: `1px solid ${gridLinesColor}`, borderBottom: `1px solid ${gridLinesColor}` }}>
                    {showGridLines && ticks.map((tick, idx) => {
                        const bottomPercent = (tick / maxVal) * 100;
                        return (
                            <div
                                key={idx}
                                style={{
                                    position: 'absolute',
                                    bottom: `${bottomPercent}%`,
                                    left: 0,
                                    right: 0,
                                    borderTop: `1px solid ${gridLinesColor}`,
                                    pointerEvents: 'none',
                                }}
                            />
                        );
                    })}

                    <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
                        <defs>
                            <clipPath id="area-wipe-clip">
                                <rect x="0" y="0" width={`${easedProgress * 100}%`} height="100%" />
                            </clipPath>
                        </defs>

                        <g clipPath="url(#area-wipe-clip)">
                            {pathDatasets.map((dataset, idx) => (
                                <React.Fragment key={idx}>
                                    <path
                                        d={dataset.areaPathString}
                                        fill={dataset.fill}
                                        opacity={dataset.opacity}
                                    />
                                    <path
                                        d={dataset.linePathString}
                                        fill="none"
                                        stroke={dataset.stroke}
                                        strokeWidth={3}
                                    />
                                </React.Fragment>
                            ))}
                        </g>
                    </svg>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                {labels.map((label, idx) => (
                    <span key={idx} style={labelStyle}>{label}</span>
                ))}
            </div>
        </div>
    );
};

export default AreaChartCard;
