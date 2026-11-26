import { useEffect } from "react";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";

/**
 * Registers unsaved Progress form edits (weigh-in & photo upload)
 * with UnsavedWorkContext and clears them cleanly on submit/cancel/unmount.
 */
export function useProgressFormDirty(
  isWeighInDirty: boolean,
  isPhotoDirty: boolean
): void {
  const { setFormDirty } = useUnsavedWork();

  useEffect(() => {
    setFormDirty("progress-weighin", isWeighInDirty, "Weigh-In Form");
    return () => {
      setFormDirty("progress-weighin", false);
    };
  }, [isWeighInDirty, setFormDirty]);

  useEffect(() => {
    setFormDirty("progress-photo", isPhotoDirty, "Progress Photo Form");
    return () => {
      setFormDirty("progress-photo", false);
    };
  }, [isPhotoDirty, setFormDirty]);
}
