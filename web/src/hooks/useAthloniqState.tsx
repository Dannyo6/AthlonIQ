import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserProfile,
  EquipmentItem,
  UserGoals,
  UserPreferences,
  RecoveryCheckIn,
  ReadinessResult,
} from "@/types";
import {
  calculateRulesReadiness,
  calculateEnergyEstimate,
  calculateProteinReference,
} from "@/lib/calculations";

const STORAGE_KEY = "athloniq_state_v1";

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
  date: new Date().toISOString().split("T")[0],
  sleepHours: 7.5,
  sleepQuality: 4,
  soreness: 2,
  fatigue: 2,
  stress: null,
};

interface AthloniqContextType {
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
}

const AthloniqContext = createContext<AthloniqContextType | null>(null);

export const AthloniqProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load persisted state or default
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_profile`);
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_equipment`);
      return stored ? JSON.parse(stored) : DEFAULT_EQUIPMENT;
    } catch {
      return DEFAULT_EQUIPMENT;
    }
  });

  const [goals, setGoals] = useState<UserGoals>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_goals`);
      return stored ? JSON.parse(stored) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_preferences`);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [todayCheckIn, setTodayCheckIn] = useState<RecoveryCheckIn>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_checkin`);
      return stored ? JSON.parse(stored) : DEFAULT_CHECKIN;
    } catch {
      return DEFAULT_CHECKIN;
    }
  });

  // Calculate readiness deterministically from checkIn
  const readiness = calculateRulesReadiness(
    todayCheckIn.sleepHours,
    todayCheckIn.sleepQuality,
    todayCheckIn.soreness,
    todayCheckIn.fatigue,
    todayCheckIn.stress
  );

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
      localStorage.setItem(`${STORAGE_KEY}_equipment`, JSON.stringify(equipment));
      localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(goals));
      localStorage.setItem(`${STORAGE_KEY}_preferences`, JSON.stringify(preferences));
      localStorage.setItem(`${STORAGE_KEY}_checkin`, JSON.stringify(todayCheckIn));
    } catch (e) {
      console.warn("Error persisting AthlonIQ state to localStorage:", e);
    }
  }, [profile, equipment, goals, preferences, todayCheckIn]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };

      // Re-evaluate protein targets if weight changed
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
  };

  const updateEquipmentItem = (id: string, updates: Partial<EquipmentItem>) => {
    setEquipment((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      const allConfirmed = next.every((item) => item.isConfirmed);
      if (allConfirmed !== profile.equipmentConfirmed) {
        setProfile((p) => ({ ...p, equipmentConfirmed: allConfirmed }));
      }
      return next;
    });
  };

  const confirmEquipment = (confirmedItems: EquipmentItem[]) => {
    setEquipment(confirmedItems);
    const allConfirmed = confirmedItems.length > 0 && confirmedItems.every((i) => i.isConfirmed);
    setProfile((p) => ({ ...p, equipmentConfirmed: allConfirmed }));
  };

  const updateGoals = (updates: Partial<UserGoals>) => {
    setGoals((prev) => ({ ...prev, ...updates }));
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const submitCheckIn = (checkIn: Partial<RecoveryCheckIn>) => {
    setTodayCheckIn((prev) => ({
      ...prev,
      ...checkIn,
      date: new Date().toISOString().split("T")[0],
    }));
  };

  const completeOnboarding = (finalData: Partial<UserProfile>) => {
    const mergedProfile: UserProfile = {
      ...profile,
      ...finalData,
      onboardingCompleted: true,
      onboardingStep: 5,
    };

    setProfile(mergedProfile);

    // Compute deterministic energy and macro estimate
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
  };

  const resetToDefaults = () => {
    setProfile(DEFAULT_PROFILE);
    setEquipment(DEFAULT_EQUIPMENT);
    setGoals(DEFAULT_GOALS);
    setPreferences(DEFAULT_PREFERENCES);
    setTodayCheckIn(DEFAULT_CHECKIN);
    localStorage.clear();
  };

  return (
    <AthloniqContext.Provider
      value={{
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
