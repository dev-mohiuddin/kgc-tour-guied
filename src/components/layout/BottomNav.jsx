'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Compass, Route, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravelStore } from '@/store/useTravelStore';

const navItems = [
  { href: '/', icon: MapPin, labelBn: 'হোম', labelEn: 'Home' },
  { href: '/discover', icon: Compass, labelBn: 'Discover', labelEn: 'Discover' },
  { href: '/route', icon: Route, labelBn: 'রুট', labelEn: 'Route' },
  { href: '/saved', icon: Bookmark, labelBn: 'সংরক্ষিত', labelEn: 'Saved' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { language, selectedPlaces } = useTravelStore();
  const locale = language === 'bn' ? 'bn' : 'en';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const label = locale === 'bn' ? item.labelBn : item.labelEn;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 left-0 right-0 mx-auto w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative flex flex-col items-center gap-0.5">
                <item.icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
              {/* Route badge */}
              {item.href === '/route' && selectedPlaces.length > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {selectedPlaces.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
