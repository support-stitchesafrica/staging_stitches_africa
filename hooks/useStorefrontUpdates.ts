'use client';

import { useEffect, useState } from 'react';
import { ThemeConfiguration } from '@/types/storefront';

interface StorefrontUpdate {
  vendorId: string;
  templateId?: string;
  theme?: ThemeConfiguration;
  heroContent?: {
    title?: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  businessInfo?: {
    businessName?: string;
    description?: string;
    handle?: string;
    slogan?: string;
  };
}

export function useStorefrontUpdates(vendorId: string) {
  const [lastUpdate, setLastUpdate] = useState<StorefrontUpdate | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!vendorId || typeof window === 'undefined') return;

    // Listen for BroadcastChannel updates
    let channel: BroadcastChannel | null = null;
    
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(`storefront_updates_${vendorId}`);
      
      channel.onmessage = (event) => {
        if (event.data.type === 'STOREFRONT_UPDATE' && event.data.vendorId === vendorId) {
          console.log('Received storefront update:', event.data.update);
          setLastUpdate(event.data.update);
          setUpdateCount(prev => prev + 1);
        }
      };
    }

    // Listen for postMessage updates (for iframe previews)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'STOREFRONT_UPDATE' && event.data.vendorId === vendorId) {
        console.log('Received storefront update via postMessage:', event.data.update);
        setLastUpdate(event.data.update);
        setUpdateCount(prev => prev + 1);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [vendorId]);

  return {
    lastUpdate,
    updateCount,
    hasUpdates: updateCount > 0
  };
}