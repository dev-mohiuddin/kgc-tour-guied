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
        console.log(`[gemini] primary model failed, succeeded with fallback: ${model}`);
      }
      return response.text;
    } catch (error) {
      const msg = error?.message || '';
      const status = error?.status || error?.code;
      const isRetryable = status === 503 || status === 429 || status === 404 ||
        msg.includes('503') || msg.includes('429') || msg.includes('404') || msg.includes('not found');
      console.warn(`[gemini] ${model} failed (${status || msg.slice(0, 80)}), trying next fallback...`);
      lastError = error;
      if (isRetryable) continue;
      throw error;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

export async function getPlaceInfo(placeName, district, language = 'en') {
  const isBn = language === 'bn';
  const prompt = isBn
    ? `আপনি একজন বাংলাভাষী ট্যুর গাইড। নিচের স্থানটি সম্পর্কে বিস্তারিত তথ্য বাংলায় লিখুন। উত্তরটি ৩টি অংশে লিখুন: ১. ইতিহাস ও গুরুত্ব, ২. মূল আকর্ষণ, ৩. প্রবেশ মূল্য ও দেখার সেরা সময়। মার্কডাউন ফরম্যাট ব্যবহার করুন।

স্থান: ${placeName}
জেলা: ${district}

শুধুমাত্র বাংলা ভাষায় উত্তর দিন।`
    : `You are an English-speaking travel guide. Provide detailed information about the following place. Write 3 sections: 1. History & Importance, 2. Key attractions, 3. Entry fee and best time to visit. Use Markdown.

Place: ${placeName}
District: ${district}

CRITICAL: Write your ENTIRE response in English only. Do NOT use Bengali.`;

  return generateWithFallback(prompt);
}

export async function getPopupDescription(placeName, district, language = 'en') {
  const isBn = language === 'bn';
  const prompt = isBn
    ? `আপনি একজন বাংলাভাষী ট্যুর গাইড। নিচের স্থানটি সম্পর্কে ২-৩ লাইনের সংক্ষিপ্ত বিবরণ বাংলায় লিখুন।

স্থান: ${placeName}
জেলা: ${district}

শুধুমাত্র বাংলা ভাষায় উত্তর দিন।`
    : `You are an English-speaking tour guide. Give a 2-3 sentence description of the following place in English.

Place: ${placeName}
District: ${district}

CRITICAL: Write in English only. Do NOT use Bengali.`;

  return generateWithFallback(prompt);
}

export async function getNearbyRecommendations(placeName, district, language = 'en') {
  const isBn = language === 'bn';
  const prompt = isBn
    ? `আপনি একজন বাংলাভাষী ট্যুর গাইড। নিচের স্থানটির আশেপাশে ৫-১০ কিমির মধ্যে কী কী দর্শনীয় স্থান ও খাবারের দোকান আছে? ৫টি আইটেমের তালিকা বাংলায় দিন।

স্থান: ${placeName}
জেলা: ${district}

শুধুমাত্র বাংলা ভাষায় উত্তর দিন।`
    : `You are an English-speaking tour guide. What nearby attractions and food spots are within 5-10km of the following place? List 5 items in English.

Place: ${placeName}
District: ${district}

CRITICAL: Write in English only. Do NOT use Bengali.`;

  return generateWithFallback(prompt);
}
