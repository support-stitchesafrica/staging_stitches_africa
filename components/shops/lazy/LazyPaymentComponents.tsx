'use client';

import { lazy, Suspense } from 'react';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';
import { OrderErrorBoundary } from '@/components/shops/orders/OrderErrorBoundary';
import HMRErrorBoundary from '@/components/shops/error-boundaries/HMRErrorBoundary';

// Lazy load payment components with simple dynamic import
const LazyStripePaymentModal = lazy(() =>
  import('@/components/shops/payments/StripePaymentModal')
);

const LazyFlutterwavePaymentModal = lazy(() =>
  import('@/components/shops/payments/FlutterwavePaymentModal')
);

const LazyOrderHistory = lazy(() =>
  import('@/components/shops/orders/OrderHistory').then(module => ({ default: module.OrderHistory }))
);

// Lazy-loaded StripePaymentModal with Suspense and HMR Error Boundary
export const StripePaymentModalLazy: React.FC<React.ComponentProps<typeof LazyStripePaymentModal>> = (props) => (
  <HMRErrorBoundary>
    <Suspense fallback={<LoadingSkeleton variant="modal" />}>
      <LazyStripePaymentModal {...props} />
    </Suspense>
  </HMRErrorBoundary>
);

// Lazy-loaded FlutterwavePaymentModal with Suspense and HMR Error Boundary
export const FlutterwavePaymentModalLazy: React.FC<React.ComponentProps<typeof LazyFlutterwavePaymentModal>> = (props) => (
  <HMRErrorBoundary>
    <Suspense fallback={<LoadingSkeleton variant="modal" />}>
      <LazyFlutterwavePaymentModal {...props} />
    </Suspense>
  </HMRErrorBoundary>
);

// Lazy-loaded OrderHistory with Suspense and Error Boundaries
export const OrderHistoryLazy: React.FC = () => (
  <HMRErrorBoundary>
    <OrderErrorBoundary>
      <Suspense fallback={<LoadingSkeleton variant="orders" />}>
        <LazyOrderHistory />
      </Suspense>
    </OrderErrorBoundary>
  </HMRErrorBoundary>
);