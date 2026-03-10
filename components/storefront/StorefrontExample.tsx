'use client';

/**
 * Example Storefront Page Component
 * Demonstrates how to use the cart integration system
 * 
 * This is an example component showing how to integrate:
 * - StorefrontCartProvider
 * - ProductCatalog with cart integration
 * - CartWidget for checkout
 */

import React, { useEffect } from 'react';
import { StorefrontCartProvider, useStorefrontCart } from '@/contexts/StorefrontCartContext';
import ProductCatalog from './ProductCatalog';
import CartWidget from './CartWidget';
import { ProductDisplayConfig } from '@/types/storefront';

interface StorefrontPageProps {
  vendorId: string;
  storefrontId?: string;
  storefrontHandle?: string;
}

function StorefrontPageContent({ vendorId, storefrontId, storefrontHandle }: StorefrontPageProps) {
  const { setStorefrontContext } = useStorefrontCart();

  // Set storefront context when component mounts
  useEffect(() => {
    setStorefrontContext({
      storefrontId,
      storefrontHandle,
      vendorId,
    });
  }, [storefrontId, storefrontHandle, vendorId, setStorefrontContext]);

  // Example product display configuration
  const productConfig: ProductDisplayConfig = {
    layout: 'grid',
    productsPerPage: 12,
    showFilters: true,
    showSorting: true,
    cartIntegration: {
      enabled: true,
      redirectToStitchesAfrica: true,
    },
    promotionalDisplay: {
      showBadges: true,
      showBanners: true,
      highlightPromotions: true,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Cart Widget */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Vendor Store
            </h1>
            <CartWidget />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductCatalog
          vendorId={vendorId}
          config={productConfig}
          className="mt-6"
        />
      </main>
    </div>
  );
}

export default function StorefrontExample(props: StorefrontPageProps) {
  return (
    <StorefrontCartProvider>
      <StorefrontPageContent {...props} />
    </StorefrontCartProvider>
  );
}