'use client';

import { lazy, Suspense } from 'react';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';
import HMRErrorBoundary from '@/components/shops/error-boundaries/HMRErrorBoundary';
import { loadModuleWithRetry } from '@/lib/utils/module-helpers';

// Lazy load page components with module loading wrapper for HMR stability
const LazyProductsPage = lazy(() =>
  loadModuleWithRetry('@/app/products/page', 'lazy_products_page')
);

const LazyCheckoutPage = lazy(() =>
  loadModuleWithRetry('@/app/checkout/page', 'lazy_checkout_page')
);

const LazyAccountPage = lazy(() =>
  loadModuleWithRetry('@/app/account/page', 'lazy_account_page')
);

// Lazy-loaded ProductsPage with Suspense and HMR Error Boundary
export const ProductsPageLazy: React.FC = () => (
  <HMRErrorBoundary>
    <Suspense fallback={<LoadingSkeleton />}>
      <LazyProductsPage />
    </Suspense>
  </HMRErrorBoundary>
);

// Lazy-loaded CheckoutPage with Suspense and HMR Error Boundary
export const CheckoutPageLazy: React.FC = () => (
  <HMRErrorBoundary>
    <Suspense fallback={<LoadingSkeleton />}>
      <LazyCheckoutPage />
    </Suspense>
  </HMRErrorBoundary>
);

// Lazy-loaded AccountPage with Suspense and HMR Error Boundary
export const AccountPageLazy: React.FC = () => (
  <HMRErrorBoundary>
    <Suspense fallback={<LoadingSkeleton />}>
      <LazyAccountPage />
    </Suspense>
  </HMRErrorBoundary>
);