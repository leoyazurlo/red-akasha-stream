import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { X, Users, Radio, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapLegend, ARTIST_TYPE_CONFIG } from "./map-legend";
import { MapSearch } from "./map-search";
import { MapHeader } from "./map-header";

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
    artist_type?: string;
  };
}

interface SelectedStream {
  stream: LiveStream;
  lng: number;
  lat: number;
}

function getStreamCoords(profile: LiveStream["profile"]): [number, number] | null {
  if (!profile) return null;
  if (profile.longitude && profile.latitude) return [profile.longitude, profile.latitude];
  const coords = CITY_COORDS[profile.ciudad];
  return coords || null;
}

export function ArtistLiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<SelectedStream | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
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
          if (dbToken) setToken(dbToken);
        }
      } catch {
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

    const streamerIds = [...new Set(data.map((s) => s.streamer_id))];
    const { data: profiles } = await supabase
      .from("profile_details")
      .select("user_id, display_name, avatar_url, ciudad, pais, latitude, longitude")
      .in("user_id", streamerIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Also fetch artist_type from artists table
    const { data: artists } = await supabase
      .from("artists")
      .select("user_id, artist_type")
      .in("user_id", streamerIds);

    const artistTypeMap = new Map(artists?.map((a) => [a.user_id, a.artist_type]) || []);

    const streamsWithProfiles: LiveStream[] = data.map((s) => {
      const profile = profileMap.get(s.streamer_id) as LiveStream["profile"];
      return {
        ...s,
        profile: profile
          ? { ...profile, artist_type: artistTypeMap.get(s.streamer_id) || undefined }
          : undefined,
      };
    });

    setLiveStreams(streamsWithProfiles);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-60, -15],
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

  useEffect(() => { fetchLiveStreams(); }, [fetchLiveStreams]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("live-map-streams")
      .on("postgres_changes", { event: "*", schema: "public", table: "streams", filter: "status=eq.live" }, () => fetchLiveStreams())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "streams" }, (payload) => {
        if (payload.new && (payload.new as any).status !== "live") {
          setLiveStreams((prev) => prev.filter((s) => s.id !== (payload.new as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLiveStreams]);

  // Filtered streams
  const filteredStreams = useMemo(() => {
    if (activeFilters.size === 0) return liveStreams;
    return liveStreams.filter((s) => s.profile?.artist_type && activeFilters.has(s.profile.artist_type));
  }, [liveStreams, activeFilters]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return filteredStreams
      .filter((s) => s.profile?.display_name?.toLowerCase().includes(q))
      .map((s) => ({
        id: s.id,
        name: s.profile!.display_name,
        city: `${s.profile!.ciudad}, ${s.profile!.pais}`,
        avatarUrl: s.profile!.avatar_url,
      }));
  }, [filteredStreams, searchQuery]);

  // Stream type counts for legend
  const streamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveStreams.forEach((s) => {
      const type = s.profile?.artist_type;
      if (type) counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [liveStreams]);

  const handleToggleFilter = useCallback((type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleSearchSelect = useCallback((streamId: string) => {
    const stream = liveStreams.find((s) => s.id === streamId);
    if (!stream?.profile) return;
    const coords = getStreamCoords(stream.profile);
    if (!coords) return;
    setSelectedStream({ stream, lng: coords[0], lat: coords[1] });
    map.current?.flyTo({ center: coords, zoom: 10, duration: 1500 });
    setSearchQuery("");
  }, [liveStreams]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const visibleIds = new Set(filteredStreams.map((s) => s.id));

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    filteredStreams.forEach((stream) => {
      if (markersRef.current.has(stream.id)) return;

      const profile = stream.profile;
      if (!profile) return;

      const coords = getStreamCoords(profile);
      if (!coords) return;
      const [lng, lat] = coords;

      const typeConfig = ARTIST_TYPE_CONFIG[profile.artist_type || ""] || { color: "hsl(270 70% 55%)" };

      const el = document.createElement("div");
      el.className = "live-artist-marker";
      el.innerHTML = `
        <div class="marker-pulse" style="background: ${typeConfig.color}33;"></div>
        <div class="marker-avatar" style="border-color: ${typeConfig.color}; box-shadow: 0 0 20px ${typeConfig.color}66;">
          <img src="${profile.avatar_url || "/placeholder.svg"}" alt="${profile.display_name}" />
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedStream({ stream, lng, lat });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);

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
  }, [filteredStreams, mapReady]);

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
            El token de Mapbox debe configurarse desde el panel de administración<br />
            (Configuración → Mapa).
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MapHeader liveCount={liveStreams.length} />

      <div className="relative w-full h-[calc(100vh-10rem)] rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Search */}
        <MapSearch
          results={searchResults}
          onSelect={handleSearchSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* View all streams */}
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

        {/* Legend + filters */}
        <MapLegend
          activeFilters={activeFilters}
          onToggleFilter={handleToggleFilter}
          streamCounts={streamCounts}
        />

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
                aria-label="Cerrar panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-1">{selectedStream.stream.title}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="destructive" className="text-xs">
                  <Radio className="h-3 w-3 mr-1" /> EN VIVO
                </Badge>
                {selectedStream.stream.profile?.artist_type && (
                  <Badge variant="secondary" className="text-xs">
                    {ARTIST_TYPE_CONFIG[selectedStream.stream.profile.artist_type]?.label ||
                      selectedStream.stream.profile.artist_type}
                  </Badge>
                )}
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

            <Button className="w-full" onClick={() => navigate("/on-demand")}>
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
            animation: marker-pulse-anim 2s ease-out infinite;
          }
          .marker-avatar {
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 3px solid;
            overflow: hidden;
            background: hsl(240 12% 10%);
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
    </>
  );
}
