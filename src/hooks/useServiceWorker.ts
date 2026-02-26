import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  cacheSize: number;
}

/**
 * Hook that monitors the PWA service worker managed by vite-plugin-pwa.
 * No longer registers a manual sw.js — the plugin handles registration automatically.
 */
export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    cacheSize: 0,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        setState((prev) => ({ ...prev, isRegistered: true }));
      }
    });
  }, [state.isSupported]);

  const clearCache = async (): Promise<boolean> => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      setState((prev) => ({ ...prev, cacheSize: 0 }));
      return true;
    } catch {
      return false;
    }
  };

  const updateServiceWorker = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      window.location.reload();
    }
  };

  return {
    ...state,
    clearCache,
    updateServiceWorker,
    refreshCacheSize: () => {},
  };
};
