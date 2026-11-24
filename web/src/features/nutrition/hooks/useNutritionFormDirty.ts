import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Reusable hook for registering unsaved form dirty state with the UnsavedWorkContext.
 * Automatically clears dirty state when unmounted or when active condition changes.
 */
export function useNutritionFormDirty(
  formId: string,
  isDirty: boolean,
  label: string
): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty(formId, isDirty, label);
    return () => {
      setFormDirty(formId, false);
    };
  }, [formId, isDirty, label, setFormDirty]);
}
