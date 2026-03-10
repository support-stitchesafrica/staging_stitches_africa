'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductRevenue } from '@/types/vendor-analytics';
import { ArrowUpDown, TrendingUp, Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatUSD } from '@/lib/utils/currency';

interface TopProductsTableProps {
  products: ProductRevenue[];
  title?: string;
  description?: string;
  maxItems?: number;
}

type SortField = 'revenue' | 'quantity' | 'percentage';
type SortOrder = 'asc' | 'desc';

export function TopProductsTable({
  products,
  title = 'Top Products',
  description = 'Best performing products by revenue',
  maxItems = 10
}: TopProductsTableProps) {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortField) {
        case 'revenue':
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        default:
          aValue = a.revenue;
          bValue = b.revenue;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted.slice(0, maxItems);
  }, [products, sortField, sortOrder, maxItems]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 hover:bg-gray-100"
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Package className="h-12 w-12 mb-3 text-gray-400" />
            <p>No product data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span>{sortedProducts.length} products</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile Card View
          <div className="space-y-3">
            {sortedProducts.map((product, index) => (
              <div
                key={product.productId}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-semibold text-gray-700 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {product.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {product.productId.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600 mb-1">Revenue</p>
                    <p className="font-semibold text-gray-900">
                      {formatUSD(product.revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Units Sold</p>
                    <p className="font-semibold text-gray-900">
                      {product.quantity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">% of Total</span>
                    <span className="text-xs font-medium text-gray-900">
                      {product.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(product.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop Table View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Product
                  </th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="revenue" label="Revenue" />
                  </th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="quantity" label="Units Sold" />
                  </th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="percentage" label="% of Total" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product, index) => (
                  <tr
                    key={product.productId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {product.productId.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatUSD(product.revenue)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm text-gray-900">
                        {product.quantity.toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${Math.min(product.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {product.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {products.length > maxItems && (
          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing top {maxItems} of {products.length} products
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
