'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Star, ArrowLeft, Compass, Loader2, Sparkles, Map } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTravelStore } from '@/store/useTravelStore';
import dynamic from 'next/dynamic';

const LeafletMapBase = dynamic(() => import('@/components/map/LeafletMapBase'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-muted flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const InfoCard = memo(function InfoCard({ icon: Icon, title, children }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-semibold">{title}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
});

export default function PlaceDetailPage() {
  const { addPlace, selectedPlaces, language } = useTravelStore();
  const locale = language === 'bn' ? 'bn' : 'en';
  const [messages, setMessages] = useState({});
  const params = useParams();
  const router = useRouter();

  const [place, setPlace] = useState(null);
  const [aiInfo, setAiInfo] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    
    const fetchPlace = async () => {
      try {
        const response = await fetch(`/api/places/${params.id}`);
        const data = await response.json();

        if (data.success && isMounted) {
          setPlace(data.data);
        } else {
          console.error('Error fetching place:', data.error);
        }
      } catch (error) {
        console.error('Error fetching place:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (params.id) {
      fetchPlace();
    }
    
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleGetAIInfo = useCallback(async () => {
    if (!place || aiLoading) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: locale === 'bn' ? place.name.bn : place.name.en,
          district: locale === 'bn' ? place.district.bn : place.district.en,
          language: locale,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiInfo(data.data.content);
      }
    } catch (error) {
      console.error('Error fetching AI info:', error);
    } finally {
      setAiLoading(false);
    }
  }, [place, aiLoading, locale]);

  const handleGetNearby = useCallback(async () => {
    if (!place || nearbyLoading) return;

    setNearbyLoading(true);
    try {
      const response = await fetch('/api/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: locale === 'bn' ? place.name.bn : place.name.en,
          district: locale === 'bn' ? place.district.bn : place.district.en,
          language: locale,
          type: 'nearby',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNearbyPlaces(data.data.content);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setNearbyLoading(false);
    }
  }, [place, nearbyLoading, locale]);

  const handleAddToRoute = useCallback(() => {
    if (place) {
      addPlace(place);
    }
  }, [place, addPlace]);

  const isInRoute = place ? selectedPlaces.some((p) => p._id === place._id) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.error') || 'Error loading place'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container px-4 py-8 pb-extra">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {locale === 'bn' ? 'ফিরে যান' : 'Back'}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="space-y-6">
            <div className="h-72 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <MapPin className="h-24 w-24 text-primary/20" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                {place.rating || 'N/A'}
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-bold mb-2 font-bangla">
                {locale === 'bn' ? place.name.bn : place.name.en}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {locale === 'bn' ? place.district.bn : place.district.en},{' '}
                  {locale === 'bn' ? place.upazila.bn : place.upazila.en}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAddToRoute}
                variant={isInRoute ? 'secondary' : 'default'}
                className="flex-1 sm:flex-none"
              >
                {isInRoute
                  ? (locale === 'bn' ? 'রুটে আছে' : 'In Route')
                  : (t('explore.addToRoute') || 'Add to Route')}
              </Button>
              <Button
                variant="outline"
                onClick={handleGetAIInfo}
                disabled={aiLoading}
                className="flex-1 sm:flex-none"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {aiLoading ? (t('common.loading') || 'Loading...') : (locale === 'bn' ? 'এআই গাইড' : 'AI Guide')}
              </Button>
              <Button
                variant="outline"
                onClick={handleGetNearby}
                disabled={nearbyLoading}
                className="flex-1 sm:flex-none"
              >
                <Compass className="h-4 w-4 mr-2" />
                {nearbyLoading ? (t('common.loading') || 'Loading...') : (locale === 'bn' ? 'আশেপাশে' : 'Nearby')}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {place.entryFee && (
                <InfoCard icon={DollarSign} title={t('place.entryFee') || 'Entry Fee'}>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{t('place.local') || 'Local'}</span>
                      <span className="font-medium">৳{place.entryFee.local || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('place.foreign') || 'Foreign'}</span>
                      <span className="font-medium">৳{place.entryFee.foreign || 0}</span>
                    </div>
                  </div>
                </InfoCard>
              )}

              {place.bestTime && (
                <InfoCard icon={Clock} title={t('place.bestTime') || 'Best Time'}>
                  <p className="text-sm text-muted-foreground">{place.bestTime}</p>
                </InfoCard>
              )}
            </div>

            {place.coordinates && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  {t('place.coordinates') || 'Location'}
                </h3>
                <LeafletMapBase places={[place]} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">{locale === 'bn' ? 'বিবরণ' : 'Description'}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {locale === 'bn' ? place.description?.bn : place.description?.en}
                </p>
              </CardContent>
            </Card>

            {aiInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">
                        {locale === 'bn' ? 'এআই ট্যুর গাইড' : 'AI Tour Guide'}
                      </h2>
                    </div>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                      {aiInfo}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {nearbyPlaces && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Compass className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">
                        {locale === 'bn' ? 'আশেপাশের স্থান' : 'Nearby Places'}
                      </h2>
                    </div>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                      {nearbyPlaces}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
