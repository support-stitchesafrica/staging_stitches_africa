"use client";

import React from 'react';
import { BOGOIndicator } from '../BOGOIndicator';

export function BOGOIndicatorExample() {
  // Mock data for demonstration
  const mockMainProduct = {
    id: 'main-1',
    name: 'Premium Cotton T-Shirt',
    price: 29.99,
  };

  const mockFreeProducts = [
    {
      id: 'free-1',
      name: 'Cotton Socks',
      price: 9.99,
    },
    {
      id: 'free-2',
      name: 'Baseball Cap',
      price: 15.99,
    },
  ];

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">BOGO Indicator Examples</h1>
        
        {/* Compact Variant */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Compact Variant</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BOGOIndicator
              mainProduct={mockMainProduct}
              freeProducts={[mockFreeProducts[0]]}
              totalSavings={9.99}
              variant="compact"
            />
          </div>
        </div>

        {/* Detailed Variant (Default) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Detailed Variant (Default)</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BOGOIndicator
              mainProduct={mockMainProduct}
              freeProducts={[mockFreeProducts[0]]}
              totalSavings={9.99}
              daysUntilExpiry={3}
            />
          </div>
        </div>

        {/* Multiple Free Products */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Multiple Free Products</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BOGOIndicator
              mainProduct={mockMainProduct}
              freeProducts={mockFreeProducts}
              totalSavings={25.98}
              promotionName="Holiday Special BOGO"
              daysUntilExpiry={1}
            />
          </div>
        </div>

        {/* Banner Variant */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Banner Variant</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BOGOIndicator
              mainProduct={mockMainProduct}
              freeProducts={[mockFreeProducts[0]]}
              totalSavings={9.99}
              variant="banner"
              promotionName="December Special"
              description="Limited time offer with free shipping included!"
              daysUntilExpiry={5}
            />
          </div>
        </div>

        {/* Custom Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">With Custom Description</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BOGOIndicator
              mainProduct={mockMainProduct}
              freeProducts={[mockFreeProducts[0]]}
              totalSavings={9.99}
              promotionName="Flash Sale"
              description="This exclusive offer is only available for the next 24 hours. Don't miss out on this amazing deal!"
              showDetails={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}