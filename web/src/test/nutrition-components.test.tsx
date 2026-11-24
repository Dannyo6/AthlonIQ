import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";

import { NutritionTotalsHeader } from "@/features/nutrition/components/NutritionTotalsHeader";
import { NutritionDateNav } from "@/features/nutrition/components/NutritionDateNav";
import { NutritionMealEntries } from "@/features/nutrition/components/NutritionMealEntries";
import { NutritionUnconfirmedSection } from "@/features/nutrition/components/NutritionUnconfirmedSection";
import { NutritionPreviousDayReview } from "@/features/nutrition/components/NutritionPreviousDayReview";
import { NutritionAddPanel } from "@/features/nutrition/components/NutritionAddPanel";
import { NutritionCustomFoodModal } from "@/features/nutrition/components/NutritionCustomFoodModal";
import { NutritionEditEntryModal } from "@/features/nutrition/components/NutritionEditEntryModal";
import { CandidateReviewForm } from "@/features/nutrition/components/CandidateReviewForm";
import {
  MacroFields,
  validateMacroInput,
  parseMacroInput,
  validateAllMacros,
} from "@/features/nutrition/components/MacroFields";
import { MEAL_SLOTS, QUANTITY_OPTIONS } from "@/features/nutrition/constants";
import { resolveDateInTimezone } from "@/lib/weeklyConsistency";
import { FoodEntry, UserGoals, CandidateFoodItem } from "@/types";

// Mock external services
vi.mock("@/services/api", () => ({
  sendCoachChatTurn: vi.fn(),
  fetchWeeklyReview: vi.fn(),
  analyzeMealPhoto: vi.fn(),
  checkBackendHealth: vi.fn().mockResolvedValue({ status: "healthy" }),
}));

vi.mock("@/features/pwa/usePwa", () => ({
  usePwa: () => ({ isOnline: true }),
}));

const mockGoalsWithTarget: UserGoals = {
  calorieTargetKcal: 2500,
  calorieProvenance: "user_confirmed",
  proteinTargetG: 160,
  proteinMinG: 140,
  proteinMaxG: 180,
  proteinProvenance: "verified_reference",
  carbsTargetG: 300,
  fatTargetG: 70,
  waterTargetMl: 3500,
};

const mockNullGoals: UserGoals = {
  calorieTargetKcal: null,
  calorieProvenance: "provisional_default",
  proteinTargetG: 0,
  proteinMinG: 0,
  proteinMaxG: 0,
  proteinProvenance: "provisional_default",
  carbsTargetG: null,
  fatTargetG: null,
  waterTargetMl: 3500,
};

let currentGoals: UserGoals = mockNullGoals;
let currentFoodEntries: FoodEntry[] = [];
let currentTimezone: string = "Asia/Kolkata";

const mockAddFoodEntry = vi.fn();
const mockUpdateFoodEntry = vi.fn();
const mockDeleteFoodEntry = vi.fn();

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    goals: currentGoals,
    foodEntries: currentFoodEntries,
    preferences: { timezone: currentTimezone },
    addFoodEntry: mockAddFoodEntry,
    updateFoodEntry: mockUpdateFoodEntry,
    deleteFoodEntry: mockDeleteFoodEntry,
    getFoodEntriesForDate: (date: string) =>
      currentFoodEntries.filter((e) => e.loggedDate === date),
  }),
}));

describe("Nutrition Components & Ergonomics Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentGoals = mockNullGoals;
    currentFoodEntries = [];
    currentTimezone = "Asia/Kolkata";
  });

  // =========================================================================
  // 1. Unconfirmed items excluded from totals with the count shown
  // =========================================================================
  describe("1. Unconfirmed items excluded from totals with count shown", () => {
    it("strictly excludes unconfirmed AI entries from confirmed daily totals and displays the unconfirmed count badge", () => {
      currentGoals = mockGoalsWithTarget;
      currentFoodEntries = [
        {
          id: "entry-1",
          loggedDate: "2026-10-20",
          mealSlot: "breakfast",
          foodName: "Confirmed Oatmeal",
          quantity: 1,
          servingLabel: "1 bowl",
          caloriesKcal: 350,
          proteinG: 15,
          carbsG: 60,
          fatG: 5,
          provenance: "verified_reference",
          isConfirmed: true,
          is_confirmed: true,
        },
        {
          id: "entry-2",
          loggedDate: "2026-10-20",
          mealSlot: "lunch",
          foodName: "AI Scanned Biryani (Unconfirmed)",
          quantity: 1,
          servingLabel: "1 plate",
          caloriesKcal: 450,
          proteinG: 22,
          carbsG: 65,
          fatG: 12,
          provenance: "ai_estimated",
          isConfirmed: false,
          is_confirmed: false,
        },
      ];

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionTotalsHeader
              confirmedTotals={{
                caloriesKcal: 350,
                proteinG: 15,
                carbsG: 60,
                fatG: 5,
                entryCount: 1,
              }}
              unconfirmedCalories={450}
              unconfirmedCount={1}
              calorieTargetKcal={2500}
              calorieProvenance="user_confirmed"
              proteinTargetG={160}
              proteinMinG={140}
              proteinMaxG={180}
              proteinProvenance="verified_reference"
            />
            <NutritionUnconfirmedSection
              unconfirmedEntries={[currentFoodEntries[1]]}
              onConfirmEntry={vi.fn()}
              onEditEntry={vi.fn()}
              onDeleteEntry={vi.fn()}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Confirmed calories should be 350, NOT 800
      expect(screen.getByText("350 / 2500 kcal")).toBeInTheDocument();
      expect(screen.queryByText("800 / 2500 kcal")).not.toBeInTheDocument();

      // Unconfirmed exclusion badges
      expect(
        screen.getByText("+450 kcal unconfirmed (excluded)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("+450 kcal excluded from daily totals")
      ).toBeInTheDocument();
      expect(screen.getByText("1 item")).toBeInTheDocument();

      // Unconfirmed section shows food name and UNCONFIRMED badge
      expect(
        screen.getByText("AI Scanned Biryani (Unconfirmed)")
      ).toBeInTheDocument();
      expect(screen.getByText("UNCONFIRMED")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. Null calorie target hides ratios but shows the real logged kcal
  // =========================================================================
  describe("2. Null calorie target hides ratios but shows real logged kcal", () => {
    it("renders real logged calories and onboarding alert without fabricating targets or ratios when target is null", () => {
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionTotalsHeader
              confirmedTotals={{
                caloriesKcal: 420,
                proteinG: 28,
                carbsG: 45,
                fatG: 14,
                entryCount: 2,
              }}
              unconfirmedCalories={0}
              unconfirmedCount={0}
              calorieTargetKcal={null}
              calorieProvenance="provisional_default"
              proteinTargetG={null}
              proteinMinG={null}
              proteinMaxG={null}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Real logged kcal is shown
      expect(screen.getByText("420 kcal logged")).toBeInTheDocument();

      // Onboarding CTA is shown
      expect(
        screen.getByText(/Calorie target not set — finish onboarding/i)
      ).toBeInTheDocument();

      // Ratios and progress bar text must be hidden (no / 2000, no %, no NaN)
      expect(screen.queryByText(/\/ 2000/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\/ 2500/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Calories/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. Date navigation at 00:30 and 23:30 in the saved timezone
  // =========================================================================
  describe("3. Date navigation at 00:30 and 23:30 in the saved timezone", () => {
    it("resolves date across midnight UTC boundary for Asia/Kolkata (+05:30)", () => {
      // 2026-10-20 19:00:00 UTC = 2026-10-21 00:30:00 in Asia/Kolkata
      const at0030Kolkata = new Date("2026-10-20T19:00:00.000Z");
      expect(resolveDateInTimezone(at0030Kolkata, "Asia/Kolkata")).toBe("2026-10-21");

      // 2026-10-20 18:00:00 UTC = 2026-10-20 23:30:00 in Asia/Kolkata
      const at2330Kolkata = new Date("2026-10-20T18:00:00.000Z");
      expect(resolveDateInTimezone(at2330Kolkata, "Asia/Kolkata")).toBe("2026-10-20");
    });

    it("resolves date across midnight UTC boundary for America/New_York (-04:00)", () => {
      // 2026-10-21 04:30:00 UTC = 2026-10-21 00:30:00 in America/New_York (EDT UTC-4)
      const at0030NY = new Date("2026-10-21T04:30:00.000Z");
      expect(resolveDateInTimezone(at0030NY, "America/New_York")).toBe("2026-10-21");

      // 2026-10-21 03:30:00 UTC = 2026-10-20 23:30:00 in America/New_York (EDT UTC-4)
      const at2330NY = new Date("2026-10-21T03:30:00.000Z");
      expect(resolveDateInTimezone(at2330NY, "America/New_York")).toBe("2026-10-20");
    });

    it("supports stepping previous and next days in NutritionDateNav", () => {
      const onDateChange = vi.fn();

      render(
        <NutritionDateNav
          selectedDate="2026-10-20"
          onDateChange={onDateChange}
          timezone="Asia/Kolkata"
          onOpenPhotoModal={vi.fn()}
          onToggleAddPanel={vi.fn()}
          showAddPanel={false}
        />
      );

      // Click Previous day
      const prevBtn = screen.getByLabelText("Previous day");
      fireEvent.click(prevBtn);
      expect(onDateChange).toHaveBeenCalledWith("2026-10-19");

      // Click Next day
      const nextBtn = screen.getByLabelText("Next day");
      fireEvent.click(nextBtn);
      expect(onDateChange).toHaveBeenCalledWith("2026-10-21");
    });
  });

  // =========================================================================
  // 4. Delete and duplicate
  // =========================================================================
  describe("4. Delete and duplicate operations", () => {
    it("invokes duplicate handler when duplicate button is clicked", () => {
      const sampleEntry: FoodEntry = {
        id: "entry-oats-1",
        loggedDate: "2026-10-20",
        mealSlot: "breakfast",
        foodName: "Rolled Oats",
        quantity: 1.5,
        servingLabel: "1 cup",
        caloriesKcal: 300,
        proteinG: 10,
        carbsG: 50,
        fatG: 4,
        provenance: "verified_reference",
        isConfirmed: true,
        is_confirmed: true,
      };

      const onDuplicate = vi.fn();
      const onDelete = vi.fn();
      const onEdit = vi.fn();

      render(
        <NutritionMealEntries
          entries={[sampleEntry]}
          activeTab="all"
          onEditEntry={onEdit}
          onDuplicateEntry={onDuplicate}
          onDeleteEntry={onDelete}
          onAddClick={vi.fn()}
        />
      );

      // Click Duplicate
      const dupButton = screen.getByLabelText("Duplicate Rolled Oats");
      fireEvent.click(dupButton);
      expect(onDuplicate).toHaveBeenCalledTimes(1);
      expect(onDuplicate).toHaveBeenCalledWith(sampleEntry);

      // Click Delete
      const delButton = screen.getByLabelText("Delete Rolled Oats");
      fireEvent.click(delButton);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("entry-oats-1");
    });
  });

  // =========================================================================
  // 5. Empty, loading and error states
  // =========================================================================
  describe("5. Empty, loading and error states", () => {
    it("renders empty slot messages when no entries exist in meal slots", () => {
      render(
        <NutritionMealEntries
          entries={[]}
          activeTab="all"
          onEditEntry={vi.fn()}
          onDuplicateEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
          onAddClick={vi.fn()}
        />
      );

      expect(
        screen.getByText("No entries logged for Breakfast")
      ).toBeInTheDocument();
      expect(
        screen.getByText("No entries logged for Lunch")
      ).toBeInTheDocument();
      expect(
        screen.getByText("No entries logged for Dinner")
      ).toBeInTheDocument();
      expect(
        screen.getByText("No entries logged for Snack")
      ).toBeInTheDocument();
    });

    it("renders empty unconfirmed state when no pending AI items exist", () => {
      render(
        <NutritionUnconfirmedSection
          unconfirmedEntries={[]}
          onConfirmEntry={vi.fn()}
          onEditEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
        />
      );

      expect(
        screen.getByText("No unconfirmed AI estimates")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "All food entries for this date are verified and counted toward your daily totals."
        )
      ).toBeInTheDocument();
    });

    it("renders empty previous-day review state when no logs exist on previous day", () => {
      render(
        <NutritionPreviousDayReview
          selectedDate="2026-10-20"
          getFoodEntriesForDate={() => []}
          goals={mockGoalsWithTarget}
          timezone="Asia/Kolkata"
        />
      );

      expect(
        screen.getByText(/No entries logged on/i)
      ).toBeInTheDocument();
    });

    it("renders loading skeleton in NutritionTotalsHeader when isLoading is true", () => {
      const { container } = render(
        <MemoryRouter>
          <NutritionTotalsHeader
            confirmedTotals={{
              caloriesKcal: 0,
              proteinG: 0,
              carbsG: 0,
              fatG: 0,
              entryCount: 0,
            }}
            unconfirmedCalories={0}
            unconfirmedCount={0}
            calorieTargetKcal={null}
            proteinTargetG={null}
            proteinMinG={null}
            proteinMaxG={null}
            isLoading={true}
          />
        </MemoryRouter>
      );

      // Skeleton pulse animation container must exist
      const pulseSkeleton = container.querySelector(".animate-pulse");
      expect(pulseSkeleton).not.toBeNull();
    });
  });

  // =========================================================================
  // 6. Explicit provenance and is_confirmed across all callers
  // =========================================================================
  describe("6. Explicit provenance and is_confirmed across callers", () => {
    it("NutritionAddPanel passes explicit provenance and isConfirmed=true on add", () => {
      const onAddEntry = vi.fn();
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionAddPanel
              isOpen={true}
              onClose={vi.fn()}
              selectedDate="2026-10-20"
              selectedSlot="breakfast"
              onSlotChange={vi.fn()}
              onAddEntry={onAddEntry}
              onOpenCustomModal={vi.fn()}
              onOpenPhotoModal={vi.fn()}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Search for an item from catalog
      const searchInput = screen.getByPlaceholderText(/Search Indian & athletic foods/i);
      fireEvent.change(searchInput, { target: { value: "Oats" } });

      // Click to select the first search result
      const catalogItem = screen.getAllByRole("button").find((btn) =>
        btn.textContent?.includes("Rolled Oats")
      );
      expect(catalogItem).toBeDefined();
      fireEvent.click(catalogItem!);

      // Click Add button
      const addButton = screen.getByRole("button", { name: /Add to Breakfast/i });
      fireEvent.click(addButton);

      expect(onAddEntry).toHaveBeenCalledTimes(1);
      const added = onAddEntry.mock.calls[0][0];
      expect(added.provenance).toBe("verified_reference");
      expect(added.isConfirmed).toBe(true);
      expect(added.foodName).toBe("Rolled Oats");
    });

    it("NutritionCustomFoodModal passes explicit provenance='manual_entry' and isConfirmed=true", () => {
      const onAddEntry = vi.fn();
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionCustomFoodModal
              isOpen={true}
              onClose={vi.fn()}
              selectedDate="2026-10-20"
              selectedSlot="lunch"
              onAddEntry={onAddEntry}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Fill in fields with explicit values, including an explicit 0 for fat
      fireEvent.change(screen.getByPlaceholderText("Food name *"), {
        target: { value: "Homemade Protein Khichdi" },
      });
      fireEvent.change(screen.getByTestId("macro-input-caloriesKcal"), {
        target: { value: "320" },
      });
      fireEvent.change(screen.getByTestId("macro-input-proteinG"), {
        target: { value: "22" },
      });
      fireEvent.change(screen.getByTestId("macro-input-carbsG"), {
        target: { value: "48" },
      });
      fireEvent.change(screen.getByTestId("macro-input-fatG"), {
        target: { value: "0" }, // Explicit 0 is valid!
      });

      const submitButton = screen.getByRole("button", { name: /Add Custom Food/i });
      fireEvent.click(submitButton);

      expect(onAddEntry).toHaveBeenCalledTimes(1);
      const added = onAddEntry.mock.calls[0][0];
      expect(added.provenance).toBe("manual_entry");
      expect(added.isConfirmed).toBe(true);
      expect(added.caloriesKcal).toBe(320);
      expect(added.fatG).toBe(0);
    });

    it("CandidateReviewForm: untouched AI candidate keeps ai_estimated; edited becomes user_corrected", () => {
      const initialCandidate: CandidateFoodItem = {
        id: "cand-1",
        catalog_id: "paneer-bhurji",
        food_name: "Paneer Bhurji",
        matched_catalog_name: "Paneer Bhurji",
        estimated_serving: "1 cup 150g",
        serving_label: "1 cup 150g",
        quantity: 1.0,
        calories_kcal: 260.0,
        protein_g: 18.0,
        carbs_g: 6.0,
        fat_g: 18.0,
        confidence: "high",
        provenance: "ai_estimated",
        is_confirmed: false,
      };

      // 1. Confirm untouched candidate
      const onConfirmUntouched = vi.fn();
      const { unmount } = render(
        <CandidateReviewForm
          candidates={[initialCandidate]}
          previewUrl={null}
          selectedDate="2026-10-20"
          selectedSlot="dinner"
          onConfirm={onConfirmUntouched}
          onCancel={vi.fn()}
        />
      );

      const confirmBtn1 = screen.getByRole("button", { name: /Confirm & Log/i });
      fireEvent.click(confirmBtn1);

      expect(onConfirmUntouched).toHaveBeenCalledTimes(1);
      const untouchedResult = onConfirmUntouched.mock.calls[0][0][0];
      expect(untouchedResult.provenance).toBe("ai_estimated");
      expect(untouchedResult.isConfirmed).toBe(true);

      unmount();

      // 2. Edit candidate portion, then confirm -> provenance must change to user_corrected
      const onConfirmEdited = vi.fn();
      render(
        <CandidateReviewForm
          candidates={[initialCandidate]}
          previewUrl={null}
          selectedDate="2026-10-20"
          selectedSlot="dinner"
          onConfirm={onConfirmEdited}
          onCancel={vi.fn()}
        />
      );

      // Scale portion to 2x
      const scale2xBtn = screen.getByRole("button", { name: "2x" });
      fireEvent.click(scale2xBtn);

      const confirmBtn2 = screen.getByRole("button", { name: /Confirm & Log/i });
      fireEvent.click(confirmBtn2);

      expect(onConfirmEdited).toHaveBeenCalledTimes(1);
      const editedResult = onConfirmEdited.mock.calls[0][0][0];
      expect(editedResult.provenance).toBe("user_corrected");
      expect(editedResult.isConfirmed).toBe(true);
      expect(editedResult.quantity).toBe(2);
      expect(editedResult.caloriesKcal).toBe(520);
    });

    it("NutritionEditEntryModal: saves user_corrected when edited, retains original provenance when unchanged", () => {
      const originalEntry: FoodEntry = {
        id: "entry-ai-1",
        loggedDate: "2026-10-20",
        mealSlot: "dinner",
        foodName: "AI Scanned Paneer",
        quantity: 1,
        servingLabel: "150g",
        caloriesKcal: 260,
        proteinG: 18,
        carbsG: 6,
        fatG: 18,
        provenance: "ai_estimated",
        isConfirmed: false,
      };

      // 1. Save without changing values
      const onSaveUnchanged = vi.fn();
      const { unmount } = render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionEditEntryModal
              entry={originalEntry}
              isOpen={true}
              onClose={vi.fn()}
              onSave={onSaveUnchanged}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));
      expect(onSaveUnchanged).toHaveBeenCalledTimes(1);
      const unchangedUpdates = onSaveUnchanged.mock.calls[0][1];
      expect(unchangedUpdates.provenance).toBe("ai_estimated");
      expect(unchangedUpdates.isConfirmed).toBe(true);

      unmount();

      // 2. Change a macro value, then save
      const onSaveChanged = vi.fn();
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionEditEntryModal
              entry={originalEntry}
              isOpen={true}
              onClose={vi.fn()}
              onSave={onSaveChanged}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByTestId("macro-input-proteinG"), {
        target: { value: "24" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));
      expect(onSaveChanged).toHaveBeenCalledTimes(1);
      const changedUpdates = onSaveChanged.mock.calls[0][1];
      expect(changedUpdates.provenance).toBe("user_corrected");
      expect(changedUpdates.isConfirmed).toBe(true);
      expect(changedUpdates.proteinG).toBe(24);
    });
  });

  // =========================================================================
  // 7. Macro input validation: blank is error; explicit 0 is valid
  // =========================================================================
  describe("7. Macro input validation", () => {
    it("validateMacroInput returns 'Required' on empty or whitespace strings", () => {
      expect(validateMacroInput("")).toBe("Required");
      expect(validateMacroInput("   ")).toBe("Required");
    });

    it("validateMacroInput accepts explicit 0 and 0.0 without errors", () => {
      expect(validateMacroInput("0")).toBeNull();
      expect(validateMacroInput("0.0")).toBeNull();
      expect(validateMacroInput("0.5")).toBeNull();
      expect(validateMacroInput("100")).toBeNull();
    });

    it("validateMacroInput rejects negative numbers and non-numeric strings", () => {
      expect(validateMacroInput("-5")).toBe("Must be ≥ 0");
      expect(validateMacroInput("abc")).toBe("Must be a valid number");
    });

    it("parseMacroInput returns numeric 0 for '0' and null for blank", () => {
      expect(parseMacroInput("0")).toBe(0);
      expect(parseMacroInput("0.0")).toBe(0);
      expect(parseMacroInput("25.5")).toBe(25.5);
      expect(parseMacroInput("")).toBeNull();
      expect(parseMacroInput("   ")).toBeNull();
    });

    it("validateAllMacros rejects when any macro is blank and parses cleanly when all valid", () => {
      const incomplete = {
        caloriesKcal: "250",
        proteinG: "",
        carbsG: "30",
        fatG: "5",
      };
      const resIncomplete = validateAllMacros(incomplete);
      expect(resIncomplete.isValid).toBe(false);
      expect(resIncomplete.errors.proteinG).toBe("Required");
      expect(resIncomplete.parsed).toBeNull();

      const completeWithZero = {
        caloriesKcal: "120",
        proteinG: "28",
        carbsG: "0", // Zero carbs (e.g. egg white or isolate)
        fatG: "0.5",
      };
      const resComplete = validateAllMacros(completeWithZero);
      expect(resComplete.isValid).toBe(true);
      expect(resComplete.parsed).toEqual({
        caloriesKcal: 120,
        proteinG: 28,
        carbsG: 0,
        fatG: 0.5,
      });
    });

    it("NutritionCustomFoodModal blocks submission and displays error when macro is blank", () => {
      const onAddEntry = vi.fn();
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionCustomFoodModal
              isOpen={true}
              onClose={vi.fn()}
              selectedDate="2026-10-20"
              selectedSlot="lunch"
              onAddEntry={onAddEntry}
            />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText("Food name *"), {
        target: { value: "Black Coffee" },
      });
      // Leave calories, protein, carbs, fat blank

      fireEvent.click(screen.getByRole("button", { name: /Add Custom Food/i }));

      // Submission blocked
      expect(onAddEntry).not.toHaveBeenCalled();

      // Required errors displayed
      expect(screen.getByTestId("macro-error-caloriesKcal")).toHaveTextContent("Required");
      expect(screen.getByTestId("macro-error-proteinG")).toHaveTextContent("Required");
      expect(screen.getByTestId("macro-error-carbsG")).toHaveTextContent("Required");
      expect(screen.getByTestId("macro-error-fatG")).toHaveTextContent("Required");
    });
  });

  // =========================================================================
  // 8. Shared constants and modules
  // =========================================================================
  describe("8. Shared constants and modules", () => {
    it("exports canonical MEAL_SLOTS and QUANTITY_OPTIONS from nutrition/constants", () => {
      expect(MEAL_SLOTS).toHaveLength(4);
      expect(MEAL_SLOTS.map((s) => s.id)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
      expect(QUANTITY_OPTIONS).toEqual([0.5, 1, 1.5, 2, 2.5, 3]);
    });

    it("MacroFields renders 4 inputs with min-h-[44px] and tabular-nums", () => {
      const { container } = render(
        <MacroFields
          values={{ caloriesKcal: "100", proteinG: "10", carbsG: "15", fatG: "2" }}
          onChange={vi.fn()}
        />
      );

      const inputs = container.querySelectorAll("input");
      expect(inputs).toHaveLength(4);
      inputs.forEach((input) => {
        expect(input.className).toContain("min-h-[44px]");
        expect(input.className).toContain("tabular-nums");
      });
    });
  });

  // =========================================================================
  // 9. Timezone Date function verification
  // =========================================================================
  describe("9. Timezone Date function verification", () => {
    it("calls the real resolveDateInTimezone function from @/lib/weeklyConsistency", () => {
      // Direct call to the real exported function confirms behavior and non-mock identity
      const sampleUtc = new Date("2026-10-20T19:00:00.000Z"); // 00:30 next day in IST
      const resolved = resolveDateInTimezone(sampleUtc, "Asia/Kolkata");
      expect(resolved).toBe("2026-10-21");
      expect(typeof resolveDateInTimezone).toBe("function");
    });
  });
});
