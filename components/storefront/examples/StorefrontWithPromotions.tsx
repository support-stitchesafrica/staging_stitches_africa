"use client";

import React from 'react';
import { TopPromotionalBanner, MiddlePromotionalBanner } from '../PromotionalBanner';
import { StorefrontPromotion } from '@/lib/storefront/promotion-service';

interface StorefrontWithPromotionsProps {
  vendorId: string;
  children: React.ReactNode;
}

/**
 * Example of how to integrate promotional banners into a complete storefront layout
 * This shows the recommended placement and configuration for different banner types
 */
export function StorefrontWithPromotions({ vendorId, children }: StorefrontWithPromotionsProps) {
  const handlePromotionClick = (promotion: StorefrontPromotion) => {
    // In a real app, you might:
    // - Navigate to a promotion landing page
    // - Show a modal with promotion details
    // - Apply a discount code automatically
    // - Track analytics events
    
    console.log('Promotion clicked:', promotion.title);
    
    // Example: Navigate to promotion page
    // router.push(`/promotions/${promotion.id}`);
    
    // Example: Apply discount code
    // if (promotion.discountInfo) {
    //   applyDiscountToCart(promotion);
    // }
  };

  const handlePromotionClose = (promotionId: string) => {
    // In a real app, you might:
    // - Store dismissed promotions in localStorage
    // - Track dismissal analytics
    // - Update user preferences
    
    console.log('Promotion dismissed:', promotionId);
    
    // Example: Store in localStorage
    // const dismissed = JSON.parse(localStorage.getItem('dismissedPromotions') || '[]');
    // dismissed.push(promotionId);
    // localStorage.setItem('dismissedPromotions', JSON.stringify(dismissed));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner - High Priority Announcements */}
      <TopPromotionalBanner
        vendorId={vendorId}
        maxBanners={1}
        showCloseButton={true}
        autoRotate={false}
        onPromotionClick={handlePromotionClick}
        onPromotionClose={handlePromotionClose}
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">My Storefront</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900">Products</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">About</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Middle Banner - Content Area Promotions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <MiddlePromotionalBanner
          vendorId={vendorId}
          maxBanners={2}
          showCloseButton={true}
          autoRotate={true}
          rotationInterval={6000}
          onPromotionClick={handlePromotionClick}
          onPromotionClose={handlePromotionClose}
          className="rounded-lg shadow-sm"
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 My Storefront. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Example usage component
export function StorefrontExample() {
  return (
    <StorefrontWithPromotions vendorId="example-vendor-123">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock product cards */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">Product {i}</h3>
                  <p className="text-gray-600 text-sm mt-1">Product description here</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">$99.99</span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Store</h2>
          <p className="text-gray-600 leading-relaxed">
            Welcome to our storefront! We offer high-quality products with excellent customer service.
            Check out our current promotions above and don't miss our limited-time offers.
          </p>
        </section>
      </div>
    </StorefrontWithPromotions>
  );
}