import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-1.5-flash',
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
      const status = error?.status || error?.code;
      const isHighDemand = status === 503 || error?.message?.includes('503');
      const isQuota = status === 429 || error?.message?.includes('429');
      if (isHighDemand || isQuota) {
        console.warn(`[gemini] ${model} failed (${status}), trying next fallback...`);
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

export async function getPlaceInfo(placeName, district, language = 'en') {
  const prompt = language === 'bn'
    ? `বাংলাদেশের ${district} জেলার ${placeName} সম্পর্কে বিস্তারিত তথ্য দিন। ৩টি অনুচ্ছেদে লিখুন: ১. ইতিহাস ও গুরুত্ব, ২. মূল আকর্ষণ, ৩. প্রবেশ মূল্য এবং দেখার সেরা সময়। মার্কডাউন ফরম্যাটে লিখুন।`
    : `Act as an expert travel guide. Search for '${placeName}, ${district}' in Bangladesh. Give me a 3-paragraph summary: 1. History & Importance, 2. Key attractions at this spot, 3. Entry fee and best time to visit. Format: Markdown.`;

  return generateWithFallback(prompt);
}

export async function getPopupDescription(placeName, district, language = 'en') {
  const prompt = language === 'bn'
    ? `বাংলাদেশের ${district} জেলার ${placeName} সম্পর্কে ২-৩ লাইনের সংক্ষিপ্ত বর্ণনা বাংলায় দিন। ইতিহাস, বৈশিষ্ট্য ও কেন ভ্রমণ করবেন তা উল্লেখ করুন।`
    : `Give a 2-3 sentence brief description of ${placeName} in ${district}, Bangladesh. Mention what it is, why it's special, and a travel tip. Be concise.`;

  return generateWithFallback(prompt);
}

export async function getNearbyRecommendations(placeName, district, language = 'en') {
  const prompt = language === 'bn'
    ? `বাংলাদেশের ${district} জেলার ${placeName} এর আশেপাশের ৫-১০ কিমি এর মধ্যে কী কী দর্শনীয় স্থান বা বিখ্যাত খাবারের দোকান আছে? ৫টি আইটেমের তালিকা দিন।`
    : `What are the nearby attractions and famous food spots within 5-10km of ${placeName}, ${district} in Bangladesh? List 5 items.`;

  return generateWithFallback(prompt);
}
