import { BaseMotionProps } from '../types';
import React from 'react';
import { Sparkle } from '@phosphor-icons/react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface FeatureCardProps extends BaseMotionProps {
    glowConfig?: glowConfigProps;
    width?: number;
    height?: number;
    logoUrl?: string;
    logoBgColor?: string;
    logoBorderRadius?: number;
    titleText: string;
    titleConfig?: TextFormatConfig;
    descriptionText: string;
    descriptionConfig?: TextFormatConfig;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
  translateX?: number;
  translateY?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    glowConfig,
    width,
    height,
    logoUrl,
    logoBgColor = 'rgba(255, 255, 255, 0.1)',
    logoBorderRadius = 12,
    titleText,
    titleConfig,
    descriptionText,
    descriptionConfig,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 24,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
  translateX,
  translateY,
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
        gap: '20px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
    };

    const logoContainerStyle: React.CSSProperties = {
        width: '48px',
        height: '48px',
        borderRadius: `${logoBorderRadius}px`,
        backgroundColor: logoUrl ? 'transparent' : logoBgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '28px',
        margin: 0,
        lineHeight: 1.2,
        ...textFormatToStyle(titleConfig),
    };

    const descriptionStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#e4e4e7',
        fontSize: '16px',
        margin: 0,
        lineHeight: 1.5,
        ...textFormatToStyle(descriptionConfig),
    };

    return (
        <div style={cardStyle} className="transition-all duration-300">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={logoContainerStyle}>
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <Sparkle size={24} color="#fff" weight="fill" />
                    )}
                </div>
                <h3 style={titleStyle}>{titleText}</h3>
            </div>

            <p style={descriptionStyle}>{descriptionText}</p>
        </div>
    );
};
