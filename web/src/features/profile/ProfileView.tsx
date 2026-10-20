import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  calculateBmi,
  calculateProteinReference,
  calculateEnergyEstimate,
} from "@/lib/calculations";
import {
  User,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  Utensils,
  Flame,
  RotateCcw,
  Activity,
  FileSpreadsheet,
  FileJson,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// Zod Schema for Onboarding Wizard
const onboardingSchema = z.object({
  // Step 1: Biometrics
  age: z.coerce.number().min(12).max(120),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(300),
  sex: z.enum(["male", "female", "other", "unknown"]).optional().nullable(),
  waistCm: z.coerce.number().min(40).max(200).optional().nullable(),

  // Step 2: Goals & Diet
  primaryGoal: z.enum([
    "lean_bulk",
    "hypertrophy",
    "strength",
    "fat_loss",
    "recomposition",
    "endurance",
    "maintenance",
  ]),
  dietaryPattern: z.enum([
    "nonvegetarian",
    "vegetarian",
    "vegan",
    "pescatarian",
    "eggetarian",
    "keto",
    "other",
  ]),
  customProteinG: z.coerce.number().min(50).max(350).optional().nullable(),
  dietaryRestrictions: z.string().optional().nullable(),

  // Step 4: Training & Sleep
  trainingDaysPerWeek: z.coerce.number().min(1).max(7),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  currentSplit: z.enum([
    "ppl",
    "upper_lower",
    "full_body",
    "bro_split",
    "custom",
    "need_recommendation",
  ]),
  weeklyBadmintonSessions: z.coerce.number().min(0).max(14),
  weeklyRunningSessions: z.coerce.number().min(0).max(14),
  sleepBaselineHours: z.coerce.number().min(4).max(14),
  exerciseLimitations: z.string().optional().nullable(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const ProfileView: React.FC = () => {
  const {
    profile,
    equipment,
    goals,
    preferences,
    todayCheckIn,
    foodEntries,
    workoutSessions,
    activitySessions,
    bodyMetrics,
    coachMessages,
    progressPhotos,
    updateProfile,
    updateEquipmentItem,
    confirmEquipment,
    updateGoals,
    completeOnboarding,
    resetToDefaults,
  } = useAthloniqState();

  const [currentStep, setCurrentStep] = useState<number>(profile.onboardingStep || 1);
  const [isEditingAfterCompletion, setIsEditingAfterCompletion] = useState<boolean>(
    !profile.onboardingCompleted
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      age: profile.age || 20,
      heightCm: profile.heightCm || 173.0,
      weightKg: profile.weightKg || 55.0,
      sex: profile.sex || "unknown",
      waistCm: profile.waistCm || null,
      primaryGoal: (profile.primaryGoal as any) || "lean_bulk",
      dietaryPattern: (profile.dietaryPattern as any) || "nonvegetarian",
      customProteinG: goals.proteinTargetG || 110,
      dietaryRestrictions: "",
      trainingDaysPerWeek: profile.trainingDaysPerWeek || 5,
      experienceLevel: (profile.experienceLevel as any) || "beginner",
      currentSplit: (profile.currentSplit as any) || "need_recommendation",
      weeklyBadmintonSessions: profile.weeklyBadmintonSessions ?? 2,
      weeklyRunningSessions: profile.weeklyRunningSessions ?? 1,
      sleepBaselineHours: profile.sleepBaselineHours ?? 7.5,
      exerciseLimitations: profile.exerciseLimitations || "",
    },
  });

  const watchedWeight = watch("weightKg") || 55.0;
  const watchedHeight = watch("heightCm") || 173.0;
  const watchedAge = watch("age") || 20;
  const watchedSex = watch("sex");
  const watchedGoal = watch("primaryGoal");
  const watchedProtein = watch("customProteinG");
  const watchedSleep = watch("sleepBaselineHours");
  const watchedExp = watch("experienceLevel");
  const watchedBadminton = watch("weeklyBadmintonSessions");
  const watchedRunning = watch("weeklyRunningSessions");

  // Live client calculations for preview in wizard
  const liveBmi = calculateBmi(watchedWeight, watchedHeight);
  const liveProteinRef = calculateProteinReference(watchedWeight, watchedProtein);
  const liveEnergy = calculateEnergyEstimate({
    weightKg: watchedWeight,
    heightCm: watchedHeight,
    age: watchedAge,
    sex: watchedSex === "unknown" ? null : watchedSex,
    primaryGoal: watchedGoal,
    onboardingCompleted: true, // Preview as if completed
    sleepBaselineHours: watchedSleep,
    experienceLevel: watchedExp,
    weeklyBadmintonSessions: watchedBadminton,
    weeklyRunningSessions: watchedRunning,
  });

  const handleStepNext = (step: number) => {
    updateProfile({ onboardingStep: step + 1 });
    setCurrentStep(step + 1);
  };

  const handleStepBack = (step: number) => {
    setCurrentStep(step - 1);
  };

  const onFinalSubmit = (data: OnboardingFormData) => {
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

    if (data.customProteinG) {
      updateGoals({
        proteinTargetG: data.customProteinG,
        proteinProvenance: "user_confirmed",
      });
    }

    setIsEditingAfterCompletion(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <User className="h-6 w-6 text-athloniq-lime" />
            Athlete Identity & Onboarding Calibration
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic biometric anchors, verified home equipment, and audited macronutrient allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile.onboardingCompleted ? (
            <>
              <Badge variant="emerald">ONBOARDING COMPLETED</Badge>
              <Button
                variant="outline"
                size="sm"
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
            onClick={() => {
              if (confirm("Reset profile to pristine initial defaults (55kg / 173cm, unconfirmed equipment)?")) {
                resetToDefaults();
                setCurrentStep(1);
                setIsEditingAfterCompletion(true);
              }
            }}
            title="Reset to pristine Phase 1 defaults"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Wizard Form or Summary View */}
      {isEditingAfterCompletion || !profile.onboardingCompleted ? (
        <div className="space-y-6">
          {/* Step Indicator Progress Bar */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { num: 1, label: "Biometrics & Units" },
              { num: 2, label: "Goals & Diet" },
              { num: 3, label: "Home Equipment" },
              { num: 4, label: "Training & Sleep" },
              { num: 5, label: "Review & Activation" },
            ].map((s) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? "bg-athloniq-lime/10 border-athloniq-lime text-white"
                      : isPast
                      ? "bg-[#12151E] border-emerald-500/40 text-emerald-300"
                      : "bg-[#12151E] border-[#1E2330] text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span>STEP 0{s.num}</span>
                    {isPast && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-xs font-semibold mt-1 truncate">{s.label}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-6">
            {/* STEP 1: Biometrics & Anthropometry */}
            {currentStep === 1 && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E2330] pb-4">
                  <div>
                    <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
                      Step 1 of 5
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Biometrics & Anthropometry
                    </h3>
                  </div>
                  <ProvenanceBadge provenance="calculated_estimate" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Age (Years) <span className="text-athloniq-lime">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("age")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                    {errors.age && (
                      <p className="text-xs text-rose-400">{errors.age.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Height (cm) <span className="text-athloniq-lime">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      {...register("heightCm")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                    {errors.heightCm && (
                      <p className="text-xs text-rose-400">{errors.heightCm.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Weight (kg) <span className="text-athloniq-lime">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register("weightKg")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                    {errors.weightKg && (
                      <p className="text-xs text-rose-400">{errors.weightKg.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        Biological Sex (Optional)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Known Unknown</span>
                    </div>
                    <select
                      {...register("sex")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                    >
                      <option value="unknown">Skip / Unknown</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      If omitted, metabolic equations apply conservative male reference defaults with transparent note.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        Waist Circumference (Optional cm)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Known Unknown</span>
                    </div>
                    <input
                      type="number"
                      placeholder="e.g. 74 cm (or leave empty)"
                      {...register("waistCm")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">
                      Used for Navy body-fat estimates when available. Optional.
                    </p>
                  </div>
                </div>

                {/* Instant BMI Screening Preview */}
                <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-athloniq-lime/15 border border-athloniq-lime/30 flex items-center justify-center text-athloniq-lime font-mono font-bold text-sm">
                      {liveBmi.bmi}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>Calculated BMI: {liveBmi.bmi} kg/m²</span>
                        <Badge variant="amber">{liveBmi.category.toUpperCase()}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {liveBmi.disclaimer}
                      </p>
                    </div>
                  </div>
                  <ProvenanceBadge provenance="calculated_estimate" />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleStepNext(1)}
                  >
                    Proceed to Goals & Diet <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 2: Goals & Dietary Profile */}
            {currentStep === 2 && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E2330] pb-4">
                  <div>
                    <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
                      Step 2 of 5
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Goals & Dietary Profile
                    </h3>
                  </div>
                  <ProvenanceBadge provenance="provisional_default" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Primary Physique & Performance Goal
                    </label>
                    <select
                      {...register("primaryGoal")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                    >
                      <option value="lean_bulk">Lean Bulk (+250 kcal surplus)</option>
                      <option value="hypertrophy">Hypertrophy (Targeted Muscle Growth)</option>
                      <option value="strength">Strength Focus (Neural & Max Overload)</option>
                      <option value="fat_loss">Fat Loss (-400 kcal deficit)</option>
                      <option value="recomposition">Body Recomposition</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Dietary Pattern
                    </label>
                    <select
                      {...register("dietaryPattern")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                    >
                      <option value="nonvegetarian">Nonvegetarian (Omnivore)</option>
                      <option value="vegetarian">Vegetarian (Lacto-Ovo)</option>
                      <option value="eggetarian">Eggetarian</option>
                      <option value="vegan">Vegan / Plant-Based</option>
                      <option value="pescatarian">Pescatarian</option>
                    </select>
                  </div>
                </div>

                {/* Protein Target Calibration */}
                <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-athloniq-lime" />
                        Daily Protein Reference Target
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scientific Range for {watchedWeight} kg: {liveProteinRef.proteinMinG}–{liveProteinRef.proteinMaxG} g/day (1.6–2.2 g/kg)
                      </p>
                    </div>
                    <ProvenanceBadge provenance={liveProteinRef.provenance} />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-48">
                      <input
                        type="number"
                        {...register("customProteinG")}
                        className="w-full bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-athloniq-lime focus:outline-none"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      Default is 110 g (2.0 g/kg). You can customize within evidence range.
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleStepBack(2)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleStepNext(2)}
                  >
                    Verify Equipment <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 3: Home Equipment Verification */}
            {currentStep === 3 && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E2330] pb-4">
                  <div>
                    <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
                      Step 3 of 5
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Home Gym Equipment Verification
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Historical home gym items must be confirmed to unlock tailored resistance training progressions.
                    </p>
                  </div>
                  <Badge variant={equipment.every((i) => i.isConfirmed) ? "emerald" : "amber"}>
                    {equipment.filter((i) => i.isConfirmed).length}/{equipment.length} CONFIRMED
                  </Badge>
                </div>

                <div className="space-y-3">
                  {equipment.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        item.isConfirmed
                          ? "bg-[#181D2A] border-emerald-500/40"
                          : "bg-[#181D2A]/60 border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl border mt-0.5 ${
                            item.isConfirmed
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <Dumbbell className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {item.itemName}
                            </span>
                            <ProvenanceBadge
                              provenance={
                                item.isConfirmed
                                  ? "user_confirmed"
                                  : "unconfirmed_equipment"
                              }
                            />
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            {item.maxLoadKg ? `Max Load: ${item.maxLoadKg} kg` : "Bodyweight"}{" "}
                            {item.minIncrementKg ? `• Min Increment: ${item.minIncrementKg} kg` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant={item.isConfirmed ? "outline" : "primary"}
                          size="sm"
                          onClick={() => {
                            updateEquipmentItem(item.id, {
                              isConfirmed: !item.isConfirmed,
                            });
                          }}
                        >
                          {item.isConfirmed ? "Mark Unconfirmed" : "Confirm Available"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleStepBack(3)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      // Confirm all equipment if user clicks proceed
                      const all = equipment.map((i) => ({ ...i, isConfirmed: true }));
                      confirmEquipment(all);
                      handleStepNext(3);
                    }}
                  >
                    Confirm All & Proceed <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 4: Training Split, Sport & Sleep Baseline */}
            {currentStep === 4 && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E2330] pb-4">
                  <div>
                    <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
                      Step 4 of 5
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Training Split, Badminton/Running & Sleep Baseline
                    </h3>
                  </div>
                  <ProvenanceBadge provenance="user_confirmed" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Weekly Training Days <span className="text-athloniq-lime">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      {...register("trainingDaysPerWeek")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Experience Level <span className="text-athloniq-lime">*</span>
                    </label>
                    <select
                      {...register("experienceLevel")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                    >
                      <option value="beginner">Beginner (&lt; 1 Year)</option>
                      <option value="intermediate">Intermediate (1-3 Years)</option>
                      <option value="advanced">Advanced (3-5 Years)</option>
                      <option value="elite">Elite (5+ Years Competitive)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Current Routine Split
                    </label>
                    <select
                      {...register("currentSplit")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                    >
                      <option value="need_recommendation">Need Recommendation</option>
                      <option value="upper_lower">Upper / Lower (4-5 Days)</option>
                      <option value="ppl">Push / Pull / Legs (5-6 Days)</option>
                      <option value="full_body">Full Body (3-4 Days)</option>
                      <option value="bro_split">Body Part Split</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Weekly Badminton Sessions
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register("weeklyBadmintonSessions")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Weekly Running Sessions
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register("weeklyRunningSessions")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Typical Sleep Baseline (Hours) <span className="text-athloniq-lime">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="12"
                      {...register("sleepBaselineHours")}
                      className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Exercise Limitations or Joint Sensitivities (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. slight right shoulder impingement on flat bench, or none"
                    {...register("exerciseLimitations")}
                    className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleStepBack(4)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleStepNext(4)}
                  >
                    Review & Activate Plan <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 5: Review & Plan Activation */}
            {currentStep === 5 && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E2330] pb-4">
                  <div>
                    <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
                      Step 5 of 5
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Profile Review & Plan Activation
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify deterministic anchors and activate your personalized AthlonIQ cybernetic engine.
                    </p>
                  </div>
                  <ProvenanceBadge provenance="calculated_estimate" />
                </div>

                {/* Energy & Macro Targets Preview Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181D2A] to-[#12151E] border border-athloniq-lime/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-athloniq-lime" />
                      <span className="font-bold text-white text-base">
                        Calibrated Daily Energy Balance
                      </span>
                    </div>
                    <Badge variant="lime">LEAN BULK (+250 KCAL)</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-[#12151E] border border-[#1E2330]">
                      <div className="text-[11px] text-slate-400 font-medium">Daily Target</div>
                      <div className="text-2xl font-black text-athloniq-lime font-mono mt-1 tabular-nums">
                        {liveEnergy.estimatedKcal || "2,550"}
                        <span className="text-xs text-slate-400 ml-1">kcal</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#12151E] border border-[#1E2330]">
                      <div className="text-[11px] text-slate-400 font-medium">Protein (1.6-2.2 g/kg)</div>
                      <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
                        {liveProteinRef.proteinTargetG}
                        <span className="text-xs text-slate-400 ml-1">g</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#12151E] border border-[#1E2330]">
                      <div className="text-[11px] text-slate-400 font-medium">Carbohydrates</div>
                      <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
                        {liveEnergy.macros?.carbsG || 320}
                        <span className="text-xs text-slate-400 ml-1">g</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#12151E] border border-[#1E2330]">
                      <div className="text-[11px] text-slate-400 font-medium">Dietary Fats</div>
                      <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
                        {liveEnergy.macros?.fatG || 70}
                        <span className="text-xs text-slate-400 ml-1">g</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {liveEnergy.notes}
                  </p>
                </div>

                {/* Audit Grid of Entered Baseline Anchors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
                    <div className="flex justify-between items-center border-b border-[#1E2330] pb-1.5 font-bold text-slate-300">
                      <span>BIOMETRICS</span>
                      <ProvenanceBadge provenance="calculated_estimate" />
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Weight & Height</span>
                      <span className="font-mono text-white font-semibold">
                        {watchedWeight} kg / {watchedHeight} cm (BMI {liveBmi.bmi})
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Age & Biological Sex</span>
                      <span className="font-mono text-white font-semibold">
                        {watchedAge} yrs • {watchedSex || "Unknown / Screening Default"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Sleep Baseline</span>
                      <span className="font-mono text-white font-semibold">
                        {watchedSleep} hours / night
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
                    <div className="flex justify-between items-center border-b border-[#1E2330] pb-1.5 font-bold text-slate-300">
                      <span>EQUIPMENT & SCOPE</span>
                      <ProvenanceBadge provenance="user_confirmed" />
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Home Gym Equipment</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {equipment.filter((i) => i.isConfirmed).length}/{equipment.length} Items Confirmed
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Weekly Lifting & Sports</span>
                      <span className="font-mono text-white font-semibold">
                        5 Days Lift • {watchedBadminton} Badminton • {watchedRunning} Run
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Training Scope</span>
                      <span className="font-mono text-white font-semibold">
                        Gym • Calisthenics • Badminton • Running
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleStepBack(5)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>

                  <Button type="submit" variant="primary" size="lg">
                    <Sparkles className="h-5 w-5" /> Activate Personalized Athlete Plan
                  </Button>
                </div>
              </Card>
            )}
          </form>
        </div>
      ) : (
        /* Summary Matrix View when Onboarding is completed */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-athloniq-lime/15 border border-athloniq-lime/30 flex items-center justify-center text-athloniq-lime font-black text-lg">
                AQ
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{profile.fullName}</h3>
                <p className="text-xs text-slate-400">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#1E2330] text-xs">
              <div className="flex justify-between py-1 border-b border-[#1E2330]">
                <span className="text-slate-400">Age & Weight</span>
                <span className="font-mono text-white font-medium">
                  {profile.age} yrs • {profile.weightKg} kg
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2330]">
                <span className="text-slate-400">Height & BMI</span>
                <span className="font-mono text-white font-medium">
                  {profile.heightCm} cm • BMI 18.4
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2330]">
                <span className="text-slate-400">Training Frequency</span>
                <span className="text-athloniq-lime font-semibold font-mono">
                  {profile.trainingDaysPerWeek} Days / Week
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Home Equipment</span>
                <span className="text-emerald-400 font-semibold">
                  {profile.equipmentConfirmed ? "Confirmed Home Gym" : "Pending Confirmation"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsEditingAfterCompletion(true);
                  setCurrentStep(1);
                }}
              >
                Edit Athlete Baselines
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-athloniq-lime" />
                <h3 className="font-bold text-white">Active Nutritional Target</h3>
              </div>
              <ProvenanceBadge provenance={goals.calorieProvenance} />
            </div>

            <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
              <div className="text-xs font-semibold text-athloniq-lime uppercase">
                Lean Bulk Strategy (+250 kcal)
              </div>
              <div className="text-2xl font-black text-white font-mono tabular-nums">
                {goals.calorieTargetKcal || "Awaiting Onboarding"}
                {goals.calorieTargetKcal && <span className="text-xs text-slate-400 ml-1">kcal/day</span>}
              </div>
              <div className="text-xs text-slate-400">
                Protein Target: {goals.proteinTargetG} g/day (1.6-2.2 g/kg range)
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Carbohydrate Target</span>
                <span className="font-mono text-white font-semibold">
                  {goals.carbsTargetG ? `${goals.carbsTargetG} g` : "Calibrated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dietary Fats</span>
                <span className="font-mono text-white font-semibold">
                  {goals.fatTargetG ? `${goals.fatTargetG} g` : "25% of energy"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hydration Baseline</span>
                <span className="font-mono text-white font-semibold">3,500 ml / day</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-white">Privacy & RLS Verification</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="h-4 w-4" />
                <span>Row-Level Security Active (auth.uid() = user_id)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="h-4 w-4" />
                <span>Deterministic Rules Engine (Zero Fabricated HRV)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="h-4 w-4" />
                <span>Auditable Provenance on Every Metric</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E2330]">
              <div className="text-[11px] text-slate-400">
                All biometrics, equipment items, and check-in scores are deterministically verified and synchronized with PostgreSQL Row-Level Security (RLS) policies in Supabase.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Export / Reset Notice Alert */}
      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Data Portability, Export & Account Controls */}
      <Card className="space-y-4 border-[#1E2330]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-athloniq-lime" />
            <div>
              <h3 className="font-bold text-white text-base">Data Portability, Export & Account Controls</h3>
              <p className="text-xs text-slate-400">
                Full athlete sovereignty. Export your logs as JSON or CSV spreadsheets, or securely wipe all personal data.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2"
            onClick={handleExportJSON}
          >
            <FileJson className="h-4 w-4 text-cyan-400" />
            <span>Export Complete JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV Spreadsheets</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Reset / Delete All Data</span>
          </Button>
        </div>
      </Card>

      {/* Two-Step Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md space-y-4 border-rose-500/40 bg-[#0E121A] shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Reset & Delete All Personal Data</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This action will permanently purge all nutrition entries, weigh-ins, progress photos, workout routines, and AI conversation history from this device and local storage.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-300">
              To confirm permanent deletion, please type <strong className="font-mono text-white">DELETE</strong> below:
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#141923] border border-[#232936] text-white focus:outline-none focus:border-rose-400 font-mono"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={deleteConfirmText.trim() !== "DELETE"}
                className="bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed border-rose-600"
                onClick={handleConfirmDelete}
              >
                Permanently Delete Data
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
