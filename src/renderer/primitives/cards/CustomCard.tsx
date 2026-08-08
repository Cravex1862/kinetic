import React from 'react';
import { GlowConfig, StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CustomCardProps extends BaseMotionProps {
  children: React.ReactNode;
  glowConfig?: GlowConfig;
  styleConfig?: StyleConfig;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  variant?: CardVariant;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  headerText?: string;
  footerText?: string;
  headerBackground?: string;
  footerBackground?: string;
}

function variantStyle(v: CardVariant, bc: string | undefined, bw: number | undefined): React.CSSProperties {
  if (v === 'elevated') return { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
  if (v === 'outlined') return { border: `${bw ?? 1}px solid ${bc ?? '#374151'}` };
  return {};
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  glowConfig,
  styleConfig,
  width = '100%',
  height,
  borderRadius = 12,
  borderColor,
  borderWidth,
  padding = 16,
  variant = 'elevated',
  header,
  footer,
  headerText,
  footerText,
  headerBackground,
  footerBackground,
}) => {
  const resolvedHeader = header ?? (headerText ? <span className="text-sm font-semibold text-white">{headerText}</span> : undefined);
  const resolvedFooter = footer ?? (footerText ? <span className="text-xs text-gray-500">{footerText}</span> : undefined);
  const sc = configToStyle(styleConfig);
  const glow = buildGlowFilter(glowConfig);
  const cardStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    borderRadius: `${borderRadius}px`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: sc.backgroundColor ?? '#1f2937',
    ...variantStyle(variant, borderColor, borderWidth),
    ...glow,
    ...sc,
  };

  return (
    <div style={cardStyle}>
      {resolvedHeader && (
        <div
          style={{
            padding: `${padding}px`,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: headerBackground ?? 'transparent',
            ...sc,
          }}
        >
          {resolvedHeader}
        </div>
      )}
      <div style={{ flex: 1, padding: `${padding}px`, ...sc }}>{children}</div>
      {resolvedFooter && (
        <div
          style={{
            padding: `${padding}px`,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: footerBackground ?? 'transparent',
            ...sc,
          }}
        >
          {resolvedFooter}
        </div>
      )}
    </div>
  );
};
