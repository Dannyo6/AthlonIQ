import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

interface RecoveryCheckInFormProps {
  sleepHours: number;
  sleepQuality: number;
  soreness: number;
  fatigue: number;
  stress: number | null;
  stressTouched: boolean;
  savedSuccess: boolean;
  onSleepHoursChange: (value: number) => void;
  onSleepQualityChange: (value: number) => void;
  onSorenessChange: (value: number) => void;
  onFatigueChange: (value: number) => void;
  onStressChange: (value: number) => void;
  onClearStress: () => void;
  onSubmit: () => void;
}

const STRESS_DESCRIPTIONS: Record<number, string> = {
  1: "1 - Low / Calm (+5 pts)",
  2: "2 - Normal Baseline (0 pts)",
  3: "3 - Moderate Stress (-5 pts)",
  4: "4 - High Work/Life Stress (-10 pts)",
  5: "5 - Severe Acute Stress (-15 pts)",
};

export const RecoveryCheckInForm: React.FC<RecoveryCheckInFormProps> = ({
  sleepHours,
  sleepQuality,
  soreness,
  fatigue,
  stress,
  stressTouched,
  savedSuccess,
  onSleepHoursChange,
  onSleepQualityChange,
  onSorenessChange,
  onFatigueChange,
  onStressChange,
  onClearStress,
  onSubmit,
}) => {
  return (
    <Card spotlight className="lg:col-span-2 space-y-5">
      <div className="flex flex-wrap items-center justify-between border-b border-athloniq-border pb-3 gap-2">
        <div>
          <h3 className="font-bold text-white text-lg">Daily Subjective Check-in</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Update your physical recovery metrics to immediately re-calculate your training readiness score.
          </p>
        </div>
        {savedSuccess && (
          <Badge variant="emerald">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> SAVED & RE-SCORED
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="recovery-sleep-hours" className="text-xs font-semibold text-slate-300">
            Sleep Duration (Hours)
          </label>
          <input
            id="recovery-sleep-hours"
            type="number"
            step="0.5"
            min="0"
            max="18"
            value={sleepHours}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              if (Number.isFinite(parsed)) {
                onSleepHoursChange(Math.min(18, Math.max(0, parsed)));
              }
            }}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          <span className="text-[11px] text-slate-500 block">
            Rule: &gt;=8.0h (+15 pts), 7.0-7.9h (+5 pts), &lt;6.0h (-25 pts).
          </span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="recovery-sleep-quality" className="text-xs font-semibold text-slate-300">
            Subjective Sleep Quality (1-5)
          </label>
          <select
            id="recovery-sleep-quality"
            value={sleepQuality}
            onChange={(e) => onSleepQualityChange(Number(e.target.value))}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value={5}>5 - Restorative &amp; Deep (+10 pts)</option>
            <option value={4}>4 - Good Rest (+5 pts)</option>
            <option value={3}>3 - Average (0 pts)</option>
            <option value={2}>2 - Disturbed / Light (-10 pts)</option>
            <option value={1}>1 - Severely Disrupted (-20 pts)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="recovery-soreness" className="text-xs font-semibold text-slate-300">
            Muscle Soreness (1-5, where 1=Fresh, 5=Crippling)
          </label>
          <select
            id="recovery-soreness"
            value={soreness}
            onChange={(e) => onSorenessChange(Number(e.target.value))}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value={1}>1 - Zero Soreness (+5 pts)</option>
            <option value={2}>2 - Minimal Soreness (0 pts)</option>
            <option value={3}>3 - Moderate Soreness (-5 pts)</option>
            <option value={4}>4 - High Soreness (-15 pts)</option>
            <option value={5}>5 - Severe Muscle Strain (-25 pts)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="recovery-fatigue" className="text-xs font-semibold text-slate-300">
            Systemic Fatigue (1-5, where 1=Energized, 5=Exhausted)
          </label>
          <select
            id="recovery-fatigue"
            value={fatigue}
            onChange={(e) => onFatigueChange(Number(e.target.value))}
            className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value={1}>1 - Fully Energized (+5 pts)</option>
            <option value={2}>2 - Normal Baseline (0 pts)</option>
            <option value={3}>3 - Mild Fatigue (-5 pts)</option>
            <option value={4}>4 - Elevated Fatigue (-15 pts)</option>
            <option value={5}>5 - Systemic Exhaustion (-25 pts)</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="recovery-stress-slider" className="text-xs font-semibold text-slate-300">
              External Life / Mental Stress (1-5)
            </label>
            <div className="flex items-center gap-2">
              {stress === null || !stressTouched ? (
                <span className="text-xs font-medium text-slate-400 bg-athloniq-surface px-2 py-0.5 rounded border border-athloniq-border">
                  Not set
                </span>
              ) : (
                <span className="text-xs font-medium text-athloniq-lime bg-athloniq-surface px-2 py-0.5 rounded border border-athloniq-border font-mono tabular-nums">
                  Level {stress} / 5
                </span>
              )}
              {(stressTouched || stress !== null) && (
                <button
                  type="button"
                  onClick={onClearStress}
                  className="min-h-[44px] px-2 inline-flex items-center text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <input
            id="recovery-stress-slider"
            type="range"
            min="1"
            max="5"
            step="1"
            value={stress ?? 3}
            onChange={(e) => onStressChange(Number(e.target.value))}
            className="w-full min-h-[44px] accent-athloniq-lime cursor-pointer bg-transparent"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
            <span>1 (Low)</span>
            <span>2 (Baseline)</span>
            <span>3 (Moderate)</span>
            <span>4 (High)</span>
            <span>5 (Severe)</span>
          </div>
          {stress !== null && stressTouched && (
            <div className="text-xs text-slate-400">{STRESS_DESCRIPTIONS[stress]}</div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <Button variant="primary" size="lg" onClick={onSubmit}>
          <CheckCircle2 className="h-5 w-5" /> Submit Today&apos;s Check-in
        </Button>
      </div>
    </Card>
  );
};
