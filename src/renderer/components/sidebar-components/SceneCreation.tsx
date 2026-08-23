import React from "react";
import { TabBar } from "./TabBar";
import { SceneCode } from "@/renderer/agents/types";

interface SceneCreationStageProps {
  sceneCodes: SceneCode[];
}

export const SceneCreationStage: React.FC<SceneCreationStageProps> = ({
  sceneCodes,
}) => {
  const [tab, setTab] = React.useState<"output" | "raw">("output");

  return (
    <>
      <TabBar active={tab} onChange={setTab} showRaw={false} />
      <div className="border border-gray-800 mt-2 p-2 max-h-[300px] overflow-y-auto">
        {sceneCodes.map((scene, idx) => (
          <pre
            key={idx}
            className="text-xs text-gray-400 whitespace-pre-wrap break-words mb-2"
          >
            {scene.sceneCode}
          </pre>
        ))}
      </div>
    </>
  );
};

export default SceneCreationStage;
