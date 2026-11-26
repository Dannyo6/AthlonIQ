import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, RotateCcw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { PwaInstallCard } from "@/features/pwa/PwaComponents";
import { usePwa } from "@/features/pwa/usePwa";
import {
  calculateBmi,
  calculateProteinReference,
  calculateEnergyEstimate,
} from "@/lib/calculations";
import type { EquipmentItem } from "@/types";
import {
  areProfileSnapshotsEqual,
  buildProfileBaseline,
  detectDeviceTimezone,
  normalizeProfileSnapshot,
  onboardingSchema,
  STEP_QUERY_MAP,
  type OnboardingFormData,
} from "./constants";
import { useProfileFormDirty } from "./hooks/useProfileFormDirty";
import { ProfileStepNav } from "./components/ProfileStepNav";
import { ProfileIdentityStep } from "./components/ProfileIdentityStep";
import { ProfileGoalsStep } from "./components/ProfileGoalsStep";
import { ProfileEquipmentStep } from "./components/ProfileEquipmentStep";
import {
  ProfileReviewStep,
  ProfileTrainingStep,
} from "./components/ProfilePreferencesSection";
import { ProfileSummarySection } from "./components/ProfileSummarySection";
import { ProfileDataPortabilitySection } from "./components/ProfileDataPortabilitySection";

const FIELD_STEP_MAP: Record<keyof OnboardingFormData, { step: number; label: string }> = {
  age: { step: 1, label: "Age" },
  heightCm: { step: 1, label: "Height" },
  weightKg: { step: 1, label: "Weight" },
  sex: { step: 1, label: "Biological Sex" },
  waistCm: { step: 1, label: "Waist Circumference" },
  primaryGoal: { step: 2, label: "Primary Goal" },
  dietaryPattern: { step: 2, label: "Dietary Pattern" },
  customProteinG: { step: 2, label: "Protein Target" },
  dietaryRestrictions: { step: 2, label: "Dietary Restrictions" },
  trainingDaysPerWeek: { step: 4, label: "Weekly Training Days" },
  experienceLevel: { step: 4, label: "Experience Level" },
  currentSplit: { step: 4, label: "Current Split" },
  weeklyBadmintonSessions: { step: 4, label: "Badminton Sessions" },
  weeklyRunningSessions: { step: 4, label: "Running Sessions" },
  sleepBaselineHours: { step: 4, label: "Sleep Baseline" },
  exerciseLimitations: { step: 4, label: "Exercise Limitations" },
  timezone: { step: 5, label: "Timezone" },
};

export const ProfileView: React.FC = () => {
  const {
    profile,
    equipment = [],
    goals,
    preferences,
    todayCheckIn,
    foodEntries = [],
    workoutSessions = [],
    activitySessions = [],
    bodyMetrics = [],
    coachMessages = [],
    progressPhotos = [],
    updateProfile,
    updateEquipmentItem,
    confirmEquipment,
    updateGoals,
    updatePreferences,
    completeOnboarding,
    resetToDefaults,
  } = useAthloniqState();

  const detectedTimezone = useMemo(() => detectDeviceTimezone(), []);
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get("step");

  const initialStep = useMemo(() => {
    if (stepParam) {
      const mapped = STEP_QUERY_MAP[stepParam.toLowerCase()];
      if (mapped) return mapped;
    }
    return profile.onboardingStep || 1;
  }, [stepParam, profile.onboardingStep]);

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isEditingAfterCompletion, setIsEditingAfterCompletion] = useState<boolean>(
    Boolean(stepParam) || !profile.onboardingCompleted
  );

  useEffect(() => {
    if (stepParam) {
      const target = STEP_QUERY_MAP[stepParam.toLowerCase()];
      if (target) {
        setCurrentStep(target);
        setIsEditingAfterCompletion(true);
      }
    }
  }, [stepParam]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [submitFailedErrors, setSubmitFailedErrors] = useState<
    Array<{ key: keyof OnboardingFormData; message: string; step: number; label: string }>
  >([]);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Equipment inline limit editor state
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [editMaxLoad, setEditMaxLoad] = useState<string>("");
  const [editMinIncrement, setEditMinIncrement] = useState<string>("");

  const { canInstall, isInstalled, isIos, installApp } = usePwa();

  const baselineValues = useMemo(
    () => buildProfileBaseline(profile || {}, goals || {}, preferences || {}, detectedTimezone),
    [profile, goals, preferences, detectedTimezone]
  );
  const normalizedBaseline = useMemo(
    () => normalizeProfileSnapshot(baselineValues),
    [baselineValues]
  );
  const baselineKey = useMemo(() => JSON.stringify(normalizedBaseline), [normalizedBaseline]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: baselineValues,
  });

  const watchedValues = watch();
  const normalizedCurrent = normalizeProfileSnapshot(watchedValues);

  // Sync form automatically with cloud hydration only when user has not diverged from prior baseline
  const lastBaselineRef = useRef<{ key: string; snapshot: ReturnType<typeof normalizeProfileSnapshot> }>({
    key: baselineKey,
    snapshot: normalizedBaseline,
  });

  useEffect(() => {
    if (lastBaselineRef.current.key !== baselineKey) {
      const hadUnsavedEdits = !areProfileSnapshotsEqual(
        lastBaselineRef.current.snapshot,
        normalizedCurrent
      );
      lastBaselineRef.current = { key: baselineKey, snapshot: normalizedBaseline };
      if (!hadUnsavedEdits) {
        reset(baselineValues);
      }
    }
  }, [baselineKey, baselineValues, normalizedBaseline, normalizedCurrent, reset]);

  const isEquipmentEditorDirty = useMemo(() => {
    if (!editingEquipmentId) return false;
    const targetItem = equipment.find((e) => e.id === editingEquipmentId);
    if (!targetItem) return false;
    const origMax = targetItem.maxLoadKg != null ? String(targetItem.maxLoadKg) : "";
    const origInc = targetItem.minIncrementKg != null ? String(targetItem.minIncrementKg) : "";
    return editMaxLoad.trim() !== origMax || editMinIncrement.trim() !== origInc;
  }, [editingEquipmentId, equipment, editMaxLoad, editMinIncrement]);

  const isFormDirty =
    !areProfileSnapshotsEqual(normalizedBaseline, normalizedCurrent) || isEquipmentEditorDirty;

  useProfileFormDirty(isFormDirty);

  const rawWeight = watchedValues.weightKg;
  const rawHeight = watchedValues.heightCm;
  const numWeight = typeof rawWeight === "number" ? rawWeight : parseFloat(String(rawWeight));
  const numHeight = typeof rawHeight === "number" ? rawHeight : parseFloat(String(rawHeight));
  const hasValidBiometrics =
    (rawWeight as unknown) !== "" &&
    (rawHeight as unknown) !== "" &&
    rawWeight != null &&
    rawHeight != null &&
    !isNaN(numWeight) &&
    numWeight > 0 &&
    !isNaN(numHeight) &&
    numHeight > 0;

  const watchedWeight = hasValidBiometrics ? numWeight : null;
  const watchedHeight = hasValidBiometrics ? numHeight : null;
  const watchedAge = Number(watchedValues.age) || 20;
  const watchedSex = watchedValues.sex;
  const watchedGoal = watchedValues.primaryGoal;
  const watchedProtein = watchedValues.customProteinG;
  const watchedSleep = Number(watchedValues.sleepBaselineHours) || 7.5;
  const watchedExp = watchedValues.experienceLevel;
  const watchedTrainingDays = Number(watchedValues.trainingDaysPerWeek) || 5;
  const watchedBadminton = Number(watchedValues.weeklyBadmintonSessions) || 0;
  const watchedRunning = Number(watchedValues.weeklyRunningSessions) || 0;
  const watchedTimezone = watchedValues.timezone || "";

  const liveBmi = hasValidBiometrics ? calculateBmi(numWeight, numHeight) : null;
  const liveProteinRef = calculateProteinReference(numWeight || 55.0, watchedProtein);
  const liveEnergy = calculateEnergyEstimate({
    weightKg: numWeight || 55.0,
    heightCm: numHeight || 173.0,
    age: watchedAge,
    sex: watchedSex === "unknown" ? null : watchedSex,
    primaryGoal: watchedGoal,
    onboardingCompleted: true,
    sleepBaselineHours: watchedSleep,
    experienceLevel: watchedExp,
    weeklyBadmintonSessions: watchedBadminton,
    weeklyRunningSessions: watchedRunning,
  });

  const handleExportJSON = () => {
    const archiveData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      profile,
      goals,
      equipment,
      preferences,
      todayCheckIn,
      foodEntries,
      workoutSessions,
      activitySessions,
      bodyMetrics,
      coachMessages,
      progressPhotos,
    };
    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `athloniq-archive-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("Complete AthlonIQ archive JSON downloaded successfully.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportCSV = () => {
    const nutritionHeader = [
      "Type",
      "Date",
      "MealSlot",
      "FoodName",
      "Quantity",
      "Serving",
      "Calories_kcal",
      "Protein_g",
      "Carbs_g",
      "Fat_g",
      "Confirmed",
      "Provenance",
    ].join(",");
    const nutritionRows = foodEntries.map((e) =>
      [
        "NUTRITION",
        e.loggedDate,
        e.mealSlot,
        `"${e.foodName.replace(/"/g, '""')}"`,
        e.quantity,
        `"${e.servingLabel.replace(/"/g, '""')}"`,
        e.caloriesKcal,
        e.proteinG,
        e.carbsG,
        e.fatG,
        e.is_confirmed !== undefined ? e.is_confirmed : e.isConfirmed,
        e.provenance,
      ].join(",")
    );

    const weightHeader = ["Type", "Date", "Weight_kg", "Waist_cm", "Chest_cm", "Arm_cm", "Notes"].join(",");
    const weightRows = bodyMetrics.map((m) =>
      [
        "WEIGHT",
        m.loggedDate,
        m.weightKg,
        m.waistCm ?? "",
        m.chestCm ?? "",
        m.armCm ?? "",
        m.notes ? `"${m.notes.replace(/"/g, '""')}"` : "",
      ].join(",")
    );

    const csvContent = [
      "# AthlonIQ Nutrition Logs",
      nutritionHeader,
      ...nutritionRows,
      "",
      "# AthlonIQ Body Metrics & Weigh-Ins",
      weightHeader,
      ...weightRows,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `athloniq-nutrition-weight-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("Nutrition & Weight logs CSV downloaded successfully.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText.trim() === "DELETE") {
      resetToDefaults();
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setCurrentStep(1);
      setIsEditingAfterCompletion(true);
      setExportNotice("All personal AthlonIQ records have been wiped and reset to initial defaults.");
      setTimeout(() => setExportNotice(null), 5000);
    }
  };

  const handleStepNext = (step: number) => {
    setSubmitFailedErrors([]);
    if (step === 1) {
      const currentValues = watch();
      updateProfile({
        onboardingStep: 2,
        age: currentValues.age,
        heightCm: currentValues.heightCm,
        weightKg: currentValues.weightKg,
        sex: currentValues.sex === "unknown" ? null : (currentValues.sex as any),
        waistCm: currentValues.waistCm || null,
      });
    } else {
      updateProfile({ onboardingStep: step + 1 });
    }
    setCurrentStep(step + 1);
  };

  const handleSaveEquipmentEdit = (itemId: string) => {
    const parsedMax = editMaxLoad.trim() === "" ? null : parseFloat(editMaxLoad);
    const maxLoadKg = parsedMax != null && !isNaN(parsedMax) && parsedMax >= 0 ? parsedMax : null;
    const parsedInc = editMinIncrement.trim() === "" ? null : parseFloat(editMinIncrement);
    const minIncrementKg = parsedInc != null && !isNaN(parsedInc) && parsedInc >= 0 ? parsedInc : null;

    updateEquipmentItem(itemId, {
      maxLoadKg,
      minIncrementKg,
      isConfirmed: true,
    });
    setEditingEquipmentId(null);
  };

  const handleConfirmAllEquipment = () => {
    const all: EquipmentItem[] = equipment.map((i) => ({ ...i, isConfirmed: true }));
    confirmEquipment(all);
    handleStepNext(3);
  };

  const onFinalSubmit = (data: OnboardingFormData) => {
    setSubmitFailedErrors([]);
    const finalProfile = {
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      sex: data.sex === "unknown" ? null : (data.sex as any),
      waistCm: data.waistCm || null,
      primaryGoal: data.primaryGoal,
      dietaryPattern: data.dietaryPattern,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      experienceLevel: data.experienceLevel,
      currentSplit: data.currentSplit,
      weeklyBadmintonSessions: data.weeklyBadmintonSessions,
      weeklyRunningSessions: data.weeklyRunningSessions,
      sleepBaselineHours: data.sleepBaselineHours,
      exerciseLimitations: data.exerciseLimitations || null,
    };

    completeOnboarding(finalProfile);

    if (data.timezone) {
      updatePreferences({ timezone: data.timezone });
    }

    if (data.customProteinG) {
      updateGoals({
        proteinTargetG: data.customProteinG,
        proteinProvenance: "user_confirmed",
      });
    }

    reset(data);
    setIsEditingAfterCompletion(false);
  };

  const onFinalInvalid = (fieldErrors: FieldErrors<OnboardingFormData>) => {
    const items = (Object.keys(fieldErrors) as Array<keyof OnboardingFormData>)
      .map((key) => {
        const meta = FIELD_STEP_MAP[key];
        const msg = fieldErrors[key]?.message;
        return {
          key,
          message: typeof msg === "string" ? msg : "Please check this field",
          step: meta?.step ?? 1,
          label: meta?.label ?? key,
        };
      });
    setSubmitFailedErrors(items);
    if (items.length > 0) {
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <User className="h-6 w-6 text-athloniq-lime shrink-0" aria-hidden="true" />
            Athlete Identity & Onboarding Calibration
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic biometric anchors, verified home equipment, and audited macronutrient allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {profile.onboardingCompleted ? (
            <>
              <Badge variant="emerald">ONBOARDING COMPLETED</Badge>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => {
                  setIsEditingAfterCompletion(!isEditingAfterCompletion);
                  setCurrentStep(1);
                }}
              >
                {isEditingAfterCompletion ? "View Profile Summary" : "Re-Calibrate Wizard"}
              </Button>
            </>
          ) : (
            <Badge variant="lime">ONBOARDING IN PROGRESS (STEP {currentStep}/5)</Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px]"
            aria-label="Reset profile to defaults"
            onClick={() => {
              if (
                confirm(
                  "Reset profile to pristine initial defaults (55kg / 173cm, unconfirmed equipment)?"
                )
              ) {
                resetToDefaults();
                setCurrentStep(1);
                setIsEditingAfterCompletion(true);
              }
            }}
            title="Reset to pristine Phase 1 defaults"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isEditingAfterCompletion || !profile.onboardingCompleted ? (
        <div className="space-y-6">
          <ProfileStepNav currentStep={currentStep} onSelectStep={setCurrentStep} />

          {submitFailedErrors.length > 0 && (
            <div
              ref={errorSummaryRef}
              role="alert"
              tabIndex={-1}
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 space-y-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Please review {submitFailedErrors.length} invalid profile field(s):</span>
              </div>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {submitFailedErrors.map((err) => (
                  <li key={err.key}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(err.step)}
                      className="underline hover:text-white text-left min-h-[44px] sm:min-h-0 py-1"
                    >
                      Step {err.step} ({err.label}): {err.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit(onFinalSubmit, onFinalInvalid)} className="space-y-6">
            {currentStep === 1 && (
              <ProfileIdentityStep
                register={register}
                errors={errors}
                liveBmi={liveBmi}
                liveEnergy={liveEnergy}
                onNext={() => handleStepNext(1)}
              />
            )}

            {currentStep === 2 && (
              <ProfileGoalsStep
                register={register}
                errors={errors}
                watchedWeight={watchedWeight}
                liveProteinRef={liveProteinRef}
                onBack={() => setCurrentStep(1)}
                onNext={() => handleStepNext(2)}
              />
            )}

            {currentStep === 3 && (
              <ProfileEquipmentStep
                equipment={equipment}
                editingEquipmentId={editingEquipmentId}
                editMaxLoad={editMaxLoad}
                editMinIncrement={editMinIncrement}
                onStartEdit={(item) => {
                  setEditingEquipmentId(item.id);
                  setEditMaxLoad(item.maxLoadKg != null ? String(item.maxLoadKg) : "");
                  setEditMinIncrement(item.minIncrementKg != null ? String(item.minIncrementKg) : "");
                }}
                onChangeMaxLoad={setEditMaxLoad}
                onChangeMinIncrement={setEditMinIncrement}
                onCancelEdit={() => setEditingEquipmentId(null)}
                onSaveEdit={handleSaveEquipmentEdit}
                onToggleConfirm={(item) =>
                  updateEquipmentItem(item.id, { isConfirmed: !item.isConfirmed })
                }
                onBack={() => setCurrentStep(2)}
                onConfirmAllAndNext={handleConfirmAllEquipment}
              />
            )}

            {currentStep === 4 && (
              <ProfileTrainingStep
                register={register}
                errors={errors}
                onBack={() => setCurrentStep(3)}
                onNext={() => handleStepNext(4)}
              />
            )}

            {currentStep === 5 && (
              <ProfileReviewStep
                register={register}
                errors={errors}
                equipment={equipment}
                liveBmi={liveBmi}
                liveProteinRef={liveProteinRef}
                liveEnergy={liveEnergy}
                watchedWeight={watchedWeight}
                watchedHeight={watchedHeight}
                watchedAge={watchedAge}
                watchedSex={watchedSex}
                watchedSleep={watchedSleep}
                watchedGoal={watchedGoal}
                watchedTrainingDays={watchedTrainingDays}
                watchedBadminton={watchedBadminton}
                watchedRunning={watchedRunning}
                watchedTimezone={watchedTimezone}
                detectedTimezone={detectedTimezone}
                onBack={() => setCurrentStep(4)}
              />
            )}
          </form>
        </div>
      ) : (
        <ProfileSummarySection
          profile={profile}
          goals={goals}
          onEditBaselines={() => {
            setIsEditingAfterCompletion(true);
            setCurrentStep(1);
          }}
        />
      )}

      <PwaInstallCard
        canInstall={canInstall}
        isInstalled={isInstalled}
        isIos={isIos}
        onInstall={installApp}
      />

      <ProfileDataPortabilitySection
        exportNotice={exportNotice}
        showDeleteModal={showDeleteModal}
        deleteConfirmText={deleteConfirmText}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onOpenDeleteModal={() => setShowDeleteModal(true)}
        onChangeDeleteConfirmText={setDeleteConfirmText}
        onCancelDeleteModal={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText("");
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};
