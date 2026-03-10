/**
 * React Query Provider for Vendor Analytics
 * Wraps the application with QueryClientProvider
 * Requirements: 10.1, 10.2, 10.3
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './query-client';
import { ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app with React Query
 * Enables real-time data updates and caching
 */
export function VendorQueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools for development - automatically hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
