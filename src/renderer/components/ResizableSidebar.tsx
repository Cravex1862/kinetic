import React, { useState, useEffect, useRef } from 'react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onWidthChange?: (width: number) => void;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  initialWidth = 380,
  minWidth = 320,
  maxWidth = 650,
  className = '',
  onWidthChange,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        if (onWidthChange) onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className={`relative flex-shrink-0 flex flex-col ${className}`}
    >
      {children}

      {/* Vertical Drag Handle Bar */}
      <div
        onMouseDown={startResizing}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-30 transition-colors group flex items-center justify-center ${isResizing ? 'bg-purple-500' : 'hover:bg-purple-500/60 bg-transparent'}`}
        title="Drag to resize sidebar"
      >
        <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizing ? 'bg-white' : 'bg-gray-700 group-hover:bg-white'}`} />
      </div>
    </aside>
  );
};
