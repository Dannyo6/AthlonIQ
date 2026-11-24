import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNutritionFormDirty } from "../hooks/useNutritionFormDirty";
import { MacroFields, MacroValues, validateAllMacros } from "./MacroFields";
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
  const [macroValues, setMacroValues] = useState<MacroValues>({
    caloriesKcal: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  });
  const [showErrors, setShowErrors] = useState(false);

  const isDirty = Boolean(
    customName.trim() ||
    customServing.trim() ||
    macroValues.caloriesKcal.trim() ||
    macroValues.proteinG.trim() ||
    macroValues.carbsG.trim() ||
    macroValues.fatG.trim()
  );

  useNutritionFormDirty("custom-food-modal", isOpen && isDirty, "Custom Food Modal");

  if (!isOpen) return null;

  const handleMacroChange = (field: keyof MacroValues, value: string) => {
    setMacroValues((prev) => ({ ...prev, [field]: value }));
  };

  const nameError = showErrors && !customName.trim() ? "Food name is required" : null;
  const { isValid, errors, parsed } = validateAllMacros(macroValues);

  const handleAdd = () => {
    setShowErrors(true);
    if (!customName.trim() || !isValid || !parsed) {
      return;
    }

    onAddEntry({
      loggedDate: selectedDate,
      mealSlot: selectedSlot,
      foodName: customName.trim(),
      quantity: 1,
      servingLabel: customServing.trim() || "1 serving",
      caloriesKcal: parsed.caloriesKcal,
      proteinG: parsed.proteinG,
      carbsG: parsed.carbsG,
      fatG: parsed.fatG,
      provenance: "manual_entry",
      isConfirmed: true,
      is_confirmed: true,
    });

    onClose();
    setCustomName("");
    setCustomServing("");
    setMacroValues({
      caloriesKcal: "",
      proteinG: "",
      carbsG: "",
      fatG: "",
    });
    setShowErrors(false);
  };

  const handleCancel = () => {
    onClose();
    setShowErrors(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur">
      <div className="w-full max-w-md bg-athloniq-card border border-athloniq-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Create Custom Food</h3>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close custom food dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Badge variant="amber">MANUAL ENTRY — provenance tracked</Badge>
        <div className="space-y-3">
          <div className="space-y-1">
            <input
              placeholder="Food name *"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className={`w-full min-h-[44px] bg-athloniq-surface border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                nameError
                  ? "border-rose-500/80 focus:border-rose-400 bg-rose-950/20"
                  : "border-athloniq-border focus:border-athloniq-lime"
              }`}
            />
            {nameError && (
              <p role="alert" className="text-[10px] text-rose-400 font-medium">
                {nameError}
              </p>
            )}
          </div>
          <input
            placeholder="Serving label (e.g. 1 bowl 200g)"
            value={customServing}
            onChange={(e) => setCustomServing(e.target.value)}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          />

          <MacroFields
            values={macroValues}
            onChange={handleMacroChange}
            errors={errors}
            showErrors={showErrors}
          />
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
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
