import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Registers unsaved Recovery check-in edits with UnsavedWorkContext.
 * Automatically clears dirty status when reset or unmounted.
 */
export function useRecoveryFormDirty(isDirty: boolean): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty("recovery-checkin", isDirty, "Daily Recovery Check-in");
    return () => {
      setFormDirty("recovery-checkin", false);
    };
  }, [isDirty, setFormDirty]);
}
