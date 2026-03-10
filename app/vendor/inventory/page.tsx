'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCard from '@/components/shared/MetricCard';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { StockAlertsList } from '@/components/vendor/inventory/StockAlertsList';
import { FulfillmentScoreCard } from '@/components/vendor/inventory/FulfillmentScoreCard';
import { InventoryForecast } from '@/components/vendor/inventory/InventoryForecast';
import { ReturnRateAlerts } from '@/components/vendor/inventory/ReturnRateAlerts';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { InventoryService } from '@/lib/vendor/inventory-service';
import { 
  InventoryAlert, 
  InventoryForecast as InventoryForecastType,
  FulfillmentMetrics 
} from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function InventoryOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [forecasts, setForecasts] = useState<InventoryForecastType[]>([]);
  const [fulfillmentMetrics, setFulfillmentMetrics] = useState<FulfillmentMetrics | null>(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('tailorToken');
    const id = localStorage.getItem('tailorUID');
    
    if (!token) {
      router.push('/vendor');
      return;
    }
    
    setVendorId(id);
  }, [router]);

  // Fetch inventory data
  useEffect(() => {
    if (!vendorId) return;

    fetchInventoryData();
  }, [vendorId]);

  const fetchInventoryData = async () => {
    if (!vendorId) return;
    
    setLoading(true);
    try {
      const inventoryService = new InventoryService();
      
      // Fetch alerts and forecasts in parallel
      const [alertsResponse, forecastsResponse] = await Promise.all([
        inventoryService.generateInventoryAlerts(vendorId),
        inventoryService.getVendorInventoryForecasts(vendorId, 30)
      ]);
      
      if (alertsResponse.success && alertsResponse.data) {
        setAlerts(alertsResponse.data);
      } else {
        toast.error(alertsResponse.error?.message || 'Failed to load inventory alerts');
      }

      if (forecastsResponse.success && forecastsResponse.data) {
        setForecasts(forecastsResponse.data);
      }

      // Get overall fulfillment metrics
      const fulfillmentResponse = await inventoryService.getFulfillmentMetrics('', vendorId);
      setFulfillmentMetrics(fulfillmentResponse);
      
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Clear cache
    const inventoryService = new InventoryService();
    inventoryService.clearCache();
    
    await fetchInventoryData();
    setRefreshing(false);
    toast.success('Inventory data refreshed');
  };

  // Calculate summary metrics
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
  const outOfStockCount = alerts.filter(a => a.type === 'out_of_stock').length;
  const lowStockCount = alerts.filter(a => a.type === 'low_stock').length;
  const highReturnCount = alerts.filter(a => a.type === 'high_return_rate').length;
  const slowFulfillmentCount = alerts.filter(a => a.type === 'slow_fulfillment').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <InventoryOverviewSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Inventory Management
              </h1>
              <p className="text-gray-600 text-lg">
                Monitor stock levels, fulfillment performance, and inventory forecasts
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/vendor/inventory/alerts')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View All Alerts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Critical Alerts"
            value={criticalAlerts.toString()}
            subtitle={`${warningAlerts} warnings`}
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            variant={criticalAlerts > 0 ? 'alert' : 'default'}
          />

          <MetricCard
            label="Out of Stock"
            value={outOfStockCount.toString()}
            subtitle="Products unavailable"
            icon={<Package className="h-6 w-6 text-red-600" />}
            variant={outOfStockCount > 0 ? 'alert' : 'default'}
          />

          <MetricCard
            label="Low Stock"
            value={lowStockCount.toString()}
            subtitle="Need reordering soon"
            icon={<TrendingDown className="h-6 w-6 text-amber-600" />}
          />

          <MetricCard
            label="Fulfillment Score"
            value={fulfillmentMetrics ? `${Math.round(fulfillmentMetrics.fulfillmentScore * 100)}` : '0'}
            subtitle="Overall performance"
            icon={<Clock className="h-6 w-6 text-purple-600" />}
            variant={fulfillmentMetrics && fulfillmentMetrics.fulfillmentScore >= 0.8 ? 'accent' : 'default'}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {criticalAlerts > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-600 text-white rounded-full">
                  {criticalAlerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="returns">
              Returns
              {highReturnCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-orange-600 text-white rounded-full">
                  {highReturnCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fulfillment Score Card */}
              {fulfillmentMetrics && (
                <FulfillmentScoreCard metrics={fulfillmentMetrics} />
              )}

              {/* Quick Stats Card */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Inventory Health</CardTitle>
                  <CardDescription>
                    Summary of your inventory status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-gray-900">Out of Stock</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">
                        {outOfStockCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-gray-900">Low Stock</span>
                      </div>
                      <span className="text-2xl font-bold text-amber-600">
                        {lowStockCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-gray-900">High Returns</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">
                        {highReturnCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-gray-900">Slow Fulfillment</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {slowFulfillmentCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Alerts Preview */}
            {alerts.length > 0 && (
              <Card className="border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Alerts</CardTitle>
                      <CardDescription>
                        Top {Math.min(3, alerts.length)} most urgent inventory issues
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/vendor/inventory/alerts')}
                    >
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <StockAlertsList 
                    alerts={alerts.slice(0, 3)} 
                    loading={false}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <StockAlertsList alerts={alerts} loading={false} />
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast">
            <InventoryForecast forecasts={forecasts} loading={false} />
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns">
            <ReturnRateAlerts alerts={alerts} loading={false} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Skeleton loading component
function InventoryOverviewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-6 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div>
        <Skeleton className="h-10 w-full max-w-md mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
