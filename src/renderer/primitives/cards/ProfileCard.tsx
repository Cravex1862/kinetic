import React from 'react';
import { User, SealCheck } from '@phosphor-icons/react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface ProfileCardProps {
    glowConfig?: glowConfigProps;
    width?: number;
    height?: number;
    profilePictureUrl?: string;
    name: string;
    nameConfig?: TextFormatConfig;
    mention: string;
    mentionConfig?: TextFormatConfig;
    verified?: boolean;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    glowConfig,
    width,
    height,
    profilePictureUrl,
    name,
    nameConfig,
    mention,
    mentionConfig,
    verified = false,
    backgroundColor = '#121212',
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
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    };

    const nameStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '600',
        fontSize: '22px',
        margin: 0,
        lineHeight: 1.2,
        ...textFormatToStyle(nameConfig),
    };

    const mentionStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#85858c',
        fontWeight: 'normal',
        fontSize: '15px',
        margin: 0,
        opacity: 0.8,
        lineHeight: 1.2,
        ...textFormatToStyle(mentionConfig),
    };

    return (
        <div style={cardStyle} className='transition-all duration-300'>
            <div
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {profilePictureUrl ? (
                    <img src={profilePictureUrl}
                        alt={name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <User size={32} color="rgba(255,255,255,0.4)" />
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={nameStyle}>{name}</h3>
                    {verified && (
                        <SealCheck
                            size={20}
                            weight='fill'
                            color='#1d9bf0'
                            style={{ flexShrink: 0 }}
                        />
                    )}
                </div>
                <p style={mentionStyle}>{mention}</p>
            </div>
        </div>
    )
}
