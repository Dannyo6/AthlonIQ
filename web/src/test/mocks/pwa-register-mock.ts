// Mock for virtual:pwa-register/react during testing / Vitest runs
export function useRegisterSW(_options?: {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: any) => void;
  onRegisterError?: (error: any) => void;
}) {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async (_reloadPage?: boolean) => {},
  };
}
