import React from 'react';

export interface MinecraftButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MinecraftButton: React.FC<MinecraftButtonProps> = ({
  label,
  onClick,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative px-6 py-2 bg-[#6c6c6c] ring-2 ring-black border-2 border-t-[#a8a8a8] border-l-[#a8a8a8] border-b-[#3c3c3c] border-r-[#3c3c3c] text-white font-mono font-bold text-xs tracking-wide transition-all hover:bg-[#7c7c7c] hover:border-white hover:text-amber-200 active:border-t-[#3c3c3c] active:border-l-[#3c3c3c] active:border-b-[#a8a8a8] active:border-r-[#a8a8a8] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="drop-shadow-[2px_2px_0px_#000000]">{label}</span>
    </button>
  );
};
