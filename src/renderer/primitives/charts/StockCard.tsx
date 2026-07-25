import React from "react";
import { Easing } from 'remotion';
import { useFrame } from "../useFrame";
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from "../utils/styleHelpers";

export type StockChangeMode = 'percentage' | 'price' | 'value';

export interface StockCardProps {
    width?: number;
    height?: number;
    tickerSymbol: string;
    companyName: string;
    currentPrice: number;
    priceChange: number;
    percentChange: number;
    displayMode?: StockChangeMode;
    chartData: number[];
    tickerConfig?: TextFormatConfig;
    companyConfig?: TextFormatConfig;
    priceConfig?: TextFormatConfig;
    badgeConfig?: TextFormatConfig;
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

export const StockCard: React.FC<StockCardProps> = ({
    width,
    height = 95,
    tickerSymbol,
    companyName,
    currentPrice,
    priceChange,
    percentChange,
    displayMode = 'percentage',
    chartData = [],
    tickerConfig,
    companyConfig,
    priceConfig,
    badgeConfig,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 16,
    animDuration = 35,
    frame: propFrame,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
}) => {
    const frame = useFrame(propFrame);

    const isPositive = priceChange >= 0;
    const themeColor = isPositive ? '#00d020' : '#ff3b30';
    const themeColorLight = isPositive ? 'rgba(0, 208, 32, 0.15)' : 'rgba(255, 59, 48, 0.15)';

    let badgeText = '';
    if (displayMode === 'percentage') {
        badgeText = `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`;
    }
    else if (displayMode === 'price') {
        badgeText = `${isPositive ? '+' : ''}${priceChange.toFixed(2)}`;
    }
    else {
        badgeText = `${currentPrice.toFixed(2)}`;
    }

    const progress = Math.min(frame / animDuration, 1);
    const easedProgress = Easing.out(Easing.bezier(0.25, 1, 0.5, 1))(progress);

    const sparkWidth = 120;
    const sparkHeight = 40;
    const minVal = Math.min(...chartData, 0);
    const maxVal = Math.max(...chartData, 1);
    const valRange = Math.max(maxVal - minVal, 1);

    const stepX = sparkWidth / Math.max(chartData.length - 1, 1);
    const points = chartData.map((val, idx) => {
        const x = idx * stepX;
        const y = sparkHeight - ((val - minVal) / valRange) * sparkHeight;
        return { x, y };
    });

    const pathString = points.reduce((acc, point, idx) => {
        return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    const totalPathLength = 500;
    const strokeDashOffset = totalPathLength - (totalPathLength * easedProgress);

    const cardStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: `${height}px`,
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    };

    const tickerStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '22px',
        margin: 0,
        lineHeight: '1.2',
        ...textFormatToStyle(tickerConfig),
    };

    const companyStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#a1a1aa',
        fontSize: '13px',
        margin: 0,
        lineHeight: '1.2',
        ...textFormatToStyle(companyConfig),
    };

    const priceStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '18px',
        textAlign: 'right',
        margin: 0,
        ...textFormatToStyle(priceConfig),
    };

    const badgeStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '15px',
        backgroundColor: themeColor,
        padding: '6px 12px',
        borderRadius: '8px',
        display: 'inline-block',
        minWidth: '70px',
        textAlign: 'center',
        opacity: easedProgress,
        transform: `scale(${0.9 + easedProgress * 0.1})`,
        ...textFormatToStyle(badgeConfig),
    };

    return (
        <div style={cardStyle} className="transition-all duration-300">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={tickerStyle}>{tickerSymbol}</h4>
                <p style={companyStyle}>{companyName}</p>
            </div>

            {chartData.length > 1 && (
                <div style={{ width: `${sparkWidth}px`, height: `${sparkHeight}px`, position: 'relative' }}>
                    <svg width={sparkWidth} height={sparkHeight} style={{ overflow: 'visible' }}>
                        <line
                            x1={0}
                            y1={sparkHeight}
                            x2={sparkWidth}
                            y2={sparkHeight}
                            stroke={themeColorLight}
                            strokeWidth={1.5}
                        />

                        <path
                            d={pathString}
                            fill="none"
                            stroke={themeColor}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={totalPathLength}
                            strokeDashoffset={strokeDashOffset}
                            pathLength={totalPathLength}
                        />
                    </svg>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={priceStyle}>${currentPrice.toFixed(2)}</span>
                <span style={badgeStyle}>{badgeText}</span>
            </div>
        </div>
    );


}       