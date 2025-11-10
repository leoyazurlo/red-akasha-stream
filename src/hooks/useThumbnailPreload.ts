import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';

interface PreloadStatus {
  isPreloading: boolean;
  preloadedCount: number;
  totalToPreload: number;
  error: string | null;
}

export const useThumbnailPreload = (enabled: boolean = true) => {
  const networkStatus = useNetworkStatus();
  const [status, setStatus] = useState<PreloadStatus>({
    isPreloading: false,
    preloadedCount: 0,
    totalToPreload: 0,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    
    // Solo precargar si:
    // 1. Está online
    // 2. Está en WiFi o tiene buena conexión
    // 3. No tiene modo ahorro de datos activado
    const shouldPreload = networkStatus.isOnline && 
                          networkStatus.isWiFi && 
                          !networkStatus.saveData;

    if (shouldPreload) {
      preloadPopularThumbnails();
    }
  }, [networkStatus.isOnline, networkStatus.isWiFi, networkStatus.saveData, enabled]);

  const preloadPopularThumbnails = async () => {
    try {
      setStatus(prev => ({ ...prev, isPreloading: true, error: null }));

      // Obtener contenido popular y reciente
      const { data: popularContent, error } = await supabase
        .from('content_uploads')
        .select('thumbnail_small, thumbnail_medium, thumbnail_large, views_count')
        .eq('status', 'approved')
        .not('thumbnail_small', 'is', null)
        .order('views_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20); // Precargar top 20

      if (error) throw error;

      if (!popularContent || popularContent.length === 0) {
        setStatus(prev => ({ ...prev, isPreloading: false }));
        return;
      }

      // Recolectar todas las URLs únicas de thumbnails
      const thumbnailUrls = new Set<string>();
      popularContent.forEach(content => {
        if (content.thumbnail_small) thumbnailUrls.add(content.thumbnail_small);
        if (content.thumbnail_medium) thumbnailUrls.add(content.thumbnail_medium);
      });

      const urlsArray = Array.from(thumbnailUrls);
      setStatus(prev => ({ ...prev, totalToPreload: urlsArray.length }));

      // Precargar thumbnails uno por uno
      let loaded = 0;
      const preloadPromises = urlsArray.map(async (url) => {
        try {
          const response = await fetch(url, {
            mode: 'no-cors',
            cache: 'force-cache',
          });
          
          if (response.ok || response.type === 'opaque') {
            loaded++;
            setStatus(prev => ({ ...prev, preloadedCount: loaded }));
          }
        } catch (error) {
          console.error('Error precargando thumbnail:', url, error);
        }
      });

      await Promise.all(preloadPromises);

      setStatus(prev => ({ 
        ...prev, 
        isPreloading: false,
        preloadedCount: loaded 
      }));

      console.log(`✅ Precargados ${loaded}/${urlsArray.length} thumbnails`);

    } catch (error: any) {
      console.error('Error en precarga de thumbnails:', error);
      setStatus(prev => ({ 
        ...prev, 
        isPreloading: false,
        error: error.message 
      }));
    }
  };

  const manualPreload = () => {
    if (networkStatus.isOnline) {
      preloadPopularThumbnails();
    }
  };

  return {
    ...status,
    manualPreload,
    canPreload: networkStatus.isOnline && networkStatus.isWiFi && !networkStatus.saveData,
  };
};