import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';

export async function GET(request) {
  try {
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Database not connected. Please set MONGODB_URI in .env.local' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const upazila = searchParams.get('upazila');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    let query = {};

    if (district) {
      query['district.en'] = new RegExp(district, 'i');
    }

    if (upazila) {
      query['upazila.en'] = new RegExp(upazila, 'i');
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { 'name.en': new RegExp(search, 'i') },
        { 'name.bn': new RegExp(search, 'i') },
        { 'district.en': new RegExp(search, 'i') },
        { 'description.en': new RegExp(search, 'i') },
      ];
    }

    const [places, total] = await Promise.all([
      Place.find(query)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Place.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: places,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Database not connected' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const place = await Place.create(body);

    return NextResponse.json({ success: true, data: place }, { status: 201 });
  } catch (error) {
    console.error('Error creating place:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create place' },
      { status: 500 }
    );
  }
}
