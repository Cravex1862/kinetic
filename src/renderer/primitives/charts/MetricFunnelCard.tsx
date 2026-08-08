import { BaseMotionProps } from '../types';
import React from "react";
import { Easing } from "remotion";
import { useFrame } from "../useFrame";
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from "../utils/styleHelpers";

export interface FunnelStepData {
    label: string;
    value: number;
    color?: string;
}

export interface MetricFunnelCardProps extends BaseMotionProps {
    width?: number;
    height?: number;
    titleText?: string;
    titleConfig?: TextFormatConfig;
    data: FunnelStepData[];
    barColor?: string;
    barSpacing?: number;
    barBorderRadius?: number;
    showValues?: boolean;
    showPercentages?: boolean;
    labelConfig?: TextFormatConfig;
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
  translateX?: number;
  translateY?: number;
}

export const MetricFunnelCard: React.FC<MetricFunnelCardProps> = ({
    width,
    height,
    titleText,
    titleConfig,
    data = [],
    barColor = '#8b5cf6',
    barSpacing = 12,
    barBorderRadius = 12,
    showValues = false,
    showPercentages = false,
    labelConfig,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 24,
    animDuration = 45,
    frame: propFrame,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
  translateX,
  translateY,
}) => {
    const frame = useFrame(propFrame);

    const topVal = data[0]?.value || 1;

    const progress = Math.min(frame / animDuration, 1);
    const easedProgress = Easing.out(Easing.bezier(0.25, 1, 0.5, 1))(progress);

    const cardStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: height !== undefined ? `${height}px` : 'auto',
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
    };

    const titleStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '28px',
        margin: 0,
        ...textFormatToStyle(titleConfig),
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '600',
        fontSize: '16px',
        ...textFormatToStyle(labelConfig),
    };

    return (
        <div style={cardStyle} className="transition-all duration-300">
            {titleText && <h3 style={titleStyle}>{titleText}</h3>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: `${barSpacing}px`, alignItems: 'center', width: '100%' }}>
                {data.map((step, idx) => {
                    const delayStart = idx * 3;
                    const itemProgress = Math.min(Math.max(0, frame - delayStart) / (animDuration - delayStart), 1);
                    const itemEased = Easing.out(Easing.bezier(0.25, 1, 0.5, 1))(itemProgress);

                    const widthPercent = topVal > 0 ? (step.value / topVal) * 100 : 0;

                    const animatedWidth = widthPercent * itemEased;
                    const pctText = showPercentages ? ` (${Math.round((step.value / topVal) * 100)}%)` : '';
                    const valText = showValues ? ` - ${step.value}` : '';

                    return (
                        <div
                            key={idx}
                            style={{
                                width: `${animatedWidth}%`,
                                backgroundColor: step.color || barColor,
                                borderRadius: `${barBorderRadius}px`,
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                opacity: itemEased,
                                transition: 'background-color 0.3s ease',
                                minWidth: '40px',
                            }}
                        >
                            <span style={labelStyle}>
                                {step.label}
                                {valText}
                                {pctText}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};