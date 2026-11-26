import React from "react";
import { Button } from "@/components/ui/Button";
import { UserProfile } from "@/types";
import { RotateCcw } from "lucide-react";

interface CoachContextSummaryProps {
  profile: Partial<UserProfile>;
  onClearHistory: () => void;
}

export const CoachContextSummary: React.FC<CoachContextSummaryProps> = ({
  profile,
  onClearHistory,
}) => {
  const details: string[] = [];
  if (profile.age != null) details.push(`${profile.age}yo`);
  if (profile.weightKg != null) details.push(`${profile.weightKg}kg`);
  if (profile.dietaryPattern) details.push(profile.dietaryPattern);

  const baselineLabel = profile.fullName || "Athlete";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="h-2 w-2 rounded-full bg-athloniq-lime animate-pulse shrink-0" aria-hidden="true" />
        <span className="truncate font-mono tabular-nums">
          Grounded in athlete baseline: {baselineLabel}
          {details.length > 0 ? ` (${details.join(", ")})` : ""}
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearHistory}
        className="min-h-[44px] text-xs text-slate-400 hover:text-rose-400 shrink-0"
      >
        <RotateCcw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
        New Conversation / Clear History
      </Button>
    </div>
  );
};
