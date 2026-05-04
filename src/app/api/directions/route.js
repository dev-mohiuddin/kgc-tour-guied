import { NextResponse } from 'next/server';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const waypoints = searchParams.get('waypoints'); // pipe-separated: "lat,lng|lat,lng"
    const mode = searchParams.get('mode') || 'driving';
    const avoid = searchParams.get('avoid') || ''; // tolls|highways|ferries
    const departureTime = searchParams.get('departure_time') || 'now';

    if (!GOOGLE_KEY) {
      return NextResponse.json({ success: false, error: 'Google Maps API key not configured' }, { status: 400 });
    }

    if (!origin || !destination) {
      return NextResponse.json({ success: false, error: 'origin and destination required' }, { status: 400 });
    }

    let directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${GOOGLE_KEY}`;

    if (waypoints) {
      const waypointList = waypoints.split('|').filter(Boolean);
      if (waypointList.length > 0) {
        directionsUrl += `&waypoints=optimize:true|${waypointList.join('|')}`;
      }
    }

    if (avoid) {
      directionsUrl += `&avoid=${avoid}`;
    }

    if (departureTime === 'now') {
      directionsUrl += '&departure_time=now';
    } else if (departureTime) {
      directionsUrl += `&departure_time=${departureTime}`;
    }

    const res = await fetch(directionsUrl);
    const json = await res.json();

    if (json.status !== 'OK') {
      return NextResponse.json({
        success: false,
        error: `Directions API: ${json.status}${json.error_message ? ': ' + json.error_message : ''}`,
      }, { status: 500 });
    }

    const route = json.routes[0];
    const leg = route.legs[0];

    return NextResponse.json({
      success: true,
      data: {
        totalDistance: leg.distance?.text || '',
        totalDistanceMeters: leg.distance?.value || 0,
        totalDuration: leg.duration?.text || '',
        totalDurationSeconds: leg.duration?.value || 0,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        polyline: route.overview_polyline?.points || '',
        legs: route.legs.map((l) => ({
          distance: l.distance?.text || '',
          duration: l.duration?.text || '',
          startAddress: l.start_address,
          endAddress: l.end_address,
          steps: l.steps?.map((s) => ({
            instruction: s.html_instructions,
            distance: s.distance?.text || '',
            duration: s.duration?.text || '',
          })) || [],
        })),
        totalLegs: route.legs.length,
        waypointOrder: route.waypoint_order || [],
      },
    });
  } catch (error) {
    console.error('Directions API error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { places, mode = 'driving', avoid = '' } = body;

    if (!GOOGLE_KEY) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 400 });
    }

    if (!places || places.length < 2) {
      return NextResponse.json({ success: false, error: 'At least 2 places required' }, { status: 400 });
    }

    const origin = `${places[0].lat},${places[0].lng}`;
    const destination = `${places[places.length - 1].lat},${places[places.length - 1].lng}`;
    const waypoints = places.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');

    let directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${GOOGLE_KEY}`;

    if (waypoints) {
      directionsUrl += `&waypoints=optimize:true|${waypoints}`;
    }

    if (avoid) {
      directionsUrl += `&avoid=${avoid}`;
    }

    directionsUrl += '&departure_time=now';

    const res = await fetch(directionsUrl);
    const json = await res.json();

    if (json.status !== 'OK') {
      return NextResponse.json({
        success: false,
        error: `Directions API: ${json.status}${json.error_message ? ': ' + json.error_message : ''}`,
      }, { status: 500 });
    }

    const route = json.routes[0];
    const totalDistanceKm = ((route.legs.reduce((sum, l) => sum + (l.distance?.value || 0), 0)) / 1000).toFixed(1);
    const totalDurationMin = Math.round(route.legs.reduce((sum, l) => sum + (l.duration?.value || 0), 0) / 60);

    const legDistances = route.legs.map((l, i) => ({
      distance: ((l.distance?.value || 0) / 1000).toFixed(1),
      duration: Math.round((l.duration?.value || 0) / 60),
    }));

    // Get optimized order from waypoint_order
    const waypointOrder = route.waypoint_order || [];
    const optimizedOrder = [0, ...waypointOrder.map(i => i + 1), places.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        totalDistance: totalDistanceKm,
        totalDuration: totalDurationMin,
        legDistances,
        optimizedOrder,
        polyline: route.overview_polyline?.points || '',
        legs: route.legs.map((l, i) => ({
          distance: ((l.distance?.value || 0) / 1000).toFixed(1),
          duration: Math.round((l.duration?.value || 0) / 60),
          startAddress: l.start_address,
          endAddress: l.end_address,
          steps: (l.steps || []).slice(0, 3).map(s => ({
            instruction: s.html_instructions?.replace(/<[^>]*>/g, ''),
            distance: s.distance?.text || '',
          })),
        })),
      },
    });
  } catch (error) {
    console.error('Directions API error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
