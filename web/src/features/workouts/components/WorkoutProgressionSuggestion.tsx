import React from "react";
import { ProgressionSuggestion } from "@/types";
import { TrendingUp } from "lucide-react";

export interface WorkoutProgressionSuggestionProps {
  suggestion: ProgressionSuggestion | null;
  lastSetLoadKg?: number;
}

export const WorkoutProgressionSuggestion: React.FC<WorkoutProgressionSuggestionProps> = ({
  suggestion,
  lastSetLoadKg = 0,
}) => {
  if (!suggestion || suggestion.action === "maintain") return null;

  const badgeColorClass =
    suggestion.action === "increase_load"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
      : suggestion.action === "increase_reps_or_tempo"
      ? "bg-athloniq-lime/10 border-athloniq-lime/30 text-athloniq-lime"
      : suggestion.action === "confirm_equipment_first"
      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
      : "bg-orange-500/10 border-orange-500/30 text-orange-300";

  const titleText =
    suggestion.action === "increase_load"
      ? `+${((suggestion.newLoadKg ?? 0) - lastSetLoadKg).toFixed(2)} kg suggestion`
      : suggestion.action === "increase_reps_or_tempo"
      ? "Reps / Tempo progression"
      : suggestion.action === "confirm_equipment_first"
      ? "Set your equipment limits to get load progressions"
      : "Maintain / Deload";

  return (
    <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${badgeColorClass}`}>
      <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-bold uppercase tracking-wide text-[10px] mb-0.5">
          {titleText}
        </div>
        <div className="leading-relaxed text-[11px] opacity-90">
          {suggestion.explanation}
        </div>
        {suggestion.requiresUserConfirmation && (
          <div className="mt-1.5 text-[10px] opacity-60 font-mono">
            REQUIRES USER CONFIRMATION — weights are never auto-mutated.
          </div>
        )}
      </div>
    </div>
  );
};
