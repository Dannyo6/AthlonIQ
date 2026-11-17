import React from "react";
import { Utensils, ChevronLeft, ChevronRight, Calendar, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resolveDateInTimezone, isValidTimezone } from "@/lib/weeklyConsistency";

interface NutritionDateNavProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  timezone?: string | null;
  onOpenPhotoModal: () => void;
  onToggleAddPanel: () => void;
  showAddPanel: boolean;
}

export const NutritionDateNav: React.FC<NutritionDateNavProps> = ({
  selectedDate,
  onDateChange,
  timezone,
  onOpenPhotoModal,
  onToggleAddPanel,
}) => {
  const activeTimezone = isValidTimezone(timezone) ? timezone!.trim() : "Asia/Kolkata";
  const todayInTimezone = resolveDateInTimezone(undefined, activeTimezone);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
    onDateChange(prev.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
    onDateChange(next.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    onDateChange(todayInTimezone);
  };

  const isToday = selectedDate === todayInTimezone;

  // Format date in athlete's timezone
  const formattedDate = (() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(dt);
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="flex flex-col gap-4 border-b border-athloniq-border pb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Utensils className="h-6 w-6 text-athloniq-lime" />
            Indian Nutrition & Energy Balance
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Verified Indian & athletic food catalog, deterministic macro tracking, and confirmed-entry guardrail.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenPhotoModal}
            className="min-h-[44px] border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-white bg-purple-500/10 gap-1.5"
          >
            <Camera className="h-4 w-4 text-purple-400" />
            <span>Analyze Photo</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onToggleAddPanel}
            className="min-h-[44px] gap-1.5"
          >
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-athloniq-card border border-athloniq-border">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handlePrevDay}
            aria-label="Previous day"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold font-mono tabular-nums transition-colors ${
              isToday
                ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                : "bg-athloniq-surface text-slate-300 border border-athloniq-border hover:text-white"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            aria-label="Next day"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-athloniq-surface border border-athloniq-border min-h-[44px]">
            <Calendar className="h-4 w-4 text-athloniq-lime" />
            <span className="text-sm font-bold text-white font-mono tabular-nums">
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider hidden md:inline">
            {activeTimezone}
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="min-h-[44px] bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
          />
        </div>
      </div>
    </div>
  );
};
