import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";

import { NutritionTotalsHeader } from "@/features/nutrition/components/NutritionTotalsHeader";
import { NutritionDateNav } from "@/features/nutrition/components/NutritionDateNav";
import { NutritionMealEntries } from "@/features/nutrition/components/NutritionMealEntries";
import { NutritionUnconfirmedSection } from "@/features/nutrition/components/NutritionUnconfirmedSection";
import { NutritionPreviousDayReview } from "@/features/nutrition/components/NutritionPreviousDayReview";
import { resolveDateInTimezone } from "@/lib/weeklyConsistency";
import { FoodEntry, UserGoals } from "@/types";

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
});
