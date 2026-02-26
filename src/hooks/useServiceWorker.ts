/**
 * No-op Service Worker hook.
 * vite-plugin-pwa handles SW registration automatically.
 * This hook only exposes read-only state from the existing SW.
 */
import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  cacheSize: number;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    cacheSize: 0,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    // Only check existing registration, never register /sw.js
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        setState((prev) => ({ ...prev, isRegistered: true }));
      }
    });
  }, [state.isSupported]);

  const clearCache = async (): Promise<boolean> => false;
  const updateServiceWorker = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      window.location.reload();
    }
  };
  const refreshCacheSize = async () => {};

  return { ...state, clearCache, updateServiceWorker, refreshCacheSize };
};
