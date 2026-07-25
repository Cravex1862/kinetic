import React from 'react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';
import { getLowOpacityColor } from '../utils/colorHelpers';

export interface KanbanSubCardConfig {
    text: string;
    textColor: string;
    fontFamily?: string;
    fontSize?: number;
    maxSizeCap?: number;
}

export interface KanbanTaskCardProps {
    glowConfig: glowConfigProps;
    titleText: string;
    titleConfig?: TextFormatConfig;
    backgroundColor?: string;
    width?: number;
    height?: number;
    subCards: KanbanSubCardConfig[];
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
    glowConfig,
    titleText,
    titleConfig,
    backgroundColor = '#121214',
    width,
    height,
    subCards = [],
    borderRadius = 24,
    padding = 24,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
}) => {
    const activeSubCards = subCards.slice(0, 4);

    const cardStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: height !== undefined ? `${height}px` : 'auto',
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        filter: getGlowFilter(glowConfig),
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        boxSizing: `border-box`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '16px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '600',
        fontSize: '20px',
        margin: 0,
        ...textFormatToStyle(titleConfig),
    };

    return (
        <div style={cardStyle} className='transition-all duration-300'>
            <h3 style={titleStyle}>{titleText}</h3>
            {activeSubCards.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {activeSubCards.map((sub, index) => {
                        const subTextColor = sub.textColor || '#fff';
                        const subBgColor = getLowOpacityColor(subTextColor, 0.15);

                        const subStyle: React.CSSProperties = {
                            color: subTextColor,
                            backgroundColor: subBgColor,
                            fontFamily: sub.fontFamily || 'sans-serif',
                            fontSize: sub.fontSize ? `${sub.fontSize}px` : '12px',
                            maxWidth: sub.maxSizeCap ? `${sub.maxSizeCap}px` : '120px',
                            padding: `6px 12px`,
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            msTextOverflow: 'ellipsis',
                            fontWeight: '600',
                            boxSizing: 'border-box',
                        };
                        return (
                            <div key={index} style={subStyle} title={sub.text}>
                                {sub.text}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
