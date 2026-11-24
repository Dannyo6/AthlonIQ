import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MEAL_SLOTS, QUANTITY_OPTIONS } from "../constants";
import { useNutritionFormDirty } from "../hooks/useNutritionFormDirty";
import { searchFoodCatalog } from "@/lib/calculations";
import { FoodCatalogItem, FoodEntry, MealSlot } from "@/types";
import { Plus, Search, X, CheckCircle2, Camera } from "lucide-react";

interface NutritionAddPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedSlot: MealSlot;
  onSlotChange: (slot: MealSlot) => void;
  onAddEntry: (entry: Omit<FoodEntry, "id">) => void;
  onOpenCustomModal: () => void;
  onOpenPhotoModal: () => void;
}

export const NutritionAddPanel: React.FC<NutritionAddPanelProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  onSlotChange,
  onAddEntry,
  onOpenCustomModal,
  onOpenPhotoModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");

  const hasUnsavedFoodInput = Boolean(searchQuery.trim() || customQty.trim() || selectedFood);

  useNutritionFormDirty("meal-entry-search", isOpen && hasUnsavedFoodInput, "Meal Search & Add");

  const searchResults = useMemo(
    () => (searchQuery.length >= 1 ? searchFoodCatalog(searchQuery) : []),
    [searchQuery]
  );

  const parsedQty = parseFloat(customQty);
  const effectiveQty =
    customQty.trim() !== "" && !isNaN(parsedQty) && parsedQty > 0
      ? parsedQty
      : quantity;

  const handleAdd = () => {
    if (!selectedFood) return;
    onAddEntry({
      loggedDate: selectedDate,
      mealSlot: selectedSlot,
      foodName: selectedFood.name,
      quantity: effectiveQty,
      servingLabel: selectedFood.serving_label,
      caloriesKcal: selectedFood.calories_kcal,
      proteinG: selectedFood.protein_g,
      carbsG: selectedFood.carbs_g,
      fatG: selectedFood.fat_g,
      provenance: selectedFood.provenance,
      isConfirmed: true,
      is_confirmed: true,
    });
    setSelectedFood(null);
    setSearchQuery("");
    setQuantity(1);
    setCustomQty("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-athloniq-lime" /> Add Meal Entry
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add meal panel"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Meal Slot Selector */}
      <div className="flex flex-wrap gap-2">
        {MEAL_SLOTS.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSlotChange(slot.id)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              selectedSlot === slot.id
                ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                : "bg-athloniq-surface text-slate-400 border border-athloniq-border hover:text-white"
            }`}
          >
            {slot.label}
          </button>
        ))}
      </div>

      {/* Search Bar & Analyze Photo Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Indian & athletic foods (rice, roti, dal, chicken, paneer...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedFood(null);
            }}
            className="w-full min-h-[44px] bg-athloniq-card border border-athloniq-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none placeholder-slate-500"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onOpenPhotoModal}
          className="min-h-[44px] border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-white bg-purple-500/10 shrink-0 gap-2"
        >
          <Camera className="h-4 w-4 text-purple-400" />
          Analyze Photo
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedFood && (
        <div className="max-h-48 overflow-y-auto space-y-1 border border-athloniq-border rounded-xl p-2">
          {searchResults.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                setSelectedFood(food);
                setSearchQuery(food.name);
              }}
              className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg hover:bg-athloniq-surface text-left transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-white">{food.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{food.serving_label}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-athloniq-lime tabular-nums">
                  {food.calories_kcal} kcal
                </div>
                <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                  P:{food.protein_g}g C:{food.carbs_g}g F:{food.fat_g}g
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Food + Quantity */}
      {selectedFood && (
        <div className="p-3 rounded-xl bg-athloniq-lime/5 border border-athloniq-lime/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{selectedFood.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{selectedFood.serving_label}</div>
            </div>
            <Badge variant="lime">VERIFIED REFERENCE</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-athloniq-surface">
              <div className="text-athloniq-lime font-bold tabular-nums">
                {Math.round(selectedFood.calories_kcal * effectiveQty)}
              </div>
              <div className="text-slate-400">kcal</div>
            </div>
            <div className="p-2 rounded-lg bg-athloniq-surface">
              <div className="text-emerald-400 font-bold tabular-nums">
                {Math.round(selectedFood.protein_g * effectiveQty * 10) / 10}g
              </div>
              <div className="text-slate-400">protein</div>
            </div>
            <div className="p-2 rounded-lg bg-athloniq-surface">
              <div className="text-amber-400 font-bold tabular-nums">
                {Math.round(selectedFood.carbs_g * effectiveQty * 10) / 10}g
              </div>
              <div className="text-slate-400">carbs</div>
            </div>
            <div className="p-2 rounded-lg bg-athloniq-surface">
              <div className="text-purple-400 font-bold tabular-nums">
                {Math.round(selectedFood.fat_g * effectiveQty * 10) / 10}g
              </div>
              <div className="text-slate-400">fat</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Qty:</span>
            {QUANTITY_OPTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuantity(q);
                  setCustomQty("");
                }}
                className={`min-h-[44px] min-w-[36px] px-3 py-2 rounded-lg text-xs font-mono font-bold tabular-nums transition-colors ${
                  quantity === q && !customQty
                    ? "bg-athloniq-lime text-slate-950"
                    : "bg-athloniq-surface text-slate-300 border border-athloniq-border hover:border-athloniq-lime/40"
                }`}
              >
                {q}x
              </button>
            ))}
            <input
              type="number"
              step="0.25"
              min="0.25"
              placeholder="Custom"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              className="w-20 min-h-[44px] bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleAdd}
          className={`min-h-[44px] ${selectedFood ? "" : "opacity-50 cursor-not-allowed"}`}
        >
          <CheckCircle2 className="h-4 w-4" /> Add to{" "}
          {selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="min-h-[44px]"
          onClick={onOpenCustomModal}
        >
          <Plus className="h-4 w-4" /> Create Custom Food
        </Button>
      </div>
    </Card>
  );
};
