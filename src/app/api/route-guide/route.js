import { NextResponse } from 'next/server';
import { getRouteGuide } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { places, totalDistance, totalDuration, language = 'bn' } = body;

    if (!places || places.length < 2) {
      return NextResponse.json({ success: false, error: 'At least 2 places required' }, { status: 400 });
    }

    const placeNames = places.map(p => p.name?.en || p.name?.bn || '').join(', ');
    const districts = [...new Set(places.map(p => p.district?.en || p.district?.bn || '').filter(Boolean))];

    const guide = await getRouteGuide(placeNames, districts, totalDistance, totalDuration, language);

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
