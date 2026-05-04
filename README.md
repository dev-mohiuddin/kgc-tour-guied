# 🗺️ KGC Smart Voyager - Bangladesh Tour Guide

A bilingual (Bangla/English) PWA tour guide application for Bangladesh with optimized routing, AI-powered insights, and modern animations.

## ✨ Features

- **District Explorer**: Browse tourist places by division, district, and upazila
- **Smart Route Planning**: Multi-select places with Google Maps route optimization
- **AI Tour Guide**: Get detailed information about places using Gemini AI
- **Bilingual Support**: Full Bangla and English language support
- **PWA**: Installable on mobile devices with offline support
- **Safety Features**: Emergency contact button
- **Rich Animations**: Smooth transitions with Framer Motion

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB Atlas
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API
- **AI**: Gemini 1.5 Flash
- **State**: Zustand
- **i18n**: next-intl

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Google Maps API key
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   cd kgc-tour-guide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your credentials:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kgc-tour-guide
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
kgc-tour-guide/
├── src/
│   ├── app/
│   │   ├── [lang]/              # i18n routing
│   │   │   ├── page.js          # Home page
│   │   │   ├── explore/         # District explorer
│   │   │   ├── route/           # Route planner
│   │   │   ├── saved/           # Saved routes
│   │   │   └── place/[id]/      # Place details
│   │   └── api/
│   │       ├── places/          # Places CRUD
│   │       ├── ai-guide/        # AI endpoint
│   │       └── optimize-route/  # Route optimization
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── map/                 # Google Maps components
│   │   ├── place/               # Place components
│   │   └── layout/              # Header, Footer
│   ├── lib/
│   │   ├── mongodb.js           # DB connection
│   │   ├── gemini.js            # AI integration
│   │   └── utils.js             # Utilities
│   ├── models/
│   │   ├── Place.js             # Place schema
│   │   └── Route.js             # Route schema
│   ├── store/
│   │   └── useTravelStore.js    # Zustand state
│   └── locales/
│       ├── bn.json              # Bangla translations
│       └── en.json              # English translations
├── public/
│   └── manifest.json            # PWA manifest
└── scripts/
    └── seed-data.js             # Database seeder
```

## 🎨 Design System

### Colors
- **Primary**: `#059669` (Emerald - Bangladesh green)
- **Secondary**: `#DC2626` (Red - Bangladesh red)
- **Background**: `#FAFAFA`

### Typography
- **English**: Inter
- **Bangla**: Hind Siliguri

## 📱 PWA Features

- Installable on mobile devices
- Offline support for saved routes
- App manifest configured
- Service worker enabled

## 🔌 API Endpoints

### GET /api/places
Fetch all places or filter by query params:
- `?district=Rajshahi`
- `?category=historical`

### POST /api/ai-guide
Get AI-generated information about a place:
```json
{
  "placeName": "Puthia Rajbari",
  "district": "Rajshahi",
  "language": "en"
}
```

### POST /api/optimize-route
Optimize route for multiple places:
```json
{
  "places": [
    { "lat": 24.3644, "lng": 88.8503, "name": "Puthia Rajbari" }
  ]
}
```

## 🚧 Future Enhancements

- [ ] Weather API integration
- [ ] Voice guide (Text-to-Speech)
- [ ] Local transport information
- [ ] User authentication
- [ ] Photo uploads
- [ ] Reviews and ratings
- [ ] Budget planner

## 📝 License

This project is open source and available under the MIT License.

## 👥 Credits

Built with ❤️ for Bangladesh travelers by KGC (Kumudini Government College) students.

## 🆘 Support

For issues or questions, please create an issue in the repository.
