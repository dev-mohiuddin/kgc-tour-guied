# 🗺️ KGC Tour Guide - Bangladesh Travel Companion

An AI-powered bilingual (Bangla/English) PWA tour guide for exploring Bangladesh. Discover tourist places, plan optimized routes with Google Maps, and get smart insights from Gemini AI.

## ✨ Features

- **Discover Places**: Browse tourist spots by division, district, and upazila with Google Maps integration
- **Smart Route Planning**: Multi-select places, auto-optimize route order, get driving directions
- **AI Tour Guide**: Detailed place info, descriptions, and nearby recommendations via Gemini AI with fallback chain
- **Bilingual Support**: Full Bengali (বাংলা) and English — switch anytime
- **PWA**: Installable on mobile, offline support for saved routes
- **Popular Places**: Gold/Silver tier highlighting for Bangladesh's top destinations
- **Photo Carousel**: Autoplay, touch swipe, lightbox, video support
- **Add/Remove Toggle**: One-click add/remove places from route with visual feedback
- **Filter by Type**: Tourist spots, parks, museums, temples, mosques, restaurants, hotels etc.
- **Live GPS**: Current location tracking with distance from each place

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB / Mongoose
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API (`@vis.gl/react-google-maps`)
- **AI**: Google Gemini (`@google/genai`) — Flash model with automatic fallback
- **State**: Zustand (persisted to localStorage)
- **i18n**: Dynamic JSON locale imports (bn/en)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Maps API key (with Places API, Maps JavaScript API enabled)
- Gemini API key

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kgc-tour-guide
```

### Run Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── page.js              # Home page
│   ├── discover/page.js     # Discover places + map
│   ├── route/page.js        # Route planner
│   ├── saved/page.js        # Saved routes
│   ├── place/[id]/page.js   # Place detail
│   └── api/
│       ├── ai-guide/        # Gemini AI proxy
│       ├── directions/      # Google Directions API proxy
│       ├── optimize-route/  # Route optimization
│       ├── places/          # Places CRUD
│       ├── places-search/   # Places search proxy
│       └── place-photo/     # Photo proxy
├── components/
│   ├── ui/                  # shadcn/ui: Button, Card, Dialog, Select, PhotoSlider
│   ├── map/                 # GoogleDiscoverMap, GoogleRouteMap, Leaflet fallbacks
│   └── layout/              # Header, Footer, EmergencyButton
├── lib/
│   ├── gemini.js            # AI with model fallback chain
│   ├── map-providers/       # Google Places API adapter
│   ├── mongodb.js           # DB connection
│   └── utils.js
├── data/popular-places.js   # Curated Bangladesh destinations
├── hooks/useUserLocation.js # GPS watch hook
├── store/useTravelStore.js  # Zustand store (persisted)
└── locales/
    ├── bn.json / en.json    # UI translations
    └── places-in-bangladesh/ # Division/district/upazila data
```

## 🎨 Design System

- **Primary**: `#059669` (Emerald green)
- **Secondary**: `#DC2626` (Red)
- **Fonts**: Inter (English), Hind Siliguri (Bangla)

## 📱 PWA Features

- Installable on mobile/desktop
- Offline service worker
- App manifest with icons

## 💾 Data Storage (Route Save)

Routes are saved to **localStorage** in the browser (not a database):

```
localStorage:
  ├── kgc-travel-storage      → Zustand persist (selectedPlaces, savedRoutes)
  └── kgc-saved-routes        → Fallback saved routes list
```

When you save a route, it persists to both the Zustand store and a dedicated `kgc-saved-routes` key. After saving, the route planner **auto-clears** so you can immediately plan a new route.

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai-guide` | AI info, popup, or nearby recommendations |
| POST | `/api/directions` | Google Directions with waypoint optimization |
| POST | `/api/optimize-route` | Alternative route optimization |
| GET | `/api/places` | Fetch places from DB |
| GET | `/api/places/[id]` | Single place detail |
| POST | `/api/places-search` | Google Places text/nearby search |
| GET | `/api/place-photo` | Proxy Google Place Photos |

## 📝 Credits

Built with ❤️ for Bangladesh travelers.  
© 2026 KGC Tour Guide. All rights reserved.  
**Kumudini Govt. College, Tangail.**
