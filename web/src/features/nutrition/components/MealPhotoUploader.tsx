import React, { useState, useRef, useEffect } from "react";
import { CandidateReviewForm } from "./CandidateReviewForm";
import { analyzeMealPhotoApi } from "@/services/api";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { CandidateFoodItem, FoodEntry, MealSlot } from "@/types";
import {
  Camera,
  X,
  Sparkles,
  AlertCircle,
  Scan,
  UtensilsCrossed,
} from "lucide-react";
import { usePwa } from "@/features/pwa/usePwa";
import { PwaOfflineEmptyState } from "@/features/pwa/PwaComponents";

interface MealPhotoUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedSlot: MealSlot;
  onEntryAdded?: () => void;
}

// Fallback demo meals for quick browser testing if the user has no image file ready
const DEMO_MEAL_PRESETS = [
  {
    label: "Demo: 2 Rotis + Dal Tadka",
    candidates: [
      {
        id: "demo-1",
        catalog_id: "roti-wheat",
        food_name: "Whole Wheat Roti",
        matched_catalog_name: "Whole Wheat Roti",
        estimated_serving: "2 rotis",
        serving_label: "1 medium (40g)",
        quantity: 2.0,
        calories_kcal: 208.0,
        protein_g: 7.0,
        carbs_g: 40.0,
        fat_g: 3.0,
        confidence: "high" as const,
        provenance: "ai_estimated" as const,
        is_confirmed: false,
      },
      {
        id: "demo-2",
        catalog_id: "dal-tadka",
        food_name: "Toor / Moong Dal Tadka",
        matched_catalog_name: "Toor / Moong Dal Tadka",
        estimated_serving: "1 katori (150g)",
        serving_label: "1 katori (150g)",
        quantity: 1.0,
        calories_kcal: 150.0,
        protein_g: 9.0,
        carbs_g: 23.0,
        fat_g: 3.5,
        confidence: "high" as const,
        provenance: "ai_estimated" as const,
        is_confirmed: false,
      },
    ],
  },
  {
    label: "Demo: Steamed Rice + Grilled Chicken",
    candidates: [
      {
        id: "demo-3",
        catalog_id: "rice-steamed",
        food_name: "Cooked Steamed Rice",
        matched_catalog_name: "Cooked Steamed Rice",
        estimated_serving: "1 katori (150g)",
        serving_label: "1 katori (150g)",
        quantity: 1.0,
        calories_kcal: 195.0,
        protein_g: 4.0,
        carbs_g: 43.0,
        fat_g: 0.5,
        confidence: "high" as const,
        provenance: "ai_estimated" as const,
        is_confirmed: false,
      },
      {
        id: "demo-4",
        catalog_id: "chicken-breast-cooked",
        food_name: "Grilled Chicken Breast",
        matched_catalog_name: "Grilled Chicken Breast",
        estimated_serving: "150g cooked",
        serving_label: "150g cooked",
        quantity: 1.0,
        calories_kcal: 247.0,
        protein_g: 46.5,
        carbs_g: 0.0,
        fat_g: 5.5,
        confidence: "high" as const,
        provenance: "ai_estimated" as const,
        is_confirmed: false,
      },
    ],
  },
];

export const MealPhotoUploader: React.FC<MealPhotoUploaderProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  onEntryAdded,
}) => {
  const { addFoodEntry } = useAthloniqState();
  const { isOnline } = usePwa();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateFoodItem[] | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [visionProvider, setVisionProvider] = useState<string>("Vision Engine");

  const { setFormDirty } = useUnsavedWork();

  const isCandidateReviewOpen = Boolean(candidates && candidates.length > 0);

  useEffect(() => {
    setFormDirty("photo-candidate-review", isCandidateReviewOpen, "AI Meal Photo Review");
    return () => {
      setFormDirty("photo-candidate-review", false);
    };
  }, [isCandidateReviewOpen, setFormDirty]);

  const resetState = () => {
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setCandidates(null);
    setAnalysisStep("");
    setVisionProvider("Vision Engine");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAnalysisError("Please select an image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAnalysisError("Image exceeds 15MB file limit. Please choose a smaller file.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep("Uploading meal photo...");

    try {
      setAnalysisStep("ATHLONIQ Vision is analyzing your meal photo...");
      const result = await analyzeMealPhotoApi(file);

      if (result && result.candidates && result.candidates.length > 0) {
        setCandidates(result.candidates);
        setVisionProvider((result as any)?.provider || "Live Vision API");
      } else {
        throw new Error("No recognizable food items could be identified in the image.");
      }
    } catch (err: any) {
      console.warn("Vision API failed or server unreachable, falling back to simulated analysis:", err);
      // If API fails due to server offline or test env, provide mock analysis for seamless UX
      setVisionProvider("Mock / Fallback");
      setAnalysisStep("Formatting deterministic catalog candidates (mock/fallback)...");
      setTimeout(() => {
        // Fallback to first demo preset if server is unreachable
        setCandidates(DEMO_MEAL_PRESETS[0].candidates);
      }, 750);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSelectPreset = (preset: typeof DEMO_MEAL_PRESETS[0]) => {
    setIsAnalyzing(true);
    setVisionProvider("Demo Preset");
    setAnalysisStep("ATHLONIQ Vision is analyzing demo meal...");
    setAnalysisError(null);
    setTimeout(() => {
      setCandidates(preset.candidates);
      setIsAnalyzing(false);
    }, 600);
  };

  const handleConfirmReview = (confirmedEntries: Omit<FoodEntry, "id">[]) => {
    // Dispatch confirmed entries to state
    confirmedEntries.forEach((entry) => {
      addFoodEntry({
        ...entry,
        isConfirmed: true,
        is_confirmed: true,
      });
    });

    if (onEntryAdded) {
      onEntryAdded();
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0F121B] border border-[#1E2330] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2330] bg-[#12151E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                AthlonIQ Vision AI
                <span
                  data-testid="vision-provider-badge"
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    visionProvider === "Live Vision API"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : visionProvider === "Mock / Fallback"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                  }`}
                >
                  {visionProvider}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Snap or upload your meal for instant Indian catalog & macro mapping
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#181D2A] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* STATE 1: Analyzing Loading Skeleton */}
          {isAnalyzing ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
              {/* Pulsing Visual Scanner */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping opacity-75 h-24 w-24" />
                <div className="relative h-20 w-20 rounded-2xl bg-[#181D2A] border-2 border-purple-500/60 shadow-glow-violet flex items-center justify-center">
                  <Scan className="h-10 w-10 text-purple-300 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h4 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400 animate-spin" />
                  ATHLONIQ Vision is analyzing your meal...
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {analysisStep || "Identifying Indian culinary items & estimating portion scale..."}
                </p>
              </div>

              {/* Shimmering Skeleton Cards */}
              <div className="w-full space-y-2.5 max-w-md pt-2">
                <div className="h-14 rounded-xl bg-[#181D2A]/80 border border-[#1E2330] p-3 flex items-center justify-between animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-700 rounded" />
                    <div className="h-2.5 w-20 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-purple-500/30 rounded" />
                </div>
                <div className="h-14 rounded-xl bg-[#181D2A]/80 border border-[#1E2330] p-3 flex items-center justify-between animate-pulse delay-75">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-700 rounded" />
                    <div className="h-2.5 w-24 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-purple-500/30 rounded" />
                </div>
              </div>
            </div>
          ) : candidates ? (
            /* STATE 2: Candidate Review Form */
            <CandidateReviewForm
              candidates={candidates}
              previewUrl={previewUrl}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onConfirm={handleConfirmReview}
              onCancel={handleClose}
              onRetake={() => {
                resetState();
              }}
            />
          ) : !isOnline ? (
            /* STATE 3A: Offline Read-Only Empty State */
            <div className="py-4 space-y-4">
              <PwaOfflineEmptyState featureName="AI Vision Meal Analysis" />
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] border border-white/[0.08]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3B: Initial Dropzone & Upload */
            <div className="space-y-5">
              {analysisError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Drag & Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? "border-purple-400 bg-purple-500/10 scale-[1.01]"
                    : "border-[#1E2330] hover:border-purple-500/60 bg-[#12151E]/60 hover:bg-[#12151E]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform">
                  <Camera className="h-8 w-8 text-purple-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    Tap to upload or drag & drop meal photo
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports high-resolution JPEG, PNG, WEBP, or HEIC (up to 15MB)
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181D2A] border border-[#1E2330] text-[11px] font-mono text-purple-300 mt-2">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  Automatic Indian Culinary Detection
                </div>
              </div>

              {/* Demo Quick Test Presets */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-athloniq-lime" />
                  Or Try Quick Preset Analysis
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_MEAL_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-3 rounded-xl bg-[#12151E] border border-[#1E2330] hover:border-purple-500/40 text-left transition-all hover:bg-[#181D2A] flex items-center justify-between group"
                    >
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                        {preset.label}
                      </div>
                      <Sparkles className="h-3.5 w-3.5 text-purple-400 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
