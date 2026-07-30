import React from "react";
import { Easing } from 'remotion';
import { useFrame } from "../useFrame";
import { TextFormatConfig, getTransform3DStyle, textFormatToStyle } from "../utils/styleHelpers";

export interface DonutChartDataPoints {
    label: string;
    value: number;
    color?: string;
}

export interface DonutChartCardProps {
    width?: number;
    height?: number;
    titleText?: string;
    titleConfig?: TextFormatConfig;
    data: DonutChartDataPoints[];
    sliceColors?: string[];
    innerHoleRatio?: number;
    showLabels?: boolean;
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

const defaultSliceColors = [
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899',
]

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
    width,
    height = 400,
    titleText,
    titleConfig,
    data = [],
    sliceColors = defaultSliceColors,
    innerHoleRatio = 0.5,
    showLabels = true,
    labelConfig,
    backgroundColor = '#121214',
    borderRadius = 24,
    padding = 24,
    animDuration = 40,
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

    const totalVal = data.reduce((sum, item) => sum + item.value, 0);

    const progress = Math.min(frame / animDuration, 1);
    const easedProgress = Easing.out(Easing.bezier(0.25, 1, 0.5, 1))(progress);

    const cardStyle: React.CSSProperties = {
        width: width !== undefined ? `${width}px` : '100%',
        height: `${height}px`,
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
        color: '#e4e4e7',
        fontSize: '14px',
        ...textFormatToStyle(labelConfig),
    };

    const chartHeight = height - (padding * 2) - (titleText ? 60 : 20);
    const cx = chartHeight / 2;
    const cy = chartHeight / 2;
    const r = chartHeight / 2.4;
    const innerR = r * Math.max(0.1, Math.min(0.9, innerHoleRatio));

    let currentAngle = -90;
    const slices = data.map((item, idx) => {
        const valuePercentage = totalVal > 0 ? item.value / totalVal : 0;
        const sweepAngle = valuePercentage * 360 * easedProgress;
        const endAngle = currentAngle + sweepAngle;

        const startAngleRad = (currentAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;

        const x1 = cx + r * Math.cos(startAngleRad);
        const y1 = cy + r * Math.sin(startAngleRad);
        const x2 = cx + r * Math.cos(endAngleRad);
        const y2 = cy + r * Math.sin(endAngleRad);

        const x3 = cx + innerR * Math.cos(endAngleRad);
        const y3 = cy + innerR * Math.sin(endAngleRad);
        const x4 = cx + innerR * Math.cos(startAngleRad);
        const y4 = cy + innerR * Math.sin(startAngleRad);

        const largeArcFlag = sweepAngle > 180 ? 1 : 0;

        const pathData = sweepAngle >= 359.99
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} M ${cx} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx - 0.01} ${cy - innerR} Z`
            : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

        currentAngle = currentAngle + valuePercentage * 360;

        return {
            pathData,
            color: item.color || sliceColors[idx % sliceColors.length],
            percentage: Math.round(valuePercentage * 100),
            label: item.label,
        };
    });

    return (
        <div style={cardStyle} className="transition-all duration-300">

            {titleText && <h3 style={titleStyle}>{titleText}</h3>}

            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: '40px', height: `${chartHeight}px` }}>
                <svg width={chartHeight} height={chartHeight} style={{ overflow: 'visible' }}>
                    {totalVal > 0 ? (
                        slices.map((slice, idx) => (
                            <path
                                key={idx}
                                d={slice.pathData}
                                fill={slice.color}
                                stroke={backgroundColor}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                fillRule="evenodd"
                            />
                        ))
                    ) : (
                        <path
                            d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} M ${cx} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx - 0.01} ${cy - innerR} Z`}
                            fill="rgba(255,255,255,0.05)"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={2}
                            fillRule="evenodd"
                        />
                    )}
                </svg>

                {showLabels && totalVal > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        {slices.map((slice, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: slice.color, flexShrink: 0 }} />
                                <span style={labelStyle}>
                                    {slice.label} <span style={{ color: '#71717a', marginLeft: '4px' }}>({slice.percentage}%)</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};