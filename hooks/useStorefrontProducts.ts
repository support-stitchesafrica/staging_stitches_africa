"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { productRepository } from '@/lib/firestore';

interface UseStorefrontProductsOptions {
  vendorId?: string;
  limit?: number;
  includeDiscounted?: boolean;
  includeNewArrivals?: boolean;
}

export function useStorefrontProducts(options: UseStorefrontProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    vendorId,
    limit = 20,
    includeDiscounted = true,
    includeNewArrivals = true
  } = options;

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        let allProducts: Product[] = [];

        if (vendorId) {
          // Fetch products for specific vendor
          const vendorProducts = await productRepository.getByVendorId(vendorId);
          allProducts = vendorProducts.slice(0, limit);
        } else {
          // Fetch general products
          const promises: Promise<Product[]>[] = [];

          if (includeDiscounted) {
            promises.push(productRepository.getDiscountedProductsWithTailorInfo());
          }

          if (includeNewArrivals) {
            promises.push(productRepository.getNewArrivalsWithTailorInfo(limit));
          }

          if (promises.length === 0) {
            // Fallback to all products
            promises.push(productRepository.getAllProductsWithTailorInfo(limit));
          }

          const results = await Promise.all(promises);
          
          // Combine and deduplicate products
          const productMap = new Map<string, Product>();
          
          results.forEach(productList => {
            productList.forEach(product => {
              if (!productMap.has(product.product_id)) {
                productMap.set(product.product_id, product);
              }
            });
          });

          allProducts = Array.from(productMap.values()).slice(0, limit);
        }

        setProducts(allProducts);
      } catch (err) {
        console.error('Error fetching storefront products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [vendorId, limit, includeDiscounted, includeNewArrivals]);

  return {
    products,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-trigger the effect
      setProducts([]);
    }
  };
}