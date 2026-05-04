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
  const prompt = `বাংলাদেশের ${district} জেলার ${placeName} সম্পর্কে বিস্তারিত তথ্য দাও। ৩টি অনুচ্ছেদে লেখো: ১. ইতিহাস ও গুরুত্ব, ২. মূল আকর্ষণ, ৩. প্রবেশ মূল্য এবং দেখার সেরা সময়। মার্কডাউন ফরম্যাটে লেখো। শুধুমাত্র বাংলায় উত্তর দাও।`;

  return generateWithFallback(prompt);
}

export async function getPopupDescription(placeName, district, language = 'en') {
  const langForce = language === 'bn' ? 'শুধুমাত্র বাংলায় উত্তর দিন।' : 'IMPORTANT: Respond in English only, even if place names are in Bengali.';
  const prompt = language === 'bn'
    ? `বাংলাদেশের ${district} জেলার ${placeName} সম্পর্কে ২-৩ লাইনের সংক্ষিপ্ত বর্ণনা বাংলায় দিন। ইতিহাস, বৈশিষ্ট্য ও কেন ভ্রমণ করবেন তা উল্লেখ করুন। ${langForce}`
    : `Give a 2-3 sentence brief description of ${placeName} in ${district}, Bangladesh. Mention what it is, why it's special, and a travel tip. Be concise. ${langForce}`;

  return generateWithFallback(prompt);
}

export async function getNearbyRecommendations(placeName, district, language = 'en') {
  const langForce = language === 'bn' ? 'শুধুমাত্র বাংলায় উত্তর দিন।' : 'IMPORTANT: Respond in English only, even if place names are in Bengali.';
  const prompt = language === 'bn'
    ? `বাংলাদেশের ${district} জেলার ${placeName} এর আশেপাশের ৫-১০ কিমি এর মধ্যে কী কী দর্শনীয় স্থান বা বিখ্যাত খাবারের দোকান আছে? ৫টি আইটেমের তালিকা দিন। ${langForce}`
    : `What are the nearby attractions and famous food spots within 5-10km of ${placeName}, ${district} in Bangladesh? List 5 items. ${langForce}`;

  return generateWithFallback(prompt);
}

export async function getRouteGuide(placeNames, districts, totalDistance, totalDuration, language = 'bn') {
  const hours = (totalDuration / 60).toFixed(1);
  
  const prompt = `বাংলাদেশের একটি রোড ট্রিপের জন্য ট্রাভেল গাইড তৈরি করুন।

রুটের বিবরণ:
- স্থানসমূহ: ${placeNames}
- জেলাসমূহ: ${districts.join(', ')}
- মোট দূরত্ব: ${totalDistance} কিমি
- মোট সময়: ${hours} ঘন্টা (${totalDuration} মিনিট)

নিচের বিষয়গুলো অন্তর্ভুক্ত করুন:
১. রুটের সংক্ষিপ্ত বিবরণ (২-৩ লাইন)
২. যাত্রার সেরা সময় (কখন রওনা দেওয়া উচিত)
৩. জ্বালানি ও খাবারের জন্য সুপারিশকৃত স্টপ
৪. এই রুটের জন্য ৩টি ভ্রমণ টিপস
৫. মৌসুমী বিবেচনা (বর্ষা, শীতকাল ইত্যাদি)

শুধুমাত্র বাংলায় উত্তর দিন। মার্কডাউন ফরম্যাটে লেখো।`;

  return generateWithFallback(prompt);
}
