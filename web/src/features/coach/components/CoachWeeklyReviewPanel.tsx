import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PwaOfflineEmptyState } from "@/features/pwa/PwaComponents";
import { UserPreferences, UserProfile, WeeklyReviewReport } from "@/types";
import {
  Bell,
  Clock,
  Compass,
  Dumbbell,
  Flame,
  Info,
  Moon,
  RefreshCw,
  Scale,
  WifiOff,
} from "lucide-react";

interface CoachWeeklyReviewPanelProps {
  isOnline: boolean;
  isLoadingReview: boolean;
  reviewError: string | null;
  weeklyReport: WeeklyReviewReport | null;
  profile: Partial<UserProfile>;
  preferences: Partial<UserPreferences>;
  notificationTestStatus: string | null;
  onRegenerate: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onTestNotification: () => void;
}

export const CoachWeeklyReviewPanel: React.FC<CoachWeeklyReviewPanelProps> = ({
  isOnline,
  isLoadingReview,
  reviewError,
  weeklyReport,
  profile,
  preferences,
  notificationTestStatus,
  onRegenerate,
  onUpdatePreferences,
  onTestNotification,
}) => {
  const notificationsEnabled = Boolean(preferences?.notificationsEnabled);
  const quietHoursStart = preferences?.quietHoursStart ?? "";
  const quietHoursEnd = preferences?.quietHoursEnd ?? "";

  return (
    <div
      role="tabpanel"
      id="coach-panel-review"
      aria-labelledby="coach-tab-review"
      className="space-y-6"
    >
      {!isOnline && <PwaOfflineEmptyState featureName="Weekly Progress Synthesizer" />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
            <span>Live Weekly Progress &amp; Priorities Synthesizer</span>
          </h2>
          <p className="text-xs text-slate-400">
            Auditable cross-domain review comparing your live nutrition, training volume, weight
            trend, and recovery.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onRegenerate}
          disabled={isLoadingReview || !isOnline}
          className="text-xs font-bold min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1.5 ${isLoadingReview ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Regenerate Review
        </Button>
      </div>

      {reviewError && (
        <Card
          role="alert"
          className="p-4 bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-amber-300 text-xs">
            <WifiOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>
              Weekly review needs a connection for live AI coaching. Displaying offline
              deterministic review from local state.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoadingReview}
            className="min-h-[44px] text-xs shrink-0 self-start sm:self-auto"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1.5 ${isLoadingReview ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Retry Review
          </Button>
        </Card>
      )}

      {weeklyReport ? (
        <div className="space-y-6">
          <Card spotlight className="border-athloniq-lime/40 bg-gradient-to-r from-athloniq-card-alt to-athloniq-dark-nav p-5">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Top 3 Suggested Priorities for Next Week
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {weeklyReport.next_week_priorities.map((priority, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border-alt flex items-start gap-3"
                >
                  <span className="h-6 w-6 rounded-lg bg-athloniq-lime/20 text-athloniq-lime font-black text-xs flex items-center justify-center shrink-0 border border-athloniq-lime/30 font-mono tabular-nums">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{priority}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
                  <span>Nutrition &amp; Protein Consistency</span>
                </h4>
                <Badge variant="lime">{weeklyReport.nutrition_consistency.protein_target_band}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-athloniq-card-alt border border-athloniq-border">
                  <span className="text-slate-400 block mb-1">Food Logging Days</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {weeklyReport.nutrition_consistency.days_logging_food} / 7
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    ({weeklyReport.nutrition_consistency.logging_consistency_pct}% consistency)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-athloniq-card-alt border border-athloniq-border">
                  <span className="text-slate-400 block mb-1">Daily Protein Target</span>
                  <span className="text-lg font-bold text-athloniq-lime font-mono tabular-nums">
                    {weeklyReport.nutrition_consistency.current_protein_target_g > 0
                      ? `${weeklyReport.nutrition_consistency.current_protein_target_g} g`
                      : "Target not set"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    Latest Confirmed: {weeklyReport.nutrition_consistency.latest_confirmed_protein_g} g
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-athloniq-card p-3 rounded-xl border border-athloniq-border">
                {weeklyReport.nutrition_consistency.summary}
              </p>
            </Card>

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Weight Trend &amp; Hydration Review</span>
                </h4>
                <Badge variant={weeklyReport.weight_trend_review.status === "ok" ? "emerald" : "amber"}>
                  {weeklyReport.weight_trend_review.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-athloniq-card-alt border border-athloniq-border">
                  <span className="text-slate-400 block mb-1">Weigh-Ins Found</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {weeklyReport.weight_trend_review.weigh_in_count}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    Latest:{" "}
                    {weeklyReport.weight_trend_review.latest_weight_kg != null
                      ? `${weeklyReport.weight_trend_review.latest_weight_kg} kg`
                      : profile.weightKg != null
                      ? `${profile.weightKg} kg`
                      : "Not set"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-athloniq-card-alt border border-athloniq-border">
                  <span className="text-slate-400 block mb-1">7-Day Rolling Trend</span>
                  <span className="text-lg font-bold text-emerald-300 font-mono tabular-nums">
                    {weeklyReport.weight_trend_review.rolling_7d_kg != null
                      ? `${weeklyReport.weight_trend_review.rolling_7d_kg} kg`
                      : "Needs 3+ Entries"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    Delta:{" "}
                    {weeklyReport.weight_trend_review.weekly_delta_kg != null
                      ? `${weeklyReport.weight_trend_review.weekly_delta_kg} kg`
                      : "N/A"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-athloniq-card p-3 rounded-xl border border-athloniq-border">
                {weeklyReport.weight_trend_review.explanation}
              </p>

              <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
                <span>{weeklyReport.weight_trend_review.disclaimer}</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-purple-400 shrink-0" aria-hidden="true" />
                  <span>Training &amp; Sports Load (Gym, Badminton, Run)</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {weeklyReport.training_and_sports_load.gym_consistency_pct}% consistency
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-athloniq-card-alt border border-athloniq-border text-center">
                  <span className="text-slate-400 block text-[11px]">Gym Sessions</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {weeklyReport.training_and_sports_load.gym_sessions_completed} /{" "}
                    {weeklyReport.training_and_sports_load.gym_sessions_target}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    {weeklyReport.training_and_sports_load.gym_total_volume_kg} kg
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-athloniq-card-alt border border-athloniq-border text-center">
                  <span className="text-slate-400 block text-[11px]">Badminton</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {weeklyReport.training_and_sports_load.badminton_sessions}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    {weeklyReport.training_and_sports_load.badminton_total_min} min
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-athloniq-card-alt border border-athloniq-border text-center">
                  <span className="text-slate-400 block text-[11px]">Running</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {weeklyReport.training_and_sports_load.running_sessions}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                    {weeklyReport.training_and_sports_load.running_total_km} km
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-athloniq-card p-3 rounded-xl border border-athloniq-border">
                {weeklyReport.training_and_sports_load.summary}
              </p>
            </Card>

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Moon className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
                  <span>Recovery &amp; Sleep Patterns</span>
                </h4>
                <Badge variant="lime" className="font-mono tabular-nums">
                  {weeklyReport.recovery_patterns.latest_status === "Not set"
                    ? "Score: Not set"
                    : `Score: ${weeklyReport.recovery_patterns.latest_readiness_score}% (${weeklyReport.recovery_patterns.latest_status})`}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-athloniq-card-alt border border-athloniq-border text-center">
                  <span className="text-slate-400 block text-[11px]">Avg Sleep</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {weeklyReport.recovery_patterns.average_sleep_hours > 0
                      ? `${weeklyReport.recovery_patterns.average_sleep_hours}h`
                      : "Not set"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-athloniq-card-alt border border-athloniq-border text-center">
                  <span className="text-slate-400 block text-[11px]">Sleep Quality</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {weeklyReport.recovery_patterns.average_sleep_quality > 0
                      ? `${weeklyReport.recovery_patterns.average_sleep_quality} / 5`
                      : "Not set"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-athloniq-card-alt border border-athloniq-border text-center">
                  <span className="text-slate-400 block text-[11px]">Soreness</span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {weeklyReport.recovery_patterns.average_soreness > 0
                      ? `${weeklyReport.recovery_patterns.average_soreness} / 5`
                      : "Not set"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-athloniq-card p-3 rounded-xl border border-athloniq-border">
                {weeklyReport.recovery_patterns.summary}
              </p>
            </Card>
          </div>

          <Card className="p-5 border-athloniq-border bg-athloniq-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
                  <span>User-Configurable Reminders &amp; Quiet Hours</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Manage evening meal alerts and protect circadian sleep baseline.
                </p>
              </div>
              <Badge variant={notificationsEnabled ? "emerald" : "neutral"}>
                {notificationsEnabled ? "NOTIFICATIONS ACTIVE" : "NOTIFICATIONS MUTED"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label htmlFor="coach-quiet-start" className="text-xs font-semibold text-slate-300">
                  Quiet Hours Start
                </label>
                <input
                  id="coach-quiet-start"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => onUpdatePreferences({ quietHoursStart: e.target.value })}
                  className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-athloniq-lime"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="coach-quiet-end" className="text-xs font-semibold text-slate-300">
                  Quiet Hours End
                </label>
                <input
                  id="coach-quiet-end"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => onUpdatePreferences({ quietHoursEnd: e.target.value })}
                  className="w-full min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-athloniq-lime"
                />
              </div>

              <div>
                <Button
                  type="button"
                  variant={notificationsEnabled ? "secondary" : "primary"}
                  size="sm"
                  onClick={onTestNotification}
                  className="w-full min-h-[44px] text-xs font-bold"
                >
                  <Bell className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Test Notification Permission
                </Button>
              </div>
            </div>

            {notificationTestStatus && (
              <p
                role="status"
                className="text-xs text-athloniq-lime bg-athloniq-lime/10 p-2.5 rounded-lg border border-athloniq-lime/20"
              >
                {notificationTestStatus}
              </p>
            )}
          </Card>
        </div>
      ) : (
        <Card role="status" className="p-8 text-center space-y-3">
          <RefreshCw
            className="h-8 w-8 text-athloniq-lime mx-auto animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-white">Synthesizing weekly review...</p>
          <p className="text-xs text-slate-400">
            Loading cross-domain analytics and verified logs.
          </p>
        </Card>
      )}
    </div>
  );
};
