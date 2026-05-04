'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trash2, ExternalLink, Calendar, Route, Clock, Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTravelStore } from '@/store/useTravelStore';

const RouteCard = memo(function RouteCard({ route, index, locale, onLoad, onExport, onDelete }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{route.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(route.createdAt)}
              </div>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Route className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{route.places?.length || 0} places</span>
              </div>
              {route.totalDistance && (
                <div className="flex items-center gap-1">
                  <Route className="h-4 w-4 text-primary" />
                  <span>{route.totalDistance} km</span>
                </div>
              )}
              {route.totalDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{route.totalDuration} min</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {route.places?.slice(0, 3).map((place, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="h-5 w-5 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="truncate">
                    {locale === 'bn' ? place.name?.bn : place.name?.en}
                  </span>
                </div>
              ))}
              {route.places?.length > 3 && (
                <p className="text-xs text-muted-foreground pl-7">
                  +{route.places.length - 3} more
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onLoad(route)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {locale === 'bn' ? 'লোড করুন' : 'Load'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport(route)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(route.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default function SavedPage() {
  const [locale, setLocale] = useState('bn');
  const [messages, setMessages] = useState({});
  const router = useRouter();
  const { setSelectedPlaces } = useTravelStore();

  const [routes, setRoutes] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('kgc-saved-routes') || '[]');
      } catch { return []; }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

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

  const handleDeleteRoute = useCallback((routeId) => {
    const updatedRoutes = routes.filter((r) => r.id !== routeId);
    setRoutes(updatedRoutes);
    localStorage.setItem('kgc-saved-routes', JSON.stringify(updatedRoutes));
  }, [routes]);

  const handleLoadRoute = useCallback((route) => {
    setSelectedPlaces(route.places || []);
    router.push('/route');
  }, [setSelectedPlaces, router]);

  const handleExportRoute = useCallback((route) => {
    const routeData = {
      name: route.name,
      places: route.places.map((p) => ({
        name: locale === 'bn' ? p.name.bn : p.name.en,
        district: locale === 'bn' ? p.district.bn : p.district.en,
        coordinates: p.coordinates,
      })),
      createdAt: route.createdAt,
    };

    const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.replace(/\s+/g, '-').toLowerCase()}-route.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [locale]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 font-bangla">{t('common.saved') || 'Saved'}</h1>
          <p className="text-muted-foreground">
            {locale === 'bn' ? 'মোট সংরক্ষিত রুট' : 'Total saved routes'}: {routes.length}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : routes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {locale === 'bn' ? 'কোনো সংরক্ষিত রুট নেই' : 'No saved routes yet'}
            </p>
            <Button onClick={() => router.push('/explore')}>
              {t('route.startPlanning') || 'Start Planning'}
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route, index) => (
              <RouteCard
                key={route.id}
                route={route}
                index={index}
                locale={locale}
                onLoad={handleLoadRoute}
                onExport={handleExportRoute}
                onDelete={handleDeleteRoute}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
