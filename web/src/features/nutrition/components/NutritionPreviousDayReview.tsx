import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FoodEntry, UserGoals } from "@/types";
import { calculateDailyNutritionTotals } from "@/lib/calculations";
import { isValidTimezone } from "@/lib/weeklyConsistency";
import { History, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from "lucide-react";

interface NutritionPreviousDayReviewProps {
  selectedDate: string; // YYYY-MM-DD
  getFoodEntriesForDate: (date: string) => FoodEntry[];
  goals: UserGoals;
  timezone?: string | null;
}

export const NutritionPreviousDayReview: React.FC<NutritionPreviousDayReviewProps> = ({
  selectedDate,
  getFoodEntriesForDate,
  goals,
  timezone,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute previous day YYYY-MM-DD
  const prevDate = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
    return dt.toISOString().split("T")[0];
  })();

  const activeTimezone = isValidTimezone(timezone) ? timezone!.trim() : "Asia/Kolkata";

  const formattedPrevDate = (() => {
    try {
      const [y, m, d] = prevDate.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(dt);
    } catch {
      return prevDate;
    }
  })();

  const prevEntries = getFoodEntriesForDate(prevDate);
  const prevTotals = calculateDailyNutritionTotals(prevEntries).confirmedTotals;
  const hasPrevEntries = prevTotals.entryCount > 0;

  const proteinMet = goals.proteinTargetG !== null && prevTotals.proteinG >= goals.proteinTargetG;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-athloniq-lime" />
          <h3 className="font-bold text-white text-sm">
            Previous-Day Review ({formattedPrevDate})
          </h3>
          {hasPrevEntries ? (
            <Badge variant="lime">{prevTotals.entryCount} entries</Badge>
          ) : (
            <Badge variant="neutral">No logs</Badge>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse previous-day review" : "Expand previous-day review"}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {!hasPrevEntries ? (
            <div className="py-4 text-center text-xs text-slate-500 font-mono">
              No entries logged on {formattedPrevDate}.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[11px] text-slate-400 font-medium">Calories</div>
                  <div className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
                    {prevTotals.caloriesKcal} kcal
                  </div>
                  {goals.calorieTargetKcal !== null && (
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      target: {goals.calorieTargetKcal}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[11px] text-slate-400 font-medium">Protein</div>
                  <div className="text-base font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                    {prevTotals.proteinG}g
                  </div>
                  {goals.proteinTargetG !== null && (
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      target: {goals.proteinTargetG}g
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[11px] text-slate-400 font-medium">Carbs</div>
                  <div className="text-base font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                    {prevTotals.carbsG}g
                  </div>
                  {goals.carbsTargetG !== null && (
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      target: {goals.carbsTargetG}g
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[11px] text-slate-400 font-medium">Fats</div>
                  <div className="text-base font-bold font-mono tabular-nums text-purple-400 mt-0.5">
                    {prevTotals.fatG}g
                  </div>
                  {goals.fatTargetG !== null && (
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      target: {goals.fatTargetG}g
                    </div>
                  )}
                </div>
              </div>

              {goals.proteinTargetG !== null && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-athloniq-surface/50 border border-athloniq-border text-xs text-slate-300">
                  {proteinMet ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Protein target was hit on {formattedPrevDate}! Keep the consistency rolling.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="tabular-nums">
                        Protein was {Math.round((goals.proteinTargetG - prevTotals.proteinG) * 10) / 10}g below target on {formattedPrevDate}.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
};
