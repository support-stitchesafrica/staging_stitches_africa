// Service Worker utilities for registration and management

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export const registerServiceWorker = async (config?: ServiceWorkerConfig) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            config?.onUpdate?.(registration);
          }
        });
      }
    });

    // Check for existing service worker
    if (registration.active) {
      config?.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    config?.onError?.(error as Error);
  }
};

export const unregisterServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service Worker unregistered');
    }
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
  }
};

export const updateServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service Worker update triggered');
    }
  } catch (error) {
    console.error('Service Worker update failed:', error);
  }
};

export const skipWaiting = () => {
  if (typeof window === 'undefined' || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
};

// Cache management utilities
export const clearCache = async (cacheName?: string) => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log(`Cache ${cacheName} cleared`);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('All caches cleared');
    }
  } catch (error) {
    console.error('Cache clearing failed:', error);
  }
};

export const getCacheSize = async () => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Cache size calculation failed:', error);
    return 0;
  }
};

// Network status utilities
export const isOnline = () => {
  return typeof window !== 'undefined' && navigator.onLine;
};

export const addNetworkListener = (callback: (online: boolean) => void) => {
  if (typeof window === 'undefined') {
    // Return a no-op cleanup function for server-side rendering
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Always return a cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};