/**
 * AI Shopping Assistant Product Card
 * 
 * Displays product information in chat with quick action buttons
 * Features:
 * - Product image with fallback
 * - Product name and vendor
 * - Price display with discount
 * - Quick action buttons (Try It On, Add to Cart, View Details)
 * - Mobile responsive (350px width as per design spec)
 * - Smooth hover effects
 * - Performance optimized with React.memo
 */

'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Price, DiscountedPrice } from '@/components/common/Price';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onTryOn?: (product: Product) => void;
  className?: string;
}

// Track product click for AI recommendations
const trackProductClick = async (productId: string) => {
  try {
    // Get unique user identifier from localStorage or generate one
    let uniqueUserId = localStorage.getItem('ai-chat-unique-user-id');

    if (!uniqueUserId) {
      uniqueUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ai-chat-unique-user-id', uniqueUserId);
    }

    // Track the click interaction
    await fetch('/api/ai-assistant/user-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uniqueUserId,
        productId: productId,
        interactionType: 'click'
      }),
    });
  } catch (error) {
    console.warn('Could not track product click:', error);
  }
};

const ProductCardComponent = ({
  product,
  onAddToCart,
  onViewDetails,
  onTryOn,
  className,
}: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Get the main product image
  const productImage = product.thumbnail || product.images?.[0] || '/placeholder-product.svg';

  // Calculate final price with discount
  const basePrice = product.price?.base || 0;
  const discount = product.price?.discount || product.discount || 0;
  const finalPrice = discount > 0 ? basePrice - (basePrice * discount / 100) : basePrice;
  const currency = product.price?.currency || '$';

  // Format price with currency
  const formatPrice = (price: number) => {
    // Determine the actual currency code
    let currencyCode = 'NGN';
    let locale = 'en-NG';

    if (currency === 'USD' || currency === '$') {
      currencyCode = 'USD';
      locale = 'en-US';
    } else if (currency === '₦' || currency === 'NGN') {
      currencyCode = 'NGN';
      locale = 'en-NG';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get vendor name
  const vendorName = product.vendor?.name || product.tailor || 'Unknown Vendor';

  return (
    <div
      className={cn(
        "w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Product Image */}
      <div className="relative w-full h-[200px] sm:h-[280px] bg-gray-100">
        <Image
          src={imageError ? '/placeholder-product.svg' : productImage}
          alt={product.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes="(max-width: 640px) 100vw, 350px"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Featured
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Product Name */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight">
            {product.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
            {vendorName}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          {discount > 0 ? (
            <DiscountedPrice
              originalPrice={basePrice}
              salePrice={finalPrice}
              originalCurrency="USD"
              size="sm"
            />
          ) : (
            <Price
              price={finalPrice}
              originalCurrency="USD"
              size="sm"
              variant="accent"
            />
          )}
        </div>

        {/* Availability Status */}
        {product.availability && (
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                product.availability === 'in_stock' && "bg-green-500",
                product.availability === 'pre_order' && "bg-yellow-500",
                product.availability === 'out_of_stock' && "bg-red-500"
              )}
            />
            <span className="text-xs text-gray-600 capitalize">
              {product.availability === 'in_stock' && 'In Stock'}
              {product.availability === 'pre_order' && 'Pre-Order'}
              {product.availability === 'out_of_stock' && 'Out of Stock'}
            </span>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Try It On Button - Primary Action */}
          {/* {onTryOn && product.availability !== 'out_of_stock' && (
            <Button
              onClick={() => {
                trackProductClick(product.product_id);
                onTryOn(product);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white touch-manipulation transition-all active:scale-95"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Try It On
            </Button>
          )} */}

          {/* Secondary Actions */}
          <div className="flex gap-2 flex-wrap">
            {/* Add to Cart */}
            {onAddToCart && product.availability !== 'out_of_stock' && (
              <Button
                onClick={() => {
                  trackProductClick(product.product_id);
                  onAddToCart(product);
                }}
                variant="outline"
                className="flex-1 min-h-[44px] touch-manipulation transition-all active:scale-95 text-xs sm:text-sm"
                size="sm"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">{product.availability === 'pre_order' ? 'Pre Order' : 'Add to Cart'}</span>
                <span className="sm:hidden">Add to</span>
              </Button>
            )}

            {/* View Details */}
            {onViewDetails && (
              <Button
                onClick={() => {
                  trackProductClick(product.product_id);
                  onViewDetails(product);
                }}
                variant="outline"
                className="flex-1 min-h-[44px] touch-manipulation transition-all active:scale-95 text-xs sm:text-sm"
                size="sm"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Only re-render if product ID changes or handlers change
  return prevProps.product.product_id === nextProps.product.product_id &&
    prevProps.onAddToCart === nextProps.onAddToCart &&
    prevProps.onViewDetails === nextProps.onViewDetails &&
    prevProps.onTryOn === nextProps.onTryOn;
});

ProductCard.displayName = 'ProductCard';
