"use client";

import { useState, useCallback, useEffect } from 'react';
import { StorefrontConfig } from '@/types/storefront';
import { Product } from '@/types';
import StorefrontRenderer from './StorefrontRenderer';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';
import { useWishlist } from '@/contexts/WishlistContext';
import { useStorefrontCart } from '@/contexts/StorefrontCartContext';
import { showSuccess, showError } from '@/lib/storefront/notifications';
import { useStorefrontUpdates } from '@/hooks/useStorefrontUpdates';

interface StorefrontClientWrapperProps {
  storefront: StorefrontConfig;
}

export function StorefrontClientWrapper({ storefront }: StorefrontClientWrapperProps) {
  // Fetch products for the storefront
  const { products, loading, error } = useStorefrontProducts({
    vendorId: storefront.vendorId,
    limit: 50,
    includeDiscounted: true,
    includeNewArrivals: true,
  });

  // Storefront cart functionality
  const { addItem, setStorefrontContext } = useStorefrontCart();

  // Set storefront context when component mounts
  useEffect(() => {
    setStorefrontContext({
      storefrontId: storefront.id,
      storefrontHandle: storefront.handle
    });
  }, [storefront.id, storefront.handle, setStorefrontContext]);

  // Wishlist functionality
  const { toggleItem, isInWishlist } = useWishlist();

  const handleToggleWishlist = useCallback(
    async (productId: string) => {
      try {
        await toggleItem(productId);
      } catch (error) {
        console.error('Error toggling wishlist item:', error);
      }
    },
    [toggleItem]
  );

  const getWishlistItems = useCallback((): Set<string> => {
    const wishlistSet = new Set<string>();
    products.forEach((product) => {
      if (isInWishlist(product.product_id)) {
        wishlistSet.add(product.product_id);
      }
    });
    return wishlistSet;
  }, [products, isInWishlist]);

  // Handle add to cart - add directly to storefront cart
  const handleAddToCart = useCallback(async (product: Product) => {
    try {
      console.log('Adding to cart:', product.title);
      
      // Add to storefront cart
      await addItem(product, 1);
      
      // Show success notification
      showSuccess('Added to cart!', `${product.title} has been added to your cart`);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      showError('Failed to add item', 'Please try again');
    }
  }, [addItem]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading storefront: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <StorefrontRenderer
      storefront={storefront}
      products={products}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      wishlistItems={getWishlistItems()}
    />
  );
}