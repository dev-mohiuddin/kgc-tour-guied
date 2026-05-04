import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';

export async function GET(request, { params }) {
  try {
    const conn = await dbConnect();
    
    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Database not connected. Please set MONGODB_URI in .env.local' },
        { status: 503 }
      );
    }

    const { id } = await params;

    const place = await Place.findById(id).lean();

    if (!place) {
      return NextResponse.json(
        { success: false, error: 'Place not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: place });
  } catch (error) {
    console.error('Error fetching place:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch place' },
      { status: 500 }
    );
  }
}
