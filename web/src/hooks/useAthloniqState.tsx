import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  EquipmentItem,
  UserGoals,
  UserPreferences,
  RecoveryCheckIn,
  ReadinessResult,
  FoodEntry,
  WorkoutSession,
  ActivitySession,
  BodyMetric,
  EpistemicCoachMessage,
  ProposedCoachAction,
  ProgressPhotoAsset,
} from "@/types";
import {
  calculateRulesReadiness,
  calculateEnergyEstimate,
  calculateProteinReference,
} from "@/lib/calculations";
import { generate14DayDemoFixture } from "@/lib/demoFixture";

export interface AthlonToast {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

const STORAGE_KEY = "athloniq_state_v1";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const DEFAULT_PROFILE: UserProfile = {
  id: "athlete-001",
  email: "alex@athloniq.io",
  fullName: "Alex Mercer",
  age: 20,
  heightCm: 173.0,
  weightKg: 55.0,
  dietaryPattern: "nonvegetarian",
  primaryGoal: "lean_bulk",
  trainingScope: ["gym", "calisthenics", "badminton", "running"],
  trainingDaysPerWeek: 5,
  trainingEnvironment: "home_gym",
  calorieTrackingHabit: "rough_estimates",

  // Known unknowns (MUST default to null until explicitly provided)
  sex: null,
  waistCm: null,
  experienceLevel: null,
  currentSplit: null,
  weeklyBadmintonSessions: null,
  weeklyRunningSessions: null,
  sleepBaselineHours: null,
  exerciseLimitations: null,

  // Onboarding & confirmation flags
  onboardingStep: 1,
  onboardingCompleted: false,
  equipmentConfirmed: false,
};

const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  {
    id: "eq-1",
    itemKey: "bench",
    itemName: "Flat/Incline Bench",
    maxLoadKg: 150.0,
    minIncrementKg: 2.5,
    isAvailable: true,
    isConfirmed: false,
    notes: "Historical home gym setup",
  },
  {
    id: "eq-2",
    itemKey: "squat_rack",
    itemName: "Squat/Power Rack",
    maxLoadKg: 200.0,
    minIncrementKg: 2.5,
    isAvailable: true,
    isConfirmed: false,
    notes: "Historical home gym setup",
  },
  {
    id: "eq-3",
    itemKey: "dips_station",
    itemName: "Dips Station",
    maxLoadKg: null,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
    notes: "Bodyweight station",
  },
  {
    id: "eq-4",
    itemKey: "lat_pulldown_station",
    itemName: "Lat Pulldown Station",
    maxLoadKg: 100.0,
    minIncrementKg: 5.0,
    isAvailable: true,
    isConfirmed: false,
    notes: "Cable pulley attachment",
  },
  {
    id: "eq-5",
    itemKey: "free_weights_70kg",
    itemName: "Free Weights up to 70 kg",
    maxLoadKg: 70.0,
    minIncrementKg: 1.25,
    isAvailable: true,
    isConfirmed: false,
    notes: "Barbell & adjustable dumbbells",
  },
];

const DEFAULT_GOALS: UserGoals = {
  proteinMinG: 88,
  proteinMaxG: 121,
  proteinTargetG: 110,
  proteinProvenance: "provisional_default",
  calorieTargetKcal: null, // Gated until onboarding completed
  calorieProvenance: "awaiting_onboarding",
  carbsTargetG: null,
  fatTargetG: null,
  waterTargetMl: 3500,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: "kg",
  distanceUnit: "km",
  timezone: "Asia/Kolkata",
  notificationsEnabled: false,
  quietHoursStart: "22:30",
  quietHoursEnd: "07:00",
};

const DEFAULT_CHECKIN: RecoveryCheckIn = {
  date: todayISO(),
  sleepHours: 7.5,
  sleepQuality: 4,
  soreness: 2,
  fatigue: 2,
  stress: null,
};

const DEFAULT_COACH_MESSAGES: EpistemicCoachMessage[] = [
  {
    id: "init-1",
    sender: "coach",
    text: "Welcome Alex. I have ingested your latest check-in data: self-reported sleep is 7.5 hours (Quality: 4/5), soreness is 2/5, yielding a deterministic Readiness score of 82% (Prime). Your target protein is 110 g/day for your lean bulk. How can we optimize today's protocol?",
    timestamp: "10:00 AM",
    toolsUsed: ["get_user_goals", "get_recovery_history"],
    factsFromTools: [
      "Athlete baseline: Alex Mercer, 20yo, 173cm, 55kg (lean_bulk, nonvegetarian).",
      "Training scope: 5 days/wk home gym (70kg free-weight setup), running, badminton, and calisthenics.",
    ],
    appCalculations: [
      "Protein reference band: 88–121 g/day (provisional target: 110 g).",
      "Readiness: Prime (82%) from transparent rules-based check-in.",
    ],
    recommendations: [
      "Target compound movements at RPE 8.0–8.5.",
      "Ensure a high-protein post-workout nonvegetarian meal.",
    ],
    missingOrUncertain: [
      "Home gym equipment setup awaits confirmation in Profile → Equipment.",
      "At least 3 weigh-ins required to build a 7-day rolling weight trend.",
    ],
    proposedAction: null,
  },
];

const DEFAULT_PROGRESS_PHOTOS: ProgressPhotoAsset[] = [
  {
    id: "photo-baseline",
    loggedDate: "2026-10-01",
    weightKg: 54.8,
    imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%23121622'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='14'>Baseline Front Physique (54.8 kg)</text></svg>",
    notes: "Baseline lean bulk check-in (Fasted, morning light)",
    category: "progress",
  },
];

// =============================================================================
// Phase 2 Context Interface
// =============================================================================

interface AthloniqContextType {
  // Phase 1 state
  profile: UserProfile;
  equipment: EquipmentItem[];
  goals: UserGoals;
  preferences: UserPreferences;
  todayCheckIn: RecoveryCheckIn;
  readiness: ReadinessResult;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateEquipmentItem: (id: string, updates: Partial<EquipmentItem>) => void;
  confirmEquipment: (confirmedItems: EquipmentItem[]) => void;
  updateGoals: (updates: Partial<UserGoals>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  submitCheckIn: (checkIn: Partial<RecoveryCheckIn>) => void;
  completeOnboarding: (finalData: Partial<UserProfile>) => void;
  resetToDefaults: () => void;

  // Phase 2: Nutrition
  foodEntries: FoodEntry[];
  addFoodEntry: (entry: Omit<FoodEntry, "id">) => void;
  updateFoodEntry: (id: string, updates: Partial<FoodEntry>) => void;
  deleteFoodEntry: (id: string) => void;
  getFoodEntriesForDate: (date: string) => FoodEntry[];

  // Phase 2: Workouts
  workoutSessions: WorkoutSession[];
  addWorkoutSession: (session: Omit<WorkoutSession, "id">) => void;
  updateWorkoutSession: (id: string, updates: Partial<WorkoutSession>) => void;
  deleteWorkoutSession: (id: string) => void;
  getTodayWorkout: () => WorkoutSession | undefined;

  // Phase 2: Activities
  activitySessions: ActivitySession[];
  addActivitySession: (session: Omit<ActivitySession, "id">) => void;
  updateActivitySession: (id: string, updates: Partial<ActivitySession>) => void;
  deleteActivitySession: (id: string) => void;
  getActivitiesForDate: (date: string) => ActivitySession[];
  getWeeklyActivities: () => ActivitySession[];

  // Phase 2: Body Metrics
  bodyMetrics: BodyMetric[];
  addBodyMetric: (metric: Omit<BodyMetric, "id">) => void;
  updateBodyMetric: (id: string, updates: Partial<BodyMetric>) => void;
  deleteBodyMetric: (id: string) => void;
  getLatestWeight: () => BodyMetric | undefined;

  // Phase 4: AI Coach & Weekly Review
  coachMessages: EpistemicCoachMessage[];
  addCoachMessage: (msg: EpistemicCoachMessage) => void;
  clearCoachMessages: () => void;
  applyProposedAction: (messageId: string, action: ProposedCoachAction) => void;
  dismissProposedAction: (messageId: string) => void;
  getCoachingSnapshot: () => any;

  // Phase 5: Progress Photos
  progressPhotos: ProgressPhotoAsset[];
  addProgressPhoto: (photo: Omit<ProgressPhotoAsset, "id">) => void;
  deleteProgressPhoto: (id: string) => void;

  // Feedback Toast System
  toast: AthlonToast | null;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
  hideToast: () => void;

  // 14-Day Labeled Demo Fixture
  isDemoFixtureActive: boolean;
  loadDemoFixture: () => void;
  resetDemoFixture: () => void;
}

const AthloniqContext = createContext<AthloniqContextType | null>(null);

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`AthlonIQ: failed to persist '${key}':`, e);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AthloniqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Phase 1 state
  const [profile, setProfile] = useState<UserProfile>(() => loadFromStorage("profile", DEFAULT_PROFILE));
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => loadFromStorage("equipment", DEFAULT_EQUIPMENT));
  const [goals, setGoals] = useState<UserGoals>(() => loadFromStorage("goals", DEFAULT_GOALS));
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadFromStorage("preferences", DEFAULT_PREFERENCES));
  const [todayCheckIn, setTodayCheckIn] = useState<RecoveryCheckIn>(() => loadFromStorage("checkin", DEFAULT_CHECKIN));

  // Phase 2 state
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(() => loadFromStorage("food_entries", []));
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>(() => loadFromStorage("workout_sessions", []));
  const [activitySessions, setActivitySessions] = useState<ActivitySession[]>(() => loadFromStorage("activity_sessions", []));
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>(() => loadFromStorage("body_metrics", []));

  // Phase 4 state
  const [coachMessages, setCoachMessages] = useState<EpistemicCoachMessage[]>(() =>
    loadFromStorage("coach_messages", DEFAULT_COACH_MESSAGES)
  );

  // Phase 5 state
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhotoAsset[]>(() =>
    loadFromStorage("progress_photos", DEFAULT_PROGRESS_PHOTOS)
  );

  // Toast notification state
  const [toast, setToast] = useState<AthlonToast | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const id = Date.now().toString();
    setToast({ id, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 3800);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  // Demo fixture active state
  const [isDemoFixtureActive, setIsDemoFixtureActive] = useState<boolean>(() =>
    loadFromStorage("is_demo_fixture_active", false)
  );

  // Deterministic readiness calculation
  const readiness = calculateRulesReadiness(
    todayCheckIn.sleepHours,
    todayCheckIn.sleepQuality,
    todayCheckIn.soreness,
    todayCheckIn.fatigue,
    todayCheckIn.stress
  );

  // Sync all Phase 1 state to localStorage
  useEffect(() => { saveToStorage("profile", profile); }, [profile]);
  useEffect(() => { saveToStorage("equipment", equipment); }, [equipment]);
  useEffect(() => { saveToStorage("goals", goals); }, [goals]);
  useEffect(() => { saveToStorage("preferences", preferences); }, [preferences]);
  useEffect(() => { saveToStorage("checkin", todayCheckIn); }, [todayCheckIn]);

  // Sync all Phase 2 state to localStorage
  useEffect(() => { saveToStorage("food_entries", foodEntries); }, [foodEntries]);
  useEffect(() => { saveToStorage("workout_sessions", workoutSessions); }, [workoutSessions]);
  useEffect(() => { saveToStorage("activity_sessions", activitySessions); }, [activitySessions]);
  useEffect(() => { saveToStorage("body_metrics", bodyMetrics); }, [bodyMetrics]);

  // Sync Phase 4 coach messages to localStorage
  useEffect(() => { saveToStorage("coach_messages", coachMessages); }, [coachMessages]);

  // Sync Phase 5 progress photos to localStorage
  useEffect(() => { saveToStorage("progress_photos", progressPhotos); }, [progressPhotos]);

  // Sync demo fixture state
  useEffect(() => { saveToStorage("is_demo_fixture_active", isDemoFixtureActive); }, [isDemoFixtureActive]);

  // ==========================================================================
  // Phase 1 Actions
  // ==========================================================================

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.weightKg && updates.weightKg !== prev.weightKg) {
        const pRef = calculateProteinReference(updates.weightKg);
        setGoals((g) => ({
          ...g,
          proteinMinG: pRef.proteinMinG,
          proteinMaxG: pRef.proteinMaxG,
          proteinTargetG: pRef.proteinTargetG,
          proteinProvenance: pRef.provenance,
        }));
      }
      return updated;
    });
  }, []);

  const updateEquipmentItem = useCallback((id: string, updates: Partial<EquipmentItem>) => {
    setEquipment((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      const allConfirmed = next.every((item) => item.isConfirmed);
      setProfile((p) => ({ ...p, equipmentConfirmed: allConfirmed }));
      return next;
    });
  }, []);

  const confirmEquipment = useCallback((confirmedItems: EquipmentItem[]) => {
    setEquipment(confirmedItems);
    const allConfirmed = confirmedItems.length > 0 && confirmedItems.every((i) => i.isConfirmed);
    setProfile((p) => ({ ...p, equipmentConfirmed: allConfirmed }));
    showToast("Home Gym Equipment Setup Confirmed", "success");
  }, [showToast]);

  const updateGoals = useCallback((updates: Partial<UserGoals>) => {
    setGoals((prev) => ({ ...prev, ...updates }));
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  }, []);

  const submitCheckIn = useCallback((checkIn: Partial<RecoveryCheckIn>) => {
    setTodayCheckIn((prev) => ({
      ...prev,
      ...checkIn,
      date: todayISO(),
    }));
    showToast("Daily Check-In Saved — Readiness Score Updated", "success");
  }, [showToast]);

  const completeOnboarding = useCallback((finalData: Partial<UserProfile>) => {
    const mergedProfile: UserProfile = {
      ...profile,
      ...finalData,
      onboardingCompleted: true,
      onboardingStep: 5,
    };
    setProfile(mergedProfile);
    const energyEst = calculateEnergyEstimate(mergedProfile);
    if (energyEst.estimatedKcal && energyEst.macros) {
      setGoals((prev) => ({
        ...prev,
        calorieTargetKcal: energyEst.estimatedKcal,
        calorieProvenance: "calculated_estimate",
        proteinTargetG: energyEst.macros!.proteinG,
        proteinProvenance: "user_confirmed",
        carbsTargetG: energyEst.macros!.carbsG,
        fatTargetG: energyEst.macros!.fatG,
      }));
    }
    showToast("Athlete Onboarding Completed — Plan Calibrated!", "success");
  }, [profile, showToast]);

  const resetToDefaults = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setEquipment(DEFAULT_EQUIPMENT);
    setGoals(DEFAULT_GOALS);
    setPreferences(DEFAULT_PREFERENCES);
    setTodayCheckIn(DEFAULT_CHECKIN);
    setFoodEntries([]);
    setWorkoutSessions([]);
    setActivitySessions([]);
    setBodyMetrics([]);
    setCoachMessages(DEFAULT_COACH_MESSAGES);
    setProgressPhotos(DEFAULT_PROGRESS_PHOTOS);
    setIsDemoFixtureActive(false);
    localStorage.clear();
  }, []);

  const loadDemoFixture = useCallback(() => {
    const fixture = generate14DayDemoFixture();
    setFoodEntries(fixture.foodEntries);
    setBodyMetrics(fixture.bodyMetrics);
    setWorkoutSessions(fixture.workoutSessions);
    setActivitySessions(fixture.activitySessions);
    setTodayCheckIn(fixture.todayCheckIn);
    setProgressPhotos(fixture.progressPhotos);
    setGoals(fixture.goals);
    setProfile((prev) => ({
      ...prev,
      ...fixture.profileUpdates,
    }));
    setEquipment((prev) => prev.map((eq) => ({ ...eq, isConfirmed: true })));
    setIsDemoFixtureActive(true);
    showToast("14-Day Demo Fixture Loaded — All 14d Charts & Calibrations Active!", "success");
  }, [showToast]);

  const resetDemoFixture = useCallback(() => {
    resetToDefaults();
    showToast("Demo Fixture Cleared — Clean Personal Baseline Restored", "info");
  }, [resetToDefaults, showToast]);

  // ==========================================================================
  // Phase 2: Nutrition Actions
  // ==========================================================================

  const addFoodEntry = useCallback((entry: Omit<FoodEntry, "id">) => {
    const isConf = entry.is_confirmed !== undefined
      ? Boolean(entry.is_confirmed)
      : (entry.isConfirmed !== undefined ? Boolean(entry.isConfirmed) : true);
    const newEntry: FoodEntry = {
      ...entry,
      id: generateId(),
      isConfirmed: isConf,
      is_confirmed: isConf,
    };
    setFoodEntries((prev) => [...prev, newEntry]);
    showToast(
      `Logged ${newEntry.quantity}× ${newEntry.foodName} (+${Math.round(newEntry.proteinG * newEntry.quantity * 10) / 10}g protein)`,
      "success"
    );
  }, [showToast]);

  const updateFoodEntry = useCallback((id: string, updates: Partial<FoodEntry>) => {
    setFoodEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteFoodEntry = useCallback((id: string) => {
    setFoodEntries((prev) => prev.filter((e) => e.id !== id));
    showToast("Meal entry removed", "info");
  }, [showToast]);

  const getFoodEntriesForDate = useCallback(
    (date: string) => foodEntries.filter((e) => e.loggedDate === date),
    [foodEntries]
  );

  // ==========================================================================
  // Phase 2: Workout Actions
  // ==========================================================================

  const addWorkoutSession = useCallback((session: Omit<WorkoutSession, "id">) => {
    const newSession: WorkoutSession = { ...session, id: generateId() };
    const prCount = (session.sets || []).filter((s) => s.isPr).length;
    setWorkoutSessions((prev) => [...prev, newSession]);
    showToast(
      prCount > 0
        ? `Workout Session Saved — ${prCount} New PR! 🔥`
        : `Workout Session Saved — ${session.title}`,
      "success"
    );
  }, [showToast]);

  const updateWorkoutSession = useCallback((id: string, updates: Partial<WorkoutSession>) => {
    setWorkoutSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteWorkoutSession = useCallback((id: string) => {
    setWorkoutSessions((prev) => prev.filter((s) => s.id !== id));
    showToast("Workout session removed", "info");
  }, [showToast]);

  const getTodayWorkout = useCallback(
    () => workoutSessions.find((s) => s.loggedDate === todayISO()),
    [workoutSessions]
  );

  // ==========================================================================
  // Phase 2: Activity Actions
  // ==========================================================================

  const addActivitySession = useCallback((session: Omit<ActivitySession, "id">) => {
    const newSession: ActivitySession = { ...session, id: generateId() };
    setActivitySessions((prev) => [...prev, newSession]);
    showToast(
      `Logged ${session.activityType.toUpperCase()} (${session.durationMinutes} min${
        session.distanceKm ? ` · ${session.distanceKm} km` : ""
      })`,
      "success"
    );
  }, [showToast]);

  const updateActivitySession = useCallback((id: string, updates: Partial<ActivitySession>) => {
    setActivitySessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteActivitySession = useCallback((id: string) => {
    setActivitySessions((prev) => prev.filter((s) => s.id !== id));
    showToast("Activity session removed", "info");
  }, [showToast]);

  const getActivitiesForDate = useCallback(
    (date: string) => activitySessions.filter((s) => s.loggedDate === date),
    [activitySessions]
  );

  const getWeeklyActivities = useCallback(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return activitySessions.filter((s) => new Date(s.loggedDate) >= weekAgo);
  }, [activitySessions]);

  // ==========================================================================
  // Phase 2: Body Metrics Actions
  // ==========================================================================

  const addBodyMetric = useCallback((metric: Omit<BodyMetric, "id">) => {
    const newMetric: BodyMetric = { ...metric, id: generateId() };
    setBodyMetrics((prev) => [...prev, newMetric]);
    showToast(`Weigh-In Recorded: ${metric.weightKg.toFixed(1)} kg`, "success");
  }, [showToast]);

  const updateBodyMetric = useCallback((id: string, updates: Partial<BodyMetric>) => {
    setBodyMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteBodyMetric = useCallback((id: string) => {
    setBodyMetrics((prev) => prev.filter((m) => m.id !== id));
    showToast("Weigh-in record removed", "info");
  }, [showToast]);

  const getLatestWeight = useCallback((): BodyMetric | undefined => {
    if (bodyMetrics.length === 0) return undefined;
    return [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0];
  }, [bodyMetrics]);

  // ==========================================================================
  // Phase 4: AI Coach & Action Handlers
  // ==========================================================================

  const addCoachMessage = useCallback((msg: EpistemicCoachMessage) => {
    setCoachMessages((prev) => [...prev, msg]);
  }, []);

  const clearCoachMessages = useCallback(() => {
    setCoachMessages(DEFAULT_COACH_MESSAGES);
  }, []);

  const applyProposedAction = useCallback((messageId: string, action: ProposedCoachAction) => {
    if (action.type === "log_meal" && action.payload) {
      addFoodEntry({
        loggedDate: action.payload.logged_date || action.payload.loggedDate || todayISO(),
        mealSlot: action.payload.meal_slot || action.payload.mealSlot || "dinner",
        foodName: action.payload.food_name || action.payload.foodName || "Coach Suggested High-Protein Meal",
        quantity: action.payload.quantity || 1.0,
        servingLabel: action.payload.serving_label || action.payload.servingLabel || "1 serving",
        caloriesKcal: action.payload.calories_kcal || action.payload.caloriesKcal || 420.0,
        proteinG: action.payload.protein_g || action.payload.proteinG || 45.0,
        carbsG: action.payload.carbs_g || action.payload.carbsG || 35.0,
        fatG: action.payload.fat_g || action.payload.fatG || 6.5,
        provenance: action.payload.provenance || "verified_reference",
        isConfirmed: true,
        is_confirmed: true,
        notes: "Confirmed and logged via AI Coach proposal",
      });
    } else if (action.type === "update_protein_target" && action.payload?.protein_target_g) {
      updateGoals({ proteinTargetG: Number(action.payload.protein_target_g) });
    }

    setCoachMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              proposedAction: m.proposedAction
                ? { ...m.proposedAction, status: "applied" }
                : null,
            }
          : m
      )
    );
  }, [addFoodEntry, updateGoals]);

  const dismissProposedAction = useCallback((messageId: string) => {
    setCoachMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              proposedAction: m.proposedAction
                ? { ...m.proposedAction, status: "dismissed" }
                : null,
            }
          : m
      )
    );
  }, []);

  // ==========================================================================
  // Phase 5: Progress Photos Actions
  // ==========================================================================

  const addProgressPhoto = useCallback((photo: Omit<ProgressPhotoAsset, "id">) => {
    const newPhoto: ProgressPhotoAsset = {
      ...photo,
      id: generateId(),
    };
    setProgressPhotos((prev) => [newPhoto, ...prev]);
    showToast(`Progress Photo Recorded (${photo.weightKg.toFixed(1)} kg)`, "success");
  }, [showToast]);

  const deleteProgressPhoto = useCallback((id: string) => {
    setProgressPhotos((prev) => prev.filter((p) => p.id !== id));
    showToast("Progress photo record deleted", "info");
  }, [showToast]);

  const getCoachingSnapshot = useCallback(() => {
    return {
      profile: {
        fullName: profile.fullName,
        age: profile.age,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        dietaryPattern: profile.dietaryPattern,
        primaryGoal: profile.primaryGoal,
        trainingDaysPerWeek: profile.trainingDaysPerWeek,
        trainingEnvironment: profile.trainingEnvironment,
        equipmentConfirmed: profile.equipmentConfirmed,
      },
      equipment: equipment.map((e) => ({
        itemKey: e.itemKey,
        itemName: e.itemName,
        maxLoadKg: e.maxLoadKg,
        minIncrementKg: e.minIncrementKg,
        isConfirmed: e.isConfirmed,
      })),
      goals: {
        proteinMinG: goals.proteinMinG,
        proteinMaxG: goals.proteinMaxG,
        proteinTargetG: goals.proteinTargetG,
        proteinProvenance: goals.proteinProvenance,
        calorieTargetKcal: goals.calorieTargetKcal,
        calorieProvenance: goals.calorieProvenance,
      },
      preferences: {
        weightUnit: preferences.weightUnit,
        distanceUnit: preferences.distanceUnit,
        timezone: preferences.timezone,
        notificationsEnabled: preferences.notificationsEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
      },
      today_check_in: {
        sleepHours: todayCheckIn.sleepHours,
        sleepQuality: todayCheckIn.sleepQuality,
        soreness: todayCheckIn.soreness,
        fatigue: todayCheckIn.fatigue,
        stress: todayCheckIn.stress,
      },
      food_entries: foodEntries.map((f) => ({
        loggedDate: f.loggedDate,
        mealSlot: f.mealSlot,
        foodName: f.foodName,
        quantity: f.quantity,
        servingLabel: f.servingLabel,
        caloriesKcal: f.caloriesKcal,
        proteinG: f.proteinG,
        carbsG: f.carbsG,
        fatG: f.fatG,
        isConfirmed: f.isConfirmed,
        is_confirmed: f.isConfirmed,
        provenance: f.provenance,
      })),
      workout_sessions: workoutSessions.map((w) => ({
        loggedDate: w.loggedDate,
        title: w.title,
        completed: w.completed,
        sets: (w.sets || []).map((s) => ({
          exerciseName: s.exerciseName,
          reps: s.reps,
          loadKg: s.loadKg,
          rpe: s.rpe,
          isCompleted: s.isCompleted,
          isPr: s.isPr,
          isBodyweight: s.isBodyweight,
        })),
      })),
      activity_sessions: activitySessions.map((a) => ({
        loggedDate: a.loggedDate,
        activityType: a.activityType,
        durationMinutes: a.durationMinutes,
        distanceKm: a.distanceKm,
        paceFormatted: a.paceFormatted,
        matchFormat: a.matchFormat,
        perceivedEffort: a.perceivedEffort,
        skillName: a.skillName,
        setsCount: a.setsCount,
      })),
      body_metrics: bodyMetrics.map((b) => ({
        loggedDate: b.loggedDate,
        weightKg: b.weightKg,
      })),
      recovery_logs: [
        {
          loggedDate: todayCheckIn.date,
          sleepHours: todayCheckIn.sleepHours,
          sleepQuality: todayCheckIn.sleepQuality,
          soreness: todayCheckIn.soreness,
          fatigue: todayCheckIn.fatigue,
          stress: todayCheckIn.stress,
        },
      ],
    };
  }, [profile, equipment, goals, preferences, todayCheckIn, foodEntries, workoutSessions, activitySessions, bodyMetrics]);

  return (
    <AthloniqContext.Provider
      value={{
        // Phase 1
        profile,
        equipment,
        goals,
        preferences,
        todayCheckIn,
        readiness,
        updateProfile,
        updateEquipmentItem,
        confirmEquipment,
        updateGoals,
        updatePreferences,
        submitCheckIn,
        completeOnboarding,
        resetToDefaults,
        // Phase 2: Nutrition
        foodEntries,
        addFoodEntry,
        updateFoodEntry,
        deleteFoodEntry,
        getFoodEntriesForDate,
        // Phase 2: Workouts
        workoutSessions,
        addWorkoutSession,
        updateWorkoutSession,
        deleteWorkoutSession,
        getTodayWorkout,
        // Phase 2: Activities
        activitySessions,
        addActivitySession,
        updateActivitySession,
        deleteActivitySession,
        getActivitiesForDate,
        getWeeklyActivities,
        // Phase 2: Body Metrics
        bodyMetrics,
        addBodyMetric,
        updateBodyMetric,
        deleteBodyMetric,
        getLatestWeight,
        // Phase 4: AI Coach
        coachMessages,
        addCoachMessage,
        clearCoachMessages,
        applyProposedAction,
        dismissProposedAction,
        getCoachingSnapshot,
        // Phase 5: Progress Photos
        progressPhotos,
        addProgressPhoto,
        deleteProgressPhoto,
        // Feedback Toast
        toast,
        showToast,
        hideToast,
        // Demo Fixture
        isDemoFixtureActive,
        loadDemoFixture,
        resetDemoFixture,
      }}
    >
      {children}
    </AthloniqContext.Provider>
  );
};

export function useAthloniqState() {
  const context = useContext(AthloniqContext);
  if (!context) {
    throw new Error("useAthloniqState must be used within an AthloniqProvider");
  }
  return context;
}
