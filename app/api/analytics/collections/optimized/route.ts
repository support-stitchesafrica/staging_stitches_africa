import { NextRequest, NextResponse } from 'next/server';
import { dataSyncService } from '@/lib/analytics/data-sync-service';

/**
 * GET /api/analytics/collections/optimized
 * 
 * Get optimized collections analytics with fast loading and synchronized data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const collectionId = searchParams.get('collectionId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    let dateRange: { start: Date; end: Date } | undefined;
    
    if (startDateParam && endDateParam) {
      dateRange = {
        start: new Date(startDateParam),
        end: new Date(endDateParam)
      };
    }

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      dataSyncService.clearCache(collectionId || undefined);
    }

    const startTime = Date.now();

    if (collectionId) {
      // Get optimized metrics for specific collection
      const collectionMetrics = await dataSyncService.getOptimizedCollectionMetrics(
        collectionId,
        dateRange
      );

      return NextResponse.json({
        success: true,
        data: collectionMetrics,
        performance: {
          queryTime: Date.now() - startTime,
          optimized: true,
          cached: collectionMetrics.loadTime < 100 // Assume cached if very fast
        }
      });
    } else {
      // Get synchronized analytics for all collections
      const syncedData = await dataSyncService.syncAllAnalyticsData(dateRange);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalCollections: syncedData.collectionsData.totalCollections,
            totalViews: syncedData.totalCollectionViews,
            totalAddToCarts: syncedData.collectionsData.totalAddToCarts,
            totalPurchases: syncedData.collectionsData.totalPurchases,
            totalRevenue: syncedData.collectionsData.totalRevenue,
            
            // Performance metrics
            conversionRate: syncedData.totalCollectionViews > 0 
              ? (syncedData.collectionsData.totalPurchases / syncedData.totalCollectionViews) * 100 
              : 0,
            
            averageOrderValue: syncedData.collectionsData.totalPurchases > 0 
              ? syncedData.collectionsData.totalRevenue / syncedData.collectionsData.totalPurchases 
              : 0,
            
            revenuePerView: syncedData.totalCollectionViews > 0 
              ? syncedData.collectionsData.totalRevenue / syncedData.totalCollectionViews 
              : 0
          },
          
          integrity: syncedData.dataIntegrity,
          
          performance: {
            ...syncedData.performance,
            queryTime: Date.now() - startTime,
            optimized: true
          }
        }
      });
    }

  } catch (error) {
    console.error('Error fetching optimized collections analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch optimized collections analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
        performance: {
          queryTime: Date.now() - (Date.now() - 1000), // Approximate
          optimized: false,
          error: true
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/collections/optimized
 * 
 * Trigger data synchronization and optimization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, collectionId, dateRange } = body;

    switch (action) {
      case 'sync':
        // Force synchronization
        dataSyncService.clearCache();
        const syncedData = await dataSyncService.syncAllAnalyticsData(dateRange);
        
        return NextResponse.json({
          success: true,
          message: 'Data synchronized successfully',
          integrity: syncedData.dataIntegrity,
          performance: syncedData.performance
        });

      case 'optimize':
        // Optimize specific collection
        if (!collectionId) {
          return NextResponse.json(
            { success: false, error: 'Collection ID required for optimization' },
            { status: 400 }
          );
        }

        const optimizedMetrics = await dataSyncService.getOptimizedCollectionMetrics(
          collectionId,
          dateRange
        );

        return NextResponse.json({
          success: true,
          message: 'Collection optimized successfully',
          data: optimizedMetrics
        });

      case 'clearCache':
        // Clear cache
        dataSyncService.clearCache(collectionId);
        
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          cacheStats: dataSyncService.getCacheStats()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing collections optimization request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process optimization request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}