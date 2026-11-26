import React from "react";
import { ActivityType } from "@/types";
import { ACTIVITY_MODES } from "../constants";

interface ActivitySportSelectorProps {
  activeMode: ActivityType;
  onSelectMode: (mode: ActivityType) => void;
}

export const ActivitySportSelector: React.FC<ActivitySportSelectorProps> = ({
  activeMode,
  onSelectMode,
}) => {
  return (
    <div
      role="group"
      aria-label="Activity Sport Mode"
      className="flex flex-wrap items-center p-0.5 rounded-xl bg-athloniq-surface border border-athloniq-border gap-0.5"
    >
      {ACTIVITY_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
            activeMode === mode
              ? "bg-athloniq-lime text-slate-950 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
};
