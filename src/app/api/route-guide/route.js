import { NextResponse } from 'next/server'
import { getRouteGuide } from '@/lib/gemini'

function generateFallbackGuide (
  placeNames,
  districts,
  totalDistance,
  totalDuration
) {
  const hours = Math.round(totalDuration / 60)
  const distance = totalDistance

  return `## 🗺️ রুট ওভারভিউ

আপনার যাত্রাপথটি ${districts.join(
    ', '
  )} জেলার ${placeNames} এলাকা পরিভ্রমণ করবে। মোট দূরত্ব প্রায় ${distance} কিমি এবং সময় লাগবে প্রায় ${hours} ঘন্টা।

## ⏰ যাত্রার সেরা সময়

সকাল ৬-৭টার মধ্যে রওনা দেওয়ার চেষ্টা করুন। এতে করে ট্রাফিক এড়ানো যাবে এবং দিনের আলোতে নিরাপদে ভ্রমণ করা যাবে।

## ⛽ জ্বালানি ও খাবারের পরামর্শ

- দীর্ঘ পথের আগে গাড়ির জ্বালানি ট্যাংক পূর্ণ করে নিন
- পথে বড় শহরগুলোতে খাওয়ার জন্য থামুন
- পর্যাপ্ত পানি ও শুকনো খাবার সাথে রাখুন

## 🚗 ভ্রমণ টিপস

১. বাংলাদেশের সড়কে যাতায়াতের সময় ধৈর্য ধরুন এবং সতর্ক থাকুন
২. জরুরি প্রয়োজনে সাথে ন্যাশনাল আইডি ও গাড়ির কাগজপত্র রাখুন
৩. যাত্রা শুরু করার আগে গাড়ির টায়ার, ব্রেক ও ইঞ্জিন চেক করে নিন

## 🌤️ মৌসুমী বিবেচনা

বর্ষাকালে (জুন-অক্টোবর) সড়কে পানি জমে থাকতে পারে, তাই সতর্ক থাকুন। শীতকালে (নভেম্বর-ফেব্রুয়ারি) ভ্রমণের জন্য সবচেয়ে উপযুক্ত সময়।`
}

export async function POST (request) {
  try {
    const body = await request.json()
    const { places, totalDistance, totalDuration } = body

    if (!places || places.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 places required' },
        { status: 400 }
      )
    }

    const placeNames = places
      .map(p => p.name?.en || p.name?.bn || '')
      .join(', ')
    const districts = [
      ...new Set(
        places.map(p => p.district?.en || p.district?.bn || '').filter(Boolean)
      )
    ]

    try {
      const guide = await getRouteGuide(
        placeNames,
        districts,
        totalDistance,
        totalDuration,
        'bn'
      )
      return NextResponse.json({
        success: true,
        data: { content: guide, isFallback: false }
      })
    } catch (aiError) {
      const msg = aiError?.message || JSON.stringify(aiError)
      const isQuotaError =
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('rate limit')

      if (isQuotaError) {
        console.warn('[route-guide] AI quota exceeded, using fallback guide')
        return NextResponse.json({
          success: true,
          data: {
            content: generateFallbackGuide(
              placeNames,
              districts,
              totalDistance,
              totalDuration
            ),
            isFallback: true
          }
        })
      }
      throw aiError
    }
  } catch (error) {
    console.error('Route guide API error:', error.message || error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate route guide'
      },
      { status: 500 }
    )
  }
}
