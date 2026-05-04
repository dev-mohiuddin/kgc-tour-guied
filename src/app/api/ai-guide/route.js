import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
];

async function generateWithFallback(prompt) {
  let lastError;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      if (model !== FALLBACK_MODELS[0]) {
        console.log(`[ai-guide] primary model failed, succeeded with fallback: ${model}`);
      }
      return response.text;
    } catch (error) {
      const msg = error?.message || '';
      const status = error?.status || error?.code;
      const isRetryable = status === 503 || status === 429 || status === 404 ||
        msg.includes('503') || msg.includes('429') || msg.includes('404') || msg.includes('not found');
      console.warn(`[ai-guide] ${model} failed (${status || msg.slice(0, 80)}), trying next fallback...`);
      lastError = error;
      if (isRetryable) continue;
      throw error;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { placeName, district, language = 'en', type = 'info' } = body;

    if (!placeName || !district) {
      return NextResponse.json(
        { success: false, error: 'Place name and district are required' },
        { status: 400 }
      );
    }

    let prompt;
    const langForce = language === 'bn' ? 'শুধুমাত্র বাংলায় উত্তর দিন।' : 'IMPORTANT: Respond in English only, even if place names are in Bengali.';

    if (type === 'popup') {
      prompt = language === 'bn'
        ? `বাংলাদেশের ${district} জেলার ${placeName} সম্পর্কে ২-৩ লাইনের সংক্ষিপ্ত বর্ণনা বাংলায় দিন। ইতিহাস, বৈশিষ্ট্য ও কেন ভ্রমণ করবেন তা উল্লেখ করুন। ${langForce}`
        : `Give a 2-3 sentence brief description of ${placeName} in ${district}, Bangladesh. Mention what it is, why it's special, and a travel tip. Keep it concise. ${langForce}`;
    } else if (type === 'nearby') {
      prompt = language === 'bn'
        ? `বাংলাদেশের ${district} জেলার ${placeName} এর আশেপাশের ৫-১০ কিমি এর মধ্যে কী কী দর্শনীয় স্থান বা বিখ্যাত খাবারের দোকান আছে? ৫টি আইটেমের তালিকা দিন। প্রতিটি আইটেমের নাম এবং সংক্ষিপ্ত বিবরণ দিন। ${langForce}`
        : `What are the nearby attractions and famous food spots within 5-10km of ${placeName}, ${district} in Bangladesh? List 5 items with names and brief descriptions. ${langForce}`;
    } else {
      prompt = language === 'bn'
        ? `বাংলাদেশের ${district} জেলার ${placeName} সম্পর্কে বিস্তারিত তথ্য দিন। ৩টি অনুচ্ছেদে লিখুন: ১. ইতিহাস ও গুরুত্ব, ২. মূল আকর্ষণ, ৩. প্রবেশ মূল্য এবং দেখার সেরা সময়। মার্কডাউন ফরম্যাটে লিখুন। ${langForce}`
        : `Act as an expert travel guide for Bangladesh. Provide detailed information about ${placeName} in ${district} district. Format your response in 3 sections: 1. History & Cultural Importance (2-3 paragraphs), 2. Key Attractions & What to See (bullet points), 3. Practical Information - Entry fees, best time to visit, opening hours, and travel tips. Use Markdown formatting. ${langForce}`;
    }

    const text = await generateWithFallback(prompt);

    return NextResponse.json({
      success: true,
      data: {
        content: text,
        type,
        placeName,
        district,
      },
    });
  } catch (error) {
    console.error('Error generating AI content:', error.message);
    const msg = error.message?.includes('quota') || error.message?.includes('429')
      ? 'AI quota exceeded. Please try again later or check your Gemini billing plan.'
      : `Failed: ${error.message?.slice(0, 100) || 'Please try again.'}`;
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
