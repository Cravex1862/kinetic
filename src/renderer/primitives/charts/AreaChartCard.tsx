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
}

const defaultColor = [
    { fill: 'rgba(59, 130, 246, 0.4)', stroke: '#3b82f6' },
    { fill: 'rgba(16, 185, 129, 0.4)', stroke: '#10b981' },
    { fill: 'rgba(139, 92, 246, 0.4)', stroke: '#8b5cf6' },
    { fill: 'rgba(245, 158, 11, 0.4)', stroke: '#f59e0b' },
];

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
    width,
    height = 400,
    titleText,
    titleConfig,
    labels = [],
    datasets = [],
    stacked = false,
    showGridLines = true,
    gridLinesColor = 'rgba(255, 255, 255, 0.08)',
    yAxisTicks,
    yAxisTitle,
    xAxisTitle,
    axisTitleConfig,
    labelConfig,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 24,
    animDuration = 40,
    frame: propFrame,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
}) => {
    const frame = useFrame(propFrame);

    let maxVal = 1;
    const numPoints = labels?.length || 0;

    if (stacked) {
        for (let i = 0; i < numPoints; i++) {
            let sumAtIndex = 0;
            for (let j = 0; j < datasets.length; j++) {
                sumAtIndex += datasets[j].values?.[i] || 0;
            }
            if (sumAtIndex > maxVal) {
                maxVal = sumAtIndex;
            }
        }
    }

    else {
        const allValues = datasets.flatMap(d => d.values || []);
        maxVal = Math.max(...allValues, 1);
    }

    const progress = Math.min(frame / animDuration, 1);
    const easedProgress = Easing.out(Easing.bezier(0.25, 1, 0.5, 1))(progress);

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
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '28px',
        margin: 0,
        ...textFormatToStyle(titleConfig),
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#a1a1aa',
        fontSize: '14px',
        textAlign: 'center',
        ...textFormatToStyle(labelConfig),
    };

    const axisTitleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#71717a',
        fontSize: '12px',
        fontWeight: '600',
        ...textFormatToStyle(axisTitleConfig),
    };

    const yAxisWidth = 45;
    const chartHeight = height - (padding * 2) - (titleText ? 60 : 20) - (xAxisTitle ? 50 : 30);
    const chartWidth = (width !== undefined ? width : 600) - (padding * 2) - yAxisWidth - 20;

    const ticks = yAxisTicks || [0, Math.round(maxVal / 2), maxVal];
    const stepX = chartWidth / Math.max(numPoints - 1, 1);

    const pathDatasets = datasets.map((dataset, datasetIdx) => {
        const fill = dataset.color || defaultColor[datasetIdx % defaultColor.length].fill;
        const stroke = dataset.lineColor || defaultColor[datasetIdx % defaultColor.length].stroke;
        const opacity = dataset.fillOpacity !== undefined ? dataset.fillOpacity : 1;

        const topPoints = (dataset.values || []).map((v, i) => {
            const x = i * stepX;
            let currentVal = v;
            if (stacked) {
                for (let prevIdx = 0; prevIdx < datasetIdx; prevIdx++) {
                    currentVal += datasets[prevIdx].values?.[i] || 0;
                }
            }

            const y = chartHeight - (currentVal / maxVal) * chartHeight;
            return { x, y };
        });

        const bottomPoints = Array.from({ length: numPoints }).map((_, i) => {
            const x = i * stepX;
            let baseVal = 0;
            if (stacked && datasetIdx > 0) {
                for (let prevIdx = 0; prevIdx < datasetIdx; prevIdx++) {
                    baseVal += datasets[prevIdx].values?.[i] || 0;
                }
            }
            const y = chartHeight - (baseVal / maxVal) * chartHeight;
            return { x, y };
        });

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
        <div style={cardStyle} className="transition-all duration-300">
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
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </React.Fragment>
                            ))}
                        </g>
                    </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: `${yAxisWidth}px`, alignItems: 'flex-start', paddingBottom: '10px' }}>
                    {ticks.slice().reverse().map((tick, idx) => (
                        <span key={idx} style={{ ...labelStyle, fontSize: '12px' }}>
                            {tick}
                        </span>
                    ))}
                </div>

                {yAxisTitle && (
                    <div style={{
                        position: 'absolute',
                        left: '-55px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        transformOrigin: 'center center',
                        whiteSpace: 'nowrap',
                    }}>
                        <span style={axisTitleStyle}>{yAxisTitle}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', marginRight: `${yAxisWidth + 12}px`, justifyContent: 'space-between', position: 'relative' }}>
                {labels.map((label, idx) => {
                    const leftOffset = idx * stepX;
                    return (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                left: `${leftOffset}px`,
                                transform: 'translateX(-50%)',
                                width: '60px',
                                textAlign: 'center'
                            }}
                        >
                            <span style={labelStyle}>{label}</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ height: '12px' }} />

            {xAxisTitle && (
                <div style={{ textAlign: 'center', marginTop: '0px' }}>
                    <span style={axisTitleStyle}>{xAxisTitle}</span>
                </div>
            )}
        </div>
    );
}
