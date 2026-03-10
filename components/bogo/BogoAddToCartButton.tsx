"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Gift, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useBogoBadge } from '@/hooks/useBogoBadges';
import type { Product } from '@/types';

interface BogoAddToCartButtonProps {
  product: Product;
  quantity?: number;
  selectedOptions?: Record<string, string>;
  className?: string;
  onAddToCart?: () => void;
  disabled?: boolean;
}

export const BogoAddToCartButton: React.FC<BogoAddToCartButtonProps> = ({
  product,
  quantity = 1,
  selectedOptions = {},
  className = '',
  onAddToCart,
  disabled = false,
}) => {
  const { addItemWithBogo, items } = useCart();
  const { isFreeProduct, isMainProduct, loading } = useBogoBadge(product.product_id);
  const [canAddFreeProduct, setCanAddFreeProduct] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFreeProductEligibility = async () => {
      if (!isFreeProduct) {
        setCanAddFreeProduct(true);
        return;
      }

      try {
        const { bogoBadgeService } = await import('@/lib/bogo/badge-service');
        const canAdd = await bogoBadgeService.canAddFreeProduct(product.product_id, items);
        setCanAddFreeProduct(canAdd);
      } catch (error) {
        console.error('Failed to check free product eligibility:', error);
        setCanAddFreeProduct(false);
      }
    };

    checkFreeProductEligibility();
  }, [isFreeProduct, product.product_id, items]);

  const handleAddToCart = async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    setError(null);

    try {
      if (isFreeProduct && !canAddFreeProduct) {
        // Show error for free product without main product
        const { bogoBadgeService } = await import('@/lib/bogo/badge-service');
        const message = bogoBadgeService.getFreeProductRestrictionMessage();
        setError(message);
        return;
      }

      // Use BOGO-aware add to cart
      await addItemWithBogo(product, quantity, selectedOptions);
      
      // Call optional callback
      onAddToCart?.();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      setError(error instanceof Error ? error.message : 'Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const getButtonText = () => {
    if (isAdding) return 'Adding...';
    
    if (isFreeProduct && !canAddFreeProduct) {
      return 'Requires Main Product';
    }
    
    if (isMainProduct) {
      return 'Add to Cart (BOGO)';
    }
    
    return 'Add to Cart';
  };

  const getButtonIcon = () => {
    if (isFreeProduct && !canAddFreeProduct) {
      return <AlertCircle className="w-4 h-4" />;
    }
    
    if (isMainProduct) {
      return <Gift className="w-4 h-4" />;
    }
    
    return <ShoppingCart className="w-4 h-4" />;
  };

  const isButtonDisabled = disabled || isAdding || loading || (isFreeProduct && !canAddFreeProduct);

  return (
    <div className="space-y-3">
      <Button
        onClick={handleAddToCart}
        disabled={isButtonDisabled}
        className={`w-full ${className}`}
        variant={isMainProduct ? 'default' : 'default'}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Free Product Info */}
      {isFreeProduct && !canAddFreeProduct && (
        <Alert>
          <Gift className="h-4 w-4" />
          <AlertDescription>
            This item is only available as part of the December BOGO promotion. 
            Add the qualifying main product to your cart first.
          </AlertDescription>
        </Alert>
      )}

      {/* BOGO Success Info */}
      {isMainProduct && (
        <Alert className="border-green-200 bg-green-50">
          <Gift className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            🎉 Adding this item will include a free product and free shipping!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};