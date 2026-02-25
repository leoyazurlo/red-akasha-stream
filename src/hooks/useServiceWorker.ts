import { useEffect, useState } from 'react';
import { notifySuccess, notifyError } from '@/lib/notifications';

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

    // vite-plugin-pwa handles SW registration automatically.
    // We just track the current registration state.
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
      notifySuccess('Caché limpiado', 'Se ha limpiado el caché correctamente');
      setState((prev) => ({ ...prev, cacheSize: 0 }));
      return true;
    } catch {
      notifyError('Error al limpiar caché');
      return false;
    }
  };

  const updateServiceWorker = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      notifySuccess('Service Worker actualizado');
    }
  };

  const getCacheSize = async () => {
    try {
      const keys = await caches.keys();
      let total = 0;
      for (const key of keys) {
        const cache = await caches.open(key);
        const entries = await cache.keys();
        total += entries.length;
      }
      setState((prev) => ({ ...prev, cacheSize: total }));
    } catch {
      // ignore
    }
  };

  return {
    ...state,
    clearCache,
    updateServiceWorker,
    refreshCacheSize: getCacheSize,
  };
};