import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { X, Users, Radio, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapSearch } from "./map-search";
import { MapHeader } from "./map-header";

// Coordinates for Latin American cities
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
  "Morón": [-58.62, -34.65],
  "Lanús": [-58.39, -34.7],
  "Quilmes": [-58.26, -34.72],
  "Avellaneda": [-58.36, -34.66],
  "San Isidro": [-58.53, -34.47],
  "Tigre": [-58.58, -34.43],
  "Lomas de Zamora": [-58.4, -34.76],
};

interface ProfileOnMap {
  id: string; // profile_details id
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  ciudad: string;
  pais: string;
  latitude: number | null;
  longitude: number | null;
  profile_type: string | null;
  bio: string | null;
}

interface SelectedProfile {
  profile: ProfileOnMap;
  lng: number;
  lat: number;
}

function getCoords(p: ProfileOnMap): [number, number] | null {
  if (p.longitude && p.latitude) return [p.longitude, p.latitude];
  const coords = CITY_COORDS[p.ciudad];
  return coords || null;
}

export function ArtistLiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [profiles, setProfiles] = useState<ProfileOnMap[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load mapbox config
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

  // Fetch all registered profiles with city
  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("profile_details")
      .select("id, user_id, display_name, avatar_url, ciudad, pais, latitude, longitude, profile_type, bio")
      .not("ciudad", "is", null)
      .not("display_name", "is", null);

    if (error || !data) return;

    setProfiles(data as ProfileOnMap[]);
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

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return profiles
      .filter((p) => p.display_name?.toLowerCase().includes(q))
      .slice(0, 8)
      .map((p) => ({
        id: p.user_id,
        name: p.display_name,
        city: `${p.ciudad}, ${p.pais}`,
        avatarUrl: p.avatar_url,
      }));
  }, [profiles, searchQuery]);

  const handleSearchSelect = useCallback((userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    if (!profile) return;
    const coords = getCoords(profile);
    if (!coords) return;
    setSelectedProfile({ profile, lng: coords[0], lat: coords[1] });
    map.current?.flyTo({ center: coords, zoom: 10, duration: 1500 });
    setSearchQuery("");
  }, [profiles]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const currentIds = new Set(profiles.map((p) => p.user_id));

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add markers for profiles
    profiles.forEach((profile) => {
      if (markersRef.current.has(profile.user_id)) return;

      const coords = getCoords(profile);
      if (!coords) return;
      const [lng, lat] = coords;

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
        setSelectedProfile({ profile, lng, lat });
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
          <p style="color:#94a3b8;margin:2px 0;font-size:12px;">${profile.ciudad}, ${profile.pais}</p>
          ${profile.profile_type ? `<p style="color:#a78bfa;font-size:11px;">${profile.profile_type}</p>` : ""}
        </div>
      `);

      el.addEventListener("mouseenter", () => marker.setPopup(popup).togglePopup());
      el.addEventListener("mouseleave", () => popup.remove());

      markersRef.current.set(profile.user_id, marker);
    });
  }, [profiles, mapReady]);

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-card/50 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground text-sm">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-card/50 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
      <MapHeader liveCount={profiles.length} />

      <div className="relative w-full h-[calc(100vh-10rem)] rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Search */}
        <MapSearch
          results={searchResults}
          onSelect={handleSearchSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Detail panel */}
        {selectedProfile && (
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
                  <AvatarImage src={selectedProfile.profile.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedProfile.profile.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedProfile.profile.display_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfile.profile.ciudad},{" "}
                    {selectedProfile.profile.pais}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedProfile(null)}
                aria-label="Cerrar panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              {selectedProfile.profile.profile_type && (
                <Badge variant="secondary" className="text-xs mb-2">
                  {selectedProfile.profile.profile_type}
                </Badge>
              )}
              {selectedProfile.profile.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedProfile.profile.bio}
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => navigate(`/circuito/perfil/${selectedProfile.profile.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Ver perfil comercial
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
    </>
  );
}
