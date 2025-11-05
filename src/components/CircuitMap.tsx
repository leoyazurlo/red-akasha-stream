import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface CircuitMapProps {
  profiles: Array<{
    id: string;
    display_name: string;
    ciudad: string;
    pais: string;
    provincia: string | null;
    profile_type: string;
    map_location?: string | null;
  }>;
}

export const CircuitMap = ({ profiles }: CircuitMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);

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

  // Extract coordinates from a Google Maps URL or plain "lat,lng" string
  const extractLatLng = (input: string): { lat: number; lng: number } | null => {
    if (!input) return null;

    // @lat,lng pattern (Google Maps share URL)
    const atMatch = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      const [, lat, lng] = atMatch;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    // q=lat,lng or ll=lat,lng
    const qMatch = input.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      const [, lat, lng] = qMatch;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    // plain "lat,lng"
    const plain = input.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
    if (plain) {
      const [, lat, lng] = plain;
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    return null;
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

        const bounds = new google.maps.LatLngBounds();
        let hasAnyMarker = false;

        profiles.forEach((profile) => {
          if (!profile.map_location) return;
          const coords = extractLatLng(profile.map_location);
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

        setShowKeyInput(false);
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
      });

    return () => {
      canceled = true;
      // No explicit destroy API for Google Maps, GC will handle it.
      map.current = null;
    };
  }, [googleApiKey, profiles]);

  if (showKeyInput) {
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

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};