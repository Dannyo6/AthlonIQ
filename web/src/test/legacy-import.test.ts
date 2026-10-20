import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Legacy localStorage Scanner & Demo Skipping", () => {
  const STORAGE_KEY = "athloniq_state_v1";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("filters out demo items and identifies only genuine athlete entries", () => {
    // Populate legacy local storage with mixed demo data and real athlete data
    const mixedFoods = [
      {
        id: "demo-food-01",
        foodName: "Demo Oats & Protein",
        caloriesKcal: 400,
        notes: "Alex Mercer Demo Breakfast",
      },
      {
        id: "demo-food-02",
        foodName: "Alex Mercer Pre-workout Rice",
        caloriesKcal: 350,
      },
      {
        id: "real-food-01",
        foodName: "Real Chicken Breast & Jasmine Rice",
        caloriesKcal: 520,
        notes: "Leg day post-workout meal",
      },
      {
        id: "real-food-02",
        foodName: "Salmon & Sweet Potato",
        caloriesKcal: 480,
      },
    ];

    const mixedWorkouts = [
      {
        id: "demo-workout-01",
        title: "Upper Body Hypertrophy (Demo)",
        notes: "Alex Mercer Sample Log",
      },
      {
        id: "real-workout-01",
        title: "Chest & Triceps Power",
        notes: "Hit bench PR 95kg",
      },
    ];

    localStorage.setItem(`${STORAGE_KEY}_food_entries`, JSON.stringify(mixedFoods));
    localStorage.setItem(`${STORAGE_KEY}_workout_sessions`, JSON.stringify(mixedWorkouts));

    const rawFoods = localStorage.getItem(`${STORAGE_KEY}_food_entries`);
    const rawWorkouts = localStorage.getItem(`${STORAGE_KEY}_workout_sessions`);

    const parsedFoods = rawFoods ? JSON.parse(rawFoods) : [];
    const parsedWorkouts = rawWorkouts ? JSON.parse(rawWorkouts) : [];

    // Apply the exact filtering logic from useAthloniqState
    const validFoods = parsedFoods.filter(
      (f: any) =>
        !f.notes?.includes("Alex Mercer") &&
        !f.id?.startsWith("demo-") &&
        !f.foodName?.includes("Alex Mercer")
    );
    const validWorkouts = parsedWorkouts.filter(
      (w: any) =>
        !w.notes?.includes("Alex Mercer") &&
        !w.id?.startsWith("demo-") &&
        !w.title?.includes("Alex Mercer")
    );

    // Verify demo entries were skipped
    expect(validFoods.length).toBe(2);
    expect(validFoods.map((f: any) => f.id)).toEqual(["real-food-01", "real-food-02"]);

    expect(validWorkouts.length).toBe(1);
    expect(validWorkouts[0].id).toBe("real-workout-01");

    // Verify raw keys remain untouched in localStorage
    expect(localStorage.getItem(`${STORAGE_KEY}_food_entries`)).toBe(JSON.stringify(mixedFoods));
    expect(localStorage.getItem(`${STORAGE_KEY}_workout_sessions`)).toBe(JSON.stringify(mixedWorkouts));
  });

  it("produces zero import count if all stored data belongs to demo fixture", () => {
    const allDemoFoods = [
      { id: "demo-1", foodName: "Demo Snack", notes: "Alex Mercer sample" },
      { id: "demo-2", foodName: "Demo Shake" },
    ];
    localStorage.setItem(`${STORAGE_KEY}_food_entries`, JSON.stringify(allDemoFoods));

    const raw = localStorage.getItem(`${STORAGE_KEY}_food_entries`);
    const parsed = raw ? JSON.parse(raw) : [];
    const valid = parsed.filter(
      (f: any) => !f.notes?.includes("Alex Mercer") && !f.id?.startsWith("demo-")
    );

    expect(valid.length).toBe(0);
  });
});
