import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Registers Profile Setup Form dirty status with UnsavedWorkContext.
 * Clears automatically when saved, reset to baseline, or unmounted.
 */
export function useProfileFormDirty(isDirty: boolean): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty("profile-form", isDirty, "Profile Setup Form");
    return () => {
      setFormDirty("profile-form", false);
    };
  }, [isDirty, setFormDirty]);
}
