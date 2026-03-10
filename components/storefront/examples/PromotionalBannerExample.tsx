"use client";

import React from 'react';
import { PromotionalBanner, TopPromotionalBanner, MiddlePromotionalBanner, BottomPromotionalBanner } from '../PromotionalBanner';
import { StorefrontPromotion } from '@/lib/storefront/promotion-service';

/**
 * Example component demonstrating how to use PromotionalBanner
 * This shows different usage patterns and configurations
 */
export function PromotionalBannerExample() {
  const handlePromotionClick = (promotion: StorefrontPromotion) => {
    console.log('Promotion clicked:', promotion);
    // In a real app, you might navigate to a promotion page or show a modal
  };

  const handlePromotionClose = (promotionId: string) => {
    console.log('Promotion closed:', promotionId);
    // In a real app, you might store this in localStorage or user preferences
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Promotional Banner Examples</h2>
        <p className="text-gray-600 mb-6">
          These examples show different ways to use the PromotionalBanner component
          in your storefront. The banners use mock data from the promotion service.
        </p>
      </div>

      {/* Example 1: Top Banner */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Top Banner (Header Area)</h3>
        <p className="text-sm text-gray-600">
          Typically used at the top of the page for high-priority announcements
        </p>
        <div className="border rounded-lg overflow-hidden">
          <TopPromotionalBanner
            vendorId="example-vendor"
            maxBanners={1}
            showCloseButton={true}
            autoRotate={false}
            onPromotionClick={handlePromotionClick}
            onPromotionClose={handlePromotionClose}
          />
        </div>
      </div>

      {/* Example 2: Middle Banner with Auto-rotation */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Middle Banner with Auto-rotation</h3>
        <p className="text-sm text-gray-600">
          Shows multiple promotions with automatic rotation every 5 seconds
        </p>
        <div className="border rounded-lg overflow-hidden">
          <MiddlePromotionalBanner
            vendorId="example-vendor"
            maxBanners={3}
            showCloseButton={true}
            autoRotate={true}
            rotationInterval={5000}
            onPromotionClick={handlePromotionClick}
            onPromotionClose={handlePromotionClose}
          />
        </div>
      </div>

      {/* Example 3: Bottom Banner - Minimal */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Bottom Banner (Footer Area)</h3>
        <p className="text-sm text-gray-600">
          Subtle promotions that don't interfere with main content
        </p>
        <div className="border rounded-lg overflow-hidden">
          <BottomPromotionalBanner
            vendorId="example-vendor"
            maxBanners={1}
            showCloseButton={false}
            autoRotate={false}
            onPromotionClick={handlePromotionClick}
          />
        </div>
      </div>

      {/* Example 4: All Positions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">All Positions (Mixed Priority)</h3>
        <p className="text-sm text-gray-600">
          Shows promotions from all positions, sorted by priority
        </p>
        <div className="border rounded-lg overflow-hidden">
          <PromotionalBanner
            vendorId="example-vendor"
            position="all"
            maxBanners={2}
            showCloseButton={true}
            autoRotate={true}
            rotationInterval={3000}
            onPromotionClick={handlePromotionClick}
            onPromotionClose={handlePromotionClose}
            className="shadow-sm"
          />
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Instructions</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>vendorId:</strong> The ID of the vendor whose promotions to display</p>
          <p><strong>position:</strong> Filter by banner position ('top', 'middle', 'bottom', or 'all')</p>
          <p><strong>maxBanners:</strong> Maximum number of promotions to show</p>
          <p><strong>showCloseButton:</strong> Whether users can dismiss banners</p>
          <p><strong>autoRotate:</strong> Automatically cycle through multiple promotions</p>
          <p><strong>rotationInterval:</strong> Time between rotations in milliseconds</p>
          <p><strong>onPromotionClick:</strong> Callback when a banner is clicked</p>
          <p><strong>onPromotionClose:</strong> Callback when a banner is dismissed</p>
        </div>
      </div>

      {/* Integration Notes */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Integration Notes</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• The component automatically loads promotions from the PromotionService</p>
          <p>• Promotions are filtered by active status and date range</p>
          <p>• Multiple banners support navigation and auto-rotation</p>
          <p>• Responsive design works on mobile and desktop</p>
          <p>• Accessibility features include proper ARIA labels</p>
          <p>• Closed promotions are remembered during the session</p>
        </div>
      </div>
    </div>
  );
}