import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  calculateBmi,
  calculateWeightTrend,
} from "@/lib/calculations";
import {
  TrendingUp,
  Scale,
  Award,
  Info,
  CheckCircle2,
  Trash2,
  Activity,
  BarChart2,
} from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export const ProgressView: React.FC = () => {
  const {
    profile,
    goals,
    bodyMetrics,
    addBodyMetric,
    deleteBodyMetric,
    workoutSessions,
    activitySessions,
    foodEntries,
  } = useAthloniqState();

  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [waistInput, setWaistInput] = useState("");
  const [chestInput, setChestInput] = useState("");
  const [armInput, setArmInput] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [weightDate, setWeightDate] = useState(todayISO());

  const bmi = calculateBmi(profile.weightKg, profile.heightCm);

  // Weight trend engine
  const weightTrend = useMemo(() => {
    const points = bodyMetrics.map((m) => ({
      loggedDate: m.loggedDate,
      weightKg: m.weightKg,
    }));
    return calculateWeightTrend(points);
  }, [bodyMetrics]);

  // Workout volume stats
  const totalSessionsLast30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return workoutSessions.filter((s) => new Date(s.loggedDate) >= cutoff).length;
  }, [workoutSessions]);

  const totalVolumeLast30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return workoutSessions
      .filter((s) => new Date(s.loggedDate) >= cutoff)
      .flatMap((s) => s.sets)
      .filter((s) => s.isCompleted && !s.isBodyweight)
      .reduce((sum, s) => sum + s.reps * s.loadKg, 0);
  }, [workoutSessions]);

  const totalPRs = useMemo(() => {
    return workoutSessions.flatMap((s) => s.sets).filter((s) => s.isPr).length;
  }, [workoutSessions]);

  // Activity stats
  const totalRunKm = useMemo(() => {
    return activitySessions
      .filter((s) => s.activityType === "running" && s.distanceKm)
      .reduce((sum, s) => sum + (s.distanceKm || 0), 0);
  }, [activitySessions]);

  const totalBadmintonMin = useMemo(() => {
    return activitySessions
      .filter((s) => s.activityType === "badminton")
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [activitySessions]);

  // Average daily protein this week
  const avgWeeklyProteinG = useMemo(() => {
    const today = new Date();
    const daysWithEntries: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const entryDate = new Date(e.loggedDate);
      const diffDays = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7 && e.isConfirmed) {
        daysWithEntries[e.loggedDate] = (daysWithEntries[e.loggedDate] || 0) + e.proteinG * e.quantity;
      }
    });
    const dayValues = Object.values(daysWithEntries);
    if (dayValues.length === 0) return null;
    return Math.round(dayValues.reduce((a, b) => a + b, 0) / dayValues.length);
  }, [foodEntries]);

  const handleAddWeight = () => {
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    addBodyMetric({
      loggedDate: weightDate,
      weightKg: kg,
      waistCm: waistInput ? parseFloat(waistInput) : null,
      chestCm: chestInput ? parseFloat(chestInput) : null,
      armCm: armInput ? parseFloat(armInput) : null,
      notes: weightNotes || undefined,
    });
    setWeightInput("");
    setWaistInput("");
    setChestInput("");
    setArmInput("");
    setWeightNotes("");
    setWeightDate(todayISO());
    setShowWeightForm(false);
  };

  const latestWeight = bodyMetrics.length > 0
    ? [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="h-6 w-6 text-athloniq-lime" />
            Physique & Strength Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Body composition trends, rolling weight average, volume analytics, and BMI screening.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">LEAN BULK</Badge>
          <ProvenanceBadge provenance="calculated_estimate" />
          <Button variant="primary" onClick={() => setShowWeightForm(!showWeightForm)}>
            <Scale className="h-4 w-4" /> Log Weigh-In
          </Button>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Current Weight",
            value: latestWeight ? `${latestWeight.weightKg.toFixed(1)} kg` : `${profile.weightKg.toFixed(1)} kg`,
            sub: latestWeight ? latestWeight.loggedDate : "Profile baseline",
            color: "text-athloniq-lime",
          },
          {
            label: "7d Rolling Avg",
            value: weightTrend.rolling7dKg != null ? `${weightTrend.rolling7dKg.toFixed(2)} kg` : "—",
            sub: weightTrend.status === "insufficient_data" ? `${bodyMetrics.length}/3 weigh-ins` : `Δ ${weightTrend.weeklyDeltaKg && weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}${weightTrend.weeklyDeltaKg?.toFixed(2) ?? "—"} kg`,
            color: "text-emerald-400",
          },
          {
            label: "Avg Daily Protein",
            value: avgWeeklyProteinG != null ? `${avgWeeklyProteinG} g` : "—",
            sub: `Target: ${goals.proteinTargetG} g/day`,
            color: avgWeeklyProteinG != null && avgWeeklyProteinG >= goals.proteinTargetG ? "text-athloniq-lime" : "text-amber-400",
          },
          {
            label: "BMI (Screening)",
            value: `${bmi.bmi}`,
            sub: bmi.category.replace("_", " "),
            color: "text-slate-300",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-[#12151E] border border-[#1E2330] space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
            <div className={`text-2xl font-black font-mono tabular-nums ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-400">{sub}</div>
          </div>
        ))}
      </div>

      {/* Weigh-In Form */}
      {showWeightForm && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-athloniq-lime" /> Log Weigh-In
            </h3>
            <Badge variant="lime">REQUIRED: 3 weigh-ins for 7-day rolling trend</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Date</label>
              <input
                type="date"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Weight (kg) *</label>
              <input
                type="number" min="20" max="300" step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="e.g. 55.4"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Waist (cm)</label>
              <input
                type="number" min="40" max="200" step="0.5"
                value={waistInput}
                onChange={(e) => setWaistInput(e.target.value)}
                placeholder="optional"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Chest (cm)</label>
              <input
                type="number" min="40" max="200" step="0.5"
                value={chestInput}
                onChange={(e) => setChestInput(e.target.value)}
                placeholder="optional"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Arm (cm)</label>
              <input
                type="number" min="20" max="100" step="0.5"
                value={armInput}
                onChange={(e) => setArmInput(e.target.value)}
                placeholder="optional"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Notes</label>
              <input
                type="text"
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                placeholder="Fasted AM, post-workout..."
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleAddWeight}>
              <CheckCircle2 className="h-4 w-4" /> Save Weigh-In
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowWeightForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Weight Trend Engine */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-athloniq-lime" /> 7-Day Rolling Weight Trend
          </h3>
          <Badge variant={weightTrend.status === "ok" ? "lime" : "amber"}>
            {weightTrend.status === "ok" ? "ACTIVE" : `${bodyMetrics.length}/3 WEIGH-INS`}
          </Badge>
        </div>

        {weightTrend.status === "insufficient_data" ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200 leading-relaxed">
            <p className="font-bold text-white text-xs mb-1">Insufficient Data — Minimum 3 Weigh-Ins Required</p>
            <p className="text-xs">{weightTrend.explanation}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330] text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">7-Day Rolling Avg</div>
                <div className="text-xl font-black font-mono tabular-nums text-athloniq-lime">
                  {weightTrend.rolling7dKg?.toFixed(2)} kg
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330] text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">Weekly Delta</div>
                <div className={`text-xl font-black font-mono tabular-nums ${
                  (weightTrend.weeklyDeltaKg ?? 0) > 0
                    ? "text-emerald-400"
                    : (weightTrend.weeklyDeltaKg ?? 0) < 0
                    ? "text-red-400"
                    : "text-slate-300"
                }`}>
                  {(weightTrend.weeklyDeltaKg ?? 0) >= 0 ? "+" : ""}{weightTrend.weeklyDeltaKg?.toFixed(2)} kg
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{weightTrend.explanation}</p>

            {/* Weight history table */}
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs font-mono tabular-nums">
                <thead className="border-b border-[#1E2330]">
                  <tr className="text-slate-500 text-left">
                    <th className="pb-2 font-bold">Date</th>
                    <th className="pb-2 font-bold text-right">Weight</th>
                    <th className="pb-2 font-bold text-right">7d Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2330]">
                  {weightTrend.entries.slice().reverse().map((entry) => (
                    <tr key={entry.logged_date} className="hover:bg-[#181D2A] transition-colors">
                      <td className="py-2 text-slate-300">{entry.logged_date}</td>
                      <td className="py-2 text-right text-white font-bold">{entry.weight_kg.toFixed(1)} kg</td>
                      <td className="py-2 text-right text-athloniq-lime">
                        {entry.rolling_7d_kg != null ? `${entry.rolling_7d_kg.toFixed(2)} kg` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Body Metric History */}
      {bodyMetrics.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1E2330] pb-3">
            <Scale className="h-4 w-4 text-athloniq-lime" /> Weigh-In History
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...bodyMetrics]
              .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
              .map((metric) => (
                <div key={metric.id} className="flex items-start justify-between p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-mono tabular-nums">
                        {metric.weightKg.toFixed(1)} kg
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{metric.loggedDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums flex flex-wrap gap-x-3">
                      {metric.waistCm && <span>Waist: {metric.waistCm} cm</span>}
                      {metric.chestCm && <span>Chest: {metric.chestCm} cm</span>}
                      {metric.armCm && <span>Arm: {metric.armCm} cm</span>}
                    </div>
                    {metric.notes && (
                      <div className="text-[11px] text-slate-500">{metric.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteBodyMetric(metric.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Training Volume Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gym Sessions (30d)</span>
            <BarChart2 className="h-4 w-4 text-athloniq-lime" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">{totalSessionsLast30}</div>
          <div className="text-xs text-slate-400">Last 30 days</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume (30d)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalVolumeLast30.toLocaleString()}
            <span className="text-sm text-slate-400 font-normal ml-1">kg</span>
          </div>
          <div className="text-xs text-slate-400">Barbell sets only</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Personal Records</span>
            <Award className="h-4 w-4 text-athloniq-lime" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">{totalPRs}</div>
          <div className="text-xs text-slate-400">All-time tracked PRs</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Running — All Time</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalRunKm.toFixed(1)} <span className="text-sm text-slate-400 font-normal">km</span>
          </div>
          <div className="text-xs text-slate-400">+ {Math.round(totalBadmintonMin / 60)}h badminton</div>
        </Card>
      </div>

      {/* BMI Disclaimer */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
          <Info className="h-4 w-4 text-athloniq-lime" />
          <span>Screening Metric Disclaimer</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {bmi.disclaimer} AthlonIQ prioritizes progressive tension overload, lean tissue accrual, and performance over static height-to-weight ratios.
        </p>
      </Card>
    </div>
  );
};
