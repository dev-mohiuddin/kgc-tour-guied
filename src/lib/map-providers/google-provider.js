import { fromGoogle } from './unified-adapter';

/**
 * Google Places Provider — ALL calls go through the server-side API route.
 * This avoids browser extension interference and keeps the API key secure.
 */

export async function fetchNearbyPlaces(lat, lng, radius = 10000) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(Math.min(radius, 50000)),
    type: 'nearby',
    provider: 'google',
  });
  return fetchResults(`/api/places-search?${params}`);
}

export async function fetchPlacesByText(query) {
  const params = new URLSearchParams({
    query,
    type: 'text',
    provider: 'google',
  });
  return fetchResults(`/api/places-search?${params}`);
}

async function fetchResults(url) {
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown');
    throw new Error(`Server error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'Search failed');
  }

  // API route already applies `fromGoogle` adapter, so data is unified
  return json.data || [];
}
