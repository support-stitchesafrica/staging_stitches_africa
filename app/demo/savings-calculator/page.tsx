"use client";

import React, { useState } from 'react';
import { PromotionalBadge } from '@/components/storefront/PromotionalBadge';
import { SavingsCalculator, InlineSavings, SavingsCard, DetailedSavings } from '@/components/storefront/SavingsCalculator';
import { PromotionalProductCard, PromotionalProductCardExample } from '@/components/storefront/PromotionalProductCard';
import { PromotionService, StorefrontPromotion } from '@/lib/storefront/promotion-service';

export default function SavingsCalculatorDemo() {
  const [originalPrice, setOriginalPrice] = useState(100);
  const [discountPercentage, setDiscountPercentage] = useState(25);
  
  const salePrice = originalPrice * (1 - discountPercentage / 100);
  const savingsAmount = PromotionService.calculateSavingsAmount(originalPrice, salePrice);

  const samplePromotion: StorefrontPromotion = {
    id: 'demo-promo',
    vendorId: 'demo-vendor',
    type: 'product_specific',
    title: `${discountPercentage}% Off Sale`,
    description: `${discountPercentage}% off selected items`,
    bannerMessage: `${discountPercentage}% OFF - Limited Time!`,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    displaySettings: {
      backgroundColor: '#f59e0b',
      textColor: '#ffffff',
      position: 'top',
      priority: 1,
      showIcon: true,
      iconType: 'percent',
    },
    discountInfo: {
      type: 'percentage',
      value: discountPercentage,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Savings Calculator Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of the savings calculation functionality
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price: ${originalPrice.toFixed(2)}
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount: {discountPercentage}%
              </label>
              <input
                type="range"
                min="5"
                max="75"
                step="5"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">${originalPrice.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Original Price</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">${salePrice.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Sale Price</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">${savingsAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">You Save</div>
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Badge Variants */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Promotional Badge Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Default</h3>
              <PromotionalBadge
                discountPercentage={discountPercentage}
                originalPrice={originalPrice}
                salePrice={salePrice}
                showSavingsAmount={true}
              />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Compact</h3>
              <PromotionalBadge
                discountPercentage={discountPercentage}
                variant="compact"
              />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Minimal</h3>
              <PromotionalBadge
                discountPercentage={discountPercentage}
                variant="minimal"
              />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Savings</h3>
              <PromotionalBadge
                discountPercentage={discountPercentage}
                originalPrice={originalPrice}
                salePrice={salePrice}
                variant="savings"
              />
            </div>
          </div>
        </div>

        {/* Savings Calculator Variants */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Savings Calculator Variants</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Inline Savings</h3>
              <InlineSavings originalPrice={originalPrice} salePrice={salePrice} />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Savings Card</h3>
              <SavingsCard originalPrice={originalPrice} salePrice={salePrice} />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Detailed Savings</h3>
              <DetailedSavings originalPrice={originalPrice} salePrice={salePrice} />
            </div>
          </div>
        </div>

        {/* Product Card Example */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Product Card with Savings</h2>
          <div className="flex justify-center">
            <PromotionalProductCard
              product={{
                id: 'demo-product',
                name: 'Premium Cotton T-Shirt',
                originalPrice: originalPrice,
                category: 'Clothing',
              }}
              promotion={samplePromotion}
              onAddToCart={(id) => alert(`Added ${id} to cart`)}
              onToggleWishlist={(id) => alert(`Toggled wishlist for ${id}`)}
              onViewProduct={(id) => alert(`Viewing product ${id}`)}
            />
          </div>
        </div>

        {/* API Examples */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Usage Examples</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="mb-2">// Calculate savings amount</div>
            <div className="mb-2">const savingsAmount = PromotionService.calculateSavingsAmount({originalPrice}, {salePrice.toFixed(2)});</div>
            <div className="mb-2">// Result: {savingsAmount.toFixed(2)}</div>
            <br />
            <div className="mb-2">// Calculate discount percentage</div>
            <div className="mb-2">const discountPercentage = PromotionService.calculateDiscountPercentage({originalPrice}, {salePrice.toFixed(2)});</div>
            <div className="mb-2">// Result: {discountPercentage.toFixed(1)}%</div>
            <br />
            <div className="mb-2">// Apply promotion to price</div>
            <div className="mb-2">const result = PromotionService.applyPromotionToPrice({originalPrice}, promotion);</div>
            <div className="mb-2">// Result: {JSON.stringify(PromotionService.applyPromotionToPrice(originalPrice, samplePromotion), null, 2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}