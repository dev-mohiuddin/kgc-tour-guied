'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Trash2, Route as RouteIcon, Share2, Save, Map, GripVertical, ArrowRight, Clock, Navigation, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTravelStore } from '@/store/useTravelStore';
import dynamic from 'next/dynamic';

const GoogleRouteMap = dynamic(() => import('@/components/map/GoogleRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const PlaceItem = memo(function PlaceItem({ place, index, isLast, locale, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
      <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold font-bangla truncate">
          {locale === 'bn' ? place.name.bn : place.name.en}
        </p>
        <p className="text-xs text-muted-foreground">
          {place.district.en}
        </p>
      </div>
      {!isLast && (
        <ArrowRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />
      )}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(place._id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </motion.div>
  );
});

export default function RoutePage() {
  const [locale, setLocale] = useState('bn');
  const [messages, setMessages] = useState({});
  const router = useRouter();
  const { selectedPlaces, removePlace, clearPlaces, addSavedRoute } = useTravelStore();

  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadTranslations = async () => {
      try {
        const mod = await import(`@/locales/${locale}.json`);
        if (isMounted) {
          setMessages(mod.default || mod);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };
    
    loadTranslations();
    
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = messages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }, [messages]);

  const handleOptimizeRoute = useCallback(async () => {
    if (selectedPlaces.length < 2) return;

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: selectedPlaces.map((p) => ({
            lat: p.coordinates?.lat,
            lng: p.coordinates?.lng,
            name: p.name?.en || p.name?.bn || '',
          })),
          mode: 'driving',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOptimizedRoute(data.data);
        const order = data.data.optimizedOrder;
        if (order?.length === selectedPlaces.length) {
          const reordered = order.map(i => selectedPlaces[i]);
          useTravelStore.getState().setSelectedPlaces(reordered);
        }
      }
      setShowMap(true);
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedPlaces]);

  const handleSaveRoute = useCallback(() => {
    if (!routeName.trim()) return;

    const route = {
      id: Date.now().toString(),
      name: routeName,
      places: selectedPlaces,
      optimizedOrder: optimizedRoute?.optimizedOrder,
      totalDistance: optimizedRoute?.totalDistance,
      totalDuration: optimizedRoute?.totalDuration,
      createdAt: new Date().toISOString(),
    };

    addSavedRoute(route);

    const existingRoutes = JSON.parse(localStorage.getItem('kgc-saved-routes') || '[]');
    localStorage.setItem('kgc-saved-routes', JSON.stringify([...existingRoutes, route]));

    setSaveDialogOpen(false);
    setRouteName('');
    setOptimizedRoute(null);

    // Auto-clear after save (Phase 15)
    clearPlaces();

    // Show success toast
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  }, [routeName, selectedPlaces, optimizedRoute, addSavedRoute, clearPlaces]);

  const handleShareRoute = useCallback(async () => {
    const placeNames = selectedPlaces.map((p) => locale === 'bn' ? p.name.bn : p.name.en).join(', ');
    const shareData = {
      title: locale === 'bn' ? 'আমার বাংলাদেশ ট্যুর রুট' : 'My Bangladesh Tour Route',
      text: `${locale === 'bn' ? 'আমার ট্যুর রুট দেখুন:' : 'Check out my tour route:'} ${placeNames}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert(locale === 'bn' ? 'রুট লিঙ্ক কপি করা হয়েছে!' : 'Route link copied!');
    }
  }, [selectedPlaces, locale]);

  const handleGetDirections = useCallback(() => {
    if (selectedPlaces.length === 0) return;
    const origin = selectedPlaces[0].coordinates;
    const dest = selectedPlaces[selectedPlaces.length - 1].coordinates;
    const waypoints = selectedPlaces.slice(1, -1)
      .map(p => `${p.coordinates.lat},${p.coordinates.lng}`)
      .join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}${waypoints ? '&waypoints=' + encodeURIComponent(waypoints) : ''}&travelmode=driving`;
    window.open(url, '_blank');
  }, [selectedPlaces]);

  const handleRemovePlace = useCallback((placeId) => {
    removePlace(placeId);
  }, [removePlace]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">{locale === 'bn' ? '✅ রুট সংরক্ষিত হয়েছে! নতুন রুট তৈরি করুন।' : '✅ Route saved! Create a new route.'}</span>
            <button onClick={() => setSaveSuccess(false)} className="text-emerald-600 hover:text-emerald-800 text-lg leading-none">&times;</button>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 font-bangla">{t('route.title') || 'Route Planner'}</h1>
          <p className="text-muted-foreground">
            {t('route.selectedPlaces') || 'Selected Places'}: {selectedPlaces.length}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <AnimatePresence mode="popLayout">
                  {selectedPlaces.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('route.noPlacesSelected') || 'No places selected'}</p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push('/discover')}
                      >
                        {t('route.startPlanning') || 'Start Planning'}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPlaces.map((place, index) => (
                        <PlaceItem
                          key={place._id}
                          place={place}
                          index={index}
                          isLast={index === selectedPlaces.length - 1}
                          locale={locale}
                          onRemove={handleRemovePlace}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {selectedPlaces.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                <Button onClick={handleOptimizeRoute} disabled={isOptimizing || selectedPlaces.length < 2} className="flex-1 sm:flex-none">
                  <RouteIcon className="h-4 w-4 mr-2" />
                  {isOptimizing ? (t('common.loading') || 'Loading...') : (t('route.optimizeRoute') || 'Optimize Route')}
                </Button>

                <Button variant="outline" onClick={() => setSaveDialogOpen(true)}>
                  <Save className="h-4 w-4 mr-2" />{t('route.saveRoute') || 'Save Route'}
                </Button>

                <Button variant="outline" onClick={handleShareRoute}>
                  <Share2 className="h-4 w-4 mr-2" />{t('route.shareRoute') || 'Share'}
                </Button>

                    <Button variant="outline" onClick={() => setShowMap(!showMap)}>
                      <Map className="h-4 w-4 mr-2" />
                      {showMap ? (locale === 'bn' ? 'ম্যাপ লুকান' : 'Hide Map') : (t('route.viewOnMap') || 'View Map')}
                    </Button>

                    <Button variant="outline" onClick={handleGetDirections} className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                      <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                      {locale === 'bn' ? 'গুগল ম্যাপসে খুলুন' : 'Open in Google Maps'}
                    </Button>

                <Button variant="destructive" size="sm" onClick={clearPlaces}>
                  <Trash2 className="h-4 w-4 mr-2" />{t('route.clearAll') || 'Clear All'}
                </Button>
              </motion.div>
            )}

            {/* Optimized route info */}
            {optimizedRoute && optimizedRoute.totalDistance && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5"><RouteIcon className="h-4 w-4 text-emerald-600" /><span className="font-semibold text-emerald-800">{optimizedRoute.totalDistance} {locale === 'bn' ? 'কিমি' : 'km'}</span><span className="text-emerald-600/70">{locale === 'bn' ? 'মোট' : 'total'}</span></div>
                  <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-emerald-600" /><span className="font-semibold text-emerald-800">{optimizedRoute.totalDuration} min</span><span className="text-emerald-600/70">~{Math.round(optimizedRoute.totalDuration / 60)}h</span></div>
                </div>
                {optimizedRoute.legDistances?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-emerald-700 mb-1">{locale === 'bn' ? 'পথের দূরত্ব:' : 'Leg distances:'}</p>
                    {optimizedRoute.legDistances.map((leg, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-emerald-700/80">
                        <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        <span>{leg.distance} {locale === 'bn' ? 'কিমি' : 'km'}</span>
                        <ArrowRight className="h-3 w-3 opacity-50" />
                        <span className="font-medium">~{leg.duration} min</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {saveDialogOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-lg p-4"
              >
                <h3 className="font-semibold mb-3">
                  {locale === 'bn' ? 'রুটের নাম দিন' : 'Name your route'}
                </h3>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder={locale === 'bn' ? 'যেমন: রাজশাহী ট্যুর' : 'e.g., Rajshahi Tour'}
                  className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveRoute} disabled={!routeName.trim()}>
                    {t('common.confirm') || 'Confirm'}
                  </Button>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {showMap && selectedPlaces.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-1"
            >
              <Card>
                <CardContent className="p-4">
                  <GoogleRouteMap places={selectedPlaces} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
