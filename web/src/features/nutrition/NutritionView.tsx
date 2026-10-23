import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import {
  searchFoodCatalog,
  calculateDailyNutritionTotals,
} from "@/lib/calculations";
import {
  FoodCatalogItem,
  FoodEntry,
  MealSlot,
  FoodProvenance,
} from "@/types";
import {
  Utensils,
  Plus,
  AlertCircle,
  Search,
  X,
  Copy,
  Trash2,
  CheckCircle2,
  Camera,
} from "lucide-react";
import { MealPhotoUploader } from "./components/MealPhotoUploader";

const MEAL_SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

const QUANTITY_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

const PROVENANCE_LABELS: Record<FoodProvenance, string> = {
  verified_reference: "VERIFIED REFERENCE",
  manual_entry: "MANUAL ENTRY",
  user_corrected: "USER CORRECTED",
  ai_estimated: "AI ESTIMATED",
};

export const NutritionView: React.FC = () => {
  const {
    goals,
    foodEntries,
    addFoodEntry,
    deleteFoodEntry,
    getFoodEntriesForDate,
  } = useAthloniqState();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Custom food form state
  const [customName, setCustomName] = useState("");
  const [customServing, setCustomServing] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  const { setFormDirty } = useUnsavedWork();

  const hasUnsavedFoodInput = Boolean(
    customName.trim() ||
    customServing.trim() ||
    customCal.trim() ||
    customProtein.trim() ||
    customCarbs.trim() ||
    customFat.trim() ||
    customQty.trim()
  );

  useEffect(() => {
    setFormDirty("meal-entry", hasUnsavedFoodInput, "Meal / Food Log");
    return () => {
      setFormDirty("meal-entry", false);
    };
  }, [hasUnsavedFoodInput, setFormDirty]);

  const todayEntries = useMemo(
    () => getFoodEntriesForDate(selectedDate),
    [getFoodEntriesForDate, selectedDate, foodEntries]
  );

  const nutrition = useMemo(
    () => calculateDailyNutritionTotals(todayEntries),
    [todayEntries]
  );

  const ct = nutrition.confirmedTotals;

  const targetKcal = goals.calorieTargetKcal || 2000;
  const proteinTarget = goals.proteinTargetG;
  const carbsTarget = goals.carbsTargetG || Math.round((targetKcal * 0.45) / 4);
  const fatTarget = goals.fatTargetG || Math.round((targetKcal * 0.25) / 9);

  const searchResults = useMemo(
    () => (searchQuery.length >= 1 ? searchFoodCatalog(searchQuery) : []),
    [searchQuery]
  );

  const effectiveQty = customQty ? parseFloat(customQty) || 1 : quantity;

  const handleAddEntry = () => {
    if (!selectedFood) return;
    addFoodEntry({
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
    });
    setSelectedFood(null);
    setSearchQuery("");
    setQuantity(1);
    setCustomQty("");
    setShowAddPanel(false);
  };

  const handleAddCustomFood = () => {
    if (!customName || !customCal || !customProtein || !customCarbs || !customFat) return;
    addFoodEntry({
      loggedDate: selectedDate,
      mealSlot: selectedSlot,
      foodName: customName,
      quantity: 1,
      servingLabel: customServing || "1 serving",
      caloriesKcal: parseFloat(customCal),
      proteinG: parseFloat(customProtein),
      carbsG: parseFloat(customCarbs),
      fatG: parseFloat(customFat),
      provenance: "manual_entry",
      isConfirmed: true,
    });
    setShowCustomModal(false);
    setCustomName("");
    setCustomServing("");
    setCustomCal("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
  };

  const handleDuplicate = (entry: FoodEntry) => {
    addFoodEntry({
      loggedDate: selectedDate,
      mealSlot: entry.mealSlot,
      foodName: entry.foodName,
      quantity: entry.quantity,
      servingLabel: entry.servingLabel,
      caloriesKcal: entry.caloriesKcal,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      provenance: entry.provenance,
      isConfirmed: true,
    });
  };

  const pct = (v: number, t: number) =>
    Math.min(100, t > 0 ? Math.round((v / t) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Utensils className="h-6 w-6 text-athloniq-lime" />
            Indian Nutrition & Energy Balance
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Verified Indian & athletic food catalog, deterministic macro tracking, and confirmed-entry guardrail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono"
          />
          <Button
            variant="secondary"
            onClick={() => setShowPhotoModal(true)}
            className="border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-white bg-purple-500/10 gap-1.5"
          >
            <Camera className="h-4 w-4 text-purple-400" />
            <span className="hidden sm:inline">Analyze Photo</span>
          </Button>
          <Button variant="primary" onClick={() => setShowAddPanel(!showAddPanel)}>
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </div>
      </div>

      {/* Onboarding Gate */}
      {!goals.calorieTargetKcal && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Caloric Target Gated Awaiting Onboarding</span>
                <ProvenanceBadge provenance="awaiting_onboarding" />
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed mt-0.5">
                Complete the 5-step onboarding to calibrate your TDEE and +250 kcal lean-bulk surplus.
              </p>
            </div>
          </div>
          <Badge variant="amber">AWAITING ONBOARDING</Badge>
        </div>
      )}

      {/* Add Meal Panel */}
      {showAddPanel && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-athloniq-lime" /> Add Meal Entry
            </h3>
            <button onClick={() => setShowAddPanel(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Meal Slot Selector */}
          <div className="flex flex-wrap gap-2">
            {MEAL_SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedSlot === slot.id
                    ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                    : "bg-[#181D2A] text-slate-400 border border-[#1E2330] hover:text-white"
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
                className="w-full bg-[#12151E] border border-[#1E2330] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none placeholder-slate-500"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPhotoModal(true)}
              className="border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-white bg-purple-500/10 shrink-0 gap-2"
            >
              <Camera className="h-4 w-4 text-purple-400" />
              Analyze Photo
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedFood && (
            <div className="max-h-48 overflow-y-auto space-y-1 border border-[#1E2330] rounded-xl p-2">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => {
                    setSelectedFood(food);
                    setSearchQuery(food.name);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#181D2A] text-left transition-colors"
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
                <div className="p-2 rounded-lg bg-[#181D2A]">
                  <div className="text-athloniq-lime font-bold tabular-nums">
                    {Math.round(selectedFood.calories_kcal * effectiveQty)}
                  </div>
                  <div className="text-slate-400">kcal</div>
                </div>
                <div className="p-2 rounded-lg bg-[#181D2A]">
                  <div className="text-emerald-400 font-bold tabular-nums">
                    {Math.round(selectedFood.protein_g * effectiveQty * 10) / 10}g
                  </div>
                  <div className="text-slate-400">protein</div>
                </div>
                <div className="p-2 rounded-lg bg-[#181D2A]">
                  <div className="text-amber-400 font-bold tabular-nums">
                    {Math.round(selectedFood.carbs_g * effectiveQty * 10) / 10}g
                  </div>
                  <div className="text-slate-400">carbs</div>
                </div>
                <div className="p-2 rounded-lg bg-[#181D2A]">
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
                    onClick={() => { setQuantity(q); setCustomQty(""); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold tabular-nums transition-colors ${
                      quantity === q && !customQty
                        ? "bg-athloniq-lime text-slate-950"
                        : "bg-[#181D2A] text-slate-300 border border-[#1E2330] hover:border-athloniq-lime/40"
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
                  className="w-20 bg-[#12151E] border border-[#1E2330] rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddEntry}
              className={selectedFood ? "" : "opacity-50 cursor-not-allowed"}
            >
              <CheckCircle2 className="h-4 w-4" /> Add to {selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCustomModal(true)}>
              <Plus className="h-4 w-4" /> Create Custom Food
            </Button>
          </div>
        </Card>
      )}

      {/* Daily Macro Progress */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2330] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-athloniq-lime uppercase font-mono font-bold">Confirmed Daily Totals</span>
              <ProvenanceBadge provenance={goals.calorieProvenance} />
              {nutrition.unconfirmedEstimates.entryCount > 0 && (
                <Badge variant="amber">
                  +{nutrition.unconfirmedEstimates.caloriesKcal} kcal unconfirmed (excluded)
                </Badge>
              )}
            </div>
            <h3 className="text-2xl font-black text-white mt-1 font-mono tabular-nums">
              {ct.caloriesKcal} / {targetKcal} kcal
            </h3>
          </div>
          <Badge variant="lime">LEAN BULK (+250 KCAL SURPLUS)</Badge>
        </div>

        {/* Calorie progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono tabular-nums">
            <span>Calories</span>
            <span>{pct(ct.caloriesKcal, targetKcal)}%</span>
          </div>
          <div className="h-3 w-full bg-[#12151E] rounded-full overflow-hidden border border-[#1E2330]">
            <div
              className="h-full bg-gradient-to-r from-athloniq-lime to-lime-300 rounded-full transition-all duration-500"
              style={{ width: `${pct(ct.caloriesKcal, targetKcal)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Protein", current: ct.proteinG, target: proteinTarget, unit: "g", range: `${goals.proteinMinG}–${goals.proteinMaxG} g/day`, color: "bg-emerald-400", textColor: "text-emerald-400" },
            { label: "Carbohydrates", current: ct.carbsG, target: carbsTarget, unit: "g", range: "Glycogen Replenishment", color: "bg-amber-400", textColor: "text-amber-400" },
            { label: "Dietary Fats", current: ct.fatG, target: fatTarget, unit: "g", range: "25% of Energy Balance", color: "bg-purple-400", textColor: "text-purple-400" },
          ].map((macro) => (
            <div key={macro.label} className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">{macro.label}</span>
                <span className="text-slate-500 font-mono text-[10px]">{macro.range}</span>
              </div>
              <div className={`font-mono text-xl font-bold tabular-nums ${macro.textColor}`}>
                {macro.current} / {macro.target} {macro.unit}
              </div>
              <div className="h-2 w-full bg-[#12151E] rounded-full overflow-hidden border border-[#1E2330]">
                <div
                  className={`h-full ${macro.color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct(macro.current, macro.target)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Meal Slot Cards */}
      {MEAL_SLOTS.map((slot) => {
        const slotEntries = todayEntries.filter((e) => e.mealSlot === slot.id);
        const slotKcal = slotEntries.reduce((sum, e) => sum + Math.round(e.caloriesKcal * e.quantity), 0);
        return (
          <Card key={slot.id} className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                {slot.label}
                {slotKcal > 0 && (
                  <span className="text-xs font-mono text-athloniq-lime tabular-nums ml-1">
                    {slotKcal} kcal
                  </span>
                )}
              </h3>
              <button
                onClick={() => {
                  setSelectedSlot(slot.id);
                  setShowAddPanel(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="p-1.5 rounded-lg bg-[#181D2A] border border-[#1E2330] text-slate-400 hover:text-athloniq-lime hover:border-athloniq-lime/40 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {slotEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No entries logged for {slot.label}</p>
            ) : (
              <div className="space-y-2">
                {slotEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#181D2A]/60 border border-[#1E2330] hover:border-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{entry.foodName}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          ×{entry.quantity}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-500 px-1.5 py-0.5 rounded bg-[#12151E] border border-[#1E2330] shrink-0">
                          {PROVENANCE_LABELS[entry.provenance] ?? entry.provenance}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                        {Math.round(entry.caloriesKcal * entry.quantity)} kcal · P:{Math.round(entry.proteinG * entry.quantity * 10) / 10}g · C:{Math.round(entry.carbsG * entry.quantity * 10) / 10}g · F:{Math.round(entry.fatG * entry.quantity * 10) / 10}g
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        onClick={() => handleDuplicate(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-athloniq-lime hover:bg-athloniq-lime/10 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFoodEntry(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete"
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

      {/* Custom Food Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur">
          <div className="w-full max-w-md bg-[#12151E] border border-[#1E2330] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Custom Food</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Badge variant="amber">MANUAL ENTRY — provenance tracked</Badge>
            <div className="space-y-3">
              <input placeholder="Food name *" value={customName} onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none" />
              <input placeholder="Serving label (e.g. 1 bowl 200g)" value={customServing} onChange={(e) => setCustomServing(e.target.value)}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Calories (kcal) *", val: customCal, set: setCustomCal },
                  { label: "Protein (g) *", val: customProtein, set: setCustomProtein },
                  { label: "Carbs (g) *", val: customCarbs, set: setCustomCarbs },
                  { label: "Fat (g) *", val: customFat, set: setCustomFat },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="text-[11px] text-slate-400 font-medium">{label}</label>
                    <input type="number" min="0" step="0.1" value={val} onChange={(e) => set(e.target.value)}
                      className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="primary" size="sm" onClick={handleAddCustomFood} className="flex-1">
                <CheckCircle2 className="h-4 w-4" /> Add Custom Food
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCustomModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* AthlonIQ Vision Modal */}
      <MealPhotoUploader
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
      />
    </div>
  );
};
