import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
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

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-athloniq-lime" />
          <h3 className="font-bold text-white text-base">Today's Training</h3>
        </div>
        <ProvenanceBadge
          provenance={equipmentConfirmed ? "user_confirmed" : "unconfirmed_equipment"}
        />
      </div>

      {!equipmentConfirmed ? (
        /* Unconfirmed Equipment State */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Confirm your equipment</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {unconfirmedEquipmentCount > 0
                ? `${unconfirmedEquipmentCount} home gym item(s) are unconfirmed. Confirm availability to generate load targets and auto-regulation protocols.`
                : "Confirm your home gym equipment setup to unlock planned workout sessions."}
            </p>
          </div>

          <Link
            to="/workouts"
            onClick={() => onNavigate?.("workouts")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover shadow-glow-lime transition-all active:scale-[0.98]"
          >
            <span>Confirm your equipment</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : isCompleted ? (
        /* Completed State */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-athloniq-lime/10 border border-athloniq-lime/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-athloniq-lime uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-athloniq-lime" />
                Session Completed
              </span>
              <Badge variant="lime">COMPLETED</Badge>
            </div>
            <div className="text-sm font-bold text-white">
              {completedSession?.title || "Workout Session"}
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              {completedSetsCount} sets completed • {totalVolumeKg.toLocaleString()} kg volume
            </div>
          </div>

          <Link
            to="/workouts"
            onClick={() => onNavigate?.("workouts")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
          >
            <span>View Completed Logs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Planned Session (Ready to Train) */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Planned Session</span>
              <Badge variant="lime">READY</Badge>
            </div>
            <div className="text-sm font-bold text-white">
              {trainingScope.length > 0
                ? `${trainingScope[0].toUpperCase()} Session`
                : "Strength & Hypertrophy Session"}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {trainingScope.map((scope, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-athloniq-card border border-athloniq-border text-[10px] font-mono text-slate-300 uppercase"
                >
                  {scope}
                </span>
              ))}
            </div>
            {trainingDaysPerWeek != null && (
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                Target: {trainingDaysPerWeek} training days/week
              </div>
            )}
          </div>

          <Link
            to="/workouts"
            onClick={() => onNavigate?.("workouts")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover shadow-glow-lime transition-all active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            <span>Start Today's Workout</span>
          </Link>
        </div>
      )}
    </Card>
  );
};

