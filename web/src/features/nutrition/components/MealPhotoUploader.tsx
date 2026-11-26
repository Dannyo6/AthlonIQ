import React, { useState, useRef } from "react";
import { CandidateReviewForm } from "./CandidateReviewForm";
import { analyzeMealPhotoApi } from "@/services/api";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { useNutritionFormDirty } from "../hooks/useNutritionFormDirty";
import { CandidateFoodItem, FoodEntry, MealSlot, MealAnalysisResponse } from "@/types";
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
  onOpenManualEntry?: () => void;
}

/**
 * Format vision provider and mode into a human-readable badge label.
 * Returns 'Provider not reported' when both provider and mode are absent/empty.
 */
export function formatVisionBadge(provider?: string | null, mode?: string | null): string {
  const cleanProvider = provider?.trim();
  const cleanMode = mode?.trim();
  if (cleanProvider && cleanMode) {
    return `${cleanProvider} (${cleanMode})`;
  }
  if (cleanProvider) return cleanProvider;
  if (cleanMode) return cleanMode;
  return "Provider not reported";
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
  onOpenManualEntry,
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
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const isCandidateReviewOpen = Boolean(candidates && candidates.length > 0);

  useNutritionFormDirty("photo-candidate-review", isCandidateReviewOpen, "AI Meal Photo Review");

  const resetState = () => {
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setCandidates(null);
    setAnalysisStep("");
    setVisionProvider("Vision Engine");
    setEmptyMessage(null);
    setIsDemoMode(false);
    setIsFallbackMode(false);
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
      const result: MealAnalysisResponse = await analyzeMealPhotoApi(file);

      const provider = result?.provider || result?.vision_meta?.provider || null;
      const mode = result?.mode || result?.vision_meta?.mode || null;
      setVisionProvider(formatVisionBadge(provider, mode));

      const isDemo = mode === "demo";
      const isFallback = mode === "fallback";
      setIsDemoMode(Boolean(isDemo));
      setIsFallbackMode(Boolean(isFallback));

      if (result && Array.isArray(result.candidates) && result.candidates.length > 0) {
        if (isFallback) {
          // Never prefill any food from mock/fallback!
          setCandidates([]);
          setEmptyMessage(result.message || "Vision unavailable — log manually");
        } else {
          setCandidates(result.candidates);
          setEmptyMessage(null);
        }
      } else {
        setCandidates([]);
        const msg =
          result?.message ||
          (isFallback
            ? "Vision unavailable — log manually"
            : "No recognizable food items could be identified in the image.");
        setEmptyMessage(msg);
      }
    } catch (err: any) {
      console.warn("Vision API failed or server unreachable:", err);
      setVisionProvider(formatVisionBadge("mock", "fallback"));
      setIsFallbackMode(true);
      setIsDemoMode(false);
      setCandidates([]);
      setEmptyMessage("Vision unavailable — log manually");
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
    setVisionProvider(formatVisionBadge("mock", "demo"));
    setIsDemoMode(true);
    setIsFallbackMode(false);
    setEmptyMessage(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vision-modal-title"
        className="relative w-full max-w-2xl bg-athloniq-card border border-athloniq-border rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-athloniq-border bg-athloniq-card">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-athloniq-lime/15 border border-athloniq-lime/30 text-athloniq-lime shrink-0">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="vision-modal-title"
                className="text-base font-black text-white flex flex-wrap items-center gap-2"
              >
                <span className="shrink-0">AthlonIQ Vision AI</span>
                <span
                  data-testid="vision-provider-badge"
                  className={`whitespace-nowrap shrink-0 text-[10px] font-mono px-2.5 py-0.5 rounded-full border tabular-nums ${
                    visionProvider.toLowerCase().includes("live")
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : visionProvider.toLowerCase().includes("fallback")
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : visionProvider.toLowerCase().includes("demo")
                      ? "bg-athloniq-lime/15 text-athloniq-lime border-athloniq-lime/30"
                      : visionProvider === "Provider not reported"
                      ? "bg-athloniq-surface text-slate-300 border-athloniq-border-alt"
                      : "bg-athloniq-surface text-athloniq-lime border-athloniq-lime/30"
                  }`}
                >
                  {visionProvider}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Snap or upload your meal for instant Indian catalog & macro mapping
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close meal photo analyzer"
            onClick={handleClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 rounded-xl text-slate-400 hover:text-white hover:bg-athloniq-surface transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          {/* STATE 1: Analyzing Loading Skeleton */}
          {isAnalyzing ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
              {/* Pulsing Visual Scanner */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-athloniq-lime/20 animate-ping opacity-75 h-24 w-24" />
                <div className="relative h-20 w-20 rounded-2xl bg-athloniq-surface border-2 border-athloniq-lime/60 shadow-glow-lime flex items-center justify-center">
                  <Scan className="h-10 w-10 text-athloniq-lime animate-pulse" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h4 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-athloniq-lime animate-spin shrink-0" aria-hidden="true" />
                  ATHLONIQ Vision is analyzing your meal...
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {analysisStep || "Identifying Indian culinary items & estimating portion scale..."}
                </p>
              </div>

              {/* Shimmering Skeleton Cards */}
              <div className="w-full space-y-2.5 max-w-md pt-2">
                <div className="h-14 rounded-xl bg-athloniq-surface/80 border border-athloniq-border p-3 flex items-center justify-between animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-700 rounded" />
                    <div className="h-2.5 w-20 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-athloniq-lime/20 rounded" />
                </div>
                <div className="h-14 rounded-xl bg-athloniq-surface/80 border border-athloniq-border p-3 flex items-center justify-between animate-pulse delay-75">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-700 rounded" />
                    <div className="h-2.5 w-24 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-athloniq-lime/20 rounded" />
                </div>
              </div>
            </div>
          ) : candidates && candidates.length === 0 ? (
            /* STATE 2A: Empty Candidates / Fallback Mode */
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-5" data-testid="vision-empty-state">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
              </div>

              <div className="space-y-2 max-w-md">
                <h4
                  className="text-base font-bold text-white tracking-tight"
                  data-testid={isFallbackMode ? "vision-empty-message" : undefined}
                >
                  {isFallbackMode
                    ? emptyMessage || "Vision unavailable — log manually"
                    : "No Food Items Identified"}
                </h4>
                <p
                  className="text-sm text-slate-400"
                  data-testid={isFallbackMode ? "vision-empty-helper" : "vision-empty-message"}
                >
                  {isFallbackMode
                    ? "You can log items manually or try another photo."
                    : emptyMessage || "No recognizable food items could be identified in the image."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  data-testid="manual-entry-button"
                  onClick={() => {
                    handleClose();
                    onOpenManualEntry?.();
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-athloniq-lime hover:bg-athloniq-lime-hover text-slate-950 font-bold text-xs tracking-wide shadow-glow-lime transition-all inline-flex items-center gap-2"
                >
                  <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                  Log Manually
                </button>

                <button
                  type="button"
                  data-testid="vision-try-again-button"
                  onClick={() => resetState()}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-athloniq-surface hover:bg-athloniq-border border border-athloniq-border-alt text-slate-300 hover:text-white font-semibold text-xs transition-all"
                >
                  Try Another Photo
                </button>
              </div>
            </div>
          ) : candidates && candidates.length > 0 ? (
            /* STATE 2B: Candidate Review Form */
            <CandidateReviewForm
              candidates={candidates}
              previewUrl={previewUrl}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              isDemo={isDemoMode || visionProvider.toLowerCase().includes("demo")}
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
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] border border-white/[0.08]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3B: Initial Dropzone & Upload */
            <div className="space-y-5">
              {analysisError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Drag & Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? "border-athloniq-lime bg-athloniq-lime/10 scale-[1.01]"
                    : "border-athloniq-border hover:border-athloniq-lime/60 bg-athloniq-card/60 hover:bg-athloniq-card"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="p-4 rounded-2xl bg-athloniq-lime/10 border border-athloniq-lime/25 text-athloniq-lime group-hover:scale-110 transition-transform">
                  <Camera className="h-8 w-8 text-athloniq-lime" aria-hidden="true" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    Tap to upload or drag & drop meal photo
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports high-resolution JPEG, PNG, WEBP, or HEIC (up to 15MB)
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-athloniq-surface border border-athloniq-border text-[11px] font-mono text-emerald-300 mt-2">
                  <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" aria-hidden="true" />
                  Automatic Indian Culinary Detection
                </div>
              </div>

              {/* Demo Quick Test Presets */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-athloniq-lime" aria-hidden="true" />
                  Or Try Quick Preset Analysis
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_MEAL_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="min-h-[44px] p-3 rounded-xl bg-athloniq-card border border-athloniq-border hover:border-athloniq-lime/40 text-left transition-all hover:bg-athloniq-surface flex items-center justify-between gap-2 group"
                    >
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-athloniq-lime">
                        {preset.label}
                      </div>
                      <Sparkles className="h-3.5 w-3.5 text-athloniq-lime opacity-70 group-hover:opacity-100 shrink-0" aria-hidden="true" />
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
