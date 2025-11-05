/**
 * Geocoding utility functions using Google Maps Geocoding API
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Geocodifica una dirección usando la API de Google Geocoding
 */
export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<Coordinates | null> {
  if (!address || !apiKey) return null;

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    console.warn('Geocoding failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Extrae coordenadas de una URL de Google Maps o string de coordenadas
 */
export function extractCoordinates(input: string): Coordinates | null {
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
}

/**
 * Crea una dirección completa a partir de los datos del perfil
 */
export function createFullAddress(
  ciudad: string,
  provincia: string | null,
  pais: string
): string {
  const parts = [ciudad];
  if (provincia) parts.push(provincia);
  parts.push(pais);
  return parts.join(', ');
}