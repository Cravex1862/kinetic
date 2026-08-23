import React from "react";
import { Check } from "@phosphor-icons/react";
import { BrandStylingPanel, StylingProps } from "../BrandStylingPanel";

interface DesigningStageProps extends StylingProps {
  onApprove?: () => void;
}

export const DesigningStage: React.FC<DesigningStageProps> = (props) => {
  return (
    <>
      <BrandStylingPanel
        fonts={props.fonts}
        setFonts={props.setFonts}
        swatches={props.swatches}
        setSwatches={props.setSwatches}
        availableFonts={props.availableFonts}
        bgSelection={props.bgSelection}
        onSelectBackground={props.onSelectBackground}
      />
      <div className="flex items-center justify-between mt-2">
        <input
          type="text"
          placeholder="Request Edits..."
          className="rounded-md p-1 grow mr-2"
        />
        <button className="p-1 pr-2 pl-2 rounded-md border border-gray-800 text-gray-400 hover:text-white mr-2">
          Edit
        </button>
        <button
          className="bg-green-600 hover:bg-green-400 border rounded-md p-2"
          onClick={() => props.onApprove?.()}
          title="Approve design tokens"
        >
          <Check size={14} color="white" />
        </button>
      </div>
    </>
  );
};

export default DesigningStage;
