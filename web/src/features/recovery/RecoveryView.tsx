import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { Moon, Bed, Activity, ShieldCheck, CheckCircle2 } from "lucide-react";

export const RecoveryView: React.FC = () => {
  const { todayCheckIn, readiness, submitCheckIn } = useAthloniqState();

  const [sleepHours, setSleepHours] = useState(todayCheckIn.sleepHours);
  const [sleepQuality, setSleepQuality] = useState(todayCheckIn.sleepQuality);
  const [soreness, setSoreness] = useState(todayCheckIn.soreness);
  const [fatigue, setFatigue] = useState(todayCheckIn.fatigue);
  const [stress, setStress] = useState<number | null>(todayCheckIn.stress ?? 2);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    submitCheckIn({
      sleepHours: Number(sleepHours),
      sleepQuality: Number(sleepQuality),
      soreness: Number(soreness),
      fatigue: Number(fatigue),
      stress: stress !== null ? Number(stress) : null,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "Prime") return "emerald";
    if (status === "Moderate") return "lime";
    return "rose";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Moon className="h-6 w-6 text-athloniq-lime" />
            Subjective Recovery & Rules-Based Readiness Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic recovery assessment powered by self-reported check-in metrics. Zero fabricated wearable telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(readiness.status)}>
            READINESS: {readiness.status.toUpperCase()} ({readiness.readinessScore}%)
          </Badge>
          <ProvenanceBadge provenance="calculated_estimate" />
        </div>
      </div>

      {/* Hero Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Daily Readiness Score"
          value={readiness.readinessScore}
          unit="/ 100"
          subtitle={`Status: ${readiness.status}`}
          icon={<Activity className="h-6 w-6 text-athloniq-lime" />}
          glow="lime"
        />
        <StatCard
          title="Sleep Duration"
          value={todayCheckIn.sleepHours.toFixed(1)}
          unit="hrs"
          subtitle="Self-reported duration"
          icon={<Moon className="h-6 w-6 text-purple-400" />}
          glow="violet"
        />
        <StatCard
          title="Sleep Quality"
          value={`${todayCheckIn.sleepQuality} / 5`}
          subtitle="Subjective depth score"
          icon={<Bed className="h-6 w-6 text-emerald-400" />}
          glow="emerald"
        />
        <StatCard
          title="Fatigue & Soreness"
          value={`${todayCheckIn.fatigue} / ${todayCheckIn.soreness}`}
          unit="(1-5)"
          subtitle="Fatigue vs DOMS index"
          icon={<ShieldCheck className="h-6 w-6 text-amber-400" />}
        />
      </div>

      {/* Main Check-in Form & Live Rules Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
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
              <label className="text-xs font-semibold text-slate-300">
                Sleep Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="18"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">
                Rule: &gt;=8.0h (+15 pts), 7.0-7.9h (+5 pts), &lt;6.0h (-25 pts).
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Subjective Sleep Quality (1-5)
              </label>
              <select
                value={sleepQuality}
                onChange={(e) => setSleepQuality(Number(e.target.value))}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={5}>5 - Restorative & Deep (+10 pts)</option>
                <option value={4}>4 - Good Rest (+5 pts)</option>
                <option value={3}>3 - Average (0 pts)</option>
                <option value={2}>2 - Disturbed / Light (-10 pts)</option>
                <option value={1}>1 - Severely Disrupted (-20 pts)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Muscle Soreness (1-5, where 1=Fresh, 5=Crippling)
              </label>
              <select
                value={soreness}
                onChange={(e) => setSoreness(Number(e.target.value))}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={1}>1 - Zero Soreness (+5 pts)</option>
                <option value={2}>2 - Minimal Soreness (0 pts)</option>
                <option value={3}>3 - Moderate Soreness (-5 pts)</option>
                <option value={4}>4 - High Soreness (-15 pts)</option>
                <option value={5}>5 - Severe Muscle Strain (-25 pts)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Systemic Fatigue (1-5, where 1=Energized, 5=Exhausted)
              </label>
              <select
                value={fatigue}
                onChange={(e) => setFatigue(Number(e.target.value))}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={1}>1 - Fully Energized (+5 pts)</option>
                <option value={2}>2 - Normal Baseline (0 pts)</option>
                <option value={3}>3 - Mild Fatigue (-5 pts)</option>
                <option value={4}>4 - Elevated Fatigue (-15 pts)</option>
                <option value={5}>5 - Systemic Exhaustion (-25 pts)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                External Life / Mental Stress (1-5)
              </label>
              <select
                value={stress ?? 2}
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              >
                <option value={1}>1 - Low / Calm (+5 pts)</option>
                <option value={2}>2 - Normal Baseline (0 pts)</option>
                <option value={3}>3 - Moderate Stress (-5 pts)</option>
                <option value={4}>4 - High Work/Life Stress (-10 pts)</option>
                <option value={5}>5 - Severe Acute Stress (-15 pts)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button variant="primary" size="lg" onClick={handleSave}>
              <CheckCircle2 className="h-5 w-5" /> Submit Today's Check-in
            </Button>
          </div>
        </Card>

        {/* Transparent Rules Audit Panel */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <div>
              <h4 className="font-bold text-white text-base">Mathematical Audit</h4>
              <p className="text-[11px] text-slate-400">Auditable Rule Breakdown</p>
            </div>
            <ProvenanceBadge provenance="calculated_estimate" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
            <div className="text-xs text-slate-400 font-medium">Readiness Guidance:</div>
            <div className="text-xs text-slate-200 leading-relaxed font-medium">
              {readiness.guidance}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Active Deterministic Triggers:</div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {readiness.triggers.map((trigger, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#181D2A] border border-[#1E2330] text-xs font-mono tabular-nums text-slate-300 flex items-center justify-between"
                >
                  <span>{trigger}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-[#1E2330]">
            Notice: AthlonIQ does not fabricate nocturnal HRV, heart rate dips, or deep sleep stages without real hardware sensor telemetry.
          </div>
        </Card>
      </div>
    </div>
  );
};
