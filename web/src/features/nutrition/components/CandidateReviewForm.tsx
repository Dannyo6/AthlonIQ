import React, { useState } from "react";
import { ProvenanceBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CandidateFoodItem, FoodEntry, MealSlot, FoodProvenance } from "@/types";
import {
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Layers,
} from "lucide-react";

const MEAL_SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

const QUANTITY_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

interface ReviewItemState extends CandidateFoodItem {
  isModifiedByUser: boolean;
  baseCalPerUnit: number;
  baseProPerUnit: number;
  baseCarbPerUnit: number;
  baseFatPerUnit: number;
}

interface CandidateReviewFormProps {
  candidates: CandidateFoodItem[];
  previewUrl: string | null;
  selectedDate: string;
  selectedSlot: MealSlot;
  onConfirm: (confirmedEntries: Omit<FoodEntry, "id">[]) => void;
  onCancel: () => void;
  onRetake?: () => void;
}

export const CandidateReviewForm: React.FC<CandidateReviewFormProps> = ({
  candidates: initialCandidates,
  previewUrl,
  selectedDate,
  selectedSlot: initialSlot,
  onConfirm,
  onCancel,
  onRetake,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(initialSlot);

  // Initialize review items state with unit baseline values
  const [items, setItems] = useState<ReviewItemState[]>(() =>
    initialCandidates.map((c) => {
      const q = c.quantity > 0 ? c.quantity : 1;
      return {
        ...c,
        isModifiedByUser: false,
        baseCalPerUnit: Math.round((c.calories_kcal / q) * 10) / 10,
        baseProPerUnit: Math.round((c.protein_g / q) * 10) / 10,
        baseCarbPerUnit: Math.round((c.carbs_g / q) * 10) / 10,
        baseFatPerUnit: Math.round((c.fat_g / q) * 10) / 10,
      };
    })
  );

  const handleUpdateQuantity = (index: number, newQty: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const validQty = Math.max(0.1, Math.round(newQty * 100) / 100);
        return {
          ...item,
          quantity: validQty,
          calories_kcal: Math.round(item.baseCalPerUnit * validQty * 10) / 10,
          protein_g: Math.round(item.baseProPerUnit * validQty * 10) / 10,
          carbs_g: Math.round(item.baseCarbPerUnit * validQty * 10) / 10,
          fat_g: Math.round(item.baseFatPerUnit * validQty * 10) / 10,
          isModifiedByUser: true,
          provenance: "user_corrected",
        };
      })
    );
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Grand totals of candidate items
  const totalCal = Math.round(
    items.reduce((sum, item) => sum + item.calories_kcal, 0) * 10
  ) / 10;
  const totalProtein = Math.round(
    items.reduce((sum, item) => sum + item.protein_g, 0) * 10
  ) / 10;
  const totalCarbs = Math.round(
    items.reduce((sum, item) => sum + item.carbs_g, 0) * 10
  ) / 10;
  const totalFat = Math.round(
    items.reduce((sum, item) => sum + item.fat_g, 0) * 10
  ) / 10;

  const handleConfirmAndLog = () => {
    if (items.length === 0) return;

    const entriesToLog: Omit<FoodEntry, "id">[] = items.map((item) => {
      const finalProvenance: FoodProvenance = item.isModifiedByUser
        ? "user_corrected"
        : "ai_estimated";

      return {
        loggedDate: selectedDate,
        mealSlot: selectedSlot,
        foodName: item.matched_catalog_name || item.food_name,
        quantity: item.quantity,
        servingLabel: item.serving_label || item.estimated_serving,
        caloriesKcal: item.calories_kcal,
        proteinG: item.protein_g,
        carbsG: item.carbs_g,
        fatG: item.fat_g,
        provenance: finalProvenance,
        isConfirmed: true,
        is_confirmed: true,
        confidence: item.confidence,
        notes: `AI detected: ${item.food_name} (${item.estimated_serving})`,
      };
    });

    onConfirm(entriesToLog);
  };

  return (
    <div className="space-y-6">
      {/* Guardrail Banner */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>AthlonIQ Vision Guardrail Active</span>
              <ProvenanceBadge provenance="ai_estimated" />
            </div>
            <p className="text-xs text-purple-300/90 leading-relaxed mt-0.5">
              AI estimates require explicit athlete confirmation before joining daily totals.
              Adjust portions or remove items as needed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRetake && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetake}
              className="text-xs shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retake
            </Button>
          )}
        </div>
      </div>

      {/* Top Preview & Meal Slot Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#12151E] p-4 rounded-2xl border border-[#1E2330]">
        {previewUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-[#1E2330] aspect-video md:aspect-square bg-black/40 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Meal preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" /> Multimodal Scan
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#1E2330] aspect-video md:aspect-square bg-[#181D2A]/40 flex flex-col items-center justify-center text-slate-500">
            <Sparkles className="h-6 w-6 text-purple-400 mb-1" />
            <span className="text-xs">Photo Processed</span>
          </div>
        )}

        <div className="md:col-span-2 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Target Meal Slot:
            </label>
            <div className="flex flex-wrap gap-2">
              {MEAL_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedSlot === slot.id
                      ? "bg-athloniq-lime text-slate-950 font-bold shadow-glow-lime"
                      : "bg-[#181D2A] text-slate-400 border border-[#1E2330] hover:text-white"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
            <div className="p-2 rounded-xl bg-[#181D2A] border border-[#1E2330]">
              <div className="text-[10px] text-slate-400 uppercase">Calories</div>
              <div className="text-sm font-bold text-athloniq-lime tabular-nums">
                {totalCal} <span className="text-[10px] font-normal">kcal</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#181D2A] border border-[#1E2330]">
              <div className="text-[10px] text-slate-400 uppercase">Protein</div>
              <div className="text-sm font-bold text-white tabular-nums">
                {totalProtein}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#181D2A] border border-[#1E2330]">
              <div className="text-[10px] text-slate-400 uppercase">Carbs</div>
              <div className="text-sm font-bold text-slate-300 tabular-nums">
                {totalCarbs}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#181D2A] border border-[#1E2330]">
              <div className="text-[10px] text-slate-400 uppercase">Fat</div>
              <div className="text-sm font-bold text-slate-300 tabular-nums">
                {totalFat}g
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Food List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-athloniq-lime" />
            Detected Foods ({items.length})
          </span>
          <span>Verify portion scaler before saving</span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#12151E] border border-dashed border-[#1E2330] text-slate-400 space-y-3">
            <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto opacity-80" />
            <p className="text-sm">All candidates have been removed.</p>
            {onRetake && (
              <Button variant="secondary" size="sm" onClick={onRetake}>
                Upload Another Photo
              </Button>
            )}
          </div>
        ) : (
          items.map((item, idx) => {
            const confidenceVariant =
              item.confidence === "high"
                ? "emerald"
                : item.confidence === "medium"
                ? "amber"
                : "rose";

            return (
              <div
                key={item.id || idx}
                className="p-4 rounded-2xl bg-[#12151E] border border-[#1E2330] hover:border-slate-700 transition-all space-y-3"
              >
                {/* Header: Name, Catalog mapping & badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-white">
                        {item.matched_catalog_name || item.food_name}
                      </h4>
                      {item.isModifiedByUser ? (
                        <ProvenanceBadge provenance="user_corrected" />
                      ) : (
                        <ProvenanceBadge provenance="ai_estimated" />
                      )}
                      <Badge variant={confidenceVariant}>
                        {item.confidence} confidence
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap font-mono">
                      <span>Detected: "{item.food_name}"</span>
                      <span className="text-slate-600">•</span>
                      <span>AI estimate: {item.estimated_serving}</span>
                      <span className="text-slate-600">•</span>
                      <span>Ref label: {item.serving_label}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Remove hallucinated item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Macro breakdown & portion multiplier */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1E2330]/60">
                  {/* Quantity Scaler */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 mr-1 font-medium">
                      Portion:
                    </span>
                    {QUANTITY_OPTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, q)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                          Math.abs(item.quantity - q) < 0.01
                            ? "bg-athloniq-lime text-slate-950 font-bold"
                            : "bg-[#181D2A] text-slate-400 hover:text-white border border-[#1E2330]"
                        }`}
                      >
                        {q}x
                      </button>
                    ))}
                    <div className="flex items-center ml-1">
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(idx, parseFloat(e.target.value) || 1)
                        }
                        className="w-16 bg-[#181D2A] border border-[#1E2330] rounded-lg px-2 py-1 text-xs text-white text-center font-mono focus:border-athloniq-lime focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Calculated Macros */}
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-athloniq-lime font-bold tabular-nums">
                      {item.calories_kcal} kcal
                    </div>
                    <div className="text-slate-400 tabular-nums">
                      P: <span className="text-white font-semibold">{item.protein_g}g</span>
                    </div>
                    <div className="text-slate-400 tabular-nums">
                      C: <span className="text-slate-300">{item.carbs_g}g</span>
                    </div>
                    <div className="text-slate-400 tabular-nums">
                      F: <span className="text-slate-300">{item.fat_g}g</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#1E2330]">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirmAndLog}
          disabled={items.length === 0}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirm & Log ({items.length} {items.length === 1 ? "item" : "items"})
        </Button>
      </div>
    </div>
  );
};
