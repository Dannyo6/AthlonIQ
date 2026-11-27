import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronDown, ChevronUp, Moon, Sliders } from "lucide-react";
import type { ReadinessResult } from "@/types";
import { CountUp } from "@/components/ui/CountUp";
import { Ring } from "@/components/charts/Ring";

interface ReadinessStripProps {
  hasTodayCheckIn: boolean;
  readiness: ReadinessResult | null;
  todayCheckIn?: {
    sleepHours?: number | null;
    sleepQuality?: number | null;
    soreness?: number | null;
    fatigue?: number | null;
  } | null;
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
  const [sleepInput, setSleepInput] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.sleepHours != null ? todayCheckIn.sleepHours : null
  );
  const [qualityInput, setQualityInput] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.sleepQuality != null ? todayCheckIn.sleepQuality : null
  );
  const [sorenessInput, setSorenessInput] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.soreness != null ? todayCheckIn.soreness : null
  );
  const [fatigueInput, setFatigueInput] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.fatigue != null ? todayCheckIn.fatigue : null
  );

  useEffect(() => {
    if (hasTodayCheckIn && todayCheckIn) {
      setSleepInput(todayCheckIn.sleepHours ?? null);
      setQualityInput(todayCheckIn.sleepQuality ?? null);
      setSorenessInput(todayCheckIn.soreness ?? null);
      setFatigueInput(todayCheckIn.fatigue ?? null);
    } else {
      setSleepInput(null);
      setQualityInput(null);
      setSorenessInput(null);
      setFatigueInput(null);
    }
  }, [hasTodayCheckIn, todayCheckIn]);

  const canSave =
    sleepInput !== null &&
    Number.isFinite(sleepInput) &&
    qualityInput !== null &&
    sorenessInput !== null &&
    fatigueInput !== null;

  const handleSave = () => {
    if (!canSave) return;
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
      className="relative overflow-hidden h-full flex flex-col justify-between p-4 sm:p-5 border-athloniq-lime/25 space-y-3"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-athloniq-border pb-2.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300">
            Recovery Check-In
          </span>
          <ProvenanceDot
            compact
            provenance={
              hasTodayCheckIn && readiness
                ? readiness.provenance
                : "provisional_default"
            }
          />
        </div>

        {hasTodayCheckIn && readiness ? (
          <div className="surface-well rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-3.5">
              <Ring
                value={readiness.readinessScore}
                max={100}
                unit="%"
                label="Readiness score"
                tone="lime"
                size={68}
                ariaLabel="Daily readiness score ring"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="font-display text-2xl font-bold tracking-[0.015em] text-white leading-tight">
                  Daily Readiness:{" "}
                  <span className="text-white font-mono tabular-nums">
                    <CountUp
                      value={readiness.readinessScore}
                      suffix={`% (${readiness.status})`}
                    />
                  </span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {readiness.guidance}
                </p>
              </div>
            </div>

            {readiness.triggers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {readiness.triggers.slice(0, 2).map((trigger, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md bg-athloniq-card border border-athloniq-border text-slate-300 tabular-nums"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="surface-well rounded-xl p-3.5 space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-[0.015em] text-white leading-tight">
              Daily Readiness:{" "}
              <span className="text-slate-400 font-sans text-base font-semibold">
                No check-in yet
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              No check-in logged yet today. Share your sleep, soreness, and fatigue to see today&apos;s readiness score.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {!hasTodayCheckIn || !readiness ? (
          <Link
            to="/recovery"
            className="surface-elevated tactile-press inline-flex items-center min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-athloniq-lime hover:border-athloniq-lime/40 gap-1.5"
          >
            <span>Log recovery check-in →</span>
          </Link>
        ) : (
          <Link
            to="/recovery"
            className="text-xs font-semibold text-slate-300 hover:text-athloniq-lime inline-flex items-center min-h-[44px] px-1"
          >
            <span>Recovery log →</span>
          </Link>
        )}

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

      {/* Inline Quick Check-in Drawer */}
      {drawerOpen && (
        <div
          id="readiness-quick-drawer"
          className="surface-well mt-2 rounded-xl p-3.5 space-y-3 motion-enter"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-athloniq-lime shrink-0" aria-hidden="true" />
              <span>Morning Check-in</span>
            </h4>
            <Badge variant="lime">TODAY</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
                placeholder="e.g. 7.5"
                value={sleepInput ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    setSleepInput(null);
                    return;
                  }
                  const parsed = Number(raw);
                  if (Number.isFinite(parsed)) {
                    setSleepInput(Math.min(16, Math.max(0, parsed)));
                  }
                }}
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
                value={qualityInput ?? ""}
                onChange={(e) =>
                  setQualityInput(e.target.value === "" ? null : Number(e.target.value))
                }
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-2 text-xs text-white tabular-nums focus:border-athloniq-lime focus:outline-none"
              >
                <option value="" disabled>
                  Select…
                </option>
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
                value={sorenessInput ?? ""}
                onChange={(e) =>
                  setSorenessInput(e.target.value === "" ? null : Number(e.target.value))
                }
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-2 text-xs text-white tabular-nums focus:border-athloniq-lime focus:outline-none"
              >
                <option value="" disabled>
                  Select…
                </option>
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
                value={fatigueInput ?? ""}
                onChange={(e) =>
                  setFatigueInput(e.target.value === "" ? null : Number(e.target.value))
                }
                className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-2 text-xs text-white tabular-nums focus:border-athloniq-lime focus:outline-none"
              >
                <option value="" disabled>
                  Select…
                </option>
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
              disabled={!canSave}
              onClick={handleSave}
              className="min-h-[44px] text-xs tactile-press"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Save Check-in</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
