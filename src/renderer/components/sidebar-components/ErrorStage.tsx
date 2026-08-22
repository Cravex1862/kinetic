import React from "react";

interface ErrorStageProps {
  error?: string;
}
export const ErrorStage: React.FC<ErrorStageProps> = ({ error }) => {
  return (
    <React.Fragment>
    <div className="flex justify-between items-center">
      <h4 className="text-xs text-red-400 p-3">Error</h4>
    </div>
    <div className="p-3">
      <div className="border border-red-500/20 bg-red-500/5 rounded-md p-2">
        <p className="text-xs text-red-400">
          {error || "An unkown error occured."}
        </p>
      </div>
    </div>
    </React.Fragment>
  );
};
