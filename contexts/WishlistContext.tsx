'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { wishlistRepository, productRepository } from '@/lib/firestore';
import { WishlistItem } from '@/types';

interface WishlistContextType
{
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
  {
    if (user)
    {
      loadWishlist();
    } else
    {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadWishlist = useCallback(async () =>
  {
    if (!user) return;

    setLoading(true);
    try
    {
      const wishlistItems = await wishlistRepository.getByUserId(user.uid);
      setItems(wishlistItems);
    } catch (error: any)
    {
      console.error('Error loading wishlist:', error);
      
      // Handle specific error types
      if (error?.message?.includes('Permission denied')) {
        console.warn('Wishlist access denied, user may need to re-authenticate');
      } else if (error?.message?.includes('Authentication required')) {
        console.warn('Authentication required for wishlist access');
      } else if (error?.message?.includes('Service temporarily unavailable')) {
        console.warn('Wishlist service temporarily unavailable');
      }
      
      // Always set empty array on error to prevent UI crashes
      setItems([]);
    } finally
    {
      setLoading(false);
    }
  }, [user]);

  const addItem = useCallback(async (productId: string) =>
  {
    if (!user)
    {
      console.log('Please log in to add items to wishlist');
      return;
    }

    try
    {
      const product = await productRepository.getByIdWithTailorInfo(productId);
      if (!product)
      {
        console.error('Product not found:', productId);
        return;
      }

      const basePrice = typeof product.price === 'number' ? product.price : product.price.base;

      // Convert sizes to string array if needed
      let sizesArray: string[] | null = null;
      if (product.rtwOptions?.sizes)
      {
        sizesArray = product.rtwOptions.sizes.map(size =>
          typeof size === 'string' ? size : size.label
        );
      }

      const wishlistItem = {
        product_id: productId,
        title: product.title,
        description: product.description,
        price: basePrice,
        discount: product.discount || 0,
        images: product.images || [],
        is_saved: true,
        size: null,
        sizes: sizesArray,
        tailor_id: product.tailor_id,
        tailor: product.tailor || product.vendor?.name || '',
      };

      const itemId = await wishlistRepository.addItem(user.uid, wishlistItem);
      console.log('Added to wishlist with ID:', itemId);
      await loadWishlist();
    } catch (error)
    {
      console.error('Error adding to wishlist:', error);
    }
  }, [user, loadWishlist]);

  const removeItem = useCallback(async (productId: string) =>
  {
    if (!user) return;

    try
    {
      await wishlistRepository.removeByProductId(user.uid, productId);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
    } catch (error)
    {
      console.error('Error removing from wishlist:', error);
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string): boolean =>
  {
    return items.some((item) => item.product_id === productId);
  }, [items]);

  const toggleItem = useCallback(async (productId: string) =>
  {
    if (isInWishlist(productId))
    {
      await removeItem(productId);
    } else
    {
      await addItem(productId);
    }
  }, [isInWishlist, removeItem, addItem]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    items,
    itemCount: items.length,
    loading,
    addItem,
    removeItem,
    isInWishlist,
    toggleItem,
  }), [items, loading, addItem, removeItem, isInWishlist, toggleItem]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () =>
{
  const context = useContext(WishlistContext);
  if (!context)
  {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
