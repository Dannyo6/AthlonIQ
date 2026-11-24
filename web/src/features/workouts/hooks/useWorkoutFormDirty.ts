import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Reusable hook for registering unsaved workout form dirty state with UnsavedWorkContext.
 * Automatically clears dirty state when unmounted.
 */
export function useWorkoutFormDirty(isDirty: boolean): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty("workout-session", isDirty, "Workout Session");
    return () => {
      setFormDirty("workout-session", false);
    };
  }, [isDirty, setFormDirty]);
}
