const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const placeSchema = new mongoose.Schema({
  name: {
    bn: { type: String, required: true },
    en: { type: String, required: true },
  },
  district: {
    bn: { type: String, required: true },
    en: { type: String, required: true },
  },
  upazila: {
    bn: { type: String, required: true },
    en: { type: String, required: true },
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  category: {
    type: String,
    enum: ['historical', 'religious', 'natural', 'park', 'museum', 'other'],
    required: true,
  },
  description: {
    bn: { type: String },
    en: { type: String },
  },
  images: [{ type: String }],
  entryFee: {
    local: { type: Number, default: 0 },
    foreign: { type: Number, default: 0 },
  },
  bestTime: { type: String },
  rating: { type: Number, default: 0 },
  openingHours: { type: String },
}, {
  timestamps: true,
});

const Place = mongoose.models.Place || mongoose.model('Place', placeSchema);

const places = [
  {
    name: { bn: 'পুঠিয়া রাজবাড়ি', en: 'Puthia Rajbari' },
    district: { bn: 'রাজশাহী', en: 'Rajshahi' },
    upazila: { bn: 'পুঠিয়া', en: 'Puthia' },
    coordinates: { lat: 24.3644, lng: 88.8503 },
    category: 'historical',
    description: {
      bn: 'পুঠিয়া রাজবাড়ি বাংলাদেশের অন্যতম ঐতিহাসিক স্থাপনা। এটি ১৯ শতকে নির্মিত হয়েছিল।',
      en: 'Puthia Rajbari is one of the most historical architectural sites in Bangladesh, built in the 19th century.',
    },
    entryFee: { local: 20, foreign: 100 },
    bestTime: 'November to February',
    rating: 4.5,
  },
  {
    name: { bn: 'পাহাড়পুর বৌদ্ধ বিহার', en: 'Paharpur Buddhist Monastery' },
    district: { bn: 'নওগাঁ', en: 'Naogaon' },
    upazila: { bn: 'বদলগাছী', en: 'Badalgachhi' },
    coordinates: { lat: 25.0752, lng: 88.9561 },
    category: 'historical',
    description: {
      bn: 'সোমপুর মহাবিহার একটি প্রাচীন বৌদ্ধ বিহার। এটি ইউনেস্কো বিশ্ব ঐতিহ্যবাহী স্থান।',
      en: 'Somapura Mahavihara is an ancient Buddhist monastery and a UNESCO World Heritage Site.',
    },
    entryFee: { local: 30, foreign: 200 },
    bestTime: 'October to March',
    rating: 4.8,
  },
  {
    name: { bn: 'লালবাগ কেল্লা', en: 'Lalbagh Fort' },
    district: { bn: 'ঢাকা', en: 'Dhaka' },
    upazila: { bn: 'লালবাগ', en: 'Lalbagh' },
    coordinates: { lat: 23.7104, lng: 90.3855 },
    category: 'historical',
    description: {
      bn: 'লালবাগ কেল্লা ঢাকার একটি ঐতিহাসিক দুর্গ। এটি ১৭ শতকে মুঘল সুবেদার শায়েস্তা খান নির্মাণ শুরু করেছিলেন।',
      en: 'Lalbagh Fort is a historical fort in Dhaka, construction started by Mughal viceroy Shaista Khan in the 17th century.',
    },
    entryFee: { local: 20, foreign: 100 },
    bestTime: 'November to February',
    rating: 4.6,
  },
  {
    name: { bn: 'কক্সবাজার সমুদ্র সৈকত', en: "Cox's Bazar Beach" },
    district: { bn: 'কক্সবাজার', en: "Cox's Bazar" },
    upazila: { bn: 'কক্সবাজার সদর', en: "Cox's Bazar Sadar" },
    coordinates: { lat: 21.4272, lng: 92.0058 },
    category: 'natural',
    description: {
      bn: 'কক্সবাজার বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকত।',
      en: "Cox's Bazar is the world's longest natural sea beach.",
    },
    entryFee: { local: 0, foreign: 0 },
    bestTime: 'November to March',
    rating: 4.7,
  },
  {
    name: { bn: 'শ্রীমঙ্গল চা বাগান', en: 'Sreemangal Tea Garden' },
    district: { bn: 'মৌলভীবাজার', en: 'Moulvibazar' },
    upazila: { bn: 'শ্রীমঙ্গল', en: 'Sreemangal' },
    coordinates: { lat: 24.3095, lng: 91.7315 },
    category: 'natural',
    description: {
      bn: 'শ্রীমঙ্গল বাংলাদেশের চা রাজধানী। এখানে অসংখ্য চা বাগান রয়েছে।',
      en: 'Sreemangal is the tea capital of Bangladesh with numerous tea gardens.',
    },
    entryFee: { local: 50, foreign: 200 },
    bestTime: 'March to May',
    rating: 4.5,
  },
  {
    name: { bn: 'রাতারগুল সোয়াম্প ফরেস্ট', en: 'Ratargul Swamp Forest' },
    district: { bn: 'সিলেট', en: 'Sylhet' },
    upazila: { bn: 'গোয়াইনঘাট', en: 'Gowainghat' },
    coordinates: { lat: 25.0533, lng: 91.8833 },
    category: 'natural',
    description: {
      bn: 'রাতারগুল বাংলাদেশের একমাত্র পানির নিচের বন।',
      en: 'Ratargul is the only swamp forest in Bangladesh.',
    },
    entryFee: { local: 50, foreign: 300 },
    bestTime: 'June to September',
    rating: 4.4,
  },
  {
    name: { bn: 'ষাট গম্বুজ মসজিদ', en: 'Sixty Dome Mosque' },
    district: { bn: 'বাগেরহাট', en: 'Bagerhat' },
    upazila: { bn: 'বাগেরহাট সদর', en: 'Bagerhat Sadar' },
    coordinates: { lat: 22.6608, lng: 89.7895 },
    category: 'religious',
    description: {
      bn: 'ষাট গম্বুজ মসজিদ একটি ইউনেস্কো বিশ্ব ঐতিহ্যবাহী স্থান।',
      en: 'Sixty Dome Mosque is a UNESCO World Heritage Site.',
    },
    entryFee: { local: 20, foreign: 100 },
    bestTime: 'November to February',
    rating: 4.8,
  },
  {
    name: { bn: 'সুন্দরবন', en: 'Sundarbans' },
    district: { bn: 'সাতক্ষীরা', en: 'Satkhira' },
    upazila: { bn: 'শ্যামনগর', en: 'Shyamnagar' },
    coordinates: { lat: 21.9497, lng: 89.1833 },
    category: 'natural',
    description: {
      bn: 'সুন্দরবন বিশ্বের বৃহত্তম ম্যানগ্রোভ বন। এটি রয়েল বেঙ্গল টাইগারের জন্য বিখ্যাত।',
      en: "Sundarbans is the world's largest mangrove forest, famous for the Royal Bengal Tiger.",
    },
    entryFee: { local: 100, foreign: 500 },
    bestTime: 'October to March',
    rating: 4.9,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Place.deleteMany({});
    console.log('🗑️  Cleared existing places');

    await Place.insertMany(places);
    console.log('✅ Seeded', places.length, 'places');

    console.log('\n📍 Sample places:');
    places.forEach((p) => {
      console.log(`  - ${p.name.en} (${p.district.en})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
