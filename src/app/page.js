'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Route, Globe, Sparkles, Phone, ChevronRight, Compass, Shield, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { popularPlaces } from '@/data/popular-places';

const features = [
  { icon: Globe, key: 'explore', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-600', titleKey: 'home.features.explore', descKey: 'home.features.exploreDesc' },
  { icon: Route, key: 'route', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600', titleKey: 'home.features.route', descKey: 'home.features.routeDesc' },
  { icon: Sparkles, key: 'ai', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-600', titleKey: 'home.features.ai', descKey: 'home.features.aiDesc' },
  { icon: Compass, key: 'offline', color: 'from-orange-500/20 to-amber-500/20', iconColor: 'text-orange-600', titleKey: 'home.features.offline', descKey: 'home.features.offlineDesc' },
];

const stats = [
  { labelKey: 'home.stats.districts', value: '64+' },
  { labelKey: 'home.stats.places', value: '100+' },
  { labelKey: 'home.stats.users', value: '1K+' },
];

const showPopularPlaces = popularPlaces.filter(p => p.tier === 'gold').slice(0, 8);

const PlaceCard = memo(function PlaceCard({ place, locale, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 cursor-pointer text-center hover:shadow-lg transition-shadow border border-yellow-100 relative"
      onClick={onClick}
    >
      <Star className="h-4 w-4 text-yellow-500 absolute top-3 right-3" />
      <MapPin className="h-8 w-8 mx-auto mb-3 text-yellow-600" />
      <p className="font-bold text-lg">{locale === 'bn' ? place.name.bn : place.name.en}</p>
      <p className="text-xs text-muted-foreground mt-1">{locale === 'bn' ? place.district.bn : place.district.en}</p>
    </motion.div>
  );
});

const FeatureCard = memo(function FeatureCard({ feature, locale, t }) {
  return (
    <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-muted/50">
      <CardContent className="pt-8 pb-6 text-center">
        <div className={`h-16 w-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
          <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
        </div>
        <h3 className="font-bold text-lg mb-2">{t(feature.titleKey)}</h3>
        <p className="text-sm text-muted-foreground">{t(feature.descKey)}</p>
      </CardContent>
    </Card>
  );
});

export default function HomePage() {
  const router = useRouter();
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState({});

  useEffect(() => {
    let m = true;
    import(`@/locales/${locale}.json`).then(mod => { if (m) setMessages(mod.default || mod); }).catch(() => {});
    return () => { m = false; };
  }, [locale]);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let v = messages;
    for (const k of keys) v = v?.[k];
    return v || key;
  }, [messages]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'kgc-travel-storage') {
        try {
          const data = JSON.parse(e.newValue);
          if (data?.state?.language) setLocale(data.state.language);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('kgc-travel-storage') || '{}');
      if (stored?.state?.language) setLocale(stored.state.language);
    } catch {}
  }, []);

  const handleExploreClick = useCallback(() => {
    router.push('/discover');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

          <div className="container relative px-4 py-20 md:py-32">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-block mb-6"
              >
                <div className="h-20 w-20 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <MapPin className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold mb-6 font-bangla bg-gradient-to-r from-primary to-emerald-700 bg-clip-text text-transparent"
              >
                {t('home.title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed"
              >
                {t('home.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/discover">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                    <Globe className="mr-2 h-5 w-5" />
                    {locale === 'bn' ? 'কাছাকাছি খুঁজুন' : 'Discover Nearby'}
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/route">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                    <Route className="mr-2 h-5 w-5" />
                    {t('home.planRouteButton')}
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex justify-center gap-8 mt-12"
              >
                {stats.map((stat) => (
                  <div key={stat.labelKey} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.features.title')}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {locale === 'bn' ? 'ভ্রমণ সহজ ও উপভোগ্য করতে বিশেষ বৈশিষ্ট্য' : 'Special features designed to make your travel easier and more enjoyable'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <FeatureCard key={feature.key} feature={feature} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{locale === 'bn' ? 'জনপ্রিয় গন্তব্য' : 'Popular Destinations'}</h2>
              <p className="text-muted-foreground">{locale === 'bn' ? 'বাংলাদেশের সর্বাধিক পরিদর্শিত স্থানসমূহ' : 'Most visited tourist spots in Bangladesh'}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {showPopularPlaces.map((place) => (
                <PlaceCard 
                  key={place.id}
                  place={place}
                  locale={locale}
                  onClick={handleExploreClick}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-secondary/10 to-red-50">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-secondary/20 rounded-full flex items-center justify-center">
                  <Shield className="h-7 w-7 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{locale === 'bn' ? 'নিরাপত্তা সর্বোচ্চ' : 'Safety First'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'bn' ? 'এক ক্লিকেই জরুরি সাহায্য পান' : 'Get emergency help with one click'}
                  </p>
                </div>
              </div>
                <Button variant="secondary" size="lg" onClick={() => window.open('tel:999')}>
                  <Phone className="h-5 w-5 mr-2" />
                  {locale === 'bn' ? 'জরুরি কল' : 'Emergency Call'}
                </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          className="h-16 w-16 rounded-full bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/40 transition-all"
          onClick={() => window.open('tel:999')}
        >
          <Phone className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
