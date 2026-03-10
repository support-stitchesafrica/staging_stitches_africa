'use client';

import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAtlasAuth } from '@/contexts/AtlasAuthContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { AtlasRole } from '@/lib/atlas/types';
import { DateRange } from '@/lib/atlas/unified-analytics/types';
import { RoleBasedAccessService } from '@/lib/atlas/unified-analytics/services/role-based-access-service';
import { LoadingSpinner, AnalyticsCardSkeleton } from '@/components/ui/optimized-loader';
import { analytics, useAnalytics } from '@/lib/analytics';
import { useCachedData } from '@/lib/utils/cache-utils';

// Lazy load analytics sections for better performance with optimized loading
const VendorAnalyticsSection = lazy(() => 
  import('./VendorAnalyticsSection').then(module => ({ 
    default: module.VendorAnalyticsSection 
  }))
);

const BogoAnalyticsSection = lazy(() => 
  import('./BogoAnalyticsSection').then(module => ({ 
    default: module.BogoAnalyticsSection 
  }))
);

const StorefrontAnalyticsSection = lazy(() => 
  import('./StorefrontAnalyticsSection').then(module => ({ 
    default: module.StorefrontAnalyticsSection 
  }))
);

const CrossAnalyticsSection = lazy(() => 
  import('./CrossAnalyticsSection').then(module => ({ 
    default: module.CrossAnalyticsSection 
  }))
);

const CollectionsAnalyticsSection = lazy(() => 
  import('./CollectionsAnalyticsSection').then(module => ({ 
    default: module.CollectionsAnalyticsSection 
  }))
);

// Enhanced loading skeleton for analytics sections
const AnalyticsSectionSkeleton = React.memo(() => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    {/* Metrics row skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <AnalyticsCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts row skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="w-32 h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-64 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  </div>
));

AnalyticsSectionSkeleton.displayName = 'AnalyticsSectionSkeleton';

export interface UnifiedAnalyticsDashboardProps {
  activeSection?: 'vendor' | 'bogo' | 'storefront' | 'collections' | 'cross-analytics';
}

/**
 * Main container component for the unified analytics interface
 * Handles route management, role-based rendering, and error boundaries
 */
export const UnifiedAnalyticsDashboard: React.FC<UnifiedAnalyticsDashboardProps> = React.memo(({
  activeSection
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { atlasUser, loading: authLoading } = useAtlasAuth();
  const { dateRange } = useDateRange();
  const { trackInteraction } = useAnalytics('UnifiedAnalyticsDashboard');
  
  const [error, setError] = useState<string | null>(null);
  
  // Memoize access service to prevent recreation
  const accessService = useMemo(() => new RoleBasedAccessService(), []);

  // Determine active section from pathname if not provided
  const currentSection = useMemo(() => 
    activeSection || getCurrentSectionFromPath(pathname), 
    [activeSection, pathname]
  );

  // Memoize analytics date range conversion
  const analyticsDateRange: DateRange = useMemo(() => ({
    from: dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: dateRange.end || new Date()
  }), [dateRange.start, dateRange.end]);

  // Use cached data for user permissions
  const {
    data: userPermissions,
    loading: permissionsLoading
  } = useCachedData(
    `user-permissions-${atlasUser?.uid}`,
    async () => {
      if (!atlasUser) return null;
      return {
        hasMinimumAccess: accessService.hasMinimumAnalyticsAccess(atlasUser.role),
        accessibleSections: accessService.getAccessibleSections(atlasUser.role),
        hasCurrentSectionAccess: currentSection ? 
          accessService.hasAccessToSection(atlasUser.role, currentSection) : true
      };
    },
    5 * 60 * 1000 // 5 minutes cache
  );

  // Optimized permission checking with caching
  useEffect(() => {
    if (authLoading || permissionsLoading) return;

    // Track page view
    analytics.trackPageView(`/atlas/${currentSection || 'dashboard'}`, `Atlas ${currentSection || 'Dashboard'}`);

    if (!atlasUser) {
      router.push('/atlas/auth');
      return;
    }

    if (!userPermissions?.hasMinimumAccess) {
      setError('You do not have permission to access analytics data');
      return;
    }

    if (currentSection && !userPermissions?.hasCurrentSectionAccess) {
      // Redirect to first accessible section
      if (userPermissions?.accessibleSections.length > 0) {
        const redirectPath = getSectionPath(userPermissions.accessibleSections[0]);
        router.push(redirectPath);
        return;
      }
    }

    setError(null);
  }, [authLoading, permissionsLoading, atlasUser, currentSection, userPermissions, router]);

  // Optimized section rendering with memoization
  const renderAnalyticsSection = useCallback(() => {
    if (!atlasUser || !userPermissions) return null;

    const sectionProps = {
      dateRange: analyticsDateRange,
      userRole: atlasUser.role
    };

    switch (currentSection) {
      case 'vendor':
        return (
          <Suspense fallback={<AnalyticsSectionSkeleton />}>
            <VendorAnalyticsSection {...sectionProps} />
          </Suspense>
        );
      
      case 'bogo':
        return (
          <Suspense fallback={<AnalyticsSectionSkeleton />}>
            <BogoAnalyticsSection {...sectionProps} />
          </Suspense>
        );
      
      case 'storefront':
        return (
          <Suspense fallback={<AnalyticsSectionSkeleton />}>
            <StorefrontAnalyticsSection {...sectionProps} />
          </Suspense>
        );
      
      case 'collections':
        return (
          <Suspense fallback={<AnalyticsSectionSkeleton />}>
            <CollectionsAnalyticsSection {...sectionProps} />
          </Suspense>
        );
      
      case 'cross-analytics':
        return (
          <Suspense fallback={<AnalyticsSectionSkeleton />}>
            <CrossAnalyticsSection {...sectionProps} />
          </Suspense>
        );
      
      default:
        // Default to first accessible section
        if (userPermissions.accessibleSections.length > 0) {
          return renderSectionByType(userPermissions.accessibleSections[0], sectionProps);
        }
        
        return (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Analytics Access
            </h2>
            <p className="text-gray-600">
              You do not have access to any analytics sections
            </p>
          </div>
        );
    }
  }, [atlasUser, userPermissions, currentSection, analyticsDateRange]);

  // Show loading spinner while checking authentication and permissions
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if user doesn't have access
  if (error || !atlasUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            {error || 'You do not have permission to access this section'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderAnalyticsSection()}
    </div>
  );
});

UnifiedAnalyticsDashboard.displayName = 'UnifiedAnalyticsDashboard';

/**
 * Helper function to determine current section from pathname
 */
function getCurrentSectionFromPath(pathname: string): 'vendor' | 'bogo' | 'storefront' | 'collections' | 'cross-analytics' | null {
  if (pathname.includes('/vendor-analytics')) return 'vendor';
  if (pathname.includes('/bogo-analytics')) return 'bogo';
  if (pathname.includes('/storefront-analytics')) return 'storefront';
  if (pathname.includes('/collections-analytics')) return 'collections';
  if (pathname.includes('/cross-analytics')) return 'cross-analytics';
  return null;
}

/**
 * Helper function to get section path
 */
function getSectionPath(section: 'vendor' | 'bogo' | 'storefront' | 'collections' | 'cross-analytics'): string {
  switch (section) {
    case 'vendor':
      return '/atlas/vendor-analytics';
    case 'bogo':
      return '/atlas/bogo-analytics';
    case 'storefront':
      return '/atlas/storefront-analytics';
    case 'collections':
      return '/atlas/collections-analytics';
    case 'cross-analytics':
      return '/atlas/cross-analytics';
    default:
      return '/atlas';
  }
}

/**
 * Helper function to render section by type with lazy loading
 */
function renderSectionByType(
  section: 'vendor' | 'bogo' | 'storefront' | 'collections' | 'cross-analytics',
  dateRange: DateRange,
  userRole: AtlasRole
) {
  switch (section) {
    case 'vendor':
      return (
        <Suspense fallback={<AnalyticsSectionSkeleton />}>
          <VendorAnalyticsSection dateRange={dateRange} userRole={userRole} />
        </Suspense>
      );
    case 'bogo':
      return (
        <Suspense fallback={<AnalyticsSectionSkeleton />}>
          <BogoAnalyticsSection dateRange={dateRange} userRole={userRole} />
        </Suspense>
      );
    case 'storefront':
      return (
        <Suspense fallback={<AnalyticsSectionSkeleton />}>
          <StorefrontAnalyticsSection dateRange={dateRange} userRole={userRole} />
        </Suspense>
      );
    case 'collections':
      return (
        <Suspense fallback={<AnalyticsSectionSkeleton />}>
          <CollectionsAnalyticsSection dateRange={dateRange} userRole={userRole} />
        </Suspense>
      );
    case 'cross-analytics':
      return (
        <Suspense fallback={<AnalyticsSectionSkeleton />}>
          <CrossAnalyticsSection dateRange={dateRange} userRole={userRole} />
        </Suspense>
      );
    default:
      return null;
  }
}