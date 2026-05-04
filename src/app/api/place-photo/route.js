import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const photoRef = searchParams.get('photo_reference');
    const maxWidth = searchParams.get('maxwidth') || '400';

    if (!photoRef) {
      return NextResponse.json({ error: 'photo_reference required' }, { status: 400 });
    }

    const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!GOOGLE_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 400 });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_KEY}`;

    // Proxy: fetch the photo and return it as an image response
    const res = await fetch(photoUrl);
    if (!res.ok) {
      return NextResponse.json({ error: 'Photo fetch failed' }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Photo proxy error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
