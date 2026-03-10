'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { ProductComparisonTable } from '@/components/vendor/products/ProductComparisonTable';
import {
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { ProductAnalytics } from '@/types/vendor-analytics';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MAX_PRODUCTS = 4;

export default function ProductComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<ProductAnalytics[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductAnalytics[]>([]);

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/vendor');
      return;
    }
  }, [user, router]);

  // Fetch available products and pre-selected products from URL
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/vendor/products/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendorId: user.uid,
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              preset: '30days'
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product analytics');
        }

        const products: ProductAnalytics[] = await response.json();
        setAvailableProducts(products);

        // Check for pre-selected products from URL
        const productIds = searchParams.get('products')?.split(',') || [];
        if (productIds.length > 0) {
          const preSelected = products.filter(p => productIds.includes(p.productId));
          setSelectedProducts(preSelected.slice(0, MAX_PRODUCTS));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user?.uid, searchParams]);

  const handleAddProduct = (productId: string) => {
    if (selectedProducts.length >= MAX_PRODUCTS) {
      toast.error(`You can only compare up to ${MAX_PRODUCTS} products at once`);
      return;
    }

    const product = availableProducts.find(p => p.productId === productId);
    if (product && !selectedProducts.find(p => p.productId === productId)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const handleClearAll = () => {
    setSelectedProducts([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Compare Products
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Side-by-side comparison of product performance metrics
              </p>
            </div>
            
            {selectedProducts.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAll}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <CardTitle>Select Products to Compare</CardTitle>
            <CardDescription>
              Choose up to {MAX_PRODUCTS} products to compare their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Selected Products */}
              {selectedProducts.map((product) => (
                <Badge
                  key={product.productId}
                  variant="outline"
                  className="px-4 py-2 text-sm flex items-center gap-2"
                >
                  {product.productId}
                  <button
                    onClick={() => handleRemoveProduct(product.productId)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {/* Add Product Dropdown */}
              {selectedProducts.length < MAX_PRODUCTS && (
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts
                      .filter(p => !selectedProducts.find(sp => sp.productId === p.productId))
                      .map((product) => (
                        <SelectItem key={product.productId} value={product.productId}>
                          {product.productId} - {product.category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedProducts.length >= MAX_PRODUCTS && (
              <p className="text-sm text-amber-600 mt-4">
                Maximum number of products reached. Remove a product to add another.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {selectedProducts.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Products Selected
              </h3>
              <p className="text-gray-600 mb-6">
                Select at least one product from the dropdown above to start comparing
              </p>
            </CardContent>
          </Card>
        ) : selectedProducts.length === 1 ? (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Add More Products
              </h3>
              <p className="text-blue-700">
                Select at least one more product to see a comparison
              </p>
            </CardContent>
          </Card>
        ) : (
          <ProductComparisonTable products={selectedProducts} />
        )}
      </main>
    </div>
  );
}
