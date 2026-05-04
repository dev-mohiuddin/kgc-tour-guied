import { NextResponse } from 'next/server';

// Haversine distance in km
function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest-neighbor TSP
function tspNearestNeighbor(places) {
  const n = places.length;
  if (n <= 2) return { order: places.map((_, i) => i), totalDist: 0, legDistances: [] };

  // Try starting from each place, pick best
  let bestOrder = [];
  let bestTotal = Infinity;
  let bestLegs = [];

  for (let start = 0; start < Math.min(n, 5); start++) {
    const visited = new Set([start]);
    const order = [start];
    let total = 0;
    const legs = [];

    while (order.length < n) {
      const last = order[order.length - 1];
      let nearest = -1;
      let minDist = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited.has(j)) {
          const d = distance(
            places[last].lat, places[last].lng,
            places[j].lat, places[j].lng
          );
          if (d < minDist) { minDist = d; nearest = j; }
        }
      }

      if (nearest >= 0) {
        visited.add(nearest);
        order.push(nearest);
        legs.push({
          from: last, to: nearest,
          distance: minDist.toFixed(1),
          duration: Math.round(minDist / 0.833), // ~50 km/h avg speed in Bangladesh
        });
        total += minDist;
      } else break;
    }

    if (total < bestTotal) {
      bestTotal = total;
      bestOrder = order;
      bestLegs = legs;
    }
  }

  return {
    order: bestOrder,
    totalDistance: bestTotal.toFixed(1),
    totalDuration: Math.round(bestTotal / 0.833),
    legDistances: bestLegs,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { places } = body;

    if (!places || !Array.isArray(places) || places.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 places with coordinates are required' },
        { status: 400 }
      );
    }

    // Filter out places with invalid coordinates
    const valid = places.filter(p => p.lat != null && p.lng != null);
    if (valid.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          optimizedOrder: valid.map((_, i) => i),
          reorderedPlaces: valid,
          totalDistance: 'N/A',
          totalDuration: 0,
          legDistances: [],
          message: 'Need valid coordinates for optimization',
        },
      });
    }

    const result = tspNearestNeighbor(valid);

    const reordered = result.order.map(i => ({
      ...valid[i],
      name: valid[i].name || 'Unknown',
    }));

    return NextResponse.json({
      success: true,
      data: {
        optimizedOrder: result.order,
        reorderedPlaces: reordered,
        totalDistance: result.totalDistance,
        totalDuration: result.totalDuration,
        legDistances: result.legDistances,
      },
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
