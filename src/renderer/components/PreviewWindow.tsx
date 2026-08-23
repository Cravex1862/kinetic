import React from "react";

interface PreviewWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  title = "Walkthrough Preview Canvas",
  children,
  className = "",
}) => {
  return (
    <div
      className={`w-full aspect-video rounded-2xl border border-gray-800 bg-gray-900 p-5 relative overflow-hidden flex flex-col flex-shrink-0 ${className}`}
    >
      <div className="text-center text-xs text-gray-500 border-b border-gray-800 pb-3 tracking-wider font-semibold z-10 select-none">
        {title}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full mt-4">
        {children}
      </div>
    </div>
  );
};
