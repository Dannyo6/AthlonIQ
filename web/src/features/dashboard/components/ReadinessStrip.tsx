import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronDown, ChevronUp, Moon, Sliders } from "lucide-react";
import type { ReadinessResult } from "@/types";
import { CountUp } from "@/components/ui/CountUp";

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
    <Card
      spotlight
      data-testid="today-readiness-card"
      className="relative overflow-hidden p-4 sm:p-6 border-athloniq-lime/25"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1 min-w-0">
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
                <CountUp
                  value={readiness.readinessScore}
                  suffix={`% (${readiness.status})`}
                />
              </span>
            ) : (
              <span className="text-slate-400 font-semibold">No check-in yet</span>
            )}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {hasTodayCheckIn && readiness
              ? readiness.guidance
              : "No recovery check-in recorded for today. Log sleep, soreness, and fatigue to calculate your deterministic readiness score."}
          </p>

          {hasTodayCheckIn && readiness ? (
            readiness.triggers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-0.5">
                  Triggers:
                </span>
                {readiness.triggers.slice(0, 3).map((trigger, idx) => (
                  <span
                    key={idx}
                    className="surface-well inline-flex items-center text-[10px] font-mono px-2.5 py-1 rounded-md text-slate-300 tabular-nums"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            )
          ) : (
            <div className="pt-1">
              <Link
                to="/recovery"
                className="surface-well tactile-press inline-flex items-center min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-athloniq-lime hover:border-athloniq-lime/40 gap-1.5"
              >
                <span>Log recovery check-in →</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-expanded={drawerOpen}
            aria-controls="readiness-quick-drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="min-h-[44px] text-xs tactile-press"
          >
            <Sliders className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
            <span>
              {drawerOpen ? "Close" : hasTodayCheckIn ? "Update" : "Quick Check-in"}
            </span>
            {drawerOpen ? (
              <ChevronUp className="h-3.5 w-3.5 ml-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-0.5 shrink-0" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Inline Quick Check-in Drawer */}
      {drawerOpen && (
        <div
          id="readiness-quick-drawer"
          className="surface-well mt-4 rounded-xl p-4 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-athloniq-lime shrink-0" aria-hidden="true" />
              <span>Subjective Recovery Parameters</span>
            </h4>
            <Badge variant="lime">AUDITABLE</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label
                htmlFor="readiness-sleep"
                className="text-[11px] font-semibold text-slate-300 block"
              >
                Sleep Hours
              </label>
              <input
                id="readiness-sleep"
                type="number"
                step="0.5"
                min="0"
                max="16"
                value={sleepInput}
                onChange={(e) => setSleepInput(Number(e.target.value))}
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="readiness-quality"
                className="text-[11px] font-semibold text-slate-300 block"
              >
                Quality (1-5)
              </label>
              <select
                id="readiness-quality"
                value={qualityInput}
                onChange={(e) => setQualityInput(Number(e.target.value))}
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-2 text-xs text-white tabular-nums focus:border-athloniq-lime focus:outline-none"
              >
                <option value={5}>5 - Deep Rest</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Light</option>
                <option value={1}>1 - Poor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="readiness-soreness"
                className="text-[11px] font-semibold text-slate-300 block"
              >
                Soreness (1-5)
              </label>
              <select
                id="readiness-soreness"
                value={sorenessInput}
                onChange={(e) => setSorenessInput(Number(e.target.value))}
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-2 text-xs text-white tabular-nums focus:border-athloniq-lime focus:outline-none"
              >
                <option value={1}>1 - Fresh</option>
                <option value={2}>2 - Mild</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Sore</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="readiness-fatigue"
                className="text-[11px] font-semibold text-slate-300 block"
              >
                Fatigue (1-5)
              </label>
              <select
                id="readiness-fatigue"
                value={fatigueInput}
                onChange={(e) => setFatigueInput(Number(e.target.value))}
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-2 text-xs text-white tabular-nums focus:border-athloniq-lime focus:outline-none"
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
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="min-h-[44px] text-xs tactile-press"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Save & Compute Score</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
