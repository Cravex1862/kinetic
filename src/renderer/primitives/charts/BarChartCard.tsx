import React from 'react';
import { GlowConfig, StyleConfig, buildGlowFilter, configToStyle, getTransform3DStyle } from '../types';



export interface BarChartDataItem {
    label: string;
    value: number;
    color?: string;
}

export interface BarChartCardProps {
    data?: BarChartDataItem[];
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    barColor?: string;
    barBorderRadius?: number;
    barSpacing?: number;
    titleText?: string;
    showValues?: boolean;
    showGridLines?: boolean;
    gridLinesColor?: string;
    yAxisTicks?: number[];
    xAxisTitle?: string;
    yAxisTitle?: string;
    glowConfig?: GlowConfig;
    style?: StyleConfig;
    frame?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
    translateX?: number;
    translateY?: number;
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
    data = [
        { label: 'Jan', value: 40 },
        { label: 'Feb', value: 70 },
        { label: 'Mar', value: 55 },
        { label: 'Apr', value: 90 },
        { label: 'May', value: 65 },
    ],
    width = 500,
    height = 320,
    backgroundColor = '#18181b',
    borderRadius = 16,
    padding = 24,
    barColor = '#3b82f6',
    barBorderRadius = 6,
    barSpacing = 16,
    titleText = 'Monthly Performance',
    showValues = true,
    showGridLines = true,
    gridLinesColor = 'rgba(255, 255, 255, 0.1)',
    yAxisTicks,
    xAxisTitle,
    yAxisTitle,
    glowConfig,
    style,
    frame = 0,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
    translateX,
    translateY,
}) => {
    const glow = buildGlowFilter(glowConfig);
    const customStyle = configToStyle(style);
    const maxVal = Math.max(...data.map(d => d.value), 1);

    const progress = Math.min(Math.max(frame / 30, 0), 1);
    const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const cardStyle: React.CSSProperties = {
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        ...glow,
        ...customStyle,
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '28px',
        margin: 0,
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#a1a1aa',
        fontSize: '14px',
        textAlign: 'center',
    };

    const axisTitleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#71717a',
        fontSize: '12px',
        fontWeight: '600',
    };

    const chartHeight = height - (padding * 2) - (titleText ? 60 : 20) - (xAxisTitle ? 50 : 30);
    const ticks = yAxisTicks || [0, Math.round(maxVal / 2), maxVal];

    return (
        <div style={cardStyle}>
            {titleText && <h3 style={titleStyle}>{titleText}</h3>}

            <div style={{ display: 'flex', flex: 1, gap: '12px', height: `${chartHeight}px`, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: '35px', alignItems: 'flex-end', paddingBottom: '10px' }}>
                    {ticks.slice().reverse().map((tick, idx) => (
                        <span key={idx} style={{ ...labelStyle, fontSize: '12px' }}>
                            {tick}
                        </span>
                    ))}
                </div>

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
                                    borderTop: `1px dashed ${gridLinesColor}`,
                                    pointerEvents: 'none',
                                }}
                            />
                        );
                    })}

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', padding: `0 ${barSpacing}px`, position: 'relative', zIndex: 2 }}>
                        {data.map((item, idx) => {
                            const barHeightPercent = (item.value / maxVal) * 100 * easedProgress;
                            const barIndividualStyle: React.CSSProperties = {
                                width: '100%',
                                maxWidth: '60px',
                                height: `${barHeightPercent}%`,
                                backgroundColor: item.color || barColor,
                                borderRadius: `${barBorderRadius}px ${barBorderRadius}px 0 0`,
                            };

                            return (
                                <div
                                    key={idx}
                                    style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <div style={barIndividualStyle} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {yAxisTitle && (
                    <div style={{
                        position: 'absolute',
                        left: '-40px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        ...axisTitleStyle
                    }}>
                        {yAxisTitle}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: '47px', paddingTop: '8px' }}>
                {data.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                        <span style={labelStyle}>{item.label}</span>
                        {showValues && (
                            <span style={{ ...labelStyle, fontSize: '10px', color: '#71717a', display: 'block' }}>
                                {Math.round(item.value * easedProgress)}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {xAxisTitle && (
                <div style={{ textAlign: 'center', paddingTop: '8px', ...axisTitleStyle }}>
                    {xAxisTitle}
                </div>
            )}
        </div>
    );
};

export default BarChartCard;