import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/features/auth/AuthContext";
import {
  profilesRepo,
  equipmentRepo,
  goalsRepo,
  preferencesRepo,
  recoveryRepo,
  foodEntriesRepo,
  workoutSessionsRepo,
  activitySessionsRepo,
  bodyMetricsRepo,
  coachRepo,
  progressPhotosRepo,
} from "@/services/repo";

export interface AthlonToast {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

export type SyncStatus = "idle" | "synced" | "syncing" | "failed";

export interface LegacyImportCounts {
  food: number;
  workouts: number;
  activities: number;
  metrics: number;
  total: number;
}

const STORAGE_KEY = "athloniq_state_v1";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Clean unpopulated profile baseline without fabricated identity
const DEFAULT_PROFILE: UserProfile = {
  id: "",
  email: "",
  fullName: "",
  age: 20,
  heightCm: 173.0,
  weightKg: 55.0,
  dietaryPattern: "nonvegetarian",
  primaryGoal: "lean_bulk",
  trainingScope: ["gym", "calisthenics", "badminton", "running"],
  trainingDaysPerWeek: 5,
  trainingEnvironment: "home_gym",
  calorieTrackingHabit: "rough_estimates",
  sex: null,
  waistCm: null,
  experienceLevel: null,
  currentSplit: null,
  weeklyBadmintonSessions: null,
  weeklyRunningSessions: null,
  sleepBaselineHours: null,
  exerciseLimitations: null,
  onboardingStep: 1,
  onboardingCompleted: false,
  equipmentConfirmed: false,
};

// Default equipment items with isConfirmed = false
const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  {
    id: "eq-1",
    itemKey: "bench",
    itemName: "Flat/Incline Bench",
    maxLoadKg: null,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
    notes: "Home gym setup (unconfirmed)",
  },
  {
    id: "eq-2",
    itemKey: "squat_rack",
    itemName: "Squat/Power Rack",
    maxLoadKg: null,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
    notes: "Home gym setup (unconfirmed)",
  },
  {
    id: "eq-3",
    itemKey: "dips_station",
    itemName: "Dips Station",
    maxLoadKg: null,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
    notes: "Bodyweight station (unconfirmed)",
  },
  {
    id: "eq-4",
    itemKey: "lat_pulldown_station",
    itemName: "Lat Pulldown Station",
    maxLoadKg: null,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
    notes: "Cable pulley attachment (unconfirmed)",
  },
  {
    id: "eq-5",
    itemKey: "free_weights_70kg",
    itemName: "Free Weights up to 70 kg",
    maxLoadKg: 70.0,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
    notes: "Barbell & adjustable dumbbells (unconfirmed)",
  },
];

const DEFAULT_GOALS: UserGoals = {
  proteinMinG: 88,
  proteinMaxG: 121,
  proteinTargetG: 110,
  proteinProvenance: "provisional_default",
  calorieTargetKcal: null,
  calorieProvenance: "provisional_default",
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
    text: "Welcome to AthlonIQ. I'm your Personal AI Performance Coach. Once you log workouts, meals, and daily check-ins I can answer questions like: How has my protein intake tracked this week? What should I train today given my recovery? Which exercises have I progressed on? Complete your onboarding to calibrate targets and start logging to unlock grounded insights.",
    timestamp: "Just now",
    toolsUsed: [],
    factsFromTools: [],
    appCalculations: [],
    recommendations: [
      "Complete onboarding in Profile to calibrate your calorie and protein targets.",
      "Log your first recovery check-in to generate today's Readiness Score.",
      "Confirm your home gym equipment in Profile → Equipment to unlock load progressions.",
    ],
    missingOrUncertain: [
      "No logs recorded yet — coach responses are grounded only in data you have logged.",
    ],
    proposedAction: null,
  },
];

export interface AthloniqContextType {
  // Phase 1 state
  profile: UserProfile;
  equipment: EquipmentItem[];
  goals: UserGoals;
  preferences: UserPreferences;
  todayCheckIn: RecoveryCheckIn;
  hasTodayCheckIn: boolean;
  readiness: ReadinessResult | null;
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

  // 14-Day Labeled Demo Fixture (in-memory only, blocked from repo writes)
  isDemoFixtureActive: boolean;
  loadDemoFixture: () => void;
  resetDemoFixture: () => void;

  // Synchronization & Cloud Persistence Indicators
  syncStatus: SyncStatus;
  syncError: string | null;
  retrySync: () => Promise<void>;

  // Legacy localStorage Data Migration
  legacyImportAvailable: boolean;
  legacyImportCounts: LegacyImportCounts | null;
  runLegacyImport: () => Promise<void>;
  dismissLegacyImport: () => void;
}

const AthloniqContext = createContext<AthloniqContextType | null>(null);

export const AthloniqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State slices
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(DEFAULT_EQUIPMENT);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [todayCheckIn, setTodayCheckIn] = useState<RecoveryCheckIn>(DEFAULT_CHECKIN);
  const [hasTodayCheckIn, setHasTodayCheckIn] = useState<boolean>(false);

  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [activitySessions, setActivitySessions] = useState<ActivitySession[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [coachMessages, setCoachMessages] = useState<EpistemicCoachMessage[]>(DEFAULT_COACH_MESSAGES);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhotoAsset[]>([]);

  // Demo fixture active state (strictly in-memory, blocked from repo writes)
  const [isDemoFixtureActive, setIsDemoFixtureActive] = useState<boolean>(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);

  // Legacy import state
  const [legacyImportAvailable, setLegacyImportAvailable] = useState<boolean>(false);
  const [legacyImportCounts, setLegacyImportCounts] = useState<LegacyImportCounts | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<AthlonToast | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const id = Date.now().toString();
    setToast({ id, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  // Readiness engine: calculated strictly from self-reported check-in metrics when present
  const readiness: ReadinessResult | null = hasTodayCheckIn
    ? calculateRulesReadiness(
        todayCheckIn.sleepHours,
        todayCheckIn.sleepQuality,
        todayCheckIn.soreness,
        todayCheckIn.fatigue,
        todayCheckIn.stress
      )
    : null;

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Sign-Out & User Isolation: Reset all in-memory athlete state
  // ---------------------------------------------------------------------------
  const resetAllAthleteState = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setEquipment(DEFAULT_EQUIPMENT);
    setGoals(DEFAULT_GOALS);
    setPreferences(DEFAULT_PREFERENCES);
    setTodayCheckIn(DEFAULT_CHECKIN);
    setHasTodayCheckIn(false);
    setFoodEntries([]);
    setWorkoutSessions([]);
    setActivitySessions([]);
    setBodyMetrics([]);
    setCoachMessages(DEFAULT_COACH_MESSAGES);
    setProgressPhotos([]);
    setIsDemoFixtureActive(false);
    setSyncStatus("idle");
    setSyncError(null);
    setToast(null);
    setLegacyImportAvailable(false);
    setLegacyImportCounts(null);
    queryClient.clear();
  }, []);

  const currentUserIdRef = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load data from Supabase repositories when user signs in
  // ---------------------------------------------------------------------------
  const loadCloudState = useCallback(async (userId: string) => {
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      // 1. Fetch Profile
      let cloudProfile = await profilesRepo.fetchProfile(userId);
      if (!cloudProfile) {
        // First sign in: initialize profile
        const initialProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          id: userId,
          email: user?.email || "",
          fullName: (user?.user_metadata?.full_name as string) || "",
        };
        cloudProfile = await profilesRepo.upsertProfile(initialProfile);

        // Seed initial unconfirmed equipment items
        await equipmentRepo.upsertEquipment(userId, DEFAULT_EQUIPMENT);

        // Seed provisional goals
        await goalsRepo.upsertGoals(userId, DEFAULT_GOALS);

        // Seed initial preferences
        await preferencesRepo.upsertPreferences(userId, DEFAULT_PREFERENCES);
      }

      // Guard: discard if user signed out or changed during fetch
      if (currentUserIdRef.current !== userId) return;

      setProfile(cloudProfile);

      // 2. Fetch parallel domain slices
      const [
        cloudEquipment,
        cloudGoals,
        cloudPreferences,
        cloudFoods,
        cloudWorkouts,
        cloudActivities,
        cloudMetrics,
        cloudRecovery,
        cloudMessages,
        cloudPhotos,
      ] = await Promise.all([
        equipmentRepo.fetchEquipment(userId),
        goalsRepo.fetchGoals(userId),
        preferencesRepo.fetchPreferences(userId),
        foodEntriesRepo.fetchEntries(userId),
        workoutSessionsRepo.fetchSessions(userId),
        activitySessionsRepo.fetchActivities(userId),
        bodyMetricsRepo.fetchMetrics(userId),
        recoveryRepo.fetchHistory(userId, 1),
        coachRepo.fetchMessages(userId),
        progressPhotosRepo.fetchPhotos(userId),
      ]);

      // Guard: discard if user signed out or changed during fetch
      if (currentUserIdRef.current !== userId) return;

      setEquipment(cloudEquipment && cloudEquipment.length > 0 ? cloudEquipment : DEFAULT_EQUIPMENT);
      setGoals(cloudGoals || DEFAULT_GOALS);
      setPreferences(cloudPreferences || DEFAULT_PREFERENCES);
      setFoodEntries(cloudFoods || []);
      setWorkoutSessions(cloudWorkouts || []);
      setActivitySessions(cloudActivities || []);
      setBodyMetrics(cloudMetrics || []);
      setTodayCheckIn(cloudRecovery && cloudRecovery.length > 0 ? cloudRecovery[0] : DEFAULT_CHECKIN);
      const hasCloudToday = Boolean(
        cloudRecovery && cloudRecovery.length > 0 && cloudRecovery[0].date === todayISO()
      );
      setHasTodayCheckIn(hasCloudToday);
      setCoachMessages(cloudMessages && cloudMessages.length > 0 ? cloudMessages : DEFAULT_COACH_MESSAGES);
      setProgressPhotos(cloudPhotos || []);

      setSyncStatus("synced");
    } catch (err: any) {
      if (currentUserIdRef.current !== userId) return;
      console.error("[AthlonIQ Provider] Error loading cloud state:", err);
      setSyncStatus("failed");
      setSyncError(err.message || "Failed to load cloud state");
      showToast(`Database sync warning: ${err.message || "Unable to reach Supabase"}`, "warning");
    }
  }, [user, showToast]);

  // Synchronize authentication lifecycle with state isolation
  useEffect(() => {
    const nextUserId = user?.id ?? null;
    if (currentUserIdRef.current !== nextUserId) {
      currentUserIdRef.current = nextUserId;
      resetAllAthleteState();
    }

    if (nextUserId && !isDemoFixtureActive) {
      loadCloudState(nextUserId);
    }
  }, [user?.id, isDemoFixtureActive, loadCloudState, resetAllAthleteState]);

  // ---------------------------------------------------------------------------
  // Check for legacy localStorage data to offer one-time import
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user?.id || isDemoFixtureActive) return;

    try {
      const importFlag = localStorage.getItem(`athloniq_legacy_imported_${user.id}`);
      if (importFlag) return;

      const rawFoods = localStorage.getItem(`${STORAGE_KEY}_food_entries`);
      const rawWorkouts = localStorage.getItem(`${STORAGE_KEY}_workout_sessions`);
      const rawActivities = localStorage.getItem(`${STORAGE_KEY}_activity_sessions`);
      const rawMetrics = localStorage.getItem(`${STORAGE_KEY}_body_metrics`);

      const parsedFoods: FoodEntry[] = rawFoods ? JSON.parse(rawFoods) : [];
      const parsedWorkouts: WorkoutSession[] = rawWorkouts ? JSON.parse(rawWorkouts) : [];
      const parsedActivities: ActivitySession[] = rawActivities ? JSON.parse(rawActivities) : [];
      const parsedMetrics: BodyMetric[] = rawMetrics ? JSON.parse(rawMetrics) : [];

      // Filter out demo data (Alex Mercer / demo keys)
      const validFoods = parsedFoods.filter((f) => !f.notes?.includes("Alex Mercer") && !f.id?.startsWith("demo-"));
      const validWorkouts = parsedWorkouts.filter((w) => !w.notes?.includes("Alex Mercer") && !w.id?.startsWith("demo-"));
      const validActivities = parsedActivities.filter((a) => !a.routeOrNotes?.includes("Alex Mercer") && !a.id?.startsWith("demo-"));
      const validMetrics = parsedMetrics.filter((m) => !m.notes?.includes("Alex Mercer") && !m.id?.startsWith("demo-"));

      const total = validFoods.length + validWorkouts.length + validActivities.length + validMetrics.length;
      if (total > 0) {
        setLegacyImportAvailable(true);
        setLegacyImportCounts({
          food: validFoods.length,
          workouts: validWorkouts.length,
          activities: validActivities.length,
          metrics: validMetrics.length,
          total,
        });
      }
    } catch {
      // ignore
    }
  }, [user?.id, isDemoFixtureActive]);

  const runLegacyImport = useCallback(async () => {
    if (!user?.id) return;
    setSyncStatus("syncing");

    try {
      const rawFoods = localStorage.getItem(`${STORAGE_KEY}_food_entries`);
      const rawWorkouts = localStorage.getItem(`${STORAGE_KEY}_workout_sessions`);
      const rawActivities = localStorage.getItem(`${STORAGE_KEY}_activity_sessions`);
      const rawMetrics = localStorage.getItem(`${STORAGE_KEY}_body_metrics`);

      const parsedFoods: FoodEntry[] = rawFoods ? JSON.parse(rawFoods) : [];
      const parsedWorkouts: WorkoutSession[] = rawWorkouts ? JSON.parse(rawWorkouts) : [];
      const parsedActivities: ActivitySession[] = rawActivities ? JSON.parse(rawActivities) : [];
      const parsedMetrics: BodyMetric[] = rawMetrics ? JSON.parse(rawMetrics) : [];

      const validFoods = parsedFoods.filter((f) => !f.notes?.includes("Alex Mercer") && !f.id?.startsWith("demo-"));
      const validWorkouts = parsedWorkouts.filter((w) => !w.notes?.includes("Alex Mercer") && !w.id?.startsWith("demo-"));
      const validActivities = parsedActivities.filter((a) => !a.routeOrNotes?.includes("Alex Mercer") && !a.id?.startsWith("demo-"));
      const validMetrics = parsedMetrics.filter((m) => !m.notes?.includes("Alex Mercer") && !m.id?.startsWith("demo-"));

      for (const f of validFoods) {
        await foodEntriesRepo.createEntry(user.id, f);
      }
      for (const w of validWorkouts) {
        await workoutSessionsRepo.saveSession(user.id, w);
      }
      for (const a of validActivities) {
        await activitySessionsRepo.createActivity(user.id, a);
      }
      for (const m of validMetrics) {
        await bodyMetricsRepo.createMetric(user.id, m);
      }

      localStorage.setItem(`athloniq_legacy_imported_${user.id}`, "true");
      setLegacyImportAvailable(false);
      setLegacyImportCounts(null);
      await loadCloudState(user.id);

      showToast("Successfully imported your local records to Supabase cloud!", "success");
    } catch (err: any) {
      setSyncStatus("failed");
      setSyncError(err.message || "Failed to import legacy records");
      showToast(`Import error: ${err.message}`, "warning");
    }
  }, [user?.id, loadCloudState, showToast]);

  const dismissLegacyImport = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(`athloniq_legacy_imported_${user.id}`, "dismissed");
    }
    setLegacyImportAvailable(false);
    setLegacyImportCounts(null);
  }, [user?.id]);

  const retrySync = useCallback(async () => {
    if (user?.id) {
      await loadCloudState(user.id);
    }
  }, [user?.id, loadCloudState]);

  // ---------------------------------------------------------------------------
  // Optimistic Mutation Engine with Rollback on Failure
  // ---------------------------------------------------------------------------
  const executeOptimisticMutation = useCallback(
    async <T,>(
      applyLocal: () => T,
      rollbackLocal: (snapshot: T) => void,
      executeRemote: () => Promise<void>
    ) => {
      const snapshot = applyLocal();

      // If demo fixture active, keep in-memory only (BLOCKED from repo writes)
      if (isDemoFixtureActive) {
        return;
      }

      const activeUserId = user?.id;
      if (!activeUserId) return;

      setSyncStatus("syncing");
      setSyncError(null);

      try {
        await executeRemote();
        // Guard: discard if user changed or signed out during network flight
        if (currentUserIdRef.current !== activeUserId) return;
        setSyncStatus("synced");
      } catch (err: any) {
        // Guard: discard if user changed or signed out during network flight
        if (currentUserIdRef.current !== activeUserId) return;
        console.error("[AthlonIQ Repo Sync Failed]:", err);
        rollbackLocal(snapshot);
        setSyncStatus("failed");
        setSyncError(err.message || "Sync failed");
        showToast(`Sync failed: ${err.message}. Rolled back.`, "warning");
      }
    },
    [isDemoFixtureActive, user?.id, showToast]
  );

  // ---------------------------------------------------------------------------
  // Phase 1 Actions
  // ---------------------------------------------------------------------------
  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      executeOptimisticMutation(
        () => {
          const prev = profile;
          setProfile((p) => {
            const next = { ...p, ...updates };
            if (updates.weightKg && updates.weightKg !== p.weightKg) {
              const pRef = calculateProteinReference(updates.weightKg);
              setGoals((g) => ({
                ...g,
                proteinMinG: pRef.proteinMinG,
                proteinMaxG: pRef.proteinMaxG,
                proteinTargetG: pRef.proteinTargetG,
                proteinProvenance: pRef.provenance,
              }));
            }
            return next;
          });
          return prev;
        },
        (prev) => setProfile(prev),
        async () => {
          if (!user?.id) return;
          await profilesRepo.upsertProfile({ ...updates, id: user.id });
        }
      );
    },
    [profile, executeOptimisticMutation, user?.id]
  );

  const updateEquipmentItem = useCallback(
    (id: string, updates: Partial<EquipmentItem>) => {
      executeOptimisticMutation(
        () => {
          const prev = equipment;
          setEquipment((curr) => {
            const next = curr.map((item) => (item.id === id ? { ...item, ...updates } : item));
            const allConfirmed = next.length > 0 && next.every((item) => item.isConfirmed);
            setProfile((p) => ({ ...p, equipmentConfirmed: allConfirmed }));
            return next;
          });
          return prev;
        },
        (prev) => setEquipment(prev),
        async () => {
          if (!user?.id) return;
          const target = equipment.find((e) => e.id === id);
          if (target) {
            await equipmentRepo.updateItem(user.id, { ...target, ...updates });
          }
        }
      );
    },
    [equipment, executeOptimisticMutation, user?.id]
  );

  const confirmEquipment = useCallback(
    (confirmedItems: EquipmentItem[]) => {
      executeOptimisticMutation(
        () => {
          const prev = equipment;
          setEquipment(confirmedItems);
          const allConfirmed = confirmedItems.length > 0 && confirmedItems.every((i) => i.isConfirmed);
          setProfile((p) => ({ ...p, equipmentConfirmed: allConfirmed }));
          showToast("Home Gym Equipment Setup Confirmed", "success");
          return prev;
        },
        (prev) => setEquipment(prev),
        async () => {
          if (!user?.id) return;
          await equipmentRepo.upsertEquipment(user.id, confirmedItems);
          await profilesRepo.upsertProfile({ id: user.id, equipmentConfirmed: true });
        }
      );
    },
    [equipment, executeOptimisticMutation, user?.id, showToast]
  );

  const updateGoals = useCallback(
    (updates: Partial<UserGoals>) => {
      executeOptimisticMutation(
        () => {
          const prev = goals;
          setGoals((g) => ({ ...g, ...updates }));
          return prev;
        },
        (prev) => setGoals(prev),
        async () => {
          if (!user?.id) return;
          await goalsRepo.upsertGoals(user.id, { ...goals, ...updates });
        }
      );
    },
    [goals, executeOptimisticMutation, user?.id]
  );

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      executeOptimisticMutation(
        () => {
          const prev = preferences;
          setPreferences((p) => ({ ...p, ...updates }));
          return prev;
        },
        (prev) => setPreferences(prev),
        async () => {
          if (!user?.id) return;
          await preferencesRepo.upsertPreferences(user.id, { ...preferences, ...updates });
        }
      );
    },
    [preferences, executeOptimisticMutation, user?.id]
  );

  const submitCheckIn = useCallback(
    (checkIn: Partial<RecoveryCheckIn>) => {
      const merged: RecoveryCheckIn = {
        ...todayCheckIn,
        ...checkIn,
        date: todayISO(),
      };
      const calculatedReadiness = calculateRulesReadiness(
        merged.sleepHours,
        merged.sleepQuality,
        merged.soreness,
        merged.fatigue,
        merged.stress
      );

      executeOptimisticMutation(
        () => {
          const prev = todayCheckIn;
          const prevHas = hasTodayCheckIn;
          setTodayCheckIn(merged);
          setHasTodayCheckIn(true);
          showToast("Daily Check-In Saved — Readiness Score Updated", "success");
          return { prev, prevHas };
        },
        ({ prev, prevHas }) => {
          setTodayCheckIn(prev);
          setHasTodayCheckIn(prevHas);
        },
        async () => {
          if (!user?.id) return;
          await recoveryRepo.upsertLog(user.id, merged, {
            score: calculatedReadiness.readinessScore,
            status: calculatedReadiness.status,
            triggers: calculatedReadiness.triggers,
          });
        }
      );
    },
    [todayCheckIn, executeOptimisticMutation, user?.id, showToast]
  );

  const completeOnboarding = useCallback(
    (finalData: Partial<UserProfile>) => {
      const mergedProfile: UserProfile = {
        ...profile,
        ...finalData,
        onboardingCompleted: true,
        onboardingStep: 5,
      };

      const energyEst = calculateEnergyEstimate(mergedProfile);
      const calculatedGoals: Partial<UserGoals> = energyEst.estimatedKcal && energyEst.macros
        ? {
            calorieTargetKcal: energyEst.estimatedKcal,
            calorieProvenance: "calculated_estimate",
            proteinTargetG: energyEst.macros.proteinG,
            proteinProvenance: "user_confirmed",
            carbsTargetG: energyEst.macros.carbsG,
            fatTargetG: energyEst.macros.fatG,
          }
        : {};

      executeOptimisticMutation(
        () => {
          const prevP = profile;
          const prevG = goals;
          setProfile(mergedProfile);
          if (Object.keys(calculatedGoals).length > 0) {
            setGoals((g) => ({ ...g, ...calculatedGoals }));
          }
          showToast("Athlete Onboarding Completed — Plan Calibrated!", "success");
          return { prevP, prevG };
        },
        (snap) => {
          setProfile(snap.prevP);
          setGoals(snap.prevG);
        },
        async () => {
          if (!user?.id) return;
          await profilesRepo.upsertProfile({ ...mergedProfile, id: user.id });
          if (Object.keys(calculatedGoals).length > 0) {
            await goalsRepo.upsertGoals(user.id, { ...goals, ...calculatedGoals });
          }
        }
      );
    },
    [profile, goals, executeOptimisticMutation, user?.id, showToast]
  );

  const resetToDefaults = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setEquipment(DEFAULT_EQUIPMENT);
    setGoals(DEFAULT_GOALS);
    setPreferences(DEFAULT_PREFERENCES);
    setTodayCheckIn(DEFAULT_CHECKIN);
    setHasTodayCheckIn(false);
    setFoodEntries([]);
    setWorkoutSessions([]);
    setActivitySessions([]);
    setBodyMetrics([]);
    setCoachMessages(DEFAULT_COACH_MESSAGES);
    setProgressPhotos([]);
    setIsDemoFixtureActive(false);
  }, []);

  const loadDemoFixture = useCallback(() => {
    const fixture = generate14DayDemoFixture();
    setFoodEntries(fixture.foodEntries);
    setBodyMetrics(fixture.bodyMetrics);
    setWorkoutSessions(fixture.workoutSessions);
    setActivitySessions(fixture.activitySessions);
    setTodayCheckIn(fixture.todayCheckIn);
    setHasTodayCheckIn(true);
    setProgressPhotos(fixture.progressPhotos);
    setGoals(fixture.goals);
    setProfile((prev) => ({
      ...prev,
      ...fixture.profileUpdates,
    }));
    setEquipment((prev) => prev.map((eq) => ({ ...eq, isConfirmed: true })));
    setIsDemoFixtureActive(true);
    showToast("14-Day Demo Fixture Active — Changes kept in-memory (cloud sync bypassed)", "info");
  }, [showToast]);

  const resetDemoFixture = useCallback(() => {
    setIsDemoFixtureActive(false);
    setHasTodayCheckIn(false);
    if (user?.id) {
      loadCloudState(user.id);
    } else {
      resetToDefaults();
    }
    showToast("Demo Sandbox Closed — Restoring Live Supabase State", "info");
  }, [user?.id, loadCloudState, resetToDefaults, showToast]);

  // ---------------------------------------------------------------------------
  // Phase 2: Nutrition Actions
  // ---------------------------------------------------------------------------
  const addFoodEntry = useCallback(
    (entry: Omit<FoodEntry, "id">) => {
      const isConf = entry.isConfirmed !== undefined ? entry.isConfirmed : true;
      const newEntry: FoodEntry = {
        ...entry,
        id: generateId(),
        isConfirmed: isConf,
        is_confirmed: isConf,
      };

      executeOptimisticMutation(
        () => {
          const prev = foodEntries;
          setFoodEntries((curr) => [...curr, newEntry]);
          showToast(
            `Logged ${newEntry.quantity}× ${newEntry.foodName} (+${Math.round(newEntry.proteinG * newEntry.quantity * 10) / 10}g protein)`,
            "success"
          );
          return prev;
        },
        (prev) => setFoodEntries(prev),
        async () => {
          if (!user?.id) return;
          const created = await foodEntriesRepo.createEntry(user.id, newEntry);
          // Replace temp ID with Supabase UUID
          setFoodEntries((curr) => curr.map((f) => (f.id === newEntry.id ? created : f)));
        }
      );
    },
    [foodEntries, executeOptimisticMutation, user?.id, showToast]
  );

  const updateFoodEntry = useCallback(
    (id: string, updates: Partial<FoodEntry>) => {
      executeOptimisticMutation(
        () => {
          const prev = foodEntries;
          setFoodEntries((curr) => curr.map((e) => (e.id === id ? { ...e, ...updates } : e)));
          return prev;
        },
        (prev) => setFoodEntries(prev),
        async () => {
          if (!user?.id || id.includes("-")) return;
          await foodEntriesRepo.updateEntry(user.id, id, updates);
        }
      );
    },
    [foodEntries, executeOptimisticMutation, user?.id]
  );

  const deleteFoodEntry = useCallback(
    (id: string) => {
      executeOptimisticMutation(
        () => {
          const prev = foodEntries;
          setFoodEntries((curr) => curr.filter((e) => e.id !== id));
          showToast("Meal entry removed", "info");
          return prev;
        },
        (prev) => setFoodEntries(prev),
        async () => {
          if (!user?.id || id.includes("-")) return;
          await foodEntriesRepo.deleteEntry(user.id, id);
        }
      );
    },
    [foodEntries, executeOptimisticMutation, user?.id, showToast]
  );

  const getFoodEntriesForDate = useCallback(
    (date: string) => foodEntries.filter((e) => e.loggedDate === date),
    [foodEntries]
  );

  // ---------------------------------------------------------------------------
  // Phase 2: Workout Actions
  // ---------------------------------------------------------------------------
  const addWorkoutSession = useCallback(
    (session: Omit<WorkoutSession, "id">) => {
      const newSession: WorkoutSession = { ...session, id: generateId() };
      const prCount = (session.sets || []).filter((s) => s.isPr).length;

      executeOptimisticMutation(
        () => {
          const prev = workoutSessions;
          setWorkoutSessions((curr) => [...curr, newSession]);
          showToast(
            prCount > 0
              ? `Workout Session Saved — ${prCount} New PR! 🔥`
              : `Workout Session Saved — ${session.title}`,
            "success"
          );
          return prev;
        },
        (prev) => setWorkoutSessions(prev),
        async () => {
          if (!user?.id) return;
          const created = await workoutSessionsRepo.saveSession(user.id, newSession);
          setWorkoutSessions((curr) => curr.map((w) => (w.id === newSession.id ? created : w)));
        }
      );
    },
    [workoutSessions, executeOptimisticMutation, user?.id, showToast]
  );

  const updateWorkoutSession = useCallback(
    (id: string, updates: Partial<WorkoutSession>) => {
      executeOptimisticMutation(
        () => {
          const prev = workoutSessions;
          setWorkoutSessions((curr) => curr.map((s) => (s.id === id ? { ...s, ...updates } : s)));
          return prev;
        },
        (prev) => setWorkoutSessions(prev),
        async () => {
          if (!user?.id) return;
          const target = workoutSessions.find((s) => s.id === id);
          if (target) {
            await workoutSessionsRepo.saveSession(user.id, { ...target, ...updates });
          }
        }
      );
    },
    [workoutSessions, executeOptimisticMutation, user?.id]
  );

  const deleteWorkoutSession = useCallback(
    (id: string) => {
      executeOptimisticMutation(
        () => {
          const prev = workoutSessions;
          setWorkoutSessions((curr) => curr.filter((s) => s.id !== id));
          showToast("Workout session removed", "info");
          return prev;
        },
        (prev) => setWorkoutSessions(prev),
        async () => {
          if (!user?.id || id.includes("-")) return;
          await workoutSessionsRepo.deleteSession(user.id, id);
        }
      );
    },
    [workoutSessions, executeOptimisticMutation, user?.id, showToast]
  );

  const getTodayWorkout = useCallback(
    () => workoutSessions.find((s) => s.loggedDate === todayISO()),
    [workoutSessions]
  );

  // ---------------------------------------------------------------------------
  // Phase 2: Activity Actions
  // ---------------------------------------------------------------------------
  const addActivitySession = useCallback(
    (session: Omit<ActivitySession, "id">) => {
      const newSession: ActivitySession = { ...session, id: generateId() };

      executeOptimisticMutation(
        () => {
          const prev = activitySessions;
          setActivitySessions((curr) => [...curr, newSession]);
          showToast(
            `Logged ${session.activityType.toUpperCase()} (${session.durationMinutes} min${
              session.distanceKm ? ` · ${session.distanceKm} km` : ""
            })`,
            "success"
          );
          return prev;
        },
        (prev) => setActivitySessions(prev),
        async () => {
          if (!user?.id) return;
          const created = await activitySessionsRepo.createActivity(user.id, newSession);
          setActivitySessions((curr) => curr.map((a) => (a.id === newSession.id ? created : a)));
        }
      );
    },
    [activitySessions, executeOptimisticMutation, user?.id, showToast]
  );

  const updateActivitySession = useCallback(
    (id: string, updates: Partial<ActivitySession>) => {
      executeOptimisticMutation(
        () => {
          const prev = activitySessions;
          setActivitySessions((curr) => curr.map((s) => (s.id === id ? { ...s, ...updates } : s)));
          return prev;
        },
        (prev) => setActivitySessions(prev),
        async () => {
          // Cloud update
        }
      );
    },
    [activitySessions, executeOptimisticMutation]
  );

  const deleteActivitySession = useCallback(
    (id: string) => {
      executeOptimisticMutation(
        () => {
          const prev = activitySessions;
          setActivitySessions((curr) => curr.filter((s) => s.id !== id));
          showToast("Activity session removed", "info");
          return prev;
        },
        (prev) => setActivitySessions(prev),
        async () => {
          if (!user?.id || id.includes("-")) return;
          await activitySessionsRepo.deleteActivity(user.id, id);
        }
      );
    },
    [activitySessions, executeOptimisticMutation, user?.id, showToast]
  );

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

  // ---------------------------------------------------------------------------
  // Phase 2: Body Metrics Actions
  // ---------------------------------------------------------------------------
  const addBodyMetric = useCallback(
    (metric: Omit<BodyMetric, "id">) => {
      const newMetric: BodyMetric = { ...metric, id: generateId() };

      executeOptimisticMutation(
        () => {
          const prev = bodyMetrics;
          setBodyMetrics((curr) => [...curr, newMetric]);
          showToast(`Weigh-In Recorded: ${metric.weightKg.toFixed(1)} kg`, "success");
          return prev;
        },
        (prev) => setBodyMetrics(prev),
        async () => {
          if (!user?.id) return;
          const created = await bodyMetricsRepo.createMetric(user.id, newMetric);
          setBodyMetrics((curr) => curr.map((b) => (b.id === newMetric.id ? created : b)));
        }
      );
    },
    [bodyMetrics, executeOptimisticMutation, user?.id, showToast]
  );

  const updateBodyMetric = useCallback(
    (id: string, updates: Partial<BodyMetric>) => {
      executeOptimisticMutation(
        () => {
          const prev = bodyMetrics;
          setBodyMetrics((curr) => curr.map((m) => (m.id === id ? { ...m, ...updates } : m)));
          return prev;
        },
        (prev) => setBodyMetrics(prev),
        async () => {
          // Cloud update
        }
      );
    },
    [bodyMetrics, executeOptimisticMutation]
  );

  const deleteBodyMetric = useCallback(
    (id: string) => {
      executeOptimisticMutation(
        () => {
          const prev = bodyMetrics;
          setBodyMetrics((curr) => curr.filter((m) => m.id !== id));
          showToast("Weigh-in record removed", "info");
          return prev;
        },
        (prev) => setBodyMetrics(prev),
        async () => {
          if (!user?.id || id.includes("-")) return;
          await bodyMetricsRepo.deleteMetric(user.id, id);
        }
      );
    },
    [bodyMetrics, executeOptimisticMutation, user?.id, showToast]
  );

  const getLatestWeight = useCallback((): BodyMetric | undefined => {
    if (bodyMetrics.length === 0) return undefined;
    return [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0];
  }, [bodyMetrics]);

  // ---------------------------------------------------------------------------
  // Phase 4: AI Coach Actions
  // ---------------------------------------------------------------------------
  const addCoachMessage = useCallback(
    (msg: EpistemicCoachMessage) => {
      executeOptimisticMutation(
        () => {
          const prev = coachMessages;
          setCoachMessages((curr) => [...curr, msg]);
          return prev;
        },
        (prev) => setCoachMessages(prev),
        async () => {
          if (!user?.id) return;
          const convId = await coachRepo.fetchOrCreateActiveConversation(user.id);
          await coachRepo.saveMessage(user.id, convId, msg);
        }
      );
    },
    [coachMessages, executeOptimisticMutation, user?.id]
  );

  const clearCoachMessages = useCallback(() => {
    setCoachMessages(DEFAULT_COACH_MESSAGES);
  }, []);

  const applyProposedAction = useCallback(
    (messageId: string, action: ProposedCoachAction) => {
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
    },
    [addFoodEntry, updateGoals]
  );

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

  // ---------------------------------------------------------------------------
  // Phase 5: Progress Photos Actions
  // ---------------------------------------------------------------------------
  const addProgressPhoto = useCallback(
    (photo: Omit<ProgressPhotoAsset, "id">) => {
      const newPhoto: ProgressPhotoAsset = { ...photo, id: generateId() };

      executeOptimisticMutation(
        () => {
          const prev = progressPhotos;
          setProgressPhotos((curr) => [newPhoto, ...curr]);
          showToast(`Progress Photo Recorded (${photo.weightKg.toFixed(1)} kg)`, "success");
          return prev;
        },
        (prev) => setProgressPhotos(prev),
        async () => {
          if (!user?.id) return;
          const created = await progressPhotosRepo.createPhoto(user.id, newPhoto);
          setProgressPhotos((curr) => curr.map((p) => (p.id === newPhoto.id ? created : p)));
        }
      );
    },
    [progressPhotos, executeOptimisticMutation, user?.id, showToast]
  );

  const deleteProgressPhoto = useCallback(
    (id: string) => {
      executeOptimisticMutation(
        () => {
          const prev = progressPhotos;
          setProgressPhotos((curr) => curr.filter((p) => p.id !== id));
          showToast("Progress photo record deleted", "info");
          return prev;
        },
        (prev) => setProgressPhotos(prev),
        async () => {
          if (!user?.id || id.includes("-")) return;
          await progressPhotosRepo.deletePhoto(user.id, id);
        }
      );
    },
    [progressPhotos, executeOptimisticMutation, user?.id, showToast]
  );

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
      recovery_logs: hasTodayCheckIn
        ? [
            {
              loggedDate: todayCheckIn.date,
              sleepHours: todayCheckIn.sleepHours,
              sleepQuality: todayCheckIn.sleepQuality,
              soreness: todayCheckIn.soreness,
              fatigue: todayCheckIn.fatigue,
              stress: todayCheckIn.stress,
            },
          ]
        : [],
    };
  }, [profile, equipment, goals, preferences, todayCheckIn, hasTodayCheckIn, foodEntries, workoutSessions, activitySessions, bodyMetrics]);

  return (
    <AthloniqContext.Provider
      value={{
        profile,
        equipment,
        goals,
        preferences,
        todayCheckIn,
        hasTodayCheckIn,
        readiness,
        updateProfile,
        updateEquipmentItem,
        confirmEquipment,
        updateGoals,
        updatePreferences,
        submitCheckIn,
        completeOnboarding,
        resetToDefaults,
        foodEntries,
        addFoodEntry,
        updateFoodEntry,
        deleteFoodEntry,
        getFoodEntriesForDate,
        workoutSessions,
        addWorkoutSession,
        updateWorkoutSession,
        deleteWorkoutSession,
        getTodayWorkout,
        activitySessions,
        addActivitySession,
        updateActivitySession,
        deleteActivitySession,
        getActivitiesForDate,
        getWeeklyActivities,
        bodyMetrics,
        addBodyMetric,
        updateBodyMetric,
        deleteBodyMetric,
        getLatestWeight,
        coachMessages,
        addCoachMessage,
        clearCoachMessages,
        applyProposedAction,
        dismissProposedAction,
        getCoachingSnapshot,
        progressPhotos,
        addProgressPhoto,
        deleteProgressPhoto,
        toast,
        showToast,
        hideToast,
        isDemoFixtureActive,
        loadDemoFixture,
        resetDemoFixture,
        syncStatus,
        syncError,
        retrySync,
        legacyImportAvailable,
        legacyImportCounts,
        runLegacyImport,
        dismissLegacyImport,
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
