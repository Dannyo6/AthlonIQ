import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface FormDirtyState {
  isDirty: boolean;
  formName: string;
}

interface UnsavedWorkContextType {
  isDirty: boolean;
  dirtyFormName: string | null;
  setFormDirty: (formKey: string, isDirty: boolean, formName?: string) => void;
  clearAllDirty: () => void;
  confirmNavigation: (proceed: () => void) => void;
  guardedNavigate: (to: string) => void;
}

const UnsavedWorkContext = createContext<UnsavedWorkContextType | null>(null);

export const UnsavedWorkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formsState, setFormsState] = useState<Record<string, FormDirtyState>>({});
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const navigate = useNavigate();

  // Any form marked dirty?
  const dirtyEntries = Object.entries(formsState).filter(([, state]) => state.isDirty);
  const isDirty = dirtyEntries.length > 0;
  const dirtyFormName = dirtyEntries.length > 0 ? dirtyEntries[0][1].formName : null;

  const setFormDirty = useCallback((formKey: string, isDirty: boolean, formName = "Form") => {
    setFormsState((prev) => {
      if (!isDirty && !prev[formKey]) return prev;
      return {
        ...prev,
        [formKey]: { isDirty, formName },
      };
    });
  }, []);

  const clearAllDirty = useCallback(() => {
    setFormsState({});
  }, []);

  const confirmNavigation = useCallback(
    (proceed: () => void) => {
      if (isDirty) {
        setPendingAction(() => proceed);
        setShowConfirmModal(true);
      } else {
        proceed();
      }
    },
    [isDirty]
  );

  const guardedNavigate = useCallback(
    (to: string) => {
      confirmNavigation(() => {
        navigate(to);
      });
    },
    [confirmNavigation, navigate]
  );

  const handleDiscardAndProceed = useCallback(() => {
    clearAllDirty();
    setShowConfirmModal(false);
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  }, [clearAllDirty, pendingAction]);

  const handleStayOnPage = useCallback(() => {
    setShowConfirmModal(false);
    setPendingAction(null);
  }, []);

  // Browser Back/Forward guard (popstate)
  useEffect(() => {
    if (!isDirty) return;

    const onPopState = () => {
      // Re-push state so user remains on current URL while dialog shows
      window.history.pushState(null, "", window.location.href);
      setPendingAction(() => () => {
        clearAllDirty();
        window.history.back();
      });
      setShowConfirmModal(true);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isDirty, clearAllDirty]);

  return (
    <UnsavedWorkContext.Provider
      value={{
        isDirty,
        dirtyFormName,
        setFormDirty,
        clearAllDirty,
        confirmNavigation,
        guardedNavigate,
      }}
    >
      {children}

      {/* AthlonIQ Design Token Unsaved Work Guard Dialog */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none"
        >
          <div className="max-w-md w-full bg-[#12151E] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h3 id="unsaved-modal-title" className="text-base font-bold text-white">
                Unsaved Work in Progress
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You have unsaved input in {dirtyFormName || "your active form"}. Leaving this page will discard your entered data.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleStayOnPage}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
              >
                Stay & Keep Editing
              </button>
              <button
                type="button"
                onClick={handleDiscardAndProceed}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </UnsavedWorkContext.Provider>
  );
};

export const useUnsavedWork = (): UnsavedWorkContextType => {
  const context = useContext(UnsavedWorkContext);
  if (!context) {
    // Graceful fallback for components used outside provider in isolated tests
    return {
      isDirty: false,
      dirtyFormName: null,
      setFormDirty: () => {},
      clearAllDirty: () => {},
      confirmNavigation: (cb) => cb(),
      guardedNavigate: () => {},
    };
  }
  return context;
};
