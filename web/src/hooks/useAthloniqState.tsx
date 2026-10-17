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
} from "@/types";
import {
  calculateRulesReadiness,
  calculateEnergyEstimate,
  calculateProteinReference,
} from "@/lib/calculations";

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
  }, []);

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
  }, []);

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
  }, [profile]);

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
    localStorage.clear();
  }, []);

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
  }, []);

  const updateFoodEntry = useCallback((id: string, updates: Partial<FoodEntry>) => {
    setFoodEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteFoodEntry = useCallback((id: string) => {
    setFoodEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getFoodEntriesForDate = useCallback(
    (date: string) => foodEntries.filter((e) => e.loggedDate === date),
    [foodEntries]
  );

  // ==========================================================================
  // Phase 2: Workout Actions
  // ==========================================================================

  const addWorkoutSession = useCallback((session: Omit<WorkoutSession, "id">) => {
    const newSession: WorkoutSession = { ...session, id: generateId() };
    setWorkoutSessions((prev) => [...prev, newSession]);
  }, []);

  const updateWorkoutSession = useCallback((id: string, updates: Partial<WorkoutSession>) => {
    setWorkoutSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteWorkoutSession = useCallback((id: string) => {
    setWorkoutSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

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
  }, []);

  const updateActivitySession = useCallback((id: string, updates: Partial<ActivitySession>) => {
    setActivitySessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteActivitySession = useCallback((id: string) => {
    setActivitySessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

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
  }, []);

  const updateBodyMetric = useCallback((id: string, updates: Partial<BodyMetric>) => {
    setBodyMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteBodyMetric = useCallback((id: string) => {
    setBodyMetrics((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const getLatestWeight = useCallback((): BodyMetric | undefined => {
    if (bodyMetrics.length === 0) return undefined;
    return [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0];
  }, [bodyMetrics]);

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
