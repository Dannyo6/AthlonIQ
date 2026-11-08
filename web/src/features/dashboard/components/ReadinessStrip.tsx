import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronDown, ChevronUp, Moon, Sliders } from "lucide-react";
import type { ReadinessResult } from "@/types";

interface ReadinessStripProps {
  hasTodayCheckIn: boolean;
  readiness: ReadinessResult | null;
  todayCheckIn: {
    sleepHours: number;
    sleepQuality: number;
    soreness: number;
    fatigue: number;
  };
  onSubmitCheckIn: (data: {
    sleepHours: number;
    sleepQuality: number;
    soreness: number;
    fatigue: number;
  }) => void;
}

export const ReadinessStrip: React.FC<ReadinessStripProps> = ({
  hasTodayCheckIn,
  readiness,
  todayCheckIn,
  onSubmitCheckIn,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sleepInput, setSleepInput] = useState(todayCheckIn.sleepHours);
  const [qualityInput, setQualityInput] = useState(todayCheckIn.sleepQuality);
  const [sorenessInput, setSorenessInput] = useState(todayCheckIn.soreness);
  const [fatigueInput, setFatigueInput] = useState(todayCheckIn.fatigue);

  const handleSave = () => {
    onSubmitCheckIn({
      sleepHours: Number(sleepInput),
      sleepQuality: Number(qualityInput),
      soreness: Number(sorenessInput),
      fatigue: Number(fatigueInput),
    });
    setDrawerOpen(false);
  };

  return (
    <div
      data-testid="today-readiness-card"
      className="relative overflow-hidden rounded-2xl bg-athloniq-card border border-athloniq-border p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasTodayCheckIn && readiness ? "lime" : "neutral"}>
              DETERMINISTIC READINESS
            </Badge>
            <ProvenanceBadge
              provenance={
                hasTodayCheckIn && readiness
                  ? readiness.provenance
                  : "provisional_default"
              }
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Daily Readiness:{" "}
            {hasTodayCheckIn && readiness ? (
              <span className="text-athloniq-lime font-mono tabular-nums">
                {readiness.readinessScore}% ({readiness.status})
              </span>
            ) : (
              <span className="text-slate-400 font-normal">No check-in yet</span>
            )}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {hasTodayCheckIn && readiness
              ? readiness.guidance
              : "No recovery check-in recorded for today. Log sleep, soreness, and fatigue to calculate your deterministic readiness score."}
          </p>

          {hasTodayCheckIn && readiness ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Triggers:</span>
              {readiness.triggers.slice(0, 3).map((trigger, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-athloniq-surface border border-athloniq-border text-slate-300 tabular-nums"
                >
                  {trigger}
                </span>
              ))}
            </div>
          ) : (
            <div className="pt-1">
              <Link
                to="/recovery"
                className="inline-flex items-center text-xs font-semibold text-athloniq-lime hover:underline gap-1 min-h-[32px]"
              >
                Log recovery check-in →
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="min-h-[44px] text-xs"
          >
            <Sliders className="h-4 w-4 text-athloniq-lime" />
            <span>
              {drawerOpen
                ? "Close"
                : hasTodayCheckIn
                ? "Update"
                : "Quick Check-in"}
            </span>
            {drawerOpen ? (
              <ChevronUp className="h-3.5 w-3.5 ml-1" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Inline Quick Check-in Drawer */}
      {drawerOpen && (
        <div className="mt-4 pt-4 border-t border-athloniq-border bg-athloniq-surface rounded-xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-athloniq-lime" />
              <span>Subjective Recovery Parameters</span>
            </h4>
            <Badge variant="lime">AUDITABLE</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Sleep Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="16"
                value={sleepInput}
                onChange={(e) => setSleepInput(Number(e.target.value))}
                className="w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Quality (1-5)
              </label>
              <select
                value={qualityInput}
                onChange={(e) => setQualityInput(Number(e.target.value))}
                className="w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1.5 text-xs text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={5}>5 - Deep Rest</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Light</option>
                <option value={1}>1 - Poor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Soreness (1-5)
              </label>
              <select
                value={sorenessInput}
                onChange={(e) => setSorenessInput(Number(e.target.value))}
                className="w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1.5 text-xs text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={1}>1 - Fresh</option>
                <option value={2}>2 - Mild</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Sore</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Fatigue (1-5)
              </label>
              <select
                value={fatigueInput}
                onChange={(e) => setFatigueInput(Number(e.target.value))}
                className="w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1.5 text-xs text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={1}>1 - Energized</option>
                <option value={2}>2 - Normal</option>
                <option value={3}>3 - Mild</option>
                <option value={4}>4 - Elevated</option>
                <option value={5}>5 - Exhausted</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="min-h-[44px] text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Save & Compute Score</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

