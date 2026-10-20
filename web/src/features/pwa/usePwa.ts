import { useState, useEffect, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwa() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [dismissedUpdate, setDismissedUpdate] = useState<boolean>(false);

  // 1. Service Worker update registration with prompt mode
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodically check for service worker updates (every 60 minutes)
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn("[PWA] Service worker registration error:", error);
    },
  });

  // 2. Detect online/offline network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Listen for browser install prompt (PWA installability)
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if running in standalone display mode
    const isStandaloneMode =
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 4. Trigger install prompt
  const installApp = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [installPrompt]);

  // 5. Dismiss update prompt (never force reload during workouts / meal entries)
  const dismissUpdate = useCallback(() => {
    setDismissedUpdate(true);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  // 6. Confirm and apply service worker update
  const applyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  // iOS detection
  const isIos =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  return {
    needRefresh: needRefresh && !dismissedUpdate,
    applyUpdate,
    dismissUpdate,
    canInstall: !!installPrompt,
    installApp,
    isInstalled,
    isIos,
    isOnline,
  };
}
