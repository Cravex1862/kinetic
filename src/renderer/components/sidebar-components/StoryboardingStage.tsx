import React from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { TabBar } from "./TabBar";
import { SceneBlueprint } from "@/renderer/agents/types";

interface StoryboardingStageProps {
  blueprints: SceneBlueprint[];
}

export const StoryboardingStage: React.FC<StoryboardingStageProps> = ({
  blueprints,
}) => {
  const [tab, setTab] = React.useState<"output" | "raw">("output");
  const [isCopied, setIsCopied] = React.useState(false);

  return (
    <>
      <TabBar active={tab} onChange={setTab} />
      {tab === "output" ? (
        <div className="mt-2 p-2 border border-gray-800 rounded-md">
          {blueprints.map((bp) => (
            <div key={bp.id} className="mb-2">
              <h4 className="text-xs">scene: {bp.id}</h4>
              <h4 className="text-xs">description: {bp.purpose}</h4>
              <h4 className="text-xs">
                duration: {bp.durationInFrames / 30}s
              </h4>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-gray-400 mt-2 rounded-t-md">
          <div className="flex justify-between border border-gray-800 rounded-t-md p-1">
            <h4>JSON</h4>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(blueprints));
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 1000);
              }}
            >
              {isCopied ? (
                <Check size={14} color="white" />
              ) : (
                <Copy size={14} color="white" />
              )}
            </button>
          </div>
          <div className="p-2">
            {blueprints.map((bp) => (
              <pre
                key={bp.id}
                className="text-xs text-gray-400 whitespace-pre-wrap break-words mb-2"
              >
                {JSON.stringify(bp, null, 2)}
              </pre>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default StoryboardingStage;
