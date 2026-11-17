import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FoodEntry } from "@/types";
import { Sparkles, CheckCircle2, Edit3, Trash2, ShieldAlert } from "lucide-react";

interface NutritionUnconfirmedSectionProps {
  unconfirmedEntries: FoodEntry[];
  onConfirmEntry: (entry: FoodEntry) => void;
  onEditEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const NutritionUnconfirmedSection: React.FC<NutritionUnconfirmedSectionProps> = ({
  unconfirmedEntries,
  onConfirmEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  const unconfirmedCount = unconfirmedEntries.length;
  const unconfirmedKcal = unconfirmedEntries.reduce(
    (sum, e) => sum + Math.round(e.caloriesKcal * e.quantity),
    0
  );

  return (
    <Card className="space-y-4 border-purple-500/30 bg-purple-950/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="font-bold text-white text-base">
            Unconfirmed AI Estimates
          </h3>
          <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 tabular-nums">
            {unconfirmedCount} {unconfirmedCount === 1 ? "item" : "items"}
          </span>
          {unconfirmedCount > 0 && (
            <Badge variant="amber">
              +{unconfirmedKcal} kcal excluded from daily totals
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-xl bg-athloniq-surface/80 border border-athloniq-border text-xs text-slate-300">
        <ShieldAlert className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white font-semibold">Strict Guardrail:</strong> AI-estimated items are strictly excluded from your confirmed daily calorie and macronutrient totals until you verify their accuracy.
        </p>
      </div>

      {unconfirmedCount === 0 ? (
        <div className="py-6 text-center space-y-1">
          <CheckCircle2 className="h-6 w-6 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No unconfirmed AI estimates</p>
          <p className="text-xs text-slate-500">
            All food entries for this date are verified and counted toward your daily totals.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {unconfirmedEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-athloniq-card border border-purple-500/20 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{entry.foodName}</span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded uppercase">
                    {entry.mealSlot}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    ×{entry.quantity} {entry.servingLabel}
                  </span>
                  <Badge variant="amber">UNCONFIRMED</Badge>
                </div>
                <div className="text-xs text-slate-300 font-mono tabular-nums mt-1">
                  {Math.round(entry.caloriesKcal * entry.quantity)} kcal · P:
                  {Math.round(entry.proteinG * entry.quantity * 10) / 10}g · C:
                  {Math.round(entry.carbsG * entry.quantity * 10) / 10}g · F:
                  {Math.round(entry.fatG * entry.quantity * 10) / 10}g
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onConfirmEntry(entry)}
                  className="min-h-[44px] gap-1.5 bg-athloniq-lime text-slate-950 hover:bg-athloniq-lime-hover"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm</span>
                </Button>
                <button
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-white transition-colors"
                  title="Edit entry"
                  aria-label={`Edit unconfirmed ${entry.foodName}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-red-400 transition-colors"
                  title="Discard"
                  aria-label={`Discard unconfirmed ${entry.foodName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
