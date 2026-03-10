"use client";

import React from 'react';
import { PromotionalBadge } from '../PromotionalBadge';

export function PromotionalBadgeExample() {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <div>
        <h2 className="text-2xl font-bold mb-4">Promotional Badge Examples</h2>
        <p className="text-gray-600 mb-6">
          Different variants and configurations of the promotional badge component.
        </p>
      </div>

      {/* Default Variant */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Variant</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge discountPercentage={25} />
          <PromotionalBadge discountPercentage={50} text="MEGA SALE" />
          <PromotionalBadge discountPercentage={15} text="LIMITED TIME" color="orange" />
        </div>
      </div>

      {/* Compact Variant */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Compact Variant</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge discountPercentage={20} variant="compact" />
          <PromotionalBadge discountPercentage={35} variant="compact" color="green" />
          <PromotionalBadge discountPercentage={10} variant="compact" showIcon={false} />
        </div>
      </div>

      {/* Minimal Variant */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Minimal Variant</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge discountPercentage={30} variant="minimal" />
          <PromotionalBadge discountPercentage={45} variant="minimal" color="blue" />
          <PromotionalBadge discountPercentage={60} variant="minimal" color="purple" />
        </div>
      </div>

      {/* Different Sizes */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Different Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <PromotionalBadge discountPercentage={25} size="sm" />
          <PromotionalBadge discountPercentage={25} size="md" />
          <PromotionalBadge discountPercentage={25} size="lg" />
        </div>
      </div>

      {/* Different Colors */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Different Colors</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge discountPercentage={20} color="red" />
          <PromotionalBadge discountPercentage={20} color="orange" />
          <PromotionalBadge discountPercentage={20} color="green" />
          <PromotionalBadge discountPercentage={20} color="blue" />
          <PromotionalBadge discountPercentage={20} color="purple" />
        </div>
      </div>

      {/* Product Card Example */}
      <div>
        <h3 className="text-lg font-semibold mb-3">In Product Card Context</h3>
        <div className="relative bg-white rounded-lg shadow-md p-4 w-64">
          <div className="absolute top-2 right-2">
            <PromotionalBadge discountPercentage={30} variant="compact" />
          </div>
          <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
          <h4 className="font-semibold text-gray-900">Sample Product</h4>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-gray-900">$49.99</span>
            <span className="text-sm text-gray-500 line-through">$71.41</span>
          </div>
        </div>
      </div>
    </div>
  );
}