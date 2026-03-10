"use client";

import React from 'react';
import { Gift, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavingsCalculator } from './SavingsCalculator';

interface BOGOIndicatorProps {
  /** Main product information */
  mainProduct: {
    id: string;
    name: string;
    price: number;
  };
  /** Free products available */
  freeProducts: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
  }>;
  /** Total savings amount */
  totalSavings: number;
  /** Promotion name/title */
  promotionName?: string;
  /** Custom description */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant */
  variant?: 'compact' | 'detailed' | 'banner';
  /** Custom styling */
  className?: string;
  /** Show detailed explanation */
  showDetails?: boolean;
  /** Days until expiry (for urgency) */
  daysUntilExpiry?: number;
}

export function BOGOIndicator({
  mainProduct,
  freeProducts,
  totalSavings,
  promotionName = "Buy One Get One FREE",
  description,
  size = 'md',
  variant = 'detailed',
  className,
  showDetails = true,
  daysUntilExpiry,
}: BOGOIndicatorProps) {
  // Don't render if no free products
  if (!freeProducts || freeProducts.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs p-3',
    md: 'text-sm p-4',
    lg: 'text-base p-6',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Compact variant - minimal BOGO badge
  if (variant === 'compact') {
    return (
      <div
        data-testid="bogo-indicator"
        className={cn(
          'inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full shadow-lg',
          sizeClasses[size],
          className
        )}
      >
        <Gift className={iconSizes[size]} />
        <span>BOGO</span>
        <Sparkles className={iconSizes[size]} />
      </div>
    );
  }

  // Banner variant - full width promotional banner
  if (variant === 'banner') {
    return (
      <div
        data-testid="bogo-indicator"
        className={cn(
          'w-full bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl',
          sizeClasses[size],
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold">
              <Gift className={iconSizes[size]} />
              <span>BOGO OFFER</span>
              <Sparkles className={iconSizes[size]} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{promotionName}</h3>
              <SavingsCalculator
                originalPrice={mainProduct.price + (freeProducts[0]?.price || 0)}
                salePrice={mainProduct.price}
                variant="inline"
                size="md"
              />
            </div>
          </div>
          {daysUntilExpiry && daysUntilExpiry <= 7 && (
            <div className="text-red-600 font-bold text-sm">
              {daysUntilExpiry === 1 ? 'Last day!' : `${daysUntilExpiry} days left`}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-800">How it works:</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Add <strong>{mainProduct.name}</strong> to your cart and get{' '}
            {freeProducts.length === 1 ? (
              <strong>{freeProducts[0].name}</strong>
            ) : (
              `your choice of ${freeProducts.length} free items`
            )}{' '}
            absolutely FREE! No additional charges, no hidden fees.
          </p>
        </div>
      </div>
    );
  }

  // Default detailed variant
  return (
    <div
      data-testid="bogo-indicator"
      className={cn(
        'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg',
        sizeClasses[size],
        className
      )}
    >
      {/* Header with BOGO badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-sm">
            <Gift className="w-4 h-4" />
            <span>BOGO</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{promotionName}</h3>
            <SavingsCalculator
              originalPrice={mainProduct.price + (freeProducts[0]?.price || 0)}
              salePrice={mainProduct.price}
              variant="inline"
              size="sm"
            />
          </div>
        </div>
        
        {daysUntilExpiry && daysUntilExpiry <= 7 && (
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-sm">
            {daysUntilExpiry === 1 ? 'Last day!' : `${daysUntilExpiry} days left`}
          </div>
        )}
      </div>

      {/* Clear explanation */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">1</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Buy this item:</p>
            <p className="text-gray-600 text-sm">{mainProduct.name} - ${mainProduct.price.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-sm">2</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Get FREE:</p>
            {freeProducts.length === 1 ? (
              <p className="text-gray-600 text-sm">
                {freeProducts[0].name} - <span className="line-through">${freeProducts[0].price.toFixed(2)}</span>{' '}
                <span className="text-green-600 font-bold">FREE</span>
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-gray-600 text-sm">Choose from {freeProducts.length} options:</p>
                <div className="ml-2 space-y-1">
                  {freeProducts.slice(0, 3).map((product) => (
                    <p key={product.id} className="text-gray-600 text-xs">
                      • {product.name} - <span className="line-through">${product.price.toFixed(2)}</span>{' '}
                      <span className="text-green-600 font-bold">FREE</span>
                    </p>
                  ))}
                  {freeProducts.length > 3 && (
                    <p className="text-gray-500 text-xs">
                      + {freeProducts.length - 3} more options
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Free item(s) automatically added to cart</li>
                  <li>• No promo code needed</li>
                  <li>• Free shipping included</li>
                  {freeProducts.length > 1 && <li>• Choose your preferred free item at checkout</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom description if provided */}
      {description && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-green-100">
          <p className="text-sm text-gray-700">{description}</p>
        </div>
      )}
    </div>
  );
}