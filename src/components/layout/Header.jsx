'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Route, Bookmark, Globe, Menu, X, Compass } from 'lucide-react';
import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const fallbackTranslations = {
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState(fallbackTranslations.en);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import(`@/locales/${locale}.json`);
        const json = mod.default || mod;
        if (mounted) {
          // Merge JSON with static fallbacks so all keys exist
          setMessages({ ...fallbackTranslations[locale], ...json });
        }
      } catch (e) {
        if (mounted) setMessages(fallbackTranslations[locale]);
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
    setLocale(prev => prev === 'bn' ? 'en' : 'bn');
  }, []);

  const navItems = useMemo(() => [
    { href: '/', icon: MapPin, label: t('common.home') },
    { href: '/discover', icon: Compass, label: t('common.discover') },
    { href: '/route', icon: Route, label: t('common.route') },
    { href: '/saved', icon: Bookmark, label: t('common.saved') },
  ], [t]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <MapPin className="h-6 w-6 text-primary" />
          </motion.div>
          <span className="font-bold text-xl hidden sm:inline-block">KGC Tour Guide</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={toggleLang} className="hidden sm:flex">
            <Globe className="h-4 w-4 mr-2" />
            {locale === 'bn' ? 'English' : 'বাংলা'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t"
          >
            <nav className="container flex flex-col p-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              ))}
              <Button variant="outline" onClick={toggleLang} className="w-full">
                <Globe className="h-4 w-4 mr-2" />
                {locale === 'bn' ? 'English' : 'বাংলা'}
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
});

export default Header;
