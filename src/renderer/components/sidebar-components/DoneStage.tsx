import React from "react";
import { Check } from "@phosphor-icons/react";

interface DoneStageProps {
  sceneCount: number;
}

export const DoneStage: React.FC<DoneStageProps> = ({ sceneCount }) => (
  <div className="p-1">
    <div className="flex items-center gap-2 text-xs text-green-400">
      <Check size={14} color="#22c55e" />
      <span>Video Composition generated successfully.</span>
    </div>
    <p className="text-xs text-gray-500 mt-1.5">
      {sceneCount} scenes. Opening Studio...
    </p>
  </div>
);

export default DoneStage;
