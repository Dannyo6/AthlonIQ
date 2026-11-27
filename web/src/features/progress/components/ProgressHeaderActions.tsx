import React from "react";
import { Button } from "@/components/ui/Button";
import { Camera, CheckCircle2, Database, RotateCcw, Scale, TrendingUp } from "lucide-react";

interface ProgressHeaderActionsProps {
  isDemoFixtureActive: boolean;
  appliedTargetNotice: string | null;
  onToggleDemo: () => void;
  onTogglePhotoForm: () => void;
  onToggleWeightForm: () => void;
}

export const ProgressHeaderActions: React.FC<ProgressHeaderActionsProps> = ({
  isDemoFixtureActive,
  appliedTargetNotice,
  onToggleDemo,
  onTogglePhotoForm,
  onToggleWeightForm,
}) => {
  const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="h-6 w-6 text-athloniq-lime shrink-0" aria-hidden="true" />
            <span>Physique, Calibrations &amp; Recovery Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic energy calibrations, multi-sport fatigue flags, private photo timeline, and volume metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {demoEnabled && (
            <Button
              type="button"
              variant={isDemoFixtureActive ? "danger" : "outline"}
              className="min-h-[44px]"
              onClick={onToggleDemo}
              title={isDemoFixtureActive ? "Reset back to personal state" : "Load 14-day populated demo data"}
            >
              {isDemoFixtureActive ? (
                <>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset Demo
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 text-athloniq-lime" aria-hidden="true" /> Load 14d Demo Fixture
                </>
              )}
            </Button>
          )}
          <Button
            id="progress-photo-trigger"
            type="button"
            variant="secondary"
            className="min-h-[44px]"
            onClick={onTogglePhotoForm}
          >
            <Camera className="h-4 w-4" aria-hidden="true" /> Add Photo
          </Button>
          <Button
            id="progress-weight-trigger"
            type="button"
            variant="primary"
            className="min-h-[44px]"
            onClick={onToggleWeightForm}
          >
            <Scale className="h-4 w-4" aria-hidden="true" /> Log Weigh-In
          </Button>
        </div>
      </div>

      {appliedTargetNotice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{appliedTargetNotice}</span>
        </div>
      )}
    </>
  );
};
