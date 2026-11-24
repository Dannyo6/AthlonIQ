import React, { useState, useMemo } from "react";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { calculateDailyNutritionTotals } from "@/lib/calculations";
import { resolveDateInTimezone } from "@/lib/weeklyConsistency";
import { FoodEntry, MealSlot, FoodProvenance } from "@/types";
import { NutritionDateNav } from "./components/NutritionDateNav";
import { NutritionMealTabs, NutritionTabId } from "./components/NutritionMealTabs";
import { NutritionTotalsHeader } from "./components/NutritionTotalsHeader";
import { NutritionMealEntries } from "./components/NutritionMealEntries";
import { NutritionAddPanel } from "./components/NutritionAddPanel";
import { MealPhotoUploader } from "./components/MealPhotoUploader";
import { NutritionUnconfirmedSection } from "./components/NutritionUnconfirmedSection";
import { NutritionPreviousDayReview } from "./components/NutritionPreviousDayReview";
import { NutritionCustomFoodModal } from "./components/NutritionCustomFoodModal";
import { NutritionEditEntryModal } from "./components/NutritionEditEntryModal";

export const NutritionView: React.FC = () => {
  const {
    goals,
    foodEntries,
    preferences,
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    getFoodEntriesForDate,
  } = useAthloniqState();

  const timezone = preferences?.timezone ?? "Asia/Kolkata";

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    resolveDateInTimezone(undefined, timezone)
  );

  const [activeTab, setActiveTab] = useState<NutritionTabId>("all");
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("breakfast");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const todayEntries = useMemo(
    () => getFoodEntriesForDate(selectedDate),
    [getFoodEntriesForDate, selectedDate, foodEntries]
  );

  const nutrition = useMemo(
    () => calculateDailyNutritionTotals(todayEntries),
    [todayEntries]
  );

  const { confirmedEntries, unconfirmedEntries } = useMemo(() => {
    const confirmed: FoodEntry[] = [];
    const unconfirmed: FoodEntry[] = [];
    for (const entry of todayEntries) {
      const isConfirmed =
        entry.is_confirmed !== undefined
          ? Boolean(entry.is_confirmed)
          : Boolean(entry.isConfirmed);
      if (isConfirmed) {
        confirmed.push(entry);
      } else {
        unconfirmed.push(entry);
      }
    }
    return { confirmedEntries: confirmed, unconfirmedEntries: unconfirmed };
  }, [todayEntries]);

  const slotCalories = useMemo(() => {
    const map: Record<MealSlot, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    for (const entry of confirmedEntries) {
      if (map[entry.mealSlot] !== undefined) {
        map[entry.mealSlot] += Math.round(entry.caloriesKcal * entry.quantity);
      }
    }
    return map;
  }, [confirmedEntries]);

  const slotCounts = useMemo(() => {
    const map: Record<MealSlot, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    for (const entry of confirmedEntries) {
      if (map[entry.mealSlot] !== undefined) {
        map[entry.mealSlot] += 1;
      }
    }
    return map;
  }, [confirmedEntries]);

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
      is_confirmed: true,
    });
  };

  const handleConfirmUnconfirmedEntry = (entry: FoodEntry) => {
    // Confirming directly retains provenance (ai_estimated) and sets isConfirmed: true
    const updates = {
      isConfirmed: true,
      is_confirmed: true,
      provenance: entry.provenance ?? ("ai_estimated" as FoodProvenance),
    };
    if (updateFoodEntry) {
      updateFoodEntry(entry.id, updates);
    } else {
      deleteFoodEntry(entry.id);
      addFoodEntry({
        ...entry,
        ...updates,
      });
    }
  };

  const handleSaveEdit = (id: string, updates: Partial<FoodEntry>) => {
    if (updateFoodEntry) {
      updateFoodEntry(id, updates);
    }
  };

  const handleOpenAddForSlot = (slot: MealSlot) => {
    setSelectedSlot(slot);
    setShowAddPanel(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* 1. Date Navigation in the Profile Timezone */}
      <NutritionDateNav
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        timezone={timezone}
        onOpenPhotoModal={() => setShowPhotoModal(true)}
        onToggleAddPanel={() => setShowAddPanel((prev) => !prev)}
        showAddPanel={showAddPanel}
      />

      {/* 2. Meal Tabs */}
      <NutritionMealTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        slotCalories={slotCalories}
        slotCounts={slotCounts}
      />

      {/* 3. Totals Header */}
      <NutritionTotalsHeader
        confirmedTotals={nutrition.confirmedTotals}
        unconfirmedCalories={nutrition.unconfirmedEstimates.caloriesKcal}
        unconfirmedCount={nutrition.unconfirmedEstimates.entryCount}
        calorieTargetKcal={goals.calorieTargetKcal}
        calorieProvenance={goals.calorieProvenance}
        proteinTargetG={goals.proteinTargetG}
        proteinMinG={goals.proteinMinG}
        proteinMaxG={goals.proteinMaxG}
        proteinProvenance={goals.proteinProvenance}
        carbsTargetG={goals.carbsTargetG ?? null}
        fatTargetG={goals.fatTargetG ?? null}
      />

      {/* 4. Entries Per Meal with Edit, Duplicate and Delete */}
      <NutritionMealEntries
        entries={todayEntries}
        activeTab={activeTab}
        onEditEntry={(entry) => setEditingEntry(entry)}
        onDuplicateEntry={handleDuplicate}
        onDeleteEntry={deleteFoodEntry}
        onAddClick={handleOpenAddForSlot}
      />

      {/* 5. Add-Food Panel */}
      <NutritionAddPanel
        isOpen={showAddPanel}
        onClose={() => setShowAddPanel(false)}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onSlotChange={setSelectedSlot}
        onAddEntry={addFoodEntry}
        onOpenCustomModal={() => setShowCustomModal(true)}
        onOpenPhotoModal={() => setShowPhotoModal(true)}
      />

      {/* 6. Photo Flow (MealPhotoUploader Modal) */}
      <MealPhotoUploader
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onOpenManualEntry={() => {
          setShowPhotoModal(false);
          setShowAddPanel(true);
        }}
      />

      {/* 7. Unconfirmed AI Items Section (Excluded from totals with a count) */}
      <NutritionUnconfirmedSection
        unconfirmedEntries={unconfirmedEntries}
        onConfirmEntry={handleConfirmUnconfirmedEntry}
        onEditEntry={(entry) => setEditingEntry(entry)}
        onDeleteEntry={deleteFoodEntry}
      />

      {/* 8. Previous-Day Review */}
      <NutritionPreviousDayReview
        selectedDate={selectedDate}
        getFoodEntriesForDate={getFoodEntriesForDate}
        goals={goals}
        timezone={timezone}
      />

      {/* Custom Food Creation Modal */}
      <NutritionCustomFoodModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onAddEntry={addFoodEntry}
      />

      {/* Edit Entry Modal */}
      <NutritionEditEntryModal
        entry={editingEntry}
        isOpen={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
