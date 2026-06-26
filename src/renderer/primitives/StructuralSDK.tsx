import React from 'react';
import { StyleConfig, configToStyle } from './types';
import type { GlowConfig } from './types';

export type { GlowConfig };

type GlowStyle = {
  filter: string;
  willChange: string;
};

function buildGlowFilter(glow?: GlowConfig): Partial<GlowStyle> {
  const g = glow || { enabled: true, color: `rgba(99,102,241, 0.25)`, intensity: 1, spread: 15 };
  if (!glow || !glow.enabled) return {};
  const blurPx = glow.intensity * 6;
  return {
    filter: `drop-shadow(0 0 ${glow.spread}px ${glow.color}) drop-shadow(0 0 ${blurPx}px ${glow.color})`,
    willChange: 'filter',
  };
}

type AspectRatio = '16:9' | '9:16' | '4:3' | '1:1';
const aspectRatioMap: Record<AspectRatio, string> = {
  '16:9': '16 / 9',
  '9:16': '9 / 16',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
};


// ─── BrowserFrame ────────────────────────────────────────────
interface BrowserFrameProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  url?: string;
  panelSize?: 'small' | 'medium' | 'large';
  windowStyle?: 'mac' | 'windows';
  style?: StyleConfig;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  translateZ?: number;
}

const panelPadding: Record<string, string> = {
  small: 'p-4',
  medium: 'p-6',
  large: 'p-8',
};

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  glowConfig,
  url = 'https://app.example.com',
  panelSize = 'medium',
  windowStyle = 'mac',
  style,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  translateZ,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);

  const transformParts = [];
  if (perspective !== undefined) transformParts.push(`perspective(${perspective}px)`);
  if (rotateX !== undefined) transformParts.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== undefined) transformParts.push(`rotateY(${rotateY}deg)`);
  if (rotateZ !== undefined) transformParts.push(`rotateZ(${rotateZ}deg)`);
  if (translateZ !== undefined) transformParts.push(`translateZ(${translateZ}px)`);

  const transformStyle: React.CSSProperties = transformParts.length > 0 ? {
    transform: transformParts.join(' '),
    transformStyle: 'preserve-3d',
  } : {};
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col" style={{ width: '100%', height: '100%', ...glow, ...us, ...transformStyle }}>
      <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-3">
        {windowStyle === 'mac' ? (
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        ) : (
          <div className="flex gap-1.5">
            <span className="text-xs text-gray-500">&#8212;</span>
            <span className="text-xs text-gray-500">&#9744;</span>
            <span className="text-xs text-gray-500">&#10005;</span>
          </div>
        )}
        <div className="mx-4 flex-1 truncate rounded-md bg-gray-700 px-3 py-1.5 text-center text-sm text-gray-300" style={us}>
          {url}
        </div>
        {windowStyle === 'windows' && (
          <div className="flex gap-1.5">
            <span className="text-xs text-gray-500">&#8212;</span>
            <span className="text-xs text-gray-500">&#9744;</span>
            <span className="text-xs text-gray-500">&#10005;</span>
          </div>
        )}
      </div>
      <div className={`bg-gray-900 flex-1 ${panelPadding[panelSize]}`} style={us}>{children}</div>
    </div>
  );
};

// ─── AppCanvas ───────────────────────────────────────────────
interface AppCanvasProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  aspectRatio?: AspectRatio;
  width?: number;
  height?: number;
  style?: StyleConfig;
}

export const AppCanvas: React.FC<AppCanvasProps> = ({
  children,
  glowConfig,
  aspectRatio = '16:9',
  width,
  height,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const dims: React.CSSProperties = {};
  if (width) dims.width = width;
  if (height) dims.height = height;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden bg-gray-950"
      style={{ width: '100%', height: '100%', aspectRatio: aspectRatioMap[aspectRatio], ...dims, ...glow, ...us }}
    >
      {children}
    </div>
  );
};

// ─── MockWindow ──────────────────────────────────────────────
interface MockWindowProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  visible: boolean;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  windowStyle?: 'mac' | 'windows';
  style?: StyleConfig;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective: number;
  translateZ: number;
}

export const MockWindow: React.FC<MockWindowProps> = ({
  children,
  glowConfig,
  visible,
  top = 50,
  left = 50,
  width = 400,
  height = 300,
  windowStyle = 'mac',
  style,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  translateZ,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const transformParts = [];
  if (perspective !== undefined) transformParts.push(`perspective(${perspective}px)`);
  if (rotateX !== undefined) transformParts.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== undefined) transformParts.push(`rotateY(${rotateY}deg)`);
  if (rotateZ !== undefined) transformParts.push(`rotateZ(${rotateZ}deg)`);
  if (translateZ !== undefined) transformParts.push(`translateZ(${translateZ}px)`);

  const transformStyle: React.CSSProperties = transformParts.length > 0 ? {
    transform: transformParts.join(' '),
    transformStyle: 'preserve-3d',
  } : {};
  if (!visible) return null;
  return (
    <div
      className="absolute z-50 overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-2xl"
      style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px`, ...glow, ...us, ...transformStyle }}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-700 bg-gray-800 px-3 py-2" style={us}>
        {windowStyle === 'mac' ? (
          <><div className="h-2 w-2 rounded-full bg-red-500" /><div className="h-2 w-2 rounded-full bg-yellow-500" /><div className="h-2 w-2 rounded-full bg-green-500" /></>
        ) : (
          <div className="flex gap-1 ml-auto"><span className="text-[10px] text-gray-500">&#8212;</span><span className="text-[10px] text-gray-500">&#9744;</span><span className="text-[10px] text-gray-500">&#10005;</span></div>
        )}
      </div>
      <div className="p-4" style={us}>{children}</div>
    </div>
  );
};

// ─── SidebarLayout ───────────────────────────────────────────
interface SidebarLayoutProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  sidebarContent: React.ReactNode;
  collapsed?: boolean;
  sidebarWidth?: number;
  sidebarPosition?: 'left' | 'right';
  style?: StyleConfig;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  glowConfig,
  sidebarContent,
  collapsed = false,
  sidebarWidth = 240,
  sidebarPosition = 'left',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const sidebar = (
    <div
      className={`flex-shrink-0 ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-gray-700 bg-gray-900 transition-all duration-300`}
      style={{ width: collapsed ? 0 : `${sidebarWidth}px`, overflow: collapsed ? 'hidden' : 'visible' }}
    >
      <div className="h-full p-4" style={{ minWidth: `${sidebarWidth}px`, ...us }}>
        {sidebarContent}
      </div>
    </div>
  );
  return (
    <div className="flex" style={{ width: '100%', height: '100%', ...glow }}>
      {sidebarPosition === 'left' && sidebar}
      <div className="flex-1 overflow-auto bg-gray-950" style={us}>{children}</div>
      {sidebarPosition === 'right' && sidebar}
    </div>
  );
};

// ─── DataGridContainer ───────────────────────────────────────
interface DataGridContainerProps {
  children: React.ReactNode;
  glowConfig: GlowConfig;
  columns?: number;
  gap?: number;
  style?: StyleConfig;
}

export const DataGridContainer: React.FC<DataGridContainerProps> = ({
  children,
  glowConfig,
  columns = 3,
  gap = 4,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div
      className="grid p-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 4}px`,
        ...glow,
        ...us,
      }}
    >
      {children}
    </div>
  );
};

// ─── TopNavbar ───────────────────────────────────────────────
interface TopNavbarProps {
  glowConfig: GlowConfig;
  logo: React.ReactNode;
  brandName?: string;
  searchPlaceholder?: string;
  actions?: React.ReactNode[];
  style?: StyleConfig;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  glowConfig,
  logo,
  brandName,
  searchPlaceholder = 'Search...',
  actions = [],
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-6 py-3" style={{ ...glow, ...us }}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{logo}</div>
        {brandName && <span className="hidden text-sm font-semibold text-white sm:inline" style={us}>{brandName}</span>}
        <div
          className="rounded-md bg-gray-800 px-4 py-2 text-sm text-gray-400 ring-1 ring-gray-600 transition-colors focus-within:ring-indigo-500"
          style={us}
        >
          {searchPlaceholder}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions.map((action, i) => (
          <div key={i}>{action}</div>
        ))}
      </div>
    </div>
  );
};

// ─── HeroMetricCard ──────────────────────────────────────────
interface HeroMetricCardProps {
  glowConfig: GlowConfig;
  primaryText: string;
  captionText: string;
  trend?: 'up' | 'down' | 'neutral';
  style?: StyleConfig;
}

const trendColors: Record<string, string> = {
  up: 'text-emerald-400',
  down: 'text-rose-400',
  neutral: 'text-gray-400',
};

const trendArrows: Record<string, string> = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
};

export const HeroMetricCard: React.FC<HeroMetricCardProps> = ({
  glowConfig,
  primaryText,
  captionText,
  trend = 'neutral',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-900 p-8 text-center shadow-lg"
      style={{ ...glow, ...us }}
    >
      <span className="text-5xl font-bold tracking-tight text-white" style={us}>
        {primaryText}
      </span>
      <span className="mt-2 flex items-center gap-1 text-sm text-gray-400">
        <span className={trendColors[trend]}>{trendArrows[trend]}</span>
        <span style={us}>{captionText}</span>
      </span>
    </div>
  );
};

// ─── ActionButton ────────────────────────────────────────────
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonLayout = 'icon-only' | 'label-only' | 'icon-label';

interface ActionButtonProps {
  glowConfig: GlowConfig;
  size: ButtonSize;
  icon?: string;
  label: string;
  layout?: ButtonLayout;
  onClick?: () => void;
  style?: StyleConfig;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  glowConfig,
  size,
  icon,
  label,
  layout = 'label-only',
  onClick,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg bg-indigo-600 font-medium text-white transition-all duration-150 hover:bg-indigo-500 active:scale-95 ${sizeStyles[size]}`}
      style={{ ...glow, ...us }}
    >
      {layout !== 'label-only' && icon && <span>{icon}</span>}
      {layout !== 'icon-only' && <span>{label}</span>}
    </button>
  );
};

// ─── SplitHeroLayout ──────────────────────────────────────────
interface SplitHeroLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  glowConfig: GlowConfig;
  splitRatio?: number;
  style?: StyleConfig;
}

export const SplitHeroLayout: React.FC<SplitHeroLayoutProps> = ({
  leftPanel,
  rightPanel,
  glowConfig,
  splitRatio = 0.5,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const leftPct = `${Math.round(splitRatio * 100)}%`;
  return (
    <div className="flex" style={{ width: '100%', height: '100%', ...glow, ...us }}>
      <div className="flex items-center justify-center p-8" style={{ width: leftPct, ...us }}>
        {leftPanel}
      </div>
      <div className="flex items-center justify-center border-l border-gray-700 p-8" style={{ flex: 1, ...us }}>
        {rightPanel}
      </div>
    </div>
  );
};

// ─── TabSwitcherContainer ─────────────────────────────────────
interface TabSwitcherContainerProps {
  tabs: string[];
  activeTab: number;
  glowConfig: GlowConfig;
  direction?: 'horizontal' | 'vertical';
  style?: StyleConfig;
}

export const TabSwitcherContainer: React.FC<TabSwitcherContainerProps> = ({
  tabs,
  activeTab,
  glowConfig,
  direction = 'horizontal',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const isHorizontal = direction === 'horizontal';
  return (
    <div
      className={`relative flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-stretch rounded-lg bg-gray-900`}
      style={{ ...glow, ...us }}
    >
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={`relative z-10 flex-1 px-4 py-2 text-center text-sm font-medium transition-colors duration-200 ${i === activeTab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          style={us}
        >
          {tab}
        </div>
      ))}
      <div
        className="absolute z-0 rounded-md bg-indigo-600 transition-all duration-300"
        style={
          isHorizontal
            ? { left: `${(100 / tabs.length) * activeTab}%`, width: `${100 / tabs.length}%`, top: 2, bottom: 2 }
            : { top: `${(100 / tabs.length) * activeTab}%`, height: `${100 / tabs.length}%`, left: 2, right: 2 }
        }
      />
    </div>
  );
};

// ─── BreadcrumbHeader ─────────────────────────────────────────
interface BreadcrumbHeaderProps {
  pathSequence: string[];
  separator?: string;
  glowConfig: GlowConfig;
  style?: StyleConfig;
}

export const BreadcrumbHeader: React.FC<BreadcrumbHeaderProps> = ({
  pathSequence,
  separator = '/',
  glowConfig,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  return (
    <div className="flex items-center gap-1 px-4 py-2 text-sm text-gray-400" style={{ ...glow, ...us }}>
      {pathSequence.map((segment, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-1 text-gray-600" style={us}>{separator}</span>}
          <span className={i === pathSequence.length - 1 ? 'font-medium text-white' : ''} style={us}>
            {segment}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── NotificationToaster ──────────────────────────────────────
type ToastPosition = 'top-right' | 'bottom-right' | 'top-left' | 'top-full' | 'bottom-full';

interface NotificationToasterProps {
  notifications: React.ReactNode[];
  glowConfig: GlowConfig;
  position?: ToastPosition;
  style?: StyleConfig;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'top-full': 'top-4 left-4 right-4',
  'bottom-full': 'bottom-4 left-4 right-4',
};

export const NotificationToaster: React.FC<NotificationToasterProps> = ({
  notifications,
  glowConfig,
  position = 'top-right',
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const isFullWidth = position === 'top-full' || position === 'bottom-full';
  return (
    <div className={`pointer-events-none absolute z-[999] flex flex-col gap-2 ${positionStyles[position]}`} style={{ ...glow, ...us }}>
      {notifications.map((n, i) => (
        <div
          key={i}
          className={`pointer-events-auto rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 shadow-2xl backdrop-blur-sm transition-all ${isFullWidth ? 'w-full' : ''}`}
          style={{ transform: `translateY(${i * 4}px)`, ...us }}
        >
          {n}
        </div>
      ))}
    </div>
  );
};
