import React from "react";
import { Card } from "@/components/ui/Card";
import { FoodEntry, MealSlot, FoodProvenance } from "@/types";
import { Plus, Copy, Trash2, Edit3 } from "lucide-react";
import { NutritionTabId } from "./NutritionMealTabs";

const MEAL_SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

const PROVENANCE_LABELS: Record<FoodProvenance, string> = {
  verified_reference: "VERIFIED REFERENCE",
  manual_entry: "MANUAL ENTRY",
  user_corrected: "USER CORRECTED",
  ai_estimated: "AI ESTIMATED",
};

interface NutritionMealEntriesProps {
  entries: FoodEntry[];
  activeTab: NutritionTabId;
  onEditEntry: (entry: FoodEntry) => void;
  onDuplicateEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onAddClick: (slot: MealSlot) => void;
}

export const NutritionMealEntries: React.FC<NutritionMealEntriesProps> = ({
  entries,
  activeTab,
  onEditEntry,
  onDuplicateEntry,
  onDeleteEntry,
  onAddClick,
}) => {
  const visibleSlots =
    activeTab === "all"
      ? MEAL_SLOTS
      : MEAL_SLOTS.filter((s) => s.id === activeTab);

  // Filter to confirmed entries only for the daily meal log
  const confirmedEntries = entries.filter((e) => {
    return e.is_confirmed !== undefined ? Boolean(e.is_confirmed) : Boolean(e.isConfirmed);
  });

  return (
    <div className="space-y-4">
      {visibleSlots.map((slot) => {
        const slotEntries = confirmedEntries.filter((e) => e.mealSlot === slot.id);
        const slotKcal = slotEntries.reduce(
          (sum, e) => sum + Math.round(e.caloriesKcal * e.quantity),
          0
        );

        return (
          <Card key={slot.id} className="space-y-3">
            <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span>{slot.label}</span>
                {slotKcal > 0 && (
                  <span className="text-xs font-mono text-athloniq-lime tabular-nums ml-1">
                    {slotKcal} kcal
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => onAddClick(slot.id)}
                aria-label={`Add food to ${slot.label}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-athloniq-lime hover:border-athloniq-lime/40 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {slotEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No entries logged for {slot.label}
              </p>
            ) : (
              <div className="space-y-2">
                {slotEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-athloniq-surface/60 border border-athloniq-border hover:border-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                          {entry.foodName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">
                          ×{entry.quantity}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5 py-0.5 rounded bg-athloniq-card border border-athloniq-border shrink-0">
                          {PROVENANCE_LABELS[entry.provenance] ?? entry.provenance}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                        {Math.round(entry.caloriesKcal * entry.quantity)} kcal · P:
                        {Math.round(entry.proteinG * entry.quantity * 10) / 10}g · C:
                        {Math.round(entry.carbsG * entry.quantity * 10) / 10}g · F:
                        {Math.round(entry.fatG * entry.quantity * 10) / 10}g
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-athloniq-surface transition-colors"
                        title="Edit"
                        aria-label={`Edit ${entry.foodName}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateEntry(entry)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-athloniq-lime hover:bg-athloniq-lime/10 transition-colors"
                        title="Duplicate"
                        aria-label={`Duplicate ${entry.foodName}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete"
                        aria-label={`Delete ${entry.foodName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
