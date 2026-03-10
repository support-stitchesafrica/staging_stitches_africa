"use client";

import React from 'react';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromotionalBadge } from './PromotionalBadge';
import { SavingsCalculator } from './SavingsCalculator';
import { BOGOIndicator } from './BOGOIndicator';
import { PromotionService, StorefrontPromotion } from '@/lib/storefront/promotion-service';

interface Product {
  id: string;
  name: string;
  originalPrice: number;
  image?: string;
  category?: string;
}

interface PromotionalProductCardProps {
  product: Product;
  promotion?: StorefrontPromotion;
  bogoOffer?: {
    freeProducts: Array<{
      id: string;
      name: string;
      price: number;
      image?: string;
    }>;
  };
  className?: string;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  showSavingsDetails?: boolean;
}

export function PromotionalProductCard({
  product,
  promotion,
  bogoOffer,
  className,
  onAddToCart,
  onToggleWishlist,
  onViewProduct,
  showSavingsDetails = true,
}: PromotionalProductCardProps) {
  // Calculate promotional pricing
  const pricingInfo = promotion 
    ? PromotionService.applyPromotionToPrice(product.originalPrice, promotion)
    : {
        salePrice: product.originalPrice,
        savingsAmount: 0,
        discountPercentage: 0,
      };

  const { salePrice, savingsAmount, discountPercentage } = pricingInfo;
  const hasDiscount = savingsAmount > 0;

  return (
    <div
      data-testid="promotional-product-card"
      className={cn(
        'bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100',
        className
      )}
    >
      {/* Product Image with Badges */}
      <div className="relative aspect-square bg-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        {/* Promotional Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <PromotionalBadge
              discountPercentage={discountPercentage}
              originalPrice={product.originalPrice}
              salePrice={salePrice}
              variant="compact"
              size="sm"
            />
          )}
          
          {bogoOffer && (
            <PromotionalBadge
              discountPercentage={50} // BOGO is typically 50% savings
              text="BOGO"
              variant="compact"
              size="sm"
              color="green"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={() => onToggleWishlist?.(product.id)}
            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>
          
          <button
            onClick={() => onViewProduct?.(product.id)}
            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
            aria-label="View product"
          >
            <Eye className="w-4 h-4 text-gray-600 hover:text-blue-500" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          {product.category && (
            <p className="text-sm text-gray-500">{product.category}</p>
          )}
        </div>

        {/* Pricing Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">
              ${salePrice.toFixed(2)}
            </span>
            
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Savings Display */}
          {hasDiscount && showSavingsDetails && (
            <SavingsCalculator
              originalPrice={product.originalPrice}
              salePrice={salePrice}
              variant="inline"
              size="sm"
            />
          )}
        </div>

        {/* BOGO Offer Details */}
        {bogoOffer && (
          <div className="mb-4">
            <BOGOIndicator
              mainProduct={{
                id: product.id,
                name: product.name,
                price: salePrice,
              }}
              freeProducts={bogoOffer.freeProducts}
              totalSavings={bogoOffer.freeProducts[0]?.price || 0}
              variant="compact"
              size="sm"
            />
          </div>
        )}

        {/* Detailed Savings Card */}
        {hasDiscount && showSavingsDetails && (
          <div className="mb-4">
            <SavingsCalculator
              originalPrice={product.originalPrice}
              salePrice={salePrice}
              variant="card"
              size="sm"
            />
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart?.(product.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// Example usage component for testing
export function PromotionalProductCardExample() {
  const sampleProduct: Product = {
    id: 'product-1',
    name: 'Premium Cotton T-Shirt',
    originalPrice: 29.99,
    category: 'Clothing',
  };

  const samplePromotion: StorefrontPromotion = {
    id: 'promo-1',
    vendorId: 'vendor-1',
    type: 'product_specific',
    title: '25% Off Sale',
    description: '25% off selected items',
    bannerMessage: '25% OFF - Limited Time!',
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
      value: 25,
    },
  };

  const sampleBogoOffer = {
    freeProducts: [
      {
        id: 'free-1',
        name: 'Basic Cotton T-Shirt',
        price: 19.99,
      },
    ],
  };

  return (
    <div className="max-w-sm">
      <PromotionalProductCard
        product={sampleProduct}
        promotion={samplePromotion}
        bogoOffer={sampleBogoOffer}
        onAddToCart={(id) => console.log('Add to cart:', id)}
        onToggleWishlist={(id) => console.log('Toggle wishlist:', id)}
        onViewProduct={(id) => console.log('View product:', id)}
      />
    </div>
  );
}