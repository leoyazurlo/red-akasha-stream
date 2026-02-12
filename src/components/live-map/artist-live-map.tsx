import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { X, Users, Radio, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock coordinates for Latin American cities
const CITY_COORDS: Record<string, [number, number]> = {
  "Buenos Aires": [-58.4, -34.6],
  "CABA": [-58.38, -34.61],
  "Córdoba": [-64.18, -31.42],
  "Rosario": [-60.65, -32.95],
  "Mendoza": [-68.84, -32.89],
  "Santiago": [-70.65, -33.45],
  "Ciudad de México": [-99.13, 19.43],
  "Bogotá": [-74.07, 4.71],
  "Lima": [-77.04, -12.05],
  "São Paulo": [-46.63, -23.55],
  "Montevideo": [-56.16, -34.9],
  "Caracas": [-66.9, 10.49],
  "Quito": [-78.52, -0.23],
  "La Paz": [-68.15, -16.5],
  "Asunción": [-57.63, -25.26],
  "Mar del Plata": [-57.55, -38.0],
  "La Plata": [-57.95, -34.92],
  "Guadalajara": [-103.35, 20.67],
  "Medellín": [-75.56, 6.25],
  "Barranquilla": [-74.78, 10.96],
  "Guayaquil": [-79.9, -2.19],
};

interface LiveStream {
  id: string;
  title: string;
  status: string;
  thumbnail_url: string | null;
  peak_viewers: number;
  streamer_id: string;
  profile?: {
    display_name: string;
    avatar_url: string | null;
    ciudad: string;
    pais: string;
    latitude: number | null;
    longitude: number | null;
  };
}

interface SelectedStream {
  stream: LiveStream;
  lng: number;
  lat: number;
}

export function ArtistLiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<SelectedStream | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [mapEnabled, setMapEnabled] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load mapbox config from platform settings
  useEffect(() => {
    const loadMapConfig = async () => {
      try {
        const { data } = await supabase
          .from("platform_payment_settings")
          .select("setting_value")
          .eq("setting_key", "platform_config")
          .single();

        if (data?.setting_value) {
          const config = data.setting_value as Record<string, unknown>;
          const dbToken = config.mapbox_token as string;
          const enabled = config.mapbox_enabled as boolean;
          if (dbToken) setToken(dbToken);
          setMapEnabled(enabled ?? false);
        }
      } catch {
        // fallback: try env var
        const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (envToken) setToken(envToken);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadMapConfig();
  }, []);

  // Fetch live streams with profile data
  const fetchLiveStreams = useCallback(async () => {
    const { data, error } = await supabase
      .from("streams")
      .select("id, title, status, thumbnail_url, peak_viewers, streamer_id")
      .eq("status", "live");

    if (error || !data) return;

    // Fetch profiles for each streamer
    const streamerIds = [...new Set(data.map((s) => s.streamer_id))];
    const { data: profiles } = await supabase
      .from("profile_details")
      .select("user_id, display_name, avatar_url, ciudad, pais, latitude, longitude")
      .in("user_id", streamerIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const streamsWithProfiles: LiveStream[] = data.map((s) => ({
      ...s,
      profile: profileMap.get(s.streamer_id) as LiveStream["profile"],
    }));

    setLiveStreams(streamsWithProfiles);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-60, -15], // Latin America center
      zoom: 3,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapInstance.on("load", () => {
      map.current = mapInstance;
      setMapReady(true);
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [token]);

  // Fetch initial data
  useEffect(() => {
    fetchLiveStreams();
  }, [fetchLiveStreams]);

  // Subscribe to realtime stream changes
  useEffect(() => {
    const channel = supabase
      .channel("live-map-streams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "streams", filter: "status=eq.live" },
        () => {
          fetchLiveStreams();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "streams" },
        (payload) => {
          if (payload.new && (payload.new as any).status !== "live") {
            // Remove stream that went offline
            setLiveStreams((prev) => prev.filter((s) => s.id !== (payload.new as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveStreams]);

  // Update markers when streams or map change
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const currentIds = new Set(liveStreams.map((s) => s.id));

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    liveStreams.forEach((stream) => {
      if (markersRef.current.has(stream.id)) return;

      const profile = stream.profile;
      if (!profile) return;

      let lng = profile.longitude;
      let lat = profile.latitude;

      // Fallback to city coords
      if (!lng || !lat) {
        const coords = CITY_COORDS[profile.ciudad];
        if (coords) {
          [lng, lat] = coords;
        } else {
          return; // No coordinates available
        }
      }

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "live-artist-marker";
      el.innerHTML = `
        <div class="marker-pulse"></div>
        <div class="marker-avatar">
          <img src="${profile.avatar_url || "/placeholder.svg"}" alt="${profile.display_name}" />
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedStream({ stream, lng: lng!, lat: lat! });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Tooltip on hover
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        className: "live-map-popup",
      }).setHTML(`
        <div style="padding:8px;font-family:inherit;">
          <strong style="color:#e2e8f0;">${profile.display_name}</strong>
          <p style="color:#94a3b8;margin:2px 0;font-size:12px;">${stream.title}</p>
          <p style="color:#f472b6;font-size:11px;">🔴 ${stream.peak_viewers} viewers</p>
        </div>
      `);

      el.addEventListener("mouseenter", () => marker.setPopup(popup).togglePopup());
      el.addEventListener("mouseleave", () => popup.remove());

      markersRef.current.set(stream.id, marker);
    });
  }, [liveStreams, mapReady]);

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-card/50 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-center p-8">
          <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground text-sm">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-card/50 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-center p-8">
          <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Mapa no disponible</h3>
          <p className="text-muted-foreground text-sm">
            El token de Mapbox debe configurarse desde el panel de administración<br/>
            (Configuración → Mapa).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-lg overflow-hidden border border-border">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Live counter */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-md border border-border rounded-lg px-4 py-2 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
        </span>
        <span className="text-sm font-medium">
          {liveStreams.length} artista{liveStreams.length !== 1 ? "s" : ""} en vivo
        </span>
      </div>

      {/* View all streams button */}
      <div className="absolute top-4 right-16 z-10">
        <Button
          variant="outline"
          size="sm"
          className="bg-card/90 backdrop-blur-md border-border"
          onClick={() => navigate("/on-demand")}
        >
          Ver todos los streams
        </Button>
      </div>

      {/* Detail panel */}
      {selectedStream && (
        <div
          className={`absolute z-20 bg-card/95 backdrop-blur-xl border border-border shadow-elegant transition-all duration-300 animate-fade-in ${
            isMobile
              ? "bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[60vh] overflow-y-auto"
              : "top-4 right-4 w-80 rounded-lg p-5"
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={selectedStream.stream.profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {selectedStream.stream.profile?.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">
                  {selectedStream.stream.profile?.display_name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedStream.stream.profile?.ciudad},{" "}
                  {selectedStream.stream.profile?.pais}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedStream(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">{selectedStream.stream.title}</p>
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="text-xs">
                <Radio className="h-3 w-3 mr-1" /> EN VIVO
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {selectedStream.stream.peak_viewers} viewers
              </span>
            </div>
          </div>

          {selectedStream.stream.thumbnail_url && (
            <div className="mb-4 rounded-md overflow-hidden aspect-video bg-muted">
              <img
                src={selectedStream.stream.thumbnail_url}
                alt={selectedStream.stream.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => navigate("/on-demand")}
          >
            <ExternalLink className="h-4 w-4 mr-2" /> Ver stream
          </Button>
        </div>
      )}

      {/* Custom marker styles */}
      <style>{`
        .live-artist-marker {
          position: relative;
          width: 48px;
          height: 48px;
          cursor: pointer;
        }
        .marker-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: hsl(270 70% 55% / 0.3);
          animation: marker-pulse-anim 2s ease-out infinite;
        }
        .marker-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid hsl(270 70% 55%);
          overflow: hidden;
          background: hsl(240 12% 10%);
          box-shadow: 0 0 20px hsl(270 70% 55% / 0.4);
        }
        .marker-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @keyframes marker-pulse-anim {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .live-map-popup .mapboxgl-popup-content {
          background: hsl(240 15% 8% / 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid hsl(240 10% 18%);
          border-radius: 0.75rem;
          padding: 0;
          box-shadow: 0 8px 32px hsl(240 20% 3% / 0.5);
        }
        .live-map-popup .mapboxgl-popup-tip {
          border-top-color: hsl(240 15% 8% / 0.95);
        }
      `}</style>
    </div>
  );
}
