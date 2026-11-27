import React, { useEffect, useRef, useState } from "react";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { Moon } from "lucide-react";
import { useRecoveryFormDirty } from "./hooks/useRecoveryFormDirty";
import { RecoveryReadinessSummary } from "./components/RecoveryReadinessSummary";
import { RecoveryCheckInForm } from "./components/RecoveryCheckInForm";
import { RecoveryAuditPanel } from "./components/RecoveryAuditPanel";
import { RecoveryHistoryList } from "./components/RecoveryHistoryList";
import type { RecoveryCheckIn } from "@/types";

export const RecoveryView: React.FC = () => {
  const { todayCheckIn, hasTodayCheckIn, readiness, submitCheckIn } = useAthloniqState();

  const [sleepHours, setSleepHours] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.sleepHours != null ? todayCheckIn.sleepHours : null
  );
  const [sleepQuality, setSleepQuality] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.sleepQuality != null ? todayCheckIn.sleepQuality : null
  );
  const [soreness, setSoreness] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.soreness != null ? todayCheckIn.soreness : null
  );
  const [fatigue, setFatigue] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.fatigue != null ? todayCheckIn.fatigue : null
  );
  const [stress, setStress] = useState<number | null>(() =>
    hasTodayCheckIn && todayCheckIn?.stress != null ? todayCheckIn.stress : null
  );
  const [stressTouched, setStressTouched] = useState<boolean>(() =>
    Boolean(hasTodayCheckIn && todayCheckIn?.stress != null)
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    sleepHours: hasTodayCheckIn && todayCheckIn?.sleepHours != null ? todayCheckIn.sleepHours : null,
    sleepQuality: hasTodayCheckIn && todayCheckIn?.sleepQuality != null ? todayCheckIn.sleepQuality : null,
    soreness: hasTodayCheckIn && todayCheckIn?.soreness != null ? todayCheckIn.soreness : null,
    fatigue: hasTodayCheckIn && todayCheckIn?.fatigue != null ? todayCheckIn.fatigue : null,
    stress: hasTodayCheckIn && todayCheckIn?.stress != null ? todayCheckIn.stress : null,
  }));

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const effectiveStress = stressTouched && stress !== null ? Number(stress) : null;
  const isDirty =
    sleepHours !== savedSnapshot.sleepHours ||
    sleepQuality !== savedSnapshot.sleepQuality ||
    soreness !== savedSnapshot.soreness ||
    fatigue !== savedSnapshot.fatigue ||
    effectiveStress !== savedSnapshot.stress;

  useRecoveryFormDirty(isDirty);

  const canSubmit =
    sleepHours !== null &&
    Number.isFinite(sleepHours) &&
    sleepQuality !== null &&
    soreness !== null &&
    fatigue !== null;

  const handleSave = () => {
    if (!canSubmit) return;
    const payload = {
      sleepHours: Number(sleepHours),
      sleepQuality: Number(sleepQuality),
      soreness: Number(soreness),
      fatigue: Number(fatigue),
      stress: effectiveStress,
    };
    submitCheckIn(payload);
    setSavedSnapshot(payload);
    setSavedSuccess(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "Prime") return "emerald";
    if (status === "Moderate") return "lime";
    return "rose";
  };

  const isValidHistoryEntry = (
    c: typeof todayCheckIn
  ): c is RecoveryCheckIn =>
    Boolean(
      hasTodayCheckIn &&
        c &&
        c.sleepHours !== null &&
        c.sleepQuality !== null &&
        c.soreness !== null &&
        c.fatigue !== null
    );

  const historyEntries: RecoveryCheckIn[] = isValidHistoryEntry(todayCheckIn)
    ? [todayCheckIn]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Moon className="h-6 w-6 text-athloniq-lime" aria-hidden="true" />
            Recovery &amp; Readiness Check-in
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track your sleep, soreness, and fatigue to see today&apos;s training readiness.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasTodayCheckIn && readiness ? (
            <Badge variant={getStatusBadgeVariant(readiness.status)}>
              READINESS: {readiness.status.toUpperCase()} ({readiness.readinessScore}%)
            </Badge>
          ) : (
            <Badge variant="neutral">NO CHECK-IN YET</Badge>
          )}
          <ProvenanceBadge
            provenance={hasTodayCheckIn && readiness ? "calculated_estimate" : "provisional_default"}
          />
        </div>
      </div>

      <RecoveryReadinessSummary
        hasTodayCheckIn={hasTodayCheckIn}
        readiness={readiness}
        todayCheckIn={historyEntries[0] ?? null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecoveryCheckInForm
          sleepHours={sleepHours}
          sleepQuality={sleepQuality}
          soreness={soreness}
          fatigue={fatigue}
          stress={stress}
          stressTouched={stressTouched}
          canSubmit={canSubmit}
          savedSuccess={savedSuccess}
          onSleepHoursChange={setSleepHours}
          onSleepQualityChange={setSleepQuality}
          onSorenessChange={setSoreness}
          onFatigueChange={setFatigue}
          onStressChange={(val) => {
            setStressTouched(true);
            setStress(val);
          }}
          onClearStress={() => {
            setStressTouched(false);
            setStress(null);
          }}
          onSubmit={handleSave}
        />

        <RecoveryAuditPanel hasTodayCheckIn={hasTodayCheckIn} readiness={readiness} />
      </div>

      <RecoveryHistoryList entries={historyEntries} />
    </div>
  );
};
