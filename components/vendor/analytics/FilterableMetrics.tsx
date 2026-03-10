/**
 * Filterable Metrics Component
 * Demonstrates instant filter application (Requirement 10.3)
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { useVendorAnalytics } from '@/lib/vendor/useVendorAnalyticsQuery';
import { DateRange } from '@/types/vendor-analytics';
import { formatUSD } from '@/lib/utils/currency';

interface FilterableMetricsProps {
  vendorId: string;
  dateRange: DateRange;
}

/**
 * Component that demonstrates instant filter application
 * Requirement 10.3: Filters apply instantly without network delay
 */
export function FilterableMetrics({ vendorId, dateRange }: FilterableMetricsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'name'>('revenue');

  // Fetch data with React Query
  const { data: analytics, isFetching } = useVendorAnalytics(vendorId, dateRange);

  // Instant client-side filtering - Requirement 10.3
  const filteredProducts = useMemo(() => {
    if (!analytics?.sales.revenueByProduct) return [];

    let filtered = [...analytics.sales.revenueByProduct];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'orders':
          return b.orderCount - a.orderCount;
        case 'name':
          return a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [analytics, searchTerm, categoryFilter, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!analytics?.sales.revenueByProduct) return [];
    return Array.from(new Set(analytics.sales.revenueByProduct.map(p => p.category)));
  }, [analytics]);



  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Product Performance</CardTitle>
          {isFetching && (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              <TrendingUp className="h-3 w-3 mr-1 animate-pulse" />
              Updating
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters - Apply instantly without network delay */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Filter */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue (High to Low)</SelectItem>
                <SelectItem value="orders">Orders (High to Low)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredProducts.length} of {analytics?.sales.revenueByProduct.length || 0} products
            </span>
            {(searchTerm || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Filter className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No products match your filters</p>
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.productName}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatUSD(product.revenue)}</p>
                  <p className="text-sm text-gray-600">{product.orderCount} orders</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Performance Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Instant Filtering</p>
              <p className="text-blue-700">
                Filters apply instantly without network delay. Data updates automatically every 30 seconds in the background.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
