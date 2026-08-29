import React, { useState } from "react";
import { Check, PaperPlaneRight } from "@phosphor-icons/react";
import { BrandStylingPanel, StylingProps } from "../BrandStylingPanel";

interface DesigningStageProps extends StylingProps {
  onApprove?: () => void;
}

export const DesigningStage: React.FC<DesigningStageProps> = (props) => {
  const [editText, setEditText] = useState("");
  const [sent, setSent] = useState(false);

  const handleEdit = () => {
    if (!editText.trim()) return;
    setSent(true);
    setTimeout(() => setSent(false), 2000);
    setEditText("");
  };

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
      <div className="mt-3 rounded-lg border border-[#27272a] bg-[#18181b] p-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            placeholder="Request edits (e.g. warmer palette)..."
            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
          />
          <button
            onClick={handleEdit}
            disabled={!editText.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#27272a] border border-[#3a3a3f] text-xs font-semibold text-gray-300 hover:bg-violet-600 hover:text-white hover:border-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Send edit request"
          >
            <PaperPlaneRight size={12} weight="bold" />
            Edit
          </button>
          <button
            className="bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-lg p-2 transition-colors"
            onClick={() => props.onApprove?.()}
            title="Approve design tokens — continue to storyboard"
          >
            <Check size={14} color="white" weight="bold" />
          </button>
        </div>
        {sent && <div className="mt-2 text-[10px] font-semibold text-emerald-400">Edit noted — adjust tokens above and approve when ready.</div>}
        <div className="mt-2 text-[10px] text-gray-500">Tip: tweak fonts and colors above, then hit the green check to continue.</div>
      </div>
    </>
  );
};

export default DesigningStage;
