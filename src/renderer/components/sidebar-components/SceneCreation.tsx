import React from "react";
import { StageHeader } from "./StageHeader";
import { TabBar } from "./TabBar";
import { SceneCode } from "@/renderer/agents/types";

interface SceneCreationStageProps {
  sceneCodes: SceneCode[];
}

export const SceneCreationStage: React.FC<SceneCreationStageProps> = ({
  sceneCodes,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"output" | "raw">("output");

  return (
    <>
      <StageHeader
        label="Creating Scenes"
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <>
          <TabBar active={tab} onChange={setTab} showRaw={false} />
          <div className="border border-gray-800 mt-2 p-2">
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
      )}
    </>
  );
};
