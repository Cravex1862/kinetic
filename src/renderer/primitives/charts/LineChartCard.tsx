import React from "react";
import { Easing } from 'remotion';
import { useFrame } from "../useFrame";
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from "../utils/styleHelpers";

export interface LineChartDataPoint {
    label: string;
    value: number;
}

export interface LineChartCardProps {
    width?: number;
    height?: number;
    titleText?: string;
    titleConfig?: TextFormatConfig;
    data: LineChartDataPoint[];
    lineColor?: string;
    lineWidth?: number;
    pointColor?: string;
    pointSize?: number;
    showPoints?: boolean;
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

export const LineChartCard: React.FC<LineChartCardProps> = ({
    width,
    height = 400,
    titleText,
    titleConfig,
    data = [],
    lineColor = '#8b5cf6',
    lineWidth = 4,
    pointColor = '#a78bfa',
    pointSize = 6,
    showPoints = true,
    showGridLines = true,
    gridLinesColor = 'rgba(255,255,255,0.08)',
    yAxisTicks,
    xAxisTitle,
    yAxisTitle,
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
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const progress = Math.min(frame / animDuration, 1);
    const easedProgress = Easing.out(Easing.bezier(0.34, 1.56, 0.64, 1))(progress);

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

    const stepX = chartWidth / Math.max(data.length - 1, 1);
    const pointsList = data.map((item, idx) => {
        const x = idx * stepX;
        const y = chartHeight - (item.value / maxVal) * chartHeight;
        return { x, y };
    });

    const pathString = pointsList.reduce((acc, point, idx) => {
        return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    const totalPathLength = 1000;
    const strokeDashoffset = totalPathLength - (totalPathLength * easedProgress);

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

                    <svg width='100%' height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
                        {pointsList.length > 1 && (
                            <path
                                d={pathString}
                                fill="none"
                                stroke={lineColor}
                                strokeWidth={lineWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={totalPathLength}
                                strokeDashoffset={strokeDashoffset}
                                pathLength={totalPathLength}
                            />
                        )}

                        {showPoints && pointsList.map((point, idx) => {
                            const pointProgressStart = idx / Math.max(data.length - 1, 1);
                            const isActive = progress >= pointProgressStart;
                            const pointScale = isActive ? Math.min((progress - pointProgressStart) * 5, 1) : 0;
                            return (
                                <circle
                                    key={idx}
                                    cx={point.x}
                                    cy={point.y}
                                    r={pointSize}
                                    fill={pointColor}
                                    stroke={backgroundColor}
                                    strokeWidth={2}
                                    style={{
                                        transform: `scale(${pointScale})`,
                                        transformOrigin: `${point.x}px ${point.y}px`,
                                        transition: 'transform 0.1s ease',
                                    }}
                                />
                            )
                        })}
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
                        whiteSpace: 'nowrap'
                    }}
                    >
                        <span style={axisTitleStyle}>{yAxisTitle}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', marginRight: `${yAxisWidth + 12}px`, justifyContent: 'space-between', position: 'relative' }}>
                {data.map((item, idx) => {
                    const leftOffset = idx * stepX;
                    return (
                        <div key={idx}
                            style={{
                                position: 'absolute',
                                left: `${leftOffset}px`,
                                transform: 'translateX(-50%)',
                                width: '60px',
                                textAlign: 'center',
                            }}
                        >
                            <span style={labelStyle}>{item.label}</span>
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
};