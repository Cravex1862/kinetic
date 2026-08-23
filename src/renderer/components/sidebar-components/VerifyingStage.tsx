import React from "react";
import { Check } from "@phosphor-icons/react";
import { TabBar } from "./TabBar";

interface VerifyingStageProps {
  assembled?: string;
  finalCode?: string;
}

export const VerifyingStage: React.FC<VerifyingStageProps> = ({
  assembled,
  finalCode,
}) => {
  const [tab, setTab] = React.useState<"output" | "raw">("output");
  const hasDiff = assembled && finalCode && assembled !== finalCode;

  return (
    <div className="p-1">
      <p className="text-xs text-gray-500 mb-2">
        Reviewing generated code...
      </p>
      {hasDiff ? (
        <div className="border border-gray-800 rounded-md overflow-hidden">
          <TabBar active={tab} onChange={setTab} />
          {tab === "output" ? (
            <div className="p-2 max-h-[300px] overflow-y-auto font-mono text-[10px] leading-relaxed">
              {assembled!.split("\n").map((line, i) => {
                const isRemoved = finalCode!
                  .split("\n")
                  .every((fl) => fl !== line);

                return isRemoved ? (
                  <div
                    key={`r-${i}`}
                    className="bg-red-500/10 text-red-400 px-1"
                  >
                    <span className="text-red-600 select-none mr-2">-</span>
                    {line}
                  </div>
                ) : null;
              })}
              {finalCode!.split("\n").map((line, i) => {
                const isAdded = assembled!
                  .split("\n")
                  .every((ol) => ol !== line);

                return isAdded ? (
                  <div
                    key={`a-${i}`}
                    className="bg-green-500/10 text-green-400 px-2"
                  >
                    <span className="text-green-600 select-none mr-2">+</span>
                    {line}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="p-2 max-h-[300px] overflow-y-auto">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words">
                {finalCode}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-800 rounded-md p-3">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Check size={14} color="#22c55e" />
            <span>No Changes needed - code verified</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyingStage;
