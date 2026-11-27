import React, { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Database, RotateCcw } from "lucide-react";

interface DashboardHeaderProps {
  fullName?: string | null;
  isDemoFixtureActive: boolean;
  onLoadDemoFixture: () => void;
  onResetDemoFixture: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  fullName,
  isDemoFixtureActive,
  onLoadDemoFixture,
  onResetDemoFixture,
}) => {
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date());
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (fullName && fullName.trim().length > 0) {
      return `${timeGreeting}, ${fullName.trim()}`;
    }
    return timeGreeting;
  }, [fullName]);

  const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest tabular-nums">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span>{formattedDate}</span>
          <span className="text-slate-600" aria-hidden="true">
            •
          </span>
          <span className="text-emerald-400">Daily Overview</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {greeting}
        </h1>
      </div>

      {demoEnabled && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={isDemoFixtureActive ? "danger" : "outline"}
            size="sm"
            onClick={isDemoFixtureActive ? onResetDemoFixture : onLoadDemoFixture}
            title={
              isDemoFixtureActive
                ? "Reset back to personal state"
                : "Load 14-day populated demo data"
            }
            className="min-h-[44px] text-xs tactile-press"
          >
            {isDemoFixtureActive ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Reset Demo</span>
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5 text-athloniq-lime shrink-0" aria-hidden="true" />
                <span>14d Demo Fixture</span>
              </>
            )}
          </Button>
        </div>
      )}
    </header>
  );
};
