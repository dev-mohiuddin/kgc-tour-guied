import { NextResponse } from 'next/server';
import { fromGoogle } from '@/lib/map-providers/unified-adapter';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function buildPhotoUrl(photoRef, maxWidth = 400) {
  if (!photoRef || !GOOGLE_KEY) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_KEY}`;
}

function decorateWithPhoto(item) {
  const ref = item.photos?.[0]?.photo_reference;
  return ref ? { ...item, _photoUrl: buildPhotoUrl(ref) } : item;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'nearby';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '10000';
    const query = searchParams.get('query');

    if (!GOOGLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key not configured' },
        { status: 400 }
      );
    }

    let url;
    if (type === 'text' && query) {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=tourist_attraction&key=${GOOGLE_KEY}`;
    } else if (lat && lng) {
      const q = encodeURIComponent('tourist attraction');
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&location=${lat},${lng}&radius=${Math.min(Number(radius), 50000)}&type=tourist_attraction&key=${GOOGLE_KEY}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide query or lat/lng' },
        { status: 400 }
      );
    }

    const res = await fetch(url);
    const json = await res.json();

    if (json.status === 'REQUEST_DENIED') {
      return NextResponse.json(
        { success: false, error: `Places API denied: ${json.error_message || 'Enable Places API + billing'}` },
        { status: 403 }
      );
    }

    if (json.status === 'ZERO_RESULTS') {
      return NextResponse.json({ success: true, data: [] });
    }

    if (json.status !== 'OK') {
      return NextResponse.json(
        { success: false, error: `Google API: ${json.status}${json.error_message ? ': ' + json.error_message : ''}` },
        { status: 500 }
      );
    }

    const results = (json.results || []).map(decorateWithPhoto).map(fromGoogle);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Places search error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
