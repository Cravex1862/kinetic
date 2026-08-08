import { BaseMotionProps } from '../types';
import React from 'react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';
import { getLowOpacityColor } from '../utils/colorHelpers';

export interface PriceCardProps extends BaseMotionProps {
    glowConfig?: glowConfigProps;
    width?: number;
    height?: number;
    titleText: string;
    titleConfig?: TextFormatConfig;
    subtitleText?: string;
    subtitleConfig?: TextFormatConfig;
    priceText: string;
    priceConfig?: TextFormatConfig;
    status?: 'pending' | 'paid' | 'overdue';
    statusConfig?: TextFormatConfig;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

const statusDefaultColors = {
    pending: '#ff7a00',
    paid: '#22c55e',
    overdue: '#ef4444',
};

export const PriceCard: React.FC<PriceCardProps> = ({
    glowConfig,
    width,
    height,
    titleText,
    titleConfig,
    subtitleText,
    subtitleConfig,
    priceText,
    priceConfig,
    status,
    statusConfig,
    backgroundColor = "#121214",
    borderRadius = 24,
    padding = 24,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
}) => {
    const cardStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: height !== undefined ? `${height}px` : 'auto',
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        filter: getGlowFilter(glowConfig),
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '700',
        fontSize: '24px',
        margin: 0,
        lineHeight: 1.2,
        ...textFormatToStyle(titleConfig),
    };

    const subtitleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#85858c',
        fontWeight: 'normal',
        fontSize: '14px',
        margin: 0,
        lineHeight: 1.4,
        ...textFormatToStyle(subtitleConfig),
    };

    const priceStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '28px',
        margin: 0,
        lineHeight: 1,
        ...textFormatToStyle(priceConfig),
    };

    const badgeColor = status ? (statusConfig?.color || statusDefaultColors[status]) : '#fff';
    const badgeBgColor = getLowOpacityColor(badgeColor, 0.15);

    const badgeStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: badgeColor,
        backgroundColor: badgeBgColor,
        fontWeight: 'bold',
        fontSize: '12px',
        padding: '4px 10px',
        borderRadius: '8px',
        textTransform: 'capitalize',
        display: 'inline-block',
        ...textFormatToStyle(statusConfig),
    };

    return (
        <div style={cardStyle} className='transition-all duration-300'>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={titleStyle}>{titleText}</h3>
                    {status && (
                        <span style={badgeStyle}>
                            {status}
                        </span>
                    )}
                </div>
                {subtitleText && (
                    <p style={subtitleStyle}>{subtitleText}</p>
                )}
            </div>

            {/* Right Column */}
            <div>
                <h2 style={priceStyle}>{priceText}</h2>
            </div>
        </div>
    );
};
