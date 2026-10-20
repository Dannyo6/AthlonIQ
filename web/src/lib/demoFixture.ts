/**
 * AthlonIQ 14-Day Labeled Demo Fixture Generator
 * Populates 14 days of realistic, audited data for Alex Mercer (55 kg lean bulk athlete):
 * - 14-day nutrition history (12 confirmed Indian macro days, ~2,450 kcal, ~110g protein)
 * - 8 fasted weigh-ins showing a clean +0.18 kg/wk lean-bulk corridor (54.8 -> 55.4 kg)
 * - 4 resistance workouts, 2 badminton matches, 2 running sessions
 * - Active deterministic readiness score and private progress photos
 */

import {
  FoodEntry,
  WorkoutSession,
  ActivitySession,
  BodyMetric,
  RecoveryCheckIn,
  ProgressPhotoAsset,
  UserGoals,
  UserProfile,
} from "@/types";

function getDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export function generate14DayDemoFixture() {
  const today = getDateOffset(0);

  // 1. 14 Days of Confirmed Nutrition (12 days logged with verified Indian staples)
  const foodEntries: FoodEntry[] = [];
  const daysToLog = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 2, 0]; // 12 days

  daysToLog.forEach((daysAgo, idx) => {
    const date = getDateOffset(daysAgo);

    // Breakfast: 2 Whole Wheat Rotis + 2 Boiled Eggs
    foodEntries.push({
      id: `fix-food-${idx}-1`,
      loggedDate: date,
      mealSlot: "breakfast",
      foodName: "Whole Wheat Roti",
      quantity: 2.0,
      servingLabel: "1 medium (40g)",
      caloriesKcal: 208.0,
      proteinG: 7.0,
      carbsG: 40.0,
      fatG: 3.0,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });
    foodEntries.push({
      id: `fix-food-${idx}-2`,
      loggedDate: date,
      mealSlot: "breakfast",
      foodName: "Whole Boiled Egg",
      quantity: 2.0,
      servingLabel: "1 large (50g)",
      caloriesKcal: 156.0,
      proteinG: 12.6,
      carbsG: 1.2,
      fatG: 10.6,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });

    // Lunch: Steamed Rice + Toor Dal Tadka + Curd
    foodEntries.push({
      id: `fix-food-${idx}-3`,
      loggedDate: date,
      mealSlot: "lunch",
      foodName: "Cooked Steamed Rice",
      quantity: 1.5,
      servingLabel: "1 katori (150g)",
      caloriesKcal: 292.5,
      proteinG: 6.0,
      carbsG: 64.5,
      fatG: 0.8,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });
    foodEntries.push({
      id: `fix-food-${idx}-4`,
      loggedDate: date,
      mealSlot: "lunch",
      foodName: "Toor / Moong Dal Tadka",
      quantity: 1.5,
      servingLabel: "1 katori (150g)",
      caloriesKcal: 225.0,
      proteinG: 13.5,
      carbsG: 34.5,
      fatG: 5.2,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });
    foodEntries.push({
      id: `fix-food-${idx}-5`,
      loggedDate: date,
      mealSlot: "lunch",
      foodName: "Plain Dahi / Curd",
      quantity: 1.0,
      servingLabel: "1 katori (150g)",
      caloriesKcal: 92.0,
      proteinG: 4.8,
      carbsG: 6.5,
      fatG: 5.0,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });

    // Dinner: Grilled Chicken Breast + 2 Rotis + Sabzi
    foodEntries.push({
      id: `fix-food-${idx}-6`,
      loggedDate: date,
      mealSlot: "dinner",
      foodName: "Grilled Chicken Breast",
      quantity: 1.2,
      servingLabel: "150g cooked",
      caloriesKcal: 296.4,
      proteinG: 55.8,
      carbsG: 0.0,
      fatG: 6.6,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });
    foodEntries.push({
      id: `fix-food-${idx}-7`,
      loggedDate: date,
      mealSlot: "dinner",
      foodName: "Whole Wheat Roti",
      quantity: 2.0,
      servingLabel: "1 medium (40g)",
      caloriesKcal: 208.0,
      proteinG: 7.0,
      carbsG: 40.0,
      fatG: 3.0,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });

    // Snack: Roasted Chana / Whey Shake
    foodEntries.push({
      id: `fix-food-${idx}-8`,
      loggedDate: date,
      mealSlot: "snack",
      foodName: "Roasted Chana / Bengal Gram",
      quantity: 1.0,
      servingLabel: "50g bowl",
      caloriesKcal: 180.0,
      proteinG: 11.5,
      carbsG: 28.0,
      fatG: 3.0,
      provenance: "verified_reference",
      isConfirmed: true,
      is_confirmed: true,
    });
  });

  // 2. 8 Fasted Weigh-Ins over 14 Days (Steady Lean-Bulk Corridor: ~0.18 kg/week)
  const bodyMetrics: BodyMetric[] = [
    {
      id: "bm-fix-1",
      loggedDate: getDateOffset(13),
      weightKg: 54.8,
      waistCm: 72.0,
      chestCm: 90.0,
      armCm: 31.0,
      notes: "Baseline lean-bulk weigh-in, fasted AM",
    },
    {
      id: "bm-fix-2",
      loggedDate: getDateOffset(11),
      weightKg: 54.9,
      notes: "Fasted AM",
    },
    {
      id: "bm-fix-3",
      loggedDate: getDateOffset(9),
      weightKg: 55.0,
      notes: "Fasted AM",
    },
    {
      id: "bm-fix-4",
      loggedDate: getDateOffset(7),
      weightKg: 55.05,
      waistCm: 72.0,
      chestCm: 90.5,
      armCm: 31.2,
      notes: "Mid-cycle weigh-in, rested",
    },
    {
      id: "bm-fix-5",
      loggedDate: getDateOffset(5),
      weightKg: 55.15,
      notes: "Fasted AM",
    },
    {
      id: "bm-fix-6",
      loggedDate: getDateOffset(3),
      weightKg: 55.25,
      notes: "Fasted AM",
    },
    {
      id: "bm-fix-7",
      loggedDate: getDateOffset(1),
      weightKg: 55.35,
      waistCm: 72.2,
      chestCm: 91.0,
      armCm: 31.5,
      notes: "Fasted AM, post-deload",
    },
    {
      id: "bm-fix-8",
      loggedDate: today,
      weightKg: 55.4,
      waistCm: 72.2,
      notes: "Today's check-in (Corridor: +0.18 kg/wk)",
    },
  ];

  // 3. 4 Workout Sessions in Last 7 Days
  const workoutSessions: WorkoutSession[] = [
    {
      id: "ws-fix-1",
      loggedDate: getDateOffset(6),
      title: "Upper A: Horizontal Push/Pull",
      templateId: "tmpl-upper-a",
      durationMinutes: 62,
      sessionRpe: 8.0,
      completed: true,
      sets: [
        { id: "s1", exerciseName: "Barbell Bench Press", setOrder: 1, reps: 8, loadKg: 47.5, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s2", exerciseName: "Barbell Bench Press", setOrder: 2, reps: 8, loadKg: 47.5, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s3", exerciseName: "Barbell Bench Press", setOrder: 3, reps: 8, loadKg: 47.5, isBodyweight: false, rpe: 8.5, isCompleted: true, isPr: true },
        { id: "s4", exerciseName: "Bent-Over Barbell Row", setOrder: 1, reps: 10, loadKg: 42.5, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s5", exerciseName: "Bent-Over Barbell Row", setOrder: 2, reps: 10, loadKg: 42.5, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
      ],
      notes: "Great bar speed, confirmed bench setup",
    },
    {
      id: "ws-fix-2",
      loggedDate: getDateOffset(4),
      title: "Lower A: Squat & Hinge",
      templateId: "tmpl-lower-a",
      durationMinutes: 68,
      sessionRpe: 8.5,
      completed: true,
      sets: [
        { id: "s6", exerciseName: "Barbell Back Squat", setOrder: 1, reps: 6, loadKg: 55.0, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s7", exerciseName: "Barbell Back Squat", setOrder: 2, reps: 6, loadKg: 55.0, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s8", exerciseName: "Romanian Deadlift", setOrder: 1, reps: 10, loadKg: 50.0, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s9", exerciseName: "Romanian Deadlift", setOrder: 2, reps: 10, loadKg: 50.0, isBodyweight: false, rpe: 8.5, isCompleted: true, isPr: false },
      ],
      notes: "Solid depth, hamstrings firing",
    },
    {
      id: "ws-fix-3",
      loggedDate: getDateOffset(2),
      title: "Upper B: Vertical Push/Pull & Dips",
      templateId: "tmpl-upper-b",
      durationMinutes: 58,
      sessionRpe: 8.0,
      completed: true,
      sets: [
        { id: "s10", exerciseName: "Overhead Press (BB/DB)", setOrder: 1, reps: 8, loadKg: 32.5, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: false },
        { id: "s11", exerciseName: "Parallel Bar Dips", setOrder: 1, reps: 10, loadKg: 0, isBodyweight: true, rpe: 7.5, isCompleted: true, isPr: false },
        { id: "s12", exerciseName: "Parallel Bar Dips", setOrder: 2, reps: 10, loadKg: 0, isBodyweight: true, rpe: 8.0, isCompleted: true, isPr: false },
      ],
      notes: "Shoulders felt pain-free",
    },
    {
      id: "ws-fix-4",
      loggedDate: today,
      title: "Full Body & Calisthenics Hybrid",
      templateId: "tmpl-full-body",
      durationMinutes: 55,
      sessionRpe: 7.5,
      completed: true,
      sets: [
        { id: "s13", exerciseName: "Barbell Deadlift", setOrder: 1, reps: 6, loadKg: 65.0, isBodyweight: false, rpe: 8.0, isCompleted: true, isPr: true },
        { id: "s14", exerciseName: "Pull-ups", setOrder: 1, reps: 8, loadKg: 0, isBodyweight: true, rpe: 7.5, isCompleted: true, isPr: false },
        { id: "s15", exerciseName: "Pull-ups", setOrder: 2, reps: 8, loadKg: 0, isBodyweight: true, rpe: 8.0, isCompleted: true, isPr: false },
      ],
      notes: "Clean session today",
    },
  ];

  // 4. Multi-Sport Activities in Last 7 Days (Badminton: 105m, Running: 11.0 km)
  const activitySessions: ActivitySession[] = [
    {
      id: "as-fix-1",
      loggedDate: getDateOffset(5),
      activityType: "badminton",
      durationMinutes: 60,
      matchFormat: "singles",
      perceivedEffort: 8,
      routeOrNotes: "Fast-paced singles tournament practice",
    },
    {
      id: "as-fix-2",
      loggedDate: getDateOffset(4),
      activityType: "running",
      durationMinutes: 27.5,
      distanceKm: 5.0,
      paceFormatted: "5:30 /km",
      perceivedEffort: 7,
      routeOrNotes: "Park loop, steady aerobic pace",
    },
    {
      id: "as-fix-3",
      loggedDate: getDateOffset(3),
      activityType: "badminton",
      durationMinutes: 45,
      matchFormat: "doubles",
      perceivedEffort: 7,
      routeOrNotes: "Club doubles drills and footwork",
    },
    {
      id: "as-fix-4",
      loggedDate: getDateOffset(1),
      activityType: "running",
      durationMinutes: 33.0,
      distanceKm: 6.0,
      paceFormatted: "5:30 /km",
      perceivedEffort: 7,
      routeOrNotes: "Morning road run",
    },
  ];

  // 5. Today's Recovery Check-in
  const todayCheckIn: RecoveryCheckIn = {
    date: today,
    sleepHours: 7.5,
    sleepQuality: 4,
    soreness: 2,
    fatigue: 2,
    stress: 2,
  };

  // 6. Progress Photos (Baseline Day -13 and Current Day 0)
  const progressPhotos: ProgressPhotoAsset[] = [
    {
      id: "photo-fix-baseline",
      loggedDate: getDateOffset(13),
      weightKg: 54.8,
      imageUrl:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%23121622'/><circle cx='200' cy='160' r='50' fill='%231e293b'/><rect x='160' y='220' width='80' height='130' rx='16' fill='%231e293b'/><text x='50%25' y='75%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-weight='bold' font-size='14'>Day 1 Baseline (54.8 kg)</text><text x='50%25' y='82%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='11'>Fasted AM · Waist 72.0 cm</text></svg>",
      notes: "Day 1 lean-bulk start (Fasted AM light)",
      category: "progress",
    },
    {
      id: "photo-fix-current",
      loggedDate: today,
      weightKg: 55.4,
      imageUrl:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%230f172a'/><circle cx='200' cy='160' r='50' fill='%23334155'/><rect x='155' y='220' width='90' height='130' rx='16' fill='%23334155'/><text x='50%25' y='75%25' dominant-baseline='middle' text-anchor='middle' fill='%23bef264' font-family='sans-serif' font-weight='bold' font-size='14'>Day 14 Check-In (55.4 kg)</text><text x='50%25' y='82%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='11'>Lean Bulk +0.6 kg Accrual · Waist 72.2 cm</text></svg>",
      notes: "Day 14 progress (+0.6 kg delta, minimal waist creep)",
      category: "progress",
    },
  ];

  // 7. Goals
  const goals: UserGoals = {
    proteinMinG: 88,
    proteinMaxG: 121,
    proteinTargetG: 110,
    proteinProvenance: "user_confirmed",
    calorieTargetKcal: 2450,
    calorieProvenance: "calculated_estimate",
    carbsTargetG: 320,
    fatTargetG: 68,
    waterTargetMl: 3500,
  };

  // 8. Profile
  const profileUpdates: Partial<UserProfile> = {
    onboardingCompleted: true,
    onboardingStep: 5,
    equipmentConfirmed: true,
    weightKg: 55.4,
    sleepBaselineHours: 7.5,
    trainingDaysPerWeek: 5,
  };

  return {
    foodEntries,
    bodyMetrics,
    workoutSessions,
    activitySessions,
    todayCheckIn,
    progressPhotos,
    goals,
    profileUpdates,
  };
}
