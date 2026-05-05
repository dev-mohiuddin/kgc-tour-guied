'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

export default function PWALoading() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);

    const startTime = Date.now();
    const minDuration = 1500;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min((elapsed / minDuration) * 100, 90);
      setProgress(rawProgress);
    }, 50);

    const handleLoad = () => {
      const remaining = minDuration - (Date.now() - startTime);
      const delay = Math.max(remaining, 200);

      clearInterval(progressInterval);
      setProgress(100);

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

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2,
                  }}
                  className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center"
                >
                  <MapPin className="h-8 w-8 text-primary" />
                </motion.div>
              </motion.div>

              <motion.div
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.5,
                }}
                className="absolute inset-0 h-24 w-24 rounded-full border-2 border-primary/30"
              />
              <motion.div
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.3, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 1.2,
                }}
                className="absolute inset-0 h-24 w-24 rounded-full border-2 border-primary/20"
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
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {progress < 30 ? 'লোড হচ্ছে...' : progress < 70 ? 'মানচিত্র প্রস্তুত হচ্ছে...' : progress < 100 ? 'প্রায় প্রস্তুত...' : 'শুরু করা হচ্ছে!'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}