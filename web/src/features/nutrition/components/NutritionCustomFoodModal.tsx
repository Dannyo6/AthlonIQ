import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { FoodEntry, MealSlot } from "@/types";
import { X, CheckCircle2 } from "lucide-react";

interface NutritionCustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedSlot: MealSlot;
  onAddEntry: (entry: Omit<FoodEntry, "id">) => void;
}

export const NutritionCustomFoodModal: React.FC<NutritionCustomFoodModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  onAddEntry,
}) => {
  const [customName, setCustomName] = useState("");
  const [customServing, setCustomServing] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  const { setFormDirty } = useUnsavedWork();

  const isDirty = Boolean(
    customName.trim() ||
    customServing.trim() ||
    customCal.trim() ||
    customProtein.trim() ||
    customCarbs.trim() ||
    customFat.trim()
  );

  useEffect(() => {
    if (isOpen) {
      setFormDirty("custom-food-modal", isDirty, "Custom Food Modal");
    }
    return () => {
      setFormDirty("custom-food-modal", false);
    };
  }, [isDirty, isOpen, setFormDirty]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!customName || !customCal || !customProtein || !customCarbs || !customFat) return;
    onAddEntry({
      loggedDate: selectedDate,
      mealSlot: selectedSlot,
      foodName: customName,
      quantity: 1,
      servingLabel: customServing || "1 serving",
      caloriesKcal: parseFloat(customCal) || 0,
      proteinG: parseFloat(customProtein) || 0,
      carbsG: parseFloat(customCarbs) || 0,
      fatG: parseFloat(customFat) || 0,
      provenance: "manual_entry",
      isConfirmed: true,
      is_confirmed: true,
    });
    onClose();
    setCustomName("");
    setCustomServing("");
    setCustomCal("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur">
      <div className="w-full max-w-md bg-athloniq-card border border-athloniq-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Create Custom Food</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom food dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Badge variant="amber">MANUAL ENTRY — provenance tracked</Badge>
        <div className="space-y-3">
          <input
            placeholder="Food name *"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          />
          <input
            placeholder="Serving label (e.g. 1 bowl 200g)"
            value={customServing}
            onChange={(e) => setCustomServing(e.target.value)}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Calories (kcal) *", val: customCal, set: setCustomCal },
              { label: "Protein (g) *", val: customProtein, set: setCustomProtein },
              { label: "Carbs (g) *", val: customCarbs, set: setCustomCarbs },
              { label: "Fat (g) *", val: customFat, set: setCustomFat },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[11px] text-slate-400 font-medium">{label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleAdd}
            className="flex-1 min-h-[44px]"
          >
            <CheckCircle2 className="h-4 w-4" /> Add Custom Food
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            className="min-h-[44px]"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
