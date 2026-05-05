'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);
            // Check for updates periodically
            setInterval(() => registration.update(), 60 * 60 * 1000);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    }

    // PWA install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Hide prompt if already installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-80 z-50 bg-white border border-emerald-200 rounded-xl shadow-lg p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install Tour Guide</p>
        <p className="text-xs text-muted-foreground mt-0.5">Use offline & get faster access</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium"
        >
          Install
        </button>
      </div>
    </div>
  );
}