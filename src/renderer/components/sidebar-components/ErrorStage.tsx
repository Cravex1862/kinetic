import React from "react";

interface ErrorStageProps {
  error?: string;
}
export const ErrorStage: React.FC<ErrorStageProps> = ({ error }) => {
  return (
    <div className="p-1">
      <div className="border border-red-500/20 bg-red-500/5 rounded-md p-2">
        <p className="text-xs text-red-400">
          {error || "An unkown error occured."}
        </p>
      </div>
    </div>
  );
};

export default ErrorStage;
