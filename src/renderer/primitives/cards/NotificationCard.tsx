import React from 'react';
import { Bell } from '@phosphor-icons/react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface NotificationCardProps {
    glowConfig?: glowConfigProps;
    width?: number;
    height?: number;
    logoUrl?: string;
    titleText: string;
    titleConfig?: TextFormatConfig;
    descriptionText?: string;
    descriptionConfig?: TextFormatConfig;
    timeText?: string;
    timeConfig?: TextFormatConfig;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
    glowConfig,
    width,
    height,
    logoUrl,
    titleText,
    titleConfig,
    descriptionText,
    descriptionConfig,
    timeText,
    timeConfig,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 20,
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
        border: `1px solid rgba(255,255,255, 0.08)`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    };

    const logoContainerStyle: React.CSSProperties = {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: logoUrl ? 'transparent' : 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '600',
        fontSize: '20px',
        margin: 0,
        lineHeight: 1.2,
        ...textFormatToStyle(titleConfig),
    };

    const descriptionStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#a1a1aa',
        fontWeight: 'normal',
        fontSize: ' 14px',
        margin: 0,
        lineHeight: 1.4,
        ...textFormatToStyle(descriptionConfig),
    };

    const timeStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#71717a',
        fontWeight: 'normal',
        fontSize: '13px',
        margin: 0,
        marginLeft: 'auto',
        ...textFormatToStyle(timeConfig),
    };

    return (
        <div style={cardStyle} className='transition-all duration-300'>
            <div style={logoContainerStyle}>
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Bell size={24} color="#fff" />
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                    <h3 style={titleStyle}>{titleText}</h3>
                    {timeText && <span style={timeStyle}>{timeText}</span>}
                </div>
                {descriptionText && (
                    <p style={descriptionStyle}>{descriptionText}</p>
                )}
            </div>
        </div>
    );
};
