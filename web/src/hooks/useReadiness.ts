/**
 * Hook to access and record daily athlete recovery check-in and rules-based readiness.
 * Zero fabricated wearable metrics (no mock HRV, nocturnal pulse, or sleep stages).
 */

import { useAthloniqState } from "./useAthloniqState";

export function useReadiness() {
  const { todayCheckIn, readiness, submitCheckIn } = useAthloniqState();

  return {
    todayCheckIn,
    readiness,
    submitCheckIn,
  };
}
