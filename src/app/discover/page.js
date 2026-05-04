'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Sliders, Navigation, Compass, Plus, Minus, Loader2, MapPin, Sparkles, Star, X, Crosshair } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTravelStore } from '@/store/useTravelStore';
import { fetchNearbyPlaces, fetchPlacesByText, geocodePlace } from '@/lib/map-providers';
import { useUserLocation } from '@/hooks/useUserLocation';
import PhotoSlider from '@/components/ui/PhotoSlider';
import dynamic from 'next/dynamic';
import divisionsData from '@/locales/places-in-bangladesh/divisions/divisions.json';
import districtsData from '@/locales/places-in-bangladesh/districts/districts.json';
import upazilasData from '@/locales/places-in-bangladesh/upazilas/upazilas.json';

const GoogleDiscoverMap = dynamic(() => import('@/components/map/GoogleDiscoverMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-muted flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const districtByDiv = new Map();
districtsData.forEach((d) => { const l = districtByDiv.get(d.division_id) || []; l.push(d); districtByDiv.set(d.division_id, l); });

const upazilaByDist = new Map();
upazilasData.forEach((u) => { const l = upazilaByDist.get(u.district_id) || []; l.push(u); upazilaByDist.set(u.district_id, l); });

export default function DiscoverPage() {
  const { addPlace, removePlace, selectedPlaces, language, setLanguage } = useTravelStore();
  const locale = language === 'bn' ? 'bn' : 'en';
  const [messages, setMessages] = useState({});
  const { location: userLocation, heading } = useUserLocation();

  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const [locationName, setLocationName] = useState('Bangladesh');
  const [radius, setRadius] = useState(10000);
  const [searchMode, setSearchMode] = useState('nearby');
  const [textQuery, setTextQuery] = useState('');
  const [manualSearchInput, setManualSearchInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [lastAddedName, setLastAddedName] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');

  // Modal state
  const [detailPlace, setDetailPlace] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');

  // Haversine distance in km
  const getDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  }, []);

  useEffect(() => {
    let m = true;
    import(`@/locales/${locale}.json`).then(mod => { if (m) setMessages(mod.default || mod); }).catch(() => {});
    return () => { m = false; };
  }, [locale]);

  const t = useCallback((key) => {
    const ks = key.split('.'); let v = messages;
    for (const k of ks) v = v?.[k];
    return v || key;
  }, [messages]);

  const availableDistricts = useMemo(() => {
    if (!selectedDivision) return [];
    const div = divisionsData.find(d => d.id === selectedDivision || d.name === selectedDivision);
    return div ? (districtByDiv.get(div.id) || []) : [];
  }, [selectedDivision]);

  const availableUpazilas = useMemo(() => {
    if (!selectedDistrict) return [];
    const dist = districtsData.find(d => d.id === selectedDistrict || d.name === selectedDistrict);
    return dist ? (upazilaByDist.get(dist.id) || []) : [];
  }, [selectedDistrict]);

  const geocodeArea = useCallback(async (areaName) => {
    setGeocoding(true);
    try {
      const dist = districtsData.find(d => d.name === areaName || d.bn_name === areaName);
      if (dist?.lat && dist?.lon) { setMapCenter([parseFloat(dist.lat), parseFloat(dist.lon)]); setLocationName(locale === 'bn' ? dist.bn_name : dist.name); return; }
      const q = encodeURIComponent(`${areaName}, Bangladesh`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'User-Agent': 'KGC/1.0' } });
      const data = await res.json();
      if (data.length) { setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]); setLocationName(areaName); }
    } catch (e) { console.error(e); }
    finally { setGeocoding(false); }
  }, [locale]);

  const handleDivisionChange = useCallback((v) => {
    setSelectedDivision(v);
    setSelectedDistrict('');
    setSelectedUpazila('');
    if (v) {
      const div = divisionsData.find(d => d.id === v || d.name === v);
      if (div) geocodeArea(div.name);
    }
  }, [geocodeArea]);
  const handleDistrictChange = useCallback((v) => { setSelectedDistrict(v); setSelectedUpazila(''); if (v) geocodeArea(v); }, [geocodeArea]);
  const handleUpazilaChange = useCallback((v) => { setSelectedUpazila(v); if (v) geocodeArea(v); }, [geocodeArea]);
  const handleManualSearch = useCallback(() => {
    if (!manualSearchInput.trim()) return;
    setTextQuery(`tourist places in ${manualSearchInput.trim()} Bangladesh`);
    setSearchMode('text');
    setLocationName(manualSearchInput.trim());
    geocodeArea(manualSearchInput.trim());
  }, [manualSearchInput, geocodeArea]);

  const handlePlaceSelect = useCallback((place) => {
    if (!place?.name) return;
    const placeId = place.place_id || `rpid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const exists = selectedPlaces.find(p => p._id === placeId);
    if (exists) {
      // REMOVE — toggle off
      removePlace(placeId);
      setAddedCount(c => Math.max(0, c - 1));
      setLastAddedName(null);
    } else {
      // ADD — toggle on
      addPlace({
        _id: placeId,
        name: { en: place.name || '', bn: place.name || '' },
        district: { en: place.vicinity || selectedDistrict || '', bn: place.vicinity || selectedDistrict || '' },
        upazila: { en: '', bn: '' },
        coordinates: { lat: place.lat, lng: place.lng },
        category: 'other',
        description: { en: place.vicinity || '', bn: place.vicinity || '' },
        rating: place.rating || 0,
        entryFee: { local: 0, foreign: 0 },
      });
      setAddedCount(c => c + 1);
      setLastAddedName(place.name);
    }
  }, [addPlace, removePlace, selectedPlaces, selectedDistrict]);

  // Check if place is already in route
  const isPlaceSelected = useCallback((placeId) => {
    return selectedPlaces.some(p => p._id === placeId);
  }, [selectedPlaces]);

  const handleShowMore = useCallback(async (place) => {
    setDetailPlace(place);
    setAiContent('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: place.name,
          district: place.vicinity || locationName || 'Bangladesh',
          language: locale,
          type: 'info',
        }),
      });
      const d = await res.json();
      if (d.success) {
        setAiContent(d.data.content);
      } else {
        setAiContent(`__error__${d.error || 'Failed'}`);
      }
    } catch (e) {
      setAiContent(`__error__${e.message || 'Network error'}`);
    }
    finally { setAiLoading(false); }
  }, [locale, locationName]);

  const radiusPresets = [
    { label: locale === 'bn' ? '১ কিমি' : '1 km', value: 1000 },
    { label: locale === 'bn' ? '৫ কিমি' : '5 km', value: 5000 },
    { label: locale === 'bn' ? '১০ কিমি' : '10 km', value: 10000 },
    { label: locale === 'bn' ? '২৫ কিমি' : '25 km', value: 25000 },
    { label: locale === 'bn' ? '৫০ কিমি' : '50 km', value: 50000 },
    { label: locale === 'bn' ? '১০০ কিমি' : '100 km', value: 100000 },
  ];

  const handleLongDistance = useCallback(() => {
    const area = selectedDistrict || 'Bangladesh';
    setTextQuery(`tourist places within 5-6 hours drive of ${area} Bangladesh`);
    setSearchMode('text');
  }, [selectedDistrict]);

  // Custom radius
  const handleCustomRadius = useCallback((e) => {
    setRadius(Number(e.target.value));
    setSearchMode('nearby');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold mb-1 font-bangla">{t('discover.title') || 'Discover Places'}</h1>
          <p className="text-muted-foreground text-sm">{t('discover.subtitle') || 'Powered by Google Maps + AI'}</p>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-4 mb-6 shadow-sm border space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={selectedDivision} onValueChange={handleDivisionChange}>
              <SelectTrigger className="flex-1"><SelectValue placeholder={t('discover.selectDivision') || 'Division'} /></SelectTrigger>
              <SelectContent>{divisionsData.map(d => (<SelectItem key={d.id} value={d.id}>{locale === 'bn' ? d.bn_name : d.name}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!selectedDivision}>
              <SelectTrigger className="flex-1"><SelectValue placeholder={t('discover.selectDistrict') || 'District'} /></SelectTrigger>
              <SelectContent>{availableDistricts.map(d => (<SelectItem key={d.id} value={d.name}>{locale === 'bn' ? d.bn_name : d.name}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={selectedUpazila} onValueChange={handleUpazilaChange} disabled={!selectedDistrict}>
              <SelectTrigger className="flex-1"><SelectValue placeholder={t('discover.selectUpazila') || 'Upazila'} /></SelectTrigger>
              <SelectContent>{availableUpazilas.map(u => (<SelectItem key={u.id} value={u.name}>{locale === 'bn' ? u.bn_name : u.name}</SelectItem>))}</SelectContent>
            </Select>
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder={locale === 'bn' ? 'যেকোনো স্থান...' : 'Any place...'} className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" value={manualSearchInput} onChange={e => setManualSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleManualSearch()} />
              </div>
              <Button size="icon" onClick={handleManualSearch}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Sliders className="h-4 w-4 text-muted-foreground" />
            {radiusPresets.map(p => (
              <button key={p.value} onClick={() => { setRadius(p.value); setSearchMode('nearby'); }} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${radius === p.value && searchMode === 'nearby' ? 'bg-primary text-white shadow-sm' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>{p.label}</button>
            ))}
            <div className="flex items-center gap-2">
              <input type="range" min="500" max="150000" step="500" value={radius} onChange={handleCustomRadius} className="w-24 h-1 accent-primary cursor-pointer" title="Custom radius" />
              <span className="text-xs text-muted-foreground font-medium min-w-[40px]">{Math.round(radius / 1000)} {locale === 'bn' ? 'কিমি' : 'km'}</span>
            </div>
            {userLocation && (
              <button onClick={() => { setMapCenter([userLocation.lat, userLocation.lng]); setSearchMode('nearby'); setLocationName(locale === 'bn' ? 'আপনার অবস্থান' : 'Your Location'); }} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1">
                <Crosshair className="h-3 w-3" />{locale === 'bn' ? 'আমার অবস্থান' : 'My Location'}
              </button>
            )}
            <button onClick={handleLongDistance} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${searchMode === 'text' && textQuery.includes('drive') ? 'bg-blue-600 text-white shadow-sm' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
              <Navigation className="h-3 w-3" />{locale === 'bn' ? 'দূরপাল্লা' : 'Long Distance'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{locale === 'bn' ? 'ধরন:' : 'Type:'}</span>
            {[
              { key: 'all', bn: 'সব', en: 'All' },
              { key: 'tourist_attraction', bn: 'পর্যটন', en: 'Tourist Spots' },
              { key: 'park', bn: 'পার্ক', en: 'Parks' },
              { key: 'museum', bn: 'জাদুঘর', en: 'Museums' },
              { key: 'natural_feature', bn: 'প্রাকৃতিক', en: 'Nature' },
              { key: 'hindu_temple', bn: 'মন্দির', en: 'Temples' },
              { key: 'mosque', bn: 'মসজিদ', en: 'Mosques' },
              { key: 'church', bn: 'গির্জা', en: 'Churches' },
              { key: 'art_gallery', bn: 'আর্ট', en: 'Art' },
            ].map(({ key, bn, en }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTypeFilter(key);
                  if (key === 'all') {
                    setSearchMode('nearby');
                    setTextQuery('');
                  } else {
                    const area = locationName || 'Bangladesh';
                    setTextQuery(`${key.replace(/_/g, ' ')} in ${area} Bangladesh`);
                    setSearchMode('text');
                  }
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize ${
                  activeTypeFilter === key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {locale === 'bn' ? bn : en}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Map */}
        {geocoding ? (
          <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center mb-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="mb-6">
            <GoogleDiscoverMap
              center={mapCenter} radius={radius} mode={searchMode} textQuery={textQuery}
              locationName={locationName} locale={locale}
              onPlaceSelect={handlePlaceSelect} onShowMore={handleShowMore}
              userLocation={userLocation} heading={heading}
              selectedPlaceIds={selectedPlaces.map(p => p._id)}
            />
          </div>
        )}

        {/* Selected places indicator (sticky bar) */}
        {selectedPlaces.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 flex items-center justify-between sticky top-[65px] z-30 backdrop-blur">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><Compass className="h-3 w-3 text-white" /></div>
              <span className="text-sm font-medium text-emerald-800 truncate">{selectedPlaces.length} {locale === 'bn' ? 'টি স্থান সিলেক্ট করা আছে' : 'places selected'}</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/route')}><Navigation className="h-3 w-3 mr-1" />{locale === 'bn' ? 'রুটে যান' : 'View Route'}</Button>
            </div>
          </motion.div>
        )}

        {/* Added confirmation */}
        {addedCount > 0 && lastAddedName && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><Plus className="h-3 w-3 text-white" /></div>
              <span className="text-sm font-medium text-emerald-800 truncate">+{addedCount} {locale === 'bn' ? 'টি স্থান রুটে যোগ হয়েছে' : 'places added to route'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setAddedCount(0); setLastAddedName(''); }}>✕</Button>
          </motion.div>
        )}

        {/* Detail Modal */}
        {detailPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailPlace(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold truncate">{detailPlace.name}</h2>
                <button onClick={() => setDetailPlace(null)} className="p-1 hover:bg-muted rounded"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Photo slider */}
                <PhotoSlider
                  photos={detailPlace.photos || []}
                  photoUrl={detailPlace.photo_url}
                  photoCount={detailPlace.photo_count || 0}
                  placeName={detailPlace.name}
                />

                {/* Name + rating + distance */}
                <div>
                  <h3 className="text-lg font-bold">{detailPlace.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {detailPlace.rating && (
                      <div className="flex items-center gap-1"><Star className="h-5 w-5 fill-yellow-500 text-yellow-500" /><span className="font-bold text-lg">{detailPlace.rating}</span><span className="text-muted-foreground text-sm">({detailPlace.user_ratings_total || 0})</span></div>
                    )}
                    {detailPlace.lat && userLocation && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {getDistance(userLocation.lat, userLocation.lng, detailPlace.lat, detailPlace.lng)} {locale === 'bn' ? 'কিমি দূরে' : 'km away'}</span>
                    )}
                    <span className="text-muted-foreground text-sm">{detailPlace.vicinity || ''}</span>
                  </div>
                </div>

                {/* AI Description */}
                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Sparkles className="h-5 w-5 text-primary" /><h3 className="font-semibold">{locale === 'bn' ? 'এআই ট্যুর গাইড' : 'AI Tour Guide'}</h3></div>
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{locale === 'bn' ? 'বিবরণ তৈরি হচ্ছে...' : 'Generating description...'}</div>
                  ) : aiContent && !aiContent.startsWith('__error__') ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiContent}</div>
                  ) : aiContent?.startsWith('__error__') ? (
                    <div className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                      <p className="font-medium mb-1">{locale === 'bn' ? '⚠️ এআই অনুপলব্ধ' : '⚠️ AI unavailable'}</p>
                      <p className="text-xs">{aiContent.replace('__error__', '')}</p>
                      <p className="text-xs mt-1 text-amber-600">{locale === 'bn' ? 'নিচে উপলব্ধ তথ্য দেখানো হয়েছে।' : 'Showing available info below.'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{locale === 'bn' ? 'এআই বিবরণের জন্য পুনঃচেষ্টা করুন।' : 'Click Retry for AI-generated description.'}</p>
                  )}
                  {!aiLoading && (
                    <button onClick={() => handleShowMore(detailPlace)} className="mt-3 text-xs text-primary hover:underline">{locale === 'bn' ? '⟳ পুনরায় তৈরি করুন' : '⟳ Regenerate'}</button>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  {isPlaceSelected(detailPlace.place_id) ? (
                    <Button onClick={() => { handlePlaceSelect(detailPlace); setDetailPlace(null); }} className="flex-1 bg-destructive hover:bg-destructive/90"><Minus className="h-4 w-4 mr-2" />{locale === 'bn' ? 'রুট থেকে সরান' : 'Remove from Route'}</Button>
                  ) : (
                    <Button onClick={() => { handlePlaceSelect(detailPlace); setDetailPlace(null); }} className="flex-1"><Plus className="h-4 w-4 mr-2" />{locale === 'bn' ? 'রুটে যোগ করুন' : 'Add to Route'}</Button>
                  )}
                  {detailPlace.place_id && (
                    <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${detailPlace.place_id}`, '_blank')}><MapPin className="h-4 w-4 mr-2" />{locale === 'bn' ? 'গুগল ম্যাপস' : 'Google Maps'}</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center py-8 border-t">
          <Button variant="outline" onClick={() => (window.location.href = '/route')}><Navigation className="h-4 w-4 mr-2" />{locale === 'bn' ? 'রুট প্ল্যানারে যান' : 'Go to Route Planner'}</Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
