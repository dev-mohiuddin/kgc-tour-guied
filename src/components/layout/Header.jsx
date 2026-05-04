'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Route, Bookmark, Globe, Compass } from 'lucide-react';
import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTravelStore } from '@/store/useTravelStore';

const translations = {
  bn: {
    'common.home': 'হোম',
    'common.discover': 'Discover',
    'common.route': 'রুট',
    'common.saved': 'সংরক্ষিত',
  },
  en: {
    'common.home': 'Home',
    'common.discover': 'Discover',
    'common.route': 'Route',
    'common.saved': 'Saved',
  }
};

const Header = memo(function Header() {
  const pathname = usePathname();
  const { language, setLanguage, selectedPlaces } = useTravelStore();
  const locale = language === 'bn' ? 'bn' : 'en';
  const [messages, setMessages] = useState(translations[locale]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import(`@/locales/${locale}.json`);
        if (mounted) {
          setMessages({ ...translations[locale], ...(mod.default || mod) });
        }
      } catch {
        if (mounted) setMessages(translations[locale]);
      }
    })();
    return () => { mounted = false; };
  }, [locale]);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let v = messages;
    for (const k of keys) v = v?.[k];
    return v || key;
  }, [messages]);

  const toggleLang = useCallback(() => {
    setLanguage(locale === 'bn' ? 'en' : 'bn');
  }, [locale, setLanguage]);

  const navItems = useMemo(() => [
    { href: '/', icon: MapPin, label: t('common.home') },
    { href: '/discover', icon: Compass, label: t('common.discover') },
    { href: '/route', icon: Route, label: t('common.route') },
    { href: '/saved', icon: Bookmark, label: t('common.saved') },
  ], [t]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <MapPin className="h-6 w-6 text-primary" />
          </motion.div>
          <span className="font-bold text-xl">KGC Tour Guide</span>
        </Link>

        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center text-sm font-medium transition-colors hover:text-primary relative ${
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
              {item.href === '/route' && selectedPlaces.length > 0 && (
                <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {selectedPlaces.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={toggleLang}>
            <Globe className="h-4 w-4 mr-2" />
            {locale === 'bn' ? 'English' : 'বাংলা'}
          </Button>
        </div>
      </div>
    </header>
  );
});

export default Header;
