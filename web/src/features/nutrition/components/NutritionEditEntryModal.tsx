import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { FoodEntry } from "@/types";
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
  const [caloriesKcal, setCaloriesKcal] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");

  useEffect(() => {
    if (entry) {
      setFoodName(entry.foodName || "");
      setQuantity(String(entry.quantity ?? 1));
      setServingLabel(entry.servingLabel || "");
      setCaloriesKcal(String(entry.caloriesKcal ?? 0));
      setProteinG(String(entry.proteinG ?? 0));
      setCarbsG(String(entry.carbsG ?? 0));
      setFatG(String(entry.fatG ?? 0));
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const handleSave = () => {
    onSave(entry.id, {
      foodName,
      quantity: parseFloat(quantity) || 1,
      servingLabel,
      caloriesKcal: parseFloat(caloriesKcal) || 0,
      proteinG: parseFloat(proteinG) || 0,
      carbsG: parseFloat(carbsG) || 0,
      fatG: parseFloat(fatG) || 0,
      provenance: "user_corrected",
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
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Food Name</label>
            <input
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Quantity</label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Serving Label</label>
              <input
                value={servingLabel}
                onChange={(e) => setServingLabel(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Calories (kcal)</label>
              <input
                type="number"
                step="0.1"
                value={caloriesKcal}
                onChange={(e) => setCaloriesKcal(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
          </div>
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
