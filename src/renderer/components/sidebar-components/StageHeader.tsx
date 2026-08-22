import React from "react";
import { CaretDown, CaretLeft } from "@phosphor-icons/react";

interface StageHeaderProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const StageHeader: React.FC<StageHeaderProps> = ({
  label,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h4 className="text-xs justify-between items-center">
        <button onClick={onToggle}>
          {isOpen ? (
            <CaretDown color="white" size={12} />
          ) : (
            <CaretLeft color="white" size={12} />
          )}
        </button>
      </h4>
    </div>
  );
};
