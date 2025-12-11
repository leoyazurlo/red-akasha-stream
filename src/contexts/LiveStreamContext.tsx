import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LiveStreamData {
  title: string;
  description: string | null;
  playbackUrl: string;
  thumbnailUrl?: string | null;
  platform?: string;
  twitchChannel?: string;
}

interface LiveStreamContextType {
  liveData: LiveStreamData | null;
  isFloating: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  closeLivePlayer: () => void;
  hasClosedManually: boolean;
}

const LiveStreamContext = createContext<LiveStreamContextType | undefined>(undefined);

export const LiveStreamProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasClosedManually, setHasClosedManually] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Detectar si estamos en el home
  const isHome = location.pathname === '/';
  const isFloating = !isHome && isPlaying && !hasClosedManually;

  // Buscar destino de streaming activo
  const { data: liveData } = useQuery({
    queryKey: ["live-stream-global"],
    queryFn: async () => {
      // Primero buscar en streams table (streams activos)
      const { data: streamData } = await supabase
        .from("streams")
        .select("id, title, description, playback_url, thumbnail_url, status")
        .eq("status", "live")
        .order("actual_start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (streamData?.playback_url) {
        return {
          title: streamData.title,
          description: streamData.description,
          playbackUrl: streamData.playback_url,
          thumbnailUrl: streamData.thumbnail_url,
          twitchChannel: extractTwitchChannel(streamData.playback_url),
        };
      }

      // Si no hay stream live, buscar destino de streaming activo
      const { data: destData } = await supabase
        .from("streaming_destinations")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      
      if (destData) {
        // La URL de reproducción es lo importante - detectamos el tipo desde ahí
        const playbackUrl = destData.playback_url || '';
        
        return {
          title: destData.name,
          description: `Transmitiendo en ${destData.platform}`,
          playbackUrl: playbackUrl,
          platform: destData.platform,
          twitchChannel: extractTwitchChannel(playbackUrl),
        };
      }
      
      return null;
    },
    refetchInterval: 30000,
  });

  // Extraer canal de Twitch de cualquier URL
  const extractTwitchChannel = (url: string): string | undefined => {
    if (!url) return undefined;
    if (url.includes('twitch.tv')) {
      const match = url.match(/twitch\.tv\/([^/?]+)/);
      return match?.[1];
    }
    return undefined;
  };

  // Auto-start cuando hay un stream disponible
  useEffect(() => {
    if (liveData?.playbackUrl && !hasAutoStarted && !hasClosedManually) {
      setIsPlaying(true);
      setHasAutoStarted(true);
    }
  }, [liveData, hasAutoStarted, hasClosedManually]);

  // Reset cuando volvemos al home
  useEffect(() => {
    if (isHome) {
      setHasClosedManually(false);
    }
  }, [isHome]);

  const closeLivePlayer = () => {
    setHasClosedManually(true);
    setIsPlaying(false);
  };

  return (
    <LiveStreamContext.Provider
      value={{
        liveData: liveData || null,
        isFloating,
        isPlaying,
        setIsPlaying,
        closeLivePlayer,
        hasClosedManually,
      }}
    >
      {children}
    </LiveStreamContext.Provider>
  );
};

export const useLiveStream = () => {
  const context = useContext(LiveStreamContext);
  if (context === undefined) {
    throw new Error('useLiveStream must be used within a LiveStreamProvider');
  }
  return context;
};
