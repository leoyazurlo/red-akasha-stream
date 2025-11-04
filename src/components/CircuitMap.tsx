import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-65, -15],
        zoom: 3,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add markers for profiles with map_location
      profiles.forEach((profile) => {
        if (profile.map_location) {
          // Extract coordinates from Google Maps URL if possible
          const coordsMatch = profile.map_location.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
          if (coordsMatch) {
            const [, lat, lng] = coordsMatch;
            
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="color: #000; padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${profile.display_name}</h3>
                <p style="font-size: 12px; margin-bottom: 2px;">${profile.ciudad}, ${profile.provincia || profile.pais}</p>
                <p style="font-size: 11px; color: #666;">${profile.profile_type}</p>
              </div>`
            );

            new mapboxgl.Marker({ color: '#00D9FF' })
              .setLngLat([parseFloat(lng), parseFloat(lat)])
              .setPopup(popup)
              .addTo(map.current!);
          }
        }
      });

      setShowTokenInput(false);
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, profiles]);

  if (showTokenInput) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Configura el mapa interactivo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para ver el mapa de colaboradores, ingresa tu token público de Mapbox.
              Puedes obtenerlo gratis en{' '}
              <a 
                href="https://mapbox.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mapbox-token">Token público de Mapbox</Label>
          <div className="flex gap-2">
            <Input
              id="mapbox-token"
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => setShowTokenInput(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Cargar mapa
            </button>
          </div>
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
