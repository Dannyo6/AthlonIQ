import React, { useEffect, useRef, useState } from "react";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { Moon } from "lucide-react";
import { useRecoveryFormDirty } from "./hooks/useRecoveryFormDirty";
import { RecoveryReadinessSummary } from "./components/RecoveryReadinessSummary";
import { RecoveryCheckInForm } from "./components/RecoveryCheckInForm";
import { RecoveryAuditPanel } from "./components/RecoveryAuditPanel";
import { RecoveryHistoryList } from "./components/RecoveryHistoryList";

export const RecoveryView: React.FC = () => {
  const { todayCheckIn, hasTodayCheckIn, readiness, submitCheckIn } = useAthloniqState();

  const [sleepHours, setSleepHours] = useState(todayCheckIn?.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState(todayCheckIn?.sleepQuality ?? 4);
  const [soreness, setSoreness] = useState(todayCheckIn?.soreness ?? 2);
  const [fatigue, setFatigue] = useState(todayCheckIn?.fatigue ?? 2);
  const [stress, setStress] = useState<number | null>(null);
  const [stressTouched, setStressTouched] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    sleepHours: todayCheckIn?.sleepHours ?? 7.5,
    sleepQuality: todayCheckIn?.sleepQuality ?? 4,
    soreness: todayCheckIn?.soreness ?? 2,
    fatigue: todayCheckIn?.fatigue ?? 2,
    stress: null as number | null,
  }));

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const effectiveStress = stressTouched && stress !== null ? Number(stress) : null;
  const isDirty =
    Number(sleepHours) !== savedSnapshot.sleepHours ||
    Number(sleepQuality) !== savedSnapshot.sleepQuality ||
    Number(soreness) !== savedSnapshot.soreness ||
    Number(fatigue) !== savedSnapshot.fatigue ||
    effectiveStress !== savedSnapshot.stress;

  useRecoveryFormDirty(isDirty);

  const handleSave = () => {
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

  const historyEntries = hasTodayCheckIn && todayCheckIn ? [todayCheckIn] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Moon className="h-6 w-6 text-athloniq-lime" />
            Subjective Recovery &amp; Rules-Based Readiness Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic recovery assessment powered by self-reported check-in metrics. Zero fabricated wearable telemetry.
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
        todayCheckIn={todayCheckIn}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecoveryCheckInForm
          sleepHours={sleepHours}
          sleepQuality={sleepQuality}
          soreness={soreness}
          fatigue={fatigue}
          stress={stress}
          stressTouched={stressTouched}
          savedSuccess={savedSuccess}
          onSleepHoursChange={setSleepHours}
          onSleepQualityChange={setSleepQuality}
          onSorenessChange={setSoreness}
          onFatigueChange={setFatigue}
          onStressChange={(val) => {
            setStress(val);
            setStressTouched(true);
          }}
          onClearStress={() => {
            setStress(null);
            setStressTouched(false);
          }}
          onSubmit={handleSave}
        />

        <RecoveryAuditPanel hasTodayCheckIn={hasTodayCheckIn} readiness={readiness} />
      </div>

      <RecoveryHistoryList entries={historyEntries} />
    </div>
  );
};
