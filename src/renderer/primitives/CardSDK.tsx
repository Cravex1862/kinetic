import React from 'react';
import { GlowConfig, StyleConfig, configToStyle } from './types';

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CustomCardProps {
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

function glowCSS(g?: GlowConfig): React.CSSProperties {
  if (!g?.enabled) return {};
  return { filter: `drop-shadow(0 0 ${g.spread}px ${g.color}) drop-shadow(0 0 ${g.intensity * 6}px ${g.color})`, willChange: 'filter' };
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
  const cardStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    borderRadius: `${borderRadius}px`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: sc.backgroundColor ?? '#1f2937',
    ...variantStyle(variant, borderColor, borderWidth),
    ...glowCSS(glowConfig),
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

// ─── GlassmorphicCard ─────────────────────────────────────────
interface GlassmorphicCardProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  blur?: number;
  saturate?: number;
  borderOpacity?: number;
  width?: number | string;
  height?: number | string;
  style?: StyleConfig;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  glowConfig,
  blur = 12,
  saturate = 1.4,
  borderOpacity = 0.2,
  width,
  height,
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  return (
    <div
      style={{
        backdropFilter: `blur(${blur}px) saturate(${saturate})`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate})`,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '16px',
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        padding: '20px',
        width: width ?? '100%',
        height: height ?? undefined,
        ...glow,
        ...us,
      }}
    >
      {children}
    </div>
  );
};

// ─── ProfileHeaderCard ────────────────────────────────────────
interface ProfileHeaderCardProps {
  glowConfig: GlowConfig;
  avatarUrl?: string;
  avatarInitials?: string;
  name: string;
  handle: string;
  metadata?: React.ReactNode;
  badgeText?: string;
  style?: StyleConfig;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  glowConfig,
  avatarUrl,
  avatarInitials,
  name,
  handle,
  metadata,
  badgeText,
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  const resolvedMetadata = metadata ?? (badgeText ? <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{badgeText}</span> : undefined);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-900 p-4" style={{ ...glow, ...us }}>
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {avatarInitials ?? name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate" style={us}>{name}</div>
        <div className="text-xs text-gray-400 truncate" style={us}>{handle}</div>
      </div>
      {resolvedMetadata && <div className="flex-shrink-0" style={us}>{resolvedMetadata}</div>}
    </div>
  );
};

// ─── FeatureBenefitCard ───────────────────────────────────────
interface FeatureBenefitCardProps {
  glowConfig: GlowConfig;
  icon: React.ReactNode;
  header: string;
  description: string;
  accentColor?: string;
  style?: StyleConfig;
}

export const FeatureBenefitCard: React.FC<FeatureBenefitCardProps> = ({
  glowConfig,
  icon,
  header,
  description,
  accentColor = '#6366f1',
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  const iconBg = { backgroundColor: `${accentColor}33` };
  const iconColor = { color: accentColor };
  return (
    <div className="rounded-xl bg-gray-900 p-5" style={{ ...glow, ...us }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ ...iconBg, ...iconColor, ...us }}>
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-white" style={us}>{header}</h3>
      <p className="text-sm leading-relaxed text-gray-400" style={us}>{description}</p>
    </div>
  );
};

// ─── PricingPlanCard ──────────────────────────────────────────
interface PricingPlanCardProps {
  glowConfig: GlowConfig;
  price: string;
  period?: string;
  features: string[];
  ctaLabel: string;
  onCtaClick?: () => void;
  highlighted?: boolean;
  accentColor?: string;
  style?: StyleConfig;
}

export const PricingPlanCard: React.FC<PricingPlanCardProps> = ({
  glowConfig,
  price,
  period = '/mo',
  features,
  ctaLabel,
  onCtaClick,
  highlighted = false,
  accentColor = '#6366f1',
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  return (
    <div
      className={`flex flex-col rounded-xl p-6 ${highlighted ? 'border-2 bg-gray-800' : 'border border-gray-700 bg-gray-900'}`}
      style={{ borderColor: highlighted ? accentColor : undefined, ...glow, ...us }}
    >
      <div className="mb-4">
        <span className="text-4xl font-bold text-white" style={us}>{price}</span>
        <span className="ml-1 text-sm text-gray-400" style={us}>{period}</span>
      </div>
      <ul className="mb-6 flex-1 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-emerald-400">&#10003;</span>
            <span style={us}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onCtaClick}
        className={`w-full rounded-lg py-2.5 text-sm font-medium transition-colors text-white`}
        style={{ backgroundColor: highlighted ? accentColor : undefined, ...(highlighted ? {} : { backgroundColor: '#374151', color: '#d1d5db' }), ...us }}
      >
        {ctaLabel}
      </button>
    </div>
  );
};

// ─── KanbanTaskCard ───────────────────────────────────────────
interface KanbanTaskCardProps {
  glowConfig: GlowConfig;
  title: string;
  status: string;
  statusColor?: string;
  priorityLabel?: string;
  assigneeAvatars?: string[];
  deadline?: string;
  style?: StyleConfig;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
  glowConfig,
  title,
  status,
  statusColor = '#f59e0b',
  priorityLabel,
  assigneeAvatars = [],
  deadline,
  style,
}) => {
  const resolvedStatus = priorityLabel ?? status;
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  return (
    <div className="rounded-xl bg-gray-900 p-4" style={{ ...glow, ...us }}>
      <div className="mb-3 flex items-start justify-between">
        <span className="text-sm font-medium text-white" style={us}>{title}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: statusColor, ...us }}>{resolvedStatus}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex">
          {assigneeAvatars.slice(0, 3).map((a, i) => (
            <div key={i} className="-ml-1.5 first:ml-0 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-[10px] font-medium text-gray-300 ring-2 ring-gray-900">
              {a}
            </div>
          ))}
          {assigneeAvatars.length > 3 && (
            <div className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-[10px] text-gray-400 ring-2 ring-gray-900">
              +{assigneeAvatars.length - 3}
            </div>
          )}
        </div>
        {deadline && <span className="text-xs text-gray-500" style={us}>{deadline}</span>}
      </div>
    </div>
  );
};

// ─── BillingInvoiceCard ───────────────────────────────────────
interface BillingInvoiceCardProps {
  glowConfig: GlowConfig;
  description: string;
  amount: string;
  dueDate?: string;
  status?: 'paid' | 'pending' | 'overdue';
  style?: StyleConfig;
}

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Paid' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
  overdue: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Overdue' },
};

export const BillingInvoiceCard: React.FC<BillingInvoiceCardProps> = ({
  glowConfig,
  description,
  amount,
  dueDate,
  status,
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  const badge = status ? statusBadge[status] : undefined;
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3" style={{ ...glow, ...us }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate" style={us}>{description}</span>
          {badge && <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>}
        </div>
        {dueDate && <div className="text-xs text-gray-500 mt-0.5" style={us}>{dueDate}</div>}
      </div>
      <div className="text-sm font-semibold text-white flex-shrink-0 ml-3" style={us}>{amount}</div>
    </div>
  );
};

// ─── SettingsToggleCard ───────────────────────────────────────
interface SettingsToggleCardProps {
  glowConfig: GlowConfig;
  label: string;
  description: string;
  toggled: boolean;
  onToggle: (val: boolean) => void;
  toggleSize?: 'sm' | 'md';
  transitionDuration?: number;
  style?: StyleConfig;
}

const toggleSizes: Record<string, { track: string; knob: string; translate: string }> = {
  sm: { track: 'h-5 w-9', knob: 'h-3.5 w-3.5', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', knob: 'h-5 w-5', translate: 'translate-x-5' },
};

export const SettingsToggleCard: React.FC<SettingsToggleCardProps> = ({
  glowConfig,
  label,
  description,
  toggled,
  onToggle,
  toggleSize = 'md',
  transitionDuration = 150,
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  const sz = toggleSizes[toggleSize];
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3" style={{ ...glow, ...us }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white" style={us}>{label}</div>
        <div className="text-xs text-gray-400" style={us}>{description}</div>
      </div>
      <button
        onClick={() => onToggle(!toggled)}
        className={`relative ml-4 flex-shrink-0 rounded-full transition-colors ${sz.track} ${toggled ? 'bg-indigo-600' : 'bg-gray-700'}`}
        style={{ transitionDuration: `${transitionDuration}ms`, ...us }}
      >
        <div
          className={`absolute left-0.5 top-0.5 rounded-full bg-white shadow ${sz.knob} ${toggled ? sz.translate : ''}`}
          style={{ transition: `transform ${transitionDuration}ms ease`, ...us }}
        />
      </button>
    </div>
  );
};

// ─── PushNotificationToast ─────────────────────────────────────
interface PushNotificationToastProps {
  glowConfig: GlowConfig;
  icon: React.ReactNode;
  appName: string;
  title: string;
  body: string;
  time?: string;
  borderRadius?: number;
  style?: StyleConfig;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  glowConfig,
  icon,
  appName,
  title,
  body,
  time,
  borderRadius = 16,
  style,
}) => {
  const glow = glowConfig?.enabled
    ? { filter: `drop-shadow(0 0 ${glowConfig.spread}px ${glowConfig.color}) drop-shadow(0 0 ${glowConfig.intensity * 6}px ${glowConfig.color})` }
    : {};
  const us = configToStyle(style);
  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{
        borderRadius: `${borderRadius}px`,
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        backgroundColor: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.06) inset',
        ...glow,
        ...us,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white" style={us}>{appName}</span>
          {time && <span className="text-[10px] text-gray-400" style={us}>{time}</span>}
        </div>
        <div className="text-sm font-medium text-white leading-tight mt-0.5" style={us}>{title}</div>
        <div className="text-xs text-gray-400 leading-tight mt-0.5 line-clamp-2" style={us}>{body}</div>
      </div>
    </div>
  );
};
