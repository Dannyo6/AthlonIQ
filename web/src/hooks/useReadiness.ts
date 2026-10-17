import { useState } from "react";
import { DailyReadiness } from "@/types";

export function useReadiness() {
  const [readiness] = useState<DailyReadiness>({
    date: new Date().toISOString().split("T")[0],
    readinessScore: 88,
    sleepDurationHours: 7.8,
    sleepQualityScore: 91,
    hrvRmssdMs: 58,
    restingHeartRate: 48,
    sorenessScore: 2,
    status: "optimal",
  });

  return { readiness };
}
