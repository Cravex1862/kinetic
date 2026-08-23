import React from "react";
import { SceneCode } from "@/renderer/agents/types";

interface AssemblingStageProps {
  sceneCodes: SceneCode[];
  progress?: number;
}

export const AssemblingStage: React.FC<AssemblingStageProps> = ({
  sceneCodes,
  progress = 0.85,
}) => {
  return (
    <div className="p-1">
      <p className="text-xs text-gray-500">
        Merging {sceneCodes.length} scenes into a single composition...
      </p>
      <div className="mt-3 space-y-2">
        {sceneCodes.map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs text-gray-400"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span>Scene {idx + 1} </span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full animate-pulse transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default AssemblingStage;
