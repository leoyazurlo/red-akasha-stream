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
      });

      const infoHtml = `
        <div style="padding:8px;max-width:220px;">
          <h3 style="font-weight:600;margin:0 0 4px;">${profile.display_name}</h3>
          <p style="font-size:12px;margin:0 0 2px;">${profile.ciudad}, ${profile.provincia || profile.pais}</p>
          <p style="font-size:11px;color:#666;margin:0;">${profile.profile_type}</p>
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
      </div>
    </div>
  );
};