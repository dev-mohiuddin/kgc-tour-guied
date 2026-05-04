/**
 * Map Provider — Google Places API (server-side proxy).
 * Returns data in UnifiedPlace format.
 */
import { fetchNearbyPlaces as googleNearby, fetchPlacesByText as googleText } from './google-provider';

export async function fetchNearbyPlaces(lat, lng, radius = 10000) {
  return googleNearby(lat, lng, radius);
}

export async function fetchPlacesByText(query) {
  return googleText(query);
}

/**
 * Geocode a place name (Nominatim, free, no key needed).
 */
export async function geocodePlace(placeName) {
  const q = encodeURIComponent(`${placeName}, Bangladesh`);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
    headers: { 'User-Agent': 'KGC-Smart-Voyager/2.0' },
  });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const d = await res.json();
  if (!d.length) throw new Error(`Location not found: ${placeName}`);
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
}
