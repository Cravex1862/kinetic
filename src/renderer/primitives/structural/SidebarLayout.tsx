import React, { useState } from 'react';
import { StyleConfig, configToStyle, GlowConfig } from '../types';
import { buildGlowFilter, getTransform3DStyle } from '../utils/styleHelpers';

export interface SideBarMenuItem {
  id?: string;
  label?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export interface SidebarLayoutProps {
  children?: React.ReactNode;
  appName?: string;
  appLogo?: React.ReactNode;
  showCollapseButton?: boolean;
  onCollapseClick?: () => void;
  menuItems?: SideBarMenuItem[];
  activeMenuItemId?: string;
  onSelectMenuItem?: (item: SideBarMenuItem) => void;
  showProfileFooter?: boolean;
  profileName?: string;
  profileHandle?: string;
  profileAvatar?: React.ReactNode;
  isVerified?: boolean;
  showSettings?: boolean;
  onSetttingsClick?: () => void;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  style?: StyleConfig;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  perspective?: number;
  translateZ?: number;
  translateX?: number;
  translateY?: number;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  appName = "Name",
  appLogo,
  showCollapseButton = true,
  onCollapseClick,
  menuItems = [
    { label: 'Home', active: true },
    { label: 'Option 1' },
    { label: 'Option 2' },
    { label: 'Option 3' },
    { label: 'Option 4' },
  ],
  activeMenuItemId,
  onSelectMenuItem,
  showProfileFooter = true,
  profileName = "Profile Name",
  profileHandle = "@profile",
  profileAvatar,
  isVerified = true,
  showSettings = true,
  onSetttingsClick,
  width = 260,
  height = 550,
  backgroundColor = '#121214',
  borderRadius = 24,
  padding = 20,
  style,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  translateZ,
  translateX,
  translateY,
}) => {

  const [selectedId, setSelectedId] = useState<string | undefined>(activeMenuItemId);
  const customStyle = configToStyle(style);

  const outerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height == 'number' ? `${height}px` : height,
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: '1px solid rgba(255,255,255,0.08)',
    boxSizing: 'border-box',
    padding: `${padding}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    userSelect: 'none',
    ...customStyle,
    ...getTransform3DStyle(rotateX, rotateY, rotateZ, perspective, translateZ, translateX, translateY),
  };

  return (

    <div style={outerStyle}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {appLogo ? (
            appLogo
          ) : (
            <div style={{ width: '36px', height: '36px', backgroundColor: 'd4d4d8', borderRadius: '6px', flexShrink: 0 }} />
          )}
          {appName && (
            <span style={{ fontFamily: 'sans-serif', color: '#fff', fontSize: '18px', fontWeight: '600' }}>
              {appName}
            </span>
          )}
        </div>

        {showCollapseButton && (
          <div style={{ cursor: 'pointer', color: '#a1a1aa', padding: '4px', display: 'flex', alignItems: 'center' }}
            onClick={onCollapseClick}
          >
            <svg width='18' height="18" viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth="2" strokeLinecap='round' strokeLinejoin='round'>
              <path d="M11 19l-7-7 7-7" />
              <path d="M19 19V5" />
            </svg>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item, idx) => {
          const itemId = item.id || item.label || `item-${idx}`;
          const isActive = selectedId ? selectedId === itemId : (item.active || idx === 0);
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? '#fff' : '#a1a1aa',
                cursor: 'pointer',
                transition: 'backgroundColor 0.2s ease, color 0.2s ease',
              }}
              onClick={() => {
                setSelectedId(itemId);
                if (item.onClick) item.onClick;
                if (onSelectMenuItem) onSelectMenuItem(item);
              }}
            >
              {item.icon ? (
                item.icon
              ) : (
                <div style={{ width: '22px', height: '22px', backgroundColor: isActive ? '#e4e4e7' : '#52525b', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <span style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: isActive ? '600' : '400' }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {
        children && (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', margin: '16px 0', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            {children}
          </div>
        )
      }

      {
        showProfileFooter && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {profileAvatar ? (
                profileAvatar
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'sans-serif', color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                    {profileName}
                  </span>
                  {isVerified && (
                    <svg width="15" height="15" viewBox='0 0 24 24' fill="#0095f6">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
                {profileHandle && (
                  <span style={{ fontFamily: 'sans-serif', color: '#71717a', fontSize: '12px' }}>
                    {profileHandle}
                  </span>
                )}
              </div>

            </div>

            {showSettings && (
              <div
                style={{ cursor: 'pointer', color: '#a1a1aa', padding: '6px', display: 'flex', alignSelf: 'center', borderRadius: '50%' }}
                onClick={onSetttingsClick}
              >
                <svg width="20" height="20" viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth="1.8" strokeLinecap='round' strokeLinejoin='round'>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
            )}
          </div>
        )
      }
    </div>

  )


}
