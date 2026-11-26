import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Registers unsaved AI Coach chat draft state with UnsavedWorkContext.
 * Clears dirty flag automatically when sent, emptied, or unmounted.
 */
export function useCoachFormDirty(isDirty: boolean): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty("coach-chat-draft", isDirty, "AI Coach Chat Draft");
    return () => {
      setFormDirty("coach-chat-draft", false);
    };
  }, [isDirty, setFormDirty]);
}
