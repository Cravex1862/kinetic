import React from 'react';
import { Easing } from 'remotion';
import { useFrame } from '../useFrame';
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface BarChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface BarChartCardProps {
    width?: number;
    height?: number;
    titleText?: string;
    titleConfig?: TextFormatConfig;
    data: BarChartDataPoint[];
    barColor?: string;
    barSpacing?: number;
    barBorderRadius?: number;
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

export const BarChartCard: React.FC<BarChartCardProps> = ({
    width,
    height = 400,
    titleText,
    titleConfig,
    data = [],
    barColor = '#8b5cf6',
    barSpacing = 16,
    barBorderRadius = 12,
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
    animDuration = 35,
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

    const chartHeight = height - (padding * 2) - (titleText ? 60 : 20) - (xAxisTitle ? 50 : 30);

    const ticks = yAxisTicks || [0, Math.round(maxVal / 2), maxVal];

    return (
        <div style={cardStyle} className='transition-all duration-300'>
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
                                transition: 'background-color 0.3s ease',
                            }

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
                        left: '-55px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        transformOrigin: 'center center',
                        whiteSpace: 'nowrap'
                    }}>
                        <span style={axisTitleStyle}>{yAxisTitle}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', marginLeft: '47px', justifyContent: 'space-around', padding: `0 ${barSpacing}px` }}>
                {data.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: 'center', maxWidth: '60px' }}>
                        <span style={labelStyle}>{item.label}</span>
                    </div>
                ))}
            </div>


            {xAxisTitle && (
                <div style={{ textAlign: 'center', marginTop: '-8px' }}>
                    <span style={axisTitleStyle}>{xAxisTitle}</span>
                </div>
            )}
        </div>
    );
};