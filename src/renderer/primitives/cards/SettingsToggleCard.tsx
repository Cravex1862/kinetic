import React from 'react';
import { interpolate, interpolateColors } from 'remotion';
import { useFrame } from '../useFrame';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface SettingsToggleCardProps {
    glowConfig?: glowConfigProps;
    width?: number;
    height?: number;
    titleText: string;
    titleConfig?: TextFormatConfig;
    descriptionText?: string;
    descriptionConfig?: TextFormatConfig;
    toggled: boolean;
    clickFrame?: number;
    frame?: number;
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

export const SettingsToggleCard: React.FC<SettingsToggleCardProps> = ({
    glowConfig,
    width,
    height,
    titleText,
    titleConfig,
    descriptionText,
    descriptionConfig,
    toggled,
    clickFrame = 30,
    frame: propFrame,
    backgroundColor = "#121214",
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
    const currentFrame = useFrame(propFrame);

    const switchDuration = 10;
    const elapsed = currentFrame - clickFrame;
    let progress = 0;

    if (elapsed <= 0) {
        progress = 0;
    } else if (elapsed >= switchDuration) {
        progress = 1;
    } else {
        progress = elapsed / switchDuration;
    }

    const startState = toggled ? 0 : 1;
    const endState = toggled ? 1 : 0;
    const activeProgress = interpolate(progress, [0, 1], [startState, endState]);

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
        justifyContent: 'space-between',
        gap: '16px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '600',
        fontSize: '20px',
        margin: 0,
        lineHeight: 1.2,
        ...textFormatToStyle(titleConfig),
    }

    const descriptionStyle: React.CSSProperties = {
        fontSize: '14px',
        fontFamily: 'sans-serif',
        color: '#85858c',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        margin: 0,
        lineHeight: 1.4,
        ...textFormatToStyle(descriptionConfig)
    }

    const trackColor = interpolateColors(
        activeProgress,
        [0, 1],
        ['#2e2e33', glowConfig?.color || '#3b82f6']
    );

    const knobLeft = interpolate(activeProgress, [0, 1], [3, 25]);

    return (
        <div style={cardStyle} className='transition-all duration-300'>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <h3 style={titleStyle}>{titleText}</h3>
                {descriptionText && (
                    <p style={descriptionStyle}>{descriptionText}</p>
                )}
            </div>

            <div
                style={{
                    width: '50px',
                    height: '28px',
                    borderRadius: '999px',
                    backgroundColor: trackColor,
                    position: 'relative',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        position: 'absolute',
                        top: '3px',
                        left: `${knobLeft}px`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                />
            </div>
        </div>
    );
};
