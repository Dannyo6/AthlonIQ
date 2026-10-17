import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Activity,
  BatteryCharging,
  Flame,
  Zap,
  Dumbbell,
  Bot,
  ArrowRight,
} from "lucide-react";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Readiness Summary */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 border-athloniq-cyan/20">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-athloniq-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-athloniq-violet/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">CYBERNETIC LOOP ACTIVE</Badge>
              <Badge variant="emerald">PHASE 0 VALIDATED</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Daily Readiness: <span className="text-gradient-cyan">88% (Optimal)</span>
            </h1>
            <p className="max-w-2xl text-slate-300 text-sm leading-relaxed">
              CNS recovered. Sleep architecture reached 2h 15m deep sleep. Physiological reserve is primed for high-intensity progressive overload.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate("workouts")}
            >
              <Dumbbell className="h-5 w-5" />
              Launch Workout
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate("coach")}
            >
              <Bot className="h-5 w-5 text-athloniq-cyan" />
              Consult AI Coach
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Recovery Readiness"
          value="88"
          unit="/100"
          subtitle="Optimal training readiness"
          trend={{ value: "+6%", positive: true }}
          icon={<BatteryCharging className="h-6 w-6 text-athloniq-emerald" />}
          glow="emerald"
        />
        <StatCard
          title="Sleep Architecture"
          value="7.8"
          unit="hrs"
          subtitle="Quality Score: 91%"
          trend={{ value: "+45m", positive: true }}
          icon={<Activity className="h-6 w-6 text-athloniq-cyan" />}
          glow="cyan"
        />
        <StatCard
          title="Energy Balance"
          value="1,840"
          unit="/ 2,650 kcal"
          subtitle="Protein: 145g / 180g"
          trend={{ value: "On Track", positive: true }}
          icon={<Flame className="h-6 w-6 text-athloniq-amber" />}
        />
        <StatCard
          title="Weekly Volume Load"
          value="38.5"
          unit="k kg"
          subtitle="4 of 5 sessions logged"
          trend={{ value: "+12%", positive: true }}
          icon={<Zap className="h-6 w-6 text-athloniq-violet" />}
          glow="violet"
        />
      </div>

      {/* Split Section: Today's Protocol & AI Recommendation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Prescribed Session */}
        <Card className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-athloniq-cyan uppercase tracking-wider">
                Prescribed Today
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Upper Body Hypertrophy & Density (Day 3)
              </h3>
            </div>
            <Badge variant="cyan">60-75 MIN</Badge>
          </div>

          <div className="space-y-3">
            {[
              {
                name: "Incline Dumbbell Press",
                sets: "4 sets × 8-10 reps",
                target: "36 kg (+2 kg Overload Target)",
                rpe: "@ RPE 8.5",
              },
              {
                name: "Barbell Pendlay Row",
                sets: "4 sets × 6-8 reps",
                target: "95 kg",
                rpe: "@ RPE 8.0",
              },
              {
                name: "Dumbbell Lateral Raise",
                sets: "3 sets × 12-15 reps",
                target: "14 kg (Myo-reps on set 3)",
                rpe: "@ RPE 9.5",
              },
              {
                name: "Triceps Rope Pushdown",
                sets: "3 sets × 12 reps",
                target: "35 kg",
                rpe: "@ RPE 9.0",
              },
            ].map((exercise, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-100 text-sm">
                    {exercise.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {exercise.sets} • {exercise.target}
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-athloniq-cyan bg-athloniq-cyan/10 px-2 py-1 rounded-md">
                  {exercise.rpe}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("workouts")}
            >
              View Full Prescription <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* AI Performance Insight */}
        <Card glow="violet" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-athloniq-violet/20 flex items-center justify-center text-athloniq-violet border border-athloniq-violet/30">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">AI Coach Live Intel</h4>
              <p className="text-[11px] text-slate-400">Context: HRV 58ms (+12%)</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 p-4 border border-athloniq-violet/20 text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              "Your parasympathetic recovery is at a 14-day high. Today is an optimal window to attempt progressive overload on the <strong>Incline DB Press</strong>.
            </p>
            <p>
              Target 36kg dumbbells for 8 clean reps on Set 1 with 3 seconds eccentric control."
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-between"
              onClick={() => onNavigate("coach")}
            >
              <span>Ask AI Coach</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
