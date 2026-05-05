'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function PWALoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setMounted(true);
    const startTime = Date.now();
    const minDuration = 1500;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min((elapsed / minDuration) * 100, 90);
      setProgress(rawProgress);
      if (rawProgress < 30) setPhase(0);
      else if (rawProgress < 70) setPhase(1);
      else setPhase(2);
    }, 50);

    const handleLoad = () => {
      const remaining = minDuration - (Date.now() - startTime);
      const delay = Math.max(remaining, 200);

      clearInterval(progressInterval);
      setProgress(100);
      setPhase(3);

      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearInterval(progressInterval);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!mounted || !isLoading) return null;

  const statusText = [
    'লোড হচ্ছে...',
    'মানচিত্র প্রস্তুত হচ্ছে...',
    'প্রায় প্রস্তুত...',
    'শুরু করা হচ্ছে!',
  ][phase];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div
            className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center"
            style={{
              animation: 'pwa-pulse 2s ease-in-out infinite',
            }}
          >
            <div
              className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center"
              style={{
                animation: 'pwa-pulse 2s ease-in-out infinite 0.2s',
              }}
            >
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div
            className="absolute inset-0 h-24 w-24 rounded-full border-2 border-primary/30"
            style={{ animation: 'pwa-ripple 1.8s ease-out infinite 0.5s' }}
          />
          <div
            className="absolute inset-0 h-24 w-24 rounded-full border-2 border-primary/20"
            style={{ animation: 'pwa-ripple 1.8s ease-out infinite 1.2s' }}
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1 font-bangla">
            Tour Guide
          </h1>
          <p className="text-sm text-muted-foreground">
            বাংলাদেশ ভ্রমণের সঙ্গী
          </p>
        </div>

        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
    </div>
  );
}