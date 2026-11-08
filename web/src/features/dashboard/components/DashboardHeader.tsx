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

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-0.5">
        <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider tabular-nums">
          {formattedDate}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {greeting}
        </h1>
      </div>

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
          className="min-h-[44px] text-xs"
        >
          {isDemoFixtureActive ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </>
          ) : (
            <>
              <Database className="h-3.5 w-3.5 text-athloniq-lime" />
              <span>14d Demo Fixture</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
};

