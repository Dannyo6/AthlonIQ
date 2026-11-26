import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Registers unsaved Activity Log form edits with UnsavedWorkContext.
 * Automatically clears dirty status on submit, cancel, or unmount.
 */
export function useActivityFormDirty(isDirty: boolean): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty("activity-log-form", isDirty, "Activity Log");
    return () => {
      setFormDirty("activity-log-form", false);
    };
  }, [isDirty, setFormDirty]);
}
