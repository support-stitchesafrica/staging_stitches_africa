'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MetricCard from '@/components/shared/MetricCard';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { StockAlertsList } from '@/components/vendor/inventory/StockAlertsList';
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  TrendingDown,
  Clock,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { InventoryService } from '@/lib/vendor/inventory-service';
import { InventoryAlert } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function InventoryAlertsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<InventoryAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  // Fetch alerts
  useEffect(() => {
    if (!vendorId) return;

    fetchAlerts();
  }, [vendorId]);

  const fetchAlerts = async () => {
    if (!vendorId) return;
    
    setLoading(true);
    try {
      const inventoryService = new InventoryService();
      const response = await inventoryService.generateInventoryAlerts(vendorId);
      
      if (response.success && response.data) {
        setAlerts(response.data);
        setFilteredAlerts(response.data);
      } else {
        toast.error(response.error?.message || 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Clear cache
    const inventoryService = new InventoryService();
    inventoryService.clearCache();
    
    await fetchAlerts();
    setRefreshing(false);
    toast.success('Alerts refreshed');
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...alerts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(alert =>
        alert.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchQuery, severityFilter, typeFilter]);

  // Calculate metrics
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const outOfStockCount = alerts.filter(a => a.type === 'out_of_stock').length;
  const lowStockCount = alerts.filter(a => a.type === 'low_stock').length;
  const highReturnCount = alerts.filter(a => a.type === 'high_return_rate').length;
  const slowFulfillmentCount = alerts.filter(a => a.type === 'slow_fulfillment').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AlertsPageSkeleton />
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
          <Button
            variant="ghost"
            onClick={() => router.push('/vendor/inventory')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Inventory Alerts
              </h1>
              <p className="text-gray-600 text-lg">
                {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'} requiring attention
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            label="Critical"
            value={criticalCount.toString()}
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            variant={criticalCount > 0 ? 'alert' : 'default'}
          />

          <MetricCard
            label="Warnings"
            value={warningCount.toString()}
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          />

          <MetricCard
            label="Out of Stock"
            value={outOfStockCount.toString()}
            icon={<Package className="h-5 w-5 text-red-600" />}
          />

          <MetricCard
            label="Low Stock"
            value={lowStockCount.toString()}
            icon={<TrendingDown className="h-5 w-5 text-amber-600" />}
          />

          <MetricCard
            label="High Returns"
            value={highReturnCount.toString()}
            icon={<Package className="h-5 w-5 text-orange-600" />}
          />

          <MetricCard
            label="Slow Fulfillment"
            value={slowFulfillmentCount.toString()}
            icon={<Clock className="h-5 w-5 text-purple-600" />}
          />
        </div>

        {/* Filters Section */}
        <Card className="border-gray-200 mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">Filter Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="warning">Warning Only</SelectItem>
                  <SelectItem value="info">Info Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="high_return_rate">High Returns</SelectItem>
                  <SelectItem value="slow_fulfillment">Slow Fulfillment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Summary */}
            {(searchQuery || severityFilter !== 'all' || typeFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <span>Active filters:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Search: "{searchQuery}"
                  </span>
                )}
                {severityFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Severity: {severityFilter}
                  </span>
                )}
                {typeFilter !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Type: {typeFilter.replace('_', ' ')}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('all');
                    setTypeFilter('all');
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts List */}
        {filteredAlerts.length === 0 && !loading ? (
          <Card className="border-gray-200">
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No alerts found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || severityFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your inventory is in good shape!'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <StockAlertsList alerts={filteredAlerts} loading={false} />
        )}
      </main>
    </div>
  );
}

// Skeleton loading component
function AlertsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-5 mb-2" />
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Alerts List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
