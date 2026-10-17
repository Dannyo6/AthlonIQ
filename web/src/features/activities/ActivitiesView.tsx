import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { calculateRunningPace } from "@/lib/calculations";
import { ActivityType, BadmintonFormat } from "@/types";
import {
  Activity,
  Plus,
  Zap,
  Trash2,
  Clock,
  MapPin,
  Filter,
} from "lucide-react";

type ActivityMode = ActivityType;

const CALISTHENICS_SKILLS = [
  "Pull-ups",
  "Parallel Bar Dips",
  "Push-ups",
  "Hanging Leg Raises",
  "L-Sit Hold",
  "Handstand Practice",
  "Muscle-up",
  "Front Lever Progression",
  "Other",
];

const EFFORT_LABELS: Record<number, string> = {
  1: "1 – Very Light",
  2: "2 – Light",
  3: "3 – Moderate",
  4: "4 – Somewhat Hard",
  5: "5 – Hard",
  6: "6 – Hard+",
  7: "7 – Very Hard",
  8: "8 – Very Hard+",
  9: "9 – Maximal",
  10: "10 – All Out",
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export const ActivitiesView: React.FC = () => {
  const { activitySessions, addActivitySession, deleteActivitySession, getWeeklyActivities } =
    useAthloniqState();

  const [activeMode, setActiveMode] = useState<ActivityMode>("running");
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [showForm, setShowForm] = useState(false);

  // Shared
  const [logDate, setLogDate] = useState(todayISO());
  const [duration, setDuration] = useState("");
  const [effort, setEffort] = useState<number | "">(7);
  const [notes, setNotes] = useState("");

  // Running
  const [distance, setDistance] = useState("");

  // Badminton
  const [matchFormat, setMatchFormat] = useState<BadmintonFormat>("singles");

  // Calisthenics
  const [skill, setSkill] = useState(CALISTHENICS_SKILLS[0]);
  const [progressionLevel, setProgressionLevel] = useState("");
  const [setsCount, setSetsCount] = useState("");
  const [repsOrHold, setRepsOrHold] = useState("");

  // Live pace calculation
  const liveKm = parseFloat(distance) || 0;
  const liveDur = parseFloat(duration) || 0;
  const livePace = useMemo(() => {
    if (activeMode === "running" && liveKm > 0 && liveDur > 0) {
      try {
        return calculateRunningPace(liveKm, liveDur);
      } catch {
        return null;
      }
    }
    return null;
  }, [activeMode, liveKm, liveDur]);

  const handleSubmit = () => {
    const dur = parseFloat(duration);
    if (!dur || dur <= 0) return;

    const base = {
      loggedDate: logDate,
      activityType: activeMode,
      durationMinutes: dur,
      perceivedEffort: effort || null,
      routeOrNotes: notes,
    };

    if (activeMode === "running") {
      const km = parseFloat(distance);
      addActivitySession({
        ...base,
        distanceKm: km > 0 ? km : null,
        paceFormatted: livePace?.paceFormatted ?? null,
      });
    } else if (activeMode === "badminton") {
      addActivitySession({ ...base, matchFormat });
    } else if (activeMode === "calisthenics") {
      addActivitySession({
        ...base,
        skillName: skill,
        progressionLevel: progressionLevel || null,
        setsCount: setsCount ? parseInt(setsCount) : null,
        repsOrHoldSec: repsOrHold ? parseInt(repsOrHold) : null,
      });
    } else {
      addActivitySession(base);
    }

    // Reset
    setDuration("");
    setDistance("");
    setNotes("");
    setEffort(7);
    setMatchFormat("singles");
    setSetsCount("");
    setRepsOrHold("");
    setProgressionLevel("");
    setShowForm(false);
  };

  const weeklyActivities = getWeeklyActivities();
  const displayActivities = filterType === "all"
    ? activitySessions
    : activitySessions.filter((s) => s.activityType === filterType);

  const weeklyCounts: Record<string, number> = {
    running: weeklyActivities.filter((s) => s.activityType === "running").length,
    badminton: weeklyActivities.filter((s) => s.activityType === "badminton").length,
    calisthenics: weeklyActivities.filter((s) => s.activityType === "calisthenics").length,
    other: weeklyActivities.filter((s) => s.activityType === "other").length,
  };

  const weeklyRunKm = weeklyActivities
    .filter((s) => s.activityType === "running" && s.distanceKm)
    .reduce((sum, s) => sum + (s.distanceKm || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Activity className="h-6 w-6 text-athloniq-lime" />
            Sports & Activity Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Running, Badminton, Calisthenics. No fabricated calorie burn or heart rate.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Log Activity
        </Button>
      </div>

      {/* Weekly Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Running", count: weeklyCounts.running, sub: `${weeklyRunKm.toFixed(1)} km`, color: "text-emerald-400" },
          { label: "Badminton", count: weeklyCounts.badminton, sub: "sessions this week", color: "text-amber-400" },
          { label: "Calisthenics", count: weeklyCounts.calisthenics, sub: "sessions this week", color: "text-athloniq-lime" },
          { label: "Other", count: weeklyCounts.other, sub: "sessions this week", color: "text-purple-400" },
        ].map(({ label, count, sub, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-[#12151E] border border-[#1E2330] text-center">
            <div className={`text-3xl font-black font-mono tabular-nums ${color}`}>{count}</div>
            <div className="text-xs font-bold text-white mt-0.5">{label}</div>
            <div className="text-[11px] text-slate-400 font-mono">{sub}</div>
          </div>
        ))}
      </div>

      {/* Log Form */}
      {showForm && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-athloniq-lime" /> Log New Activity
            </h3>
            <div className="flex items-center p-0.5 rounded-xl bg-[#181D2A] border border-[#1E2330] gap-0.5">
              {(["running", "badminton", "calisthenics", "other"] as ActivityType[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    activeMode === mode
                      ? "bg-athloniq-lime text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Date</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Duration (minutes) *</label>
              <input
                type="number" min="1" step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Mode-specific fields */}
          {activeMode === "running" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Distance (km)</label>
                  <input
                    type="number" min="0.1" step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="e.g. 5.0"
                    className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Live Pace</label>
                  <div className="mt-1 h-10 flex items-center px-3 rounded-xl bg-[#12151E] border border-[#1E2330]">
                    {livePace ? (
                      <span className="text-athloniq-lime font-mono font-bold tabular-nums">
                        {livePace.paceFormatted}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm font-mono">
                        Enter distance & duration
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#181D2A]/50 border border-[#1E2330] text-[11px] text-slate-400">
                <strong className="text-slate-300">Honesty Rule:</strong> No fabricated calories burned or heart rate displayed. Pace is deterministically calculated from your inputs only.
              </div>
            </div>
          )}

          {activeMode === "badminton" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Match Classification</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(["singles", "doubles", "free_play", "drills"] as BadmintonFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setMatchFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        matchFormat === fmt
                          ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                          : "bg-[#181D2A] text-slate-400 border border-[#1E2330] hover:text-white"
                      }`}
                    >
                      {fmt.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#181D2A]/50 border border-[#1E2330] text-[11px] text-slate-400">
                <strong className="text-slate-300">Honesty Rule:</strong> No fabricated heart rate or calorie burn for badminton.
              </div>
            </div>
          )}

          {activeMode === "calisthenics" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Skill / Movement</label>
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                >
                  {CALISTHENICS_SKILLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Progression Level</label>
                  <input
                    type="text"
                    value={progressionLevel}
                    onChange={(e) => setProgressionLevel(e.target.value)}
                    placeholder="e.g. Band-assisted"
                    className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Sets</label>
                  <input
                    type="number" min="1"
                    value={setsCount}
                    onChange={(e) => setSetsCount(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Reps / Hold (s)</label>
                  <input
                    type="number" min="1"
                    value={repsOrHold}
                    onChange={(e) => setRepsOrHold(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Effort Selector */}
          <div>
            <label className="text-xs text-slate-400 font-medium">
              Perceived Effort (1–10) {effort ? `— ${EFFORT_LABELS[effort as number] ?? ""}` : ""}
            </label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setEffort(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold tabular-nums transition-colors ${
                    effort === n
                      ? "bg-athloniq-lime text-slate-950"
                      : "bg-[#181D2A] border border-[#1E2330] text-slate-400 hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 font-medium">Route / Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning loop, Riverside park"
              className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              <Zap className="h-4 w-4" /> Log {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Activity History Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Activity History</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ActivityType | "all")}
              className="bg-[#12151E] border border-[#1E2330] rounded-lg px-2 py-1 text-xs text-white focus:border-athloniq-lime focus:outline-none"
            >
              <option value="all">All Sports</option>
              <option value="running">Running</option>
              <option value="badminton">Badminton</option>
              <option value="calisthenics">Calisthenics</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {displayActivities.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Activity className="h-12 w-12 mx-auto text-slate-600" />
            <p>No activities logged yet.</p>
          </div>
        ) : (
          [...displayActivities]
            .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
            .map((session) => (
              <Card key={session.id} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    session.activityType === "running"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : session.activityType === "badminton"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : session.activityType === "calisthenics"
                      ? "bg-athloniq-lime/10 border-athloniq-lime/30 text-athloniq-lime"
                      : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  }`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white capitalize">{session.activityType}</span>
                      {session.activityType === "badminton" && session.matchFormat && (
                        <Badge variant="amber">{session.matchFormat.replace("_", " ").toUpperCase()}</Badge>
                      )}
                      {session.activityType === "calisthenics" && session.skillName && (
                        <Badge variant="lime">{session.skillName}</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                      <span>{session.loggedDate}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {session.durationMinutes} min
                      </span>
                      {session.distanceKm && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {session.distanceKm.toFixed(1)} km
                        </span>
                      )}
                      {session.paceFormatted && (
                        <span className="text-emerald-400 font-bold">{session.paceFormatted}</span>
                      )}
                      {session.perceivedEffort && (
                        <span>RPE {session.perceivedEffort}/10</span>
                      )}
                      {session.setsCount && (
                        <span>{session.setsCount} sets × {session.repsOrHoldSec} reps/s</span>
                      )}
                    </div>
                    {session.routeOrNotes && (
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{session.routeOrNotes}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteActivitySession(session.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};
