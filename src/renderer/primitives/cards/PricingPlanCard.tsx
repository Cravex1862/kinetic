import React from 'react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface PricingPlanCardProps {
    glowConfig?: glowConfigProps;
    width?: number;
    height?: number;
    pricetext: string;
    priceConfig?: TextFormatConfig;
    periodText?: string;
    periodConfig?: TextFormatConfig;
    features?: string[];
    featuresConfig?: TextFormatConfig;
    buttonText?: string;
    buttonConfig?: TextFormatConfig;
    buttonBgColor?: string;
    tagText?: string;
    tagConfig?: TextFormatConfig;
    tagBgColor?: string;
    tagBorderRadius?: number;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

export const PricingPlanCard: React.FC<PricingPlanCardProps> = ({
    glowConfig,
    width,
    height,
    pricetext,
    priceConfig,
    periodText,
    periodConfig,
    features = [],
    featuresConfig,
    buttonText = 'Select →',
    buttonConfig,
    buttonBgColor = '#8b5cf6',
    tagText,
    tagConfig,
    tagBgColor = 'rgba(255, 255, 255, 0.1)',
    tagBorderRadius = 12,
    backgroundColor = '#121214',
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
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    };

    const priceStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '44px',
        margin: 0,
        lineHeight: 1,
        ...textFormatToStyle(priceConfig),
    };

    const periodStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#a1a1aa',
        fontWeight: 'normal',
        fontSize: '16px',
        margin: 0,
        ...textFormatToStyle(periodConfig),
    };

    const tagStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: tagBgColor,
        borderRadius: `${tagBorderRadius}px`,
        padding: '4px 12px',
        position: 'absolute',
        top: `${padding}px`,
        right: `${padding}px`,
        ...textFormatToStyle(tagConfig),
    };

    const featuresListStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: 0,
        margin: 0,
        listStyle: 'none',
        flex: 1,
    };

    const featureItemStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#e4e4e7',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...textFormatToStyle(featuresConfig),
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: buttonBgColor,
        borderRadius: '12px',
        padding: '12px',
        border: 'none',
        outline: 'none',
        color: '#fff',
        fontFamily: 'sans-serif',
        fontWeight: '600',
        fontSize: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...textFormatToStyle(buttonConfig),
    };

    return (
        <div style={cardStyle} className="transition-all duration-300">
            {tagText && <span style={tagStyle}>{tagText}</span>}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: tagText ? '16px' : '0px' }}>
                <h2 style={priceStyle}>{pricetext}</h2>
                {periodText && <span style={periodStyle}>{periodText}</span>}
            </div>

            {features.length > 0 && (
                <ul style={featuresListStyle}>
                    {features.map((feature, idx) => (
                        <li key={idx} style={featureItemStyle}>
                            <span style={{ color: buttonBgColor, marginRight: '8px' }}>•</span>
                            {feature}
                        </li>
                    ))}
                </ul>
            )}

            <button style={buttonStyle}>{buttonText}</button>
        </div>
    );
};
