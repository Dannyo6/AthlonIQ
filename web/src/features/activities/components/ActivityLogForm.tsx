import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ActivityType, BadmintonFormat } from "@/types";
import { PaceResult } from "@/lib/calculations";
import { Plus, Zap } from "lucide-react";
import { BADMINTON_FORMATS, CALISTHENICS_SKILLS, EFFORT_LABELS } from "../constants";
import { ActivitySportSelector } from "./ActivitySportSelector";

interface ActivityLogFormProps {
  activeMode: ActivityType;
  logDate: string;
  duration: string;
  effort: number | null;
  notes: string;
  distance: string;
  matchFormat: BadmintonFormat;
  skill: string;
  progressionLevel: string;
  setsCount: string;
  repsOrHold: string;
  livePace: PaceResult | null;
  validationError: string | null;
  onModeChange: (mode: ActivityType) => void;
  onLogDateChange: (val: string) => void;
  onDurationChange: (val: string) => void;
  onEffortChange: (val: number | null) => void;
  onNotesChange: (val: string) => void;
  onDistanceChange: (val: string) => void;
  onMatchFormatChange: (val: BadmintonFormat) => void;
  onSkillChange: (val: string) => void;
  onProgressionLevelChange: (val: string) => void;
  onSetsCountChange: (val: string) => void;
  onRepsOrHoldChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ActivityLogForm: React.FC<ActivityLogFormProps> = ({
  activeMode,
  logDate,
  duration,
  effort,
  notes,
  distance,
  matchFormat,
  skill,
  progressionLevel,
  setsCount,
  repsOrHold,
  livePace,
  validationError,
  onModeChange,
  onLogDateChange,
  onDurationChange,
  onEffortChange,
  onNotesChange,
  onDistanceChange,
  onMatchFormatChange,
  onSkillChange,
  onProgressionLevelChange,
  onSetsCountChange,
  onRepsOrHoldChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <Card spotlight className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-athloniq-border pb-3 gap-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-athloniq-lime" /> Log New Activity
        </h3>
        <ActivitySportSelector activeMode={activeMode} onSelectMode={onModeChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="activity-log-date" className="text-xs text-slate-400 font-medium">
            Date
          </label>
          <input
            id="activity-log-date"
            type="date"
            value={logDate}
            onChange={(e) => onLogDateChange(e.target.value)}
            className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="activity-duration" className="text-xs text-slate-400 font-medium">
            Duration (minutes) *
          </label>
          <input
            id="activity-duration"
            type="number"
            min="1"
            step="1"
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
            placeholder="e.g. 45"
            className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
          />
        </div>
      </div>

      {activeMode === "running" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity-distance" className="text-xs text-slate-400 font-medium">
                Distance (km)
              </label>
              <input
                id="activity-distance"
                type="number"
                min="0.1"
                step="0.1"
                value={distance}
                onChange={(e) => onDistanceChange(e.target.value)}
                placeholder="e.g. 5.0"
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Live Pace</span>
              <div className="mt-1 min-h-[44px] flex items-center px-3 rounded-xl bg-athloniq-card border border-athloniq-border">
                {livePace ? (
                  <span className="text-athloniq-lime font-mono font-bold tabular-nums">
                    {livePace.paceFormatted}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm font-mono tabular-nums">
                    Not set — enter distance &amp; duration
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-athloniq-surface/50 border border-athloniq-border text-[11px] text-slate-400">
            <strong className="text-slate-300">Honesty Rule:</strong> No fabricated calories burned or
            heart rate displayed. Pace is deterministically calculated from your inputs only.
          </div>
        </div>
      )}

      {activeMode === "badminton" && (
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Match Classification</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {BADMINTON_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onMatchFormatChange(fmt)}
                  className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    matchFormat === fmt
                      ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                      : "bg-athloniq-surface text-slate-400 border border-athloniq-border hover:text-white"
                  }`}
                >
                  {fmt.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-athloniq-surface/50 border border-athloniq-border text-[11px] text-slate-400">
            <strong className="text-slate-300">Honesty Rule:</strong> No fabricated heart rate or
            calorie burn for badminton.
          </div>
        </div>
      )}

      {activeMode === "calisthenics" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="activity-skill" className="text-xs text-slate-400 font-medium">
              Skill / Movement
            </label>
            <select
              id="activity-skill"
              value={skill}
              onChange={(e) => onSkillChange(e.target.value)}
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
            >
              {CALISTHENICS_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="activity-progression" className="text-xs text-slate-400 font-medium">
                Progression Level
              </label>
              <input
                id="activity-progression"
                type="text"
                value={progressionLevel}
                onChange={(e) => onProgressionLevelChange(e.target.value)}
                placeholder="e.g. Band-assisted"
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="activity-sets" className="text-xs text-slate-400 font-medium">
                Sets
              </label>
              <input
                id="activity-sets"
                type="number"
                min="1"
                value={setsCount}
                onChange={(e) => onSetsCountChange(e.target.value)}
                placeholder="e.g. 4"
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="activity-reps-hold" className="text-xs text-slate-400 font-medium">
                Reps / Hold (s)
              </label>
              <input
                id="activity-reps-hold"
                type="number"
                min="1"
                value={repsOrHold}
                onChange={(e) => onRepsOrHoldChange(e.target.value)}
                placeholder="e.g. 8"
                className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <span className="text-xs text-slate-400 font-medium block">
          Perceived Effort (1–10){" "}
          {effort !== null ? `— ${EFFORT_LABELS[effort] ?? ""}` : "— Not set"}
        </span>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onEffortChange(effort === n ? null : n)}
              className={`min-h-[44px] min-w-[36px] px-2 rounded-lg text-xs font-mono font-bold tabular-nums transition-colors ${
                effort === n
                  ? "bg-athloniq-lime text-slate-950"
                  : "bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="activity-notes" className="text-xs text-slate-400 font-medium">
          Route / Notes (optional)
        </label>
        <input
          id="activity-notes"
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. Morning loop, Riverside park"
          className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
        />
      </div>

      {validationError && (
        <div
          role="alert"
          className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2"
        >
          {validationError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="primary" size="md" className="min-h-[44px]" onClick={onSubmit}>
          <Zap className="h-4 w-4" /> Log {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}
        </Button>
        <Button type="button" variant="outline" size="md" className="min-h-[44px]" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
};
