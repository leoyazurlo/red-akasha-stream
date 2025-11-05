import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress, extractCoordinates, createFullAddress, type Coordinates } from '@/lib/geocoding';
import { toast } from 'sonner';

interface CircuitMapProps {
  profiles: Array<{
    id: string;
    display_name: string;
    ciudad: string;
    pais: string;
    provincia: string | null;
    profile_type: string;
    map_location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }>;
}

export const CircuitMap = ({ profiles }: CircuitMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedCount, setGeocodedCount] = useState(0);

  // Load Google Maps JS API dynamically
  const loadGoogleMaps = (apiKey: string) => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).google?.maps) return resolve();

      const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  };

  // Obtener coordenadas del perfil (almacenadas o desde map_location)
  const getProfileCoordinates = (profile: typeof profiles[0]): Coordinates | null => {
    // Prioridad 1: Coordenadas almacenadas en la BD
    if (profile.latitude && profile.longitude) {
      return { lat: profile.latitude, lng: profile.longitude };
    }

    // Prioridad 2: Extraer de map_location si es URL
    if (profile.map_location) {
      return extractCoordinates(profile.map_location);
    }

    return null;
  };

  // Geocodificar perfiles que no tengan coordenadas
  const geocodeProfiles = async () => {
    if (!googleApiKey) return;

    setGeocoding(true);
    let count = 0;

    const profilesToGeocode = profiles.filter(
      (p) => !p.latitude && !p.longitude && !extractCoordinates(p.map_location || '')
    );

    if (profilesToGeocode.length === 0) {
      toast.info('Todos los perfiles ya tienen coordenadas');
      setGeocoding(false);
      return;
    }

    toast.info(`Geocodificando ${profilesToGeocode.length} perfiles...`);

    for (const profile of profilesToGeocode) {
      const address = createFullAddress(profile.ciudad, profile.provincia, profile.pais);
      const coords = await geocodeAddress(address, googleApiKey);

      if (coords) {
        // Actualizar en la base de datos
        const { error } = await supabase
          .from('profile_details')
          .update({
            latitude: coords.lat,
            longitude: coords.lng,
          })
          .eq('id', profile.id);

        if (!error) {
          count++;
          // Actualizar el objeto local
          profile.latitude = coords.lat;
          profile.longitude = coords.lng;
        } else {
          console.error('Error updating coordinates:', error);
        }

        // Pequeña pausa para no exceder límites de la API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setGeocodedCount(count);
    setGeocoding(false);
    
    if (count > 0) {
      toast.success(`Se geocodificaron ${count} perfiles correctamente`);
      // Recargar el mapa
      if (map.current) {
        initializeMap();
      }
    } else {
      toast.error('No se pudo geocodificar ningún perfil');
    }
  };

  // Mapeo de colores según tipo de perfil
  const getMarkerColor = (profileType: string): string => {
    const colorMap: Record<string, string> = {
      banda: '#06b6d4', // cyan
      productor: '#8b5cf6', // purple
      music_lover: '#ec4899', // pink
      promotor: '#f59e0b', // amber
      venue: '#10b981', // emerald
      recording_studio: '#ef4444', // red
    };
    return colorMap[profileType] || '#06b6d4'; // default cyan
  };

  // Crear SVG personalizado para el marcador
  const createMarkerIcon = (profileType: string): string => {
    const color = getMarkerColor(profileType);
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" 
              fill="${color}" 
              filter="url(#shadow)"/>
        <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
      </svg>
    `)}`;
  };

  const initializeMap = () => {
    if (!mapContainer.current || !map.current) return;

    const bounds = new google.maps.LatLngBounds();
    let hasAnyMarker = false;

    // Limpiar marcadores existentes si los hay
    // (En una implementación más robusta, guardaríamos referencias a los marcadores)

    profiles.forEach((profile) => {
      const coords = getProfileCoordinates(profile);
      if (!coords) return;

      const position = new google.maps.LatLng(coords.lat, coords.lng);
      const marker = new google.maps.Marker({
        position,
        map: map.current!,
        title: profile.display_name,
        icon: {
          url: createMarkerIcon(profile.profile_type),
          scaledSize: new google.maps.Size(32, 42),
          anchor: new google.maps.Point(16, 42),
        },
        animation: google.maps.Animation.DROP,
      });

      const infoHtml = `
        <div style="
          font-family: system-ui, -apple-system, sans-serif;
          padding: 16px;
          max-width: 280px;
          background: linear-gradient(135deg, hsl(180 50% 10%) 0%, hsl(180 40% 15%) 100%);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(6, 182, 212, 0.2);
          ">
            <div style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: linear-gradient(135deg, hsl(180 70% 50%), hsl(180 60% 40%));
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              font-weight: 600;
              color: white;
              flex-shrink: 0;
            ">${profile.display_name.charAt(0).toUpperCase()}</div>
            <div style="flex: 1; min-width: 0;">
              <h3 style="
                font-weight: 600;
                margin: 0 0 4px;
                font-size: 16px;
                color: hsl(180 70% 85%);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${profile.display_name}</h3>
              <span style="
                display: inline-block;
                padding: 2px 8px;
                background: rgba(6, 182, 212, 0.2);
                border: 1px solid rgba(6, 182, 212, 0.3);
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                color: hsl(180 80% 70%);
                text-transform: capitalize;
              ">${profile.profile_type.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(180 70% 60%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <p style="
                font-size: 13px;
                margin: 0;
                color: hsl(180 40% 70%);
                line-height: 1.4;
              ">${profile.ciudad}${profile.provincia ? ', ' + profile.provincia : ''}, ${profile.pais}</p>
            </div>
          </div>
          <div style="
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(6, 182, 212, 0.2);
            text-align: center;
          ">
            <a href="#" onclick="return false;" style="
              display: inline-block;
              padding: 6px 16px;
              background: linear-gradient(135deg, hsl(180 70% 50%), hsl(180 60% 40%));
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 500;
              transition: opacity 0.2s;
            " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Ver perfil</a>
          </div>
        </div>
      `;
      const infoWindow = new google.maps.InfoWindow({ content: infoHtml });
      marker.addListener('click', () => infoWindow.open({ anchor: marker, map: map.current! }));

      bounds.extend(position);
      hasAnyMarker = true;
    });

    if (hasAnyMarker) {
      map.current.fitBounds(bounds, 40);
    }
  };

  useEffect(() => {
    if (!googleApiKey || !mapContainer.current) return;

    let canceled = false;

    loadGoogleMaps(googleApiKey)
      .then(() => {
        if (canceled || !mapContainer.current) return;

        const defaultCenter = { lat: -15, lng: -65 }; // Latin America approx
        map.current = new google.maps.Map(mapContainer.current, {
          center: defaultCenter,
          zoom: 3,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        initializeMap();
        setShowKeyInput(false);
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
        toast.error('Error al cargar Google Maps');
      });

    return () => {
      canceled = true;
      map.current = null;
    };
  }, [googleApiKey, profiles, geocodedCount]);

  if (showKeyInput) {
    const profilesWithoutCoords = profiles.filter(
      (p) => !p.latitude && !p.longitude && !extractCoordinates(p.map_location || '')
    );

    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Configura el mapa interactivo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para ver el mapa de colaboradores, ingresa tu clave de Google Maps (clave de navegador restringida).
              Puedes obtenerla en{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
            {profilesWithoutCoords.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <MapPin className="w-4 h-4" />
                <span>
                  {profilesWithoutCoords.length} perfil(es) sin coordenadas serán geocodificados automáticamente
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="google-maps-key">Clave pública de Google Maps</Label>
          <div className="flex gap-2">
            <Input
              id="google-maps-key"
              type="text"
              placeholder="AIzaSy..."
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => setShowKeyInput(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Cargar mapa
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Consejo: Restringe la clave por HTTP referer (dominio) en Google Cloud para mayor seguridad.
          </p>
        </div>
      </div>
    );
  }

  const profilesNeedingGeocode = profiles.filter(
    (p) => !p.latitude && !p.longitude && !extractCoordinates(p.map_location || '')
  ).length;

  // Obtener tipos de perfil únicos para la leyenda
  const uniqueProfileTypes = Array.from(
    new Set(profiles.map((p) => p.profile_type))
  );

  const getProfileTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      banda: 'Banda',
      productor: 'Productor',
      music_lover: 'Music Lover',
      promotor: 'Promotor',
      venue: 'Venue',
      recording_studio: 'Recording Studio',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {profilesNeedingGeocode > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {profilesNeedingGeocode} perfil(es) sin coordenadas
              </p>
              <p className="text-xs text-muted-foreground">
                Geocodifica automáticamente las direcciones para mostrarlas en el mapa
              </p>
            </div>
          </div>
          <button
            onClick={geocodeProfiles}
            disabled={geocoding}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {geocoding ? 'Geocodificando...' : 'Geocodificar'}
          </button>
        </div>
      )}
      
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Leyenda de marcadores */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Tipos de perfil</h4>
          <div className="space-y-2">
            {uniqueProfileTypes.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getMarkerColor(type) }}
                />
                <span className="text-xs text-muted-foreground">
                  {getProfileTypeLabel(type)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};