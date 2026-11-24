import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useNutritionFormDirty } from "../hooks/useNutritionFormDirty";
import { MacroFields, MacroValues, validateAllMacros } from "./MacroFields";
import { FoodEntry, FoodProvenance } from "@/types";
import { X, CheckCircle2 } from "lucide-react";

interface NutritionEditEntryModalProps {
  entry: FoodEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<FoodEntry>) => void;
}

export const NutritionEditEntryModal: React.FC<NutritionEditEntryModalProps> = ({
  entry,
  isOpen,
  onClose,
  onSave,
}) => {
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [servingLabel, setServingLabel] = useState("");
  const [macroValues, setMacroValues] = useState<MacroValues>({
    caloriesKcal: "0",
    proteinG: "0",
    carbsG: "0",
    fatG: "0",
  });
  const [showErrors, setShowErrors] = useState(false);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setFoodName(entry.foodName || "");
      setQuantity(String(entry.quantity ?? 1));
      setServingLabel(entry.servingLabel || "");
      setMacroValues({
        caloriesKcal: String(entry.caloriesKcal ?? 0),
        proteinG: String(entry.proteinG ?? 0),
        carbsG: String(entry.carbsG ?? 0),
        fatG: String(entry.fatG ?? 0),
      });
      setShowErrors(false);
      setQuantityError(null);
    }
  }, [entry]);

  const isDirty = Boolean(
    entry &&
      (foodName !== (entry.foodName || "") ||
        quantity !== String(entry.quantity ?? 1) ||
        servingLabel !== (entry.servingLabel || "") ||
        macroValues.caloriesKcal !== String(entry.caloriesKcal ?? 0) ||
        macroValues.proteinG !== String(entry.proteinG ?? 0) ||
        macroValues.carbsG !== String(entry.carbsG ?? 0) ||
        macroValues.fatG !== String(entry.fatG ?? 0))
  );

  useNutritionFormDirty("edit-food-modal", isOpen && isDirty, "Edit Food Entry");

  if (!isOpen || !entry) return null;

  const handleMacroChange = (field: keyof MacroValues, value: string) => {
    setMacroValues((prev) => ({ ...prev, [field]: value }));
  };

  const nameError = showErrors && !foodName.trim() ? "Food name is required" : null;
  const { isValid, errors, parsed } = validateAllMacros(macroValues);

  const handleSave = () => {
    setShowErrors(true);

    const parsedQty = parseFloat(quantity.trim());
    if (quantity.trim() === "" || isNaN(parsedQty) || parsedQty <= 0) {
      setQuantityError("Quantity must be > 0");
      return;
    } else {
      setQuantityError(null);
    }

    if (!foodName.trim() || !isValid || !parsed) {
      return;
    }

    // Determine if values were edited by the athlete
    const isValuesModified =
      entry.foodName !== foodName.trim() ||
      entry.servingLabel !== (servingLabel.trim() || entry.servingLabel) ||
      Math.abs(entry.quantity - parsedQty) > 0.001 ||
      Math.abs(entry.caloriesKcal - parsed.caloriesKcal) > 0.001 ||
      Math.abs(entry.proteinG - parsed.proteinG) > 0.001 ||
      Math.abs(entry.carbsG - parsed.carbsG) > 0.001 ||
      Math.abs(entry.fatG - parsed.fatG) > 0.001;

    // Confirming sets is_confirmed true, and keeps ai_estimated unless the user edited the values (then user_corrected)
    const finalProvenance: FoodProvenance = isValuesModified
      ? "user_corrected"
      : entry.provenance;

    onSave(entry.id, {
      foodName: foodName.trim(),
      quantity: parsedQty,
      servingLabel: servingLabel.trim() || entry.servingLabel,
      caloriesKcal: parsed.caloriesKcal,
      proteinG: parsed.proteinG,
      carbsG: parsed.carbsG,
      fatG: parsed.fatG,
      provenance: finalProvenance,
      isConfirmed: true,
      is_confirmed: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur">
      <div className="w-full max-w-md bg-athloniq-card border border-athloniq-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Edit Food Entry</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium block">Food Name</label>
            <input
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className={`w-full min-h-[44px] bg-athloniq-surface border rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-colors ${
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium block">Quantity</label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setQuantityError(null);
                }}
                className={`w-full min-h-[44px] bg-athloniq-surface border rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none tabular-nums transition-colors ${
                  quantityError
                    ? "border-rose-500/80 focus:border-rose-400 bg-rose-950/20"
                    : "border-athloniq-border focus:border-athloniq-lime"
                }`}
              />
              {quantityError && (
                <p role="alert" className="text-[10px] text-rose-400 font-medium">
                  {quantityError}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium block">Serving Label</label>
              <input
                value={servingLabel}
                onChange={(e) => setServingLabel(e.target.value)}
                className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
          </div>

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
            onClick={handleSave}
            className="flex-1 min-h-[44px]"
          >
            <CheckCircle2 className="h-4 w-4" /> Save Changes
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
