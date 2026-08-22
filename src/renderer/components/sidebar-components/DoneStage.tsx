import React from "react";
import { Check } from "@phosphor-icons/react";

interface DoneStageProps {
  sceneCount: number;
}

export const DoneStage: React.FC<DoneStageProps> = ({ sceneCount }) => (
  <>
    <div className="flex justify-between items-center">
      <h4 className="text-xs text-green-400 p-3">Complete</h4>
      <Check size={14} color="#22c55e" />
    </div>
    <div className="p-3">
      <p className="text-xs text-gray-400">
        Video Composition generated Successfully.
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {sceneCount} scenes. Open Studio to preview
      </p>
    </div>
  </>
);
