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
    const isBn = language === 'bn';

    if (type === 'popup') {
      prompt = isBn
        ? `আপনি একজন বাংলাভাষী ট্যুর গাইড। নিচের স্থানটি সম্পর্কে ২-৩ লাইনের সংক্ষিপ্ত বিবরণ বাংলায় লিখুন।

স্থান: ${placeName}
জেলা: ${district}

শুধুমাত্র বাংলা ভাষায় উত্তর দিন। কোনো ইংরেজি শব্দ ব্যবহার করবেন না।`
        : `You are an English-speaking tour guide. Briefly describe the following place in 2-3 sentences in English only.

Place: ${placeName}
District: ${district}

CRITICAL: Write your ENTIRE response in English only. Do NOT use Bengali language.`;
    } else if (type === 'nearby') {
      prompt = isBn
        ? `আপনি একজন বাংলাভাষী ট্যুর গাইড। নিচের স্থানটির আশেপাশে ৫-১০ কিমির মধ্যে কী কী দর্শনীয় স্থান ও খাবারের দোকান আছে? ৫টি আইটেমের তালিকা বাংলায় দিন।

স্থান: ${placeName}
জেলা: ${district}

শুধুমাত্র বাংলা ভাষায় উত্তর দিন।`
        : `You are an English-speaking tour guide. What nearby attractions and famous food spots are within 5-10km of the following place? List 5 items with names and brief descriptions in English.

Place: ${placeName}
District: ${district}

CRITICAL: Write your ENTIRE response in English only. Do NOT use Bengali.`;
    } else {
      prompt = isBn
        ? `আপনি একজন বাংলাভাষী ট্যুর গাইড। নিচের স্থানটি সম্পর্কে বিস্তারিত তথ্য বাংলায় লিখুন। উত্তরটি ৩টি অংশে লিখুন:

১. ইতিহাস ও গুরুত্ব
২. মূল আকর্ষণ
৩. প্রবেশ মূল্য, দেখার সেরা সময় ও ব্যবহারিক তথ্য

স্থান: ${placeName}
জেলা: ${district}

মার্কডাউন ফরম্যাট ব্যবহার করুন। শুধুমাত্র বাংলা ভাষায় উত্তর দিন।`
        : `You are an English-speaking travel guide for Bangladesh. Provide detailed information about the following place in English. Format your response in 3 sections using Markdown:

1. History & Cultural Importance
2. Key Attractions & What to See
3. Practical Information - Entry fees, best time to visit, opening hours, travel tips

Place: ${placeName}
District: ${district}

CRITICAL: Your ENTIRE response MUST be written in English only. Do NOT write in Bengali/Bangla under any circumstances.`;
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
