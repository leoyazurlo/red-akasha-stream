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
    if (!state.isSupported) {
      console.log('Service Workers no están soportados en este navegador');
      return;
    }

    registerServiceWorker();
  }, [state.isSupported]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registrado:', registration);
      
      setState((prev) => ({ ...prev, isRegistered: true }));

      // Verificar si hay actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
           if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, isUpdateAvailable: true }));
              
              notifySuccess('Actualización disponible', 'Hay una nueva versión disponible. Recarga la página para actualizar.');
            }
          });
        }
      });

      // Obtener tamaño del caché
      getCacheSize();

    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  };

  const getCacheSize = async () => {
    if (!navigator.serviceWorker.controller) return;

    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data && typeof event.data.size === 'number') {
        setState((prev) => ({ ...prev, cacheSize: event.data.size }));
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2]
    );
  };

  const clearCache = async (): Promise<boolean> => {
    if (!navigator.serviceWorker.controller) {
      notifyError('Service Worker no está activo');
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.success) {
           setState((prev) => ({ ...prev, cacheSize: 0 }));
           
           notifySuccess('Caché limpiado', 'Se ha limpiado el caché de thumbnails');
           
           resolve(true);
        } else {
          resolve(false);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  };

  const updateServiceWorker = async () => {
    if (!navigator.serviceWorker.controller) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      window.location.reload();
    }
  };

  return {
    ...state,
    clearCache,
    updateServiceWorker,
    refreshCacheSize: getCacheSize,
  };
};