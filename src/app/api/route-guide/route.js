import { NextResponse } from 'next/server';
import { getRouteGuide } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { places, totalDistance, totalDuration } = body;

    console.log('[route-guide] Request body:', { places: places?.length, totalDistance, totalDuration });

    if (!places || places.length < 2) {
      return NextResponse.json({ success: false, error: 'At least 2 places required' }, { status: 400 });
    }

    const placeNames = places.map(p => p.name?.en || p.name?.bn || '').join(', ');
    const districts = [...new Set(places.map(p => p.district?.en || p.district?.bn || '').filter(Boolean))];

    console.log('[route-guide] Generated prompt data:', { placeNames, districts, totalDistance, totalDuration });

    const guide = await getRouteGuide(placeNames, districts, totalDistance, totalDuration, 'bn');

    console.log('[route-guide] AI response received, length:', guide?.length);

    return NextResponse.json({
      success: true,
      data: {
        content: guide,
      },
    });
  } catch (error) {
    console.error('Route guide API error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
