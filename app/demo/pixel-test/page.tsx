/**
 * Demo page for testing social media pixel functionality
 */

'use client';

import React, { useState } from 'react';
import PixelTracker, { usePixelTracking } from '@/components/storefront/PixelTracker';
import { SocialPixelConfig } from '@/types/storefront';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PixelTestPage() {
  const [config] = useState<SocialPixelConfig>({
    facebook: {
      pixelId: '123456789012345',
      enabled: true,
    },
    tiktok: {
      pixelId: 'ABCD1234567890EFGH12',
      enabled: true,
    },
    snapchat: {
      pixelId: 'abc123-def456-789012-345678',
      enabled: true,
    },
  });

  const { trackProductView, trackAddToCart, trackCheckoutStart, trackPurchase, trackCustomEvent } = usePixelTracking();

  const handleTrackProductView = () => {
    trackProductView('demo-product-123', 'Demo Product', 29.99);
    console.log('Tracked product view');
  };

  const handleTrackAddToCart = () => {
    trackAddToCart('demo-product-123', 'Demo Product', 29.99, 1);
    console.log('Tracked add to cart');
  };

  const handleTrackCheckoutStart = () => {
    trackCheckoutStart([
      { id: 'demo-product-123', name: 'Demo Product', price: 29.99, quantity: 1 },
      { id: 'demo-product-456', name: 'Another Product', price: 19.99, quantity: 2 },
    ]);
    console.log('Tracked checkout start');
  };

  const handleTrackPurchase = () => {
    trackPurchase('order-789', [
      { id: 'demo-product-123', name: 'Demo Product', price: 29.99, quantity: 1 },
      { id: 'demo-product-456', name: 'Another Product', price: 19.99, quantity: 2 },
    ]);
    console.log('Tracked purchase');
  };

  const handleTrackCustomEvent = () => {
    trackCustomEvent('CustomEvent', { custom_parameter: 'test_value' });
    console.log('Tracked custom event');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <PixelTracker 
        config={config}
        vendorId="demo-vendor"
        storefrontHandle="demo-store"
      />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Social Media Pixel Test Page</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pixel Configuration</CardTitle>
              <CardDescription>Current pixel settings for testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Facebook Pixel:</span>
                  <span className="font-mono text-sm">{config.facebook?.pixelId}</span>
                </div>
                <div className="flex justify-between">
                  <span>TikTok Pixel:</span>
                  <span className="font-mono text-sm">{config.tiktok?.pixelId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Snapchat Pixel:</span>
                  <span className="font-mono text-sm">{config.snapchat?.pixelId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Tracking</CardTitle>
              <CardDescription>Test different pixel events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleTrackProductView} className="w-full">
                Track Product View
              </Button>
              <Button onClick={handleTrackAddToCart} className="w-full">
                Track Add to Cart
              </Button>
              <Button onClick={handleTrackCheckoutStart} className="w-full">
                Track Checkout Start
              </Button>
              <Button onClick={handleTrackPurchase} className="w-full">
                Track Purchase
              </Button>
              <Button onClick={handleTrackCustomEvent} className="w-full" variant="outline">
                Track Custom Event
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open your browser's developer console to see tracking events</li>
              <li>Click the buttons above to fire different pixel events</li>
              <li>Check the console for confirmation messages</li>
              <li>In a real implementation, these would fire to Facebook, TikTok, and Snapchat</li>
              <li>The pixel IDs used here are demo values for testing purposes</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Browser Console Output</CardTitle>
            <CardDescription>Expected console messages when events are fired</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
              <div>fbq('track', 'ViewContent', {'{...}'})</div>
              <div>ttq.track('ViewContent', {'{...}'})</div>
              <div>snaptr('track', 'VIEW_CONTENT', {'{...}'})</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}