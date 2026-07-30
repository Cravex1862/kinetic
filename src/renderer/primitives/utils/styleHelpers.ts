import React from 'react';
import { GlowConfig } from '../types';

export interface glowConfigProps {
    enabled: boolean;
    color: string;
    intensity: number;
    spread: number;
}

export interface TextFormatConfig {
    size?: number;
    fontFamily?: string;
    color?: string;
    bold?: boolean;
    italics?: boolean;
    underline?: boolean;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    lineSpacing?: number;
    letterSpacing?: number;
}

// Glow filter for Cards SDK
export function getGlowFilter(glow?: glowConfigProps): string | undefined {
    if (!glow || !glow.enabled) return undefined;
    return `drop-shadow(0 0 ${glow.spread}px ${glow.color}) drop-shadow(0 0 ${glow.intensity * 6}px ${glow.color})`;
}

// Glow filter for Structural SDK
export function buildGlowFilter(glow?: GlowConfig): React.CSSProperties {
    if (!glow || !glow.enabled) return {};
    const blurPx = glow.intensity * 6;
    return {
        filter: `drop-shadow(0 0 ${glow.spread}px ${glow.color}) drop-shadow(0 0 ${blurPx}px ${glow.color})`,
        willChange: 'filter',
    };
}

// Text style config helper
export const textFormatToStyle = (cfg?: TextFormatConfig): React.CSSProperties => {
    if (!cfg) return {};
    return {
        fontSize: cfg.size ? `${cfg.size}px` : undefined,
        fontFamily: cfg.fontFamily,
        color: cfg.color,
        fontWeight: cfg.bold ? 'bold' : 'normal',
        fontStyle: cfg.italics ? 'italic' : 'normal',
        textDecoration: cfg.underline ? 'underline' : 'none',
        textAlign: cfg.alignment,
        lineHeight: cfg.lineSpacing !== undefined ? `${cfg.lineSpacing}` : undefined,
        letterSpacing: cfg.letterSpacing !== undefined ? `${cfg.letterSpacing}` : undefined,
    };
};

// 3D transform styling helper
export function getTransform3DStyle(
    rotateX?: number,
    rotateY?: number,
    rotateZ?: number,
    perspective?: number,
    translateZ?: number,
    translateX?: number,
    translateY?: number
): React.CSSProperties {
    const transformParts: string[] = [];
    if (perspective !== undefined && perspective > 0) {
        transformParts.push(`perspective(${perspective}px)`);
    }
    if (translateX !== undefined && translateX !== 0) transformParts.push(`translateX(${translateX}px)`);
    if (translateY !== undefined && translateY !== 0) transformParts.push(`translateY(${translateY}px)`);
    if (translateZ !== undefined && translateZ !== 0) transformParts.push(`translateZ(${translateZ}px)`);
    if (rotateX !== undefined) transformParts.push(`rotateX(${rotateX}deg)`);
    if (rotateY !== undefined) transformParts.push(`rotateY(${rotateY}deg)`);
    if (rotateZ !== undefined) transformParts.push(`rotateZ(${rotateZ}deg)`);

    return {
        transform: transformParts.length > 0 ? transformParts.join(' ') : undefined,
        transformStyle: transformParts.length > 0 ? 'preserve-3d' : undefined,
    };
}
