import React from 'react';
import { glowConfigProps, TextFormatConfig, getGlowFilter, getTransform3DStyle, textFormatToStyle } from '../utils/styleHelpers';

export interface RegularCardProps {
    glowConfig?: glowConfigProps;
    titleText: string;
    titleConfig?: TextFormatConfig;
    paragraphText: string;
    paragraphConfig: TextFormatConfig;
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
}

export const RegularCard: React.FC<RegularCardProps> = ({
    glowConfig,
    titleText,
    titleConfig,
    paragraphText,
    paragraphConfig,
    width,
    height,
    backgroundColor,
    borderRadius,
    padding,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
}) => {
    const containerStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: height !== undefined ? `${height}px` : 'auto',
        backgroundColor: backgroundColor || '#121214',
        borderRadius: borderRadius !== undefined ? `${borderRadius}px` : '24px',
        padding: padding !== undefined ? `${padding}px` : '24px',
        filter: getGlowFilter(glowConfig),
        border: `1px solid rgba(255,255,255,0.08)`,
        boxSizing: 'border-box',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ),
    }
    return (
        <div style={containerStyle} className='transition-all duration-300'>
            <h3 style={textFormatToStyle(titleConfig)} className='m-0 font-sans tracking-wide'>{titleText}</h3>
            <div className='h-4' />
            <p style={textFormatToStyle(paragraphConfig)} className='m-0 font-sans opacity-90'>
                {paragraphText}
            </p>
        </div>
    );
}
