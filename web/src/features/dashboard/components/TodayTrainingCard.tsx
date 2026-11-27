import React from "react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/ui/SectionCard";
import { SportIcon } from "@/components/ui/SportIcons";
import { Dumbbell, CheckCircle2, ArrowRight, AlertTriangle, Play } from "lucide-react";
import type { WorkoutSession } from "@/types";

interface TodayTrainingCardProps {
  equipmentConfirmed: boolean;
  unconfirmedEquipmentCount: number;
  todayWorkouts: WorkoutSession[];
  trainingDaysPerWeek?: number | null;
  trainingScope?: string[];
  onNavigate?: (tab: string) => void;
}

export const TodayTrainingCard: React.FC<TodayTrainingCardProps> = ({
  equipmentConfirmed,
  unconfirmedEquipmentCount,
  todayWorkouts,
  trainingDaysPerWeek,
  trainingScope = [],
  onNavigate,
}) => {
  const isCompleted = todayWorkouts.length > 0;
  const completedSession = isCompleted ? todayWorkouts[0] : null;

  const completedSetsCount = completedSession
    ? completedSession.sets.filter((s) => s.isCompleted).length
    : 0;

  const totalVolumeKg = completedSession
    ? completedSession.sets
        .filter((s) => s.isCompleted && !s.isBodyweight)
        .reduce((sum, s) => sum + s.reps * s.loadKg, 0)
    : 0;

  const primaryAction = !equipmentConfirmed ? (
    <Link
      to="/profile?step=equipment"
      onClick={() => onNavigate?.("profile?step=equipment")}
      className="tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover shadow-glow-lime"
    >
      <span>Confirm your equipment</span>
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  ) : isCompleted ? (
    <Link
      to="/workouts"
      onClick={() => onNavigate?.("workouts")}
      className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
    >
      <span>View Completed Logs</span>
      <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
    </Link>
  ) : (
    <Link
      to="/workouts"
      onClick={() => onNavigate?.("workouts")}
      className="tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover shadow-glow-lime"
    >
      <Play className="h-4 w-4 fill-slate-950 shrink-0" aria-hidden="true" />
      <span>Start Today&apos;s Workout</span>
    </Link>
  );

  return (
    <SectionCard
      title="Today's Training"
      icon={Dumbbell}
      tone="lime"
      provenance={equipmentConfirmed ? "user_confirmed" : "unconfirmed_equipment"}
      primaryAction={primaryAction}
    >
      {!equipmentConfirmed ? (
        <div className="surface-well p-4 rounded-xl border-amber-500/35 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>Confirm your equipment</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {unconfirmedEquipmentCount > 0
              ? `${unconfirmedEquipmentCount} home gym item(s) are unconfirmed. Confirm what you have available to unlock personalized weights and progression plans.`
              : "Confirm your home gym equipment setup to unlock planned workout sessions."}
          </p>
        </div>
      ) : isCompleted ? (
        <div className="surface-well p-4 rounded-xl border-athloniq-lime/35 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>✓ Completed today</span>
            </span>
          </div>
          <div className="font-display text-xl font-bold text-white tracking-wide">
            {completedSession?.title || "Workout Session"}
          </div>
          <div className="text-xs text-slate-300 font-mono tabular-nums">
            {completedSetsCount} sets completed • {totalVolumeKg.toLocaleString()} kg lifted
          </div>
        </div>
      ) : (
        <div className="surface-well p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center gap-2 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Up Next
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              ● Ready to train
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-white tracking-wide">
            {trainingScope.length > 0
              ? `${trainingScope[0].toUpperCase()} Session`
              : "Strength & Hypertrophy Session"}
          </div>
          {trainingScope.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {trainingScope.map((scope, idx) => {
                const lower = scope.toLowerCase();
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-athloniq-card border border-athloniq-border text-[10px] font-mono text-slate-300 uppercase"
                  >
                    {(lower === "badminton" || lower === "running") && (
                      <SportIcon sport={lower} className="h-3 w-3 text-slate-300" />
                    )}
                    {lower === "calisthenics" && (
                      <SportIcon sport="pull-up" className="h-3 w-3 text-slate-300" />
                    )}
                    <span>{scope}</span>
                  </span>
                );
              })}
            </div>
          )}
          {trainingDaysPerWeek != null && (
            <div className="text-[11px] text-slate-400 font-mono tabular-nums pt-0.5">
              Target: {trainingDaysPerWeek} training days/week
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
};
