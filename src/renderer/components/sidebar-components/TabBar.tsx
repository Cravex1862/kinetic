import React from "react";

type TabState = "output" | "raw";

interface TabBarProps {
  active: TabState;
  onChange: (tab: TabState) => void;
  showRaw?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  active,
  onChange,
  showRaw = true,
}) => (
  <div className="flex w-full justify-evenly">
    <div className="grow flex justify-center flex-col">
      <button
        className={`${active === "output" ? "border-t border-r border-l border-gray-800" : "border-b border-gray-800"} grow rounded-t-md text-xs hover:text-purple-400 p-1`}
        onClick={() => onChange("output")}
      >
        Output
      </button>
    </div>
    {showRaw && (
      <div className="grow bg-gray-900 flex justify-center">
        <button
          className={`${active === "raw" ? "border-t border-r border-l border-gray-800" : "border-b border-gray-800 "} grow rounded-t-md text-xs hover:text-purple-400 p-1`}
          onClick={() => onChange("raw")}
        >
          Raw
        </button>
      </div>
    )}
  </div>
);
