import React from "react";
import { MealSlot } from "@/types";

export type NutritionTabId = "all" | MealSlot;

interface NutritionMealTabsProps {
  activeTab: NutritionTabId;
  onTabChange: (tab: NutritionTabId) => void;
  slotCalories: Record<MealSlot, number>;
  slotCounts: Record<MealSlot, number>;
}

const TABS: { id: NutritionTabId; label: string }[] = [
  { id: "all", label: "All Meals" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

export const NutritionMealTabs: React.FC<NutritionMealTabsProps> = ({
  activeTab,
  onTabChange,
  slotCalories,
  slotCounts,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Meal slot filters"
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const cal = tab.id !== "all" ? slotCalories[tab.id as MealSlot] ?? 0 : null;
        const count = tab.id !== "all" ? slotCounts[tab.id as MealSlot] ?? 0 : null;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors ${
              isActive
                ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                : "bg-athloniq-card text-slate-400 border border-athloniq-border hover:text-white hover:border-slate-700"
            }`}
          >
            <span>{tab.label}</span>
            {cal !== null && cal > 0 && (
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-athloniq-surface text-slate-300">
                {cal} kcal
              </span>
            )}
            {count !== null && count > 0 && cal === 0 && (
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-athloniq-surface text-slate-300">
                {count} items
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
