'use client';

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for updates periodically
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New version detected, updating cache...');
                  }
                });
              }
            });

            // Auto-check for updates every 30 minutes
            setInterval(() => {
              registration.update().catch(() => {});
            }, 30 * 60 * 1000);
          })
          .catch((error) => {
            console.log('[PWA] Service Worker registration failed:', error);
          });
      });

      // Handle controller change (when new worker activates)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          // Soft refresh only if triggered by new worker
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}

