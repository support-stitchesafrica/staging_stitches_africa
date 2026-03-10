/**
 * Edit Collection Page
 * 
 * Form for editing existing product collections.
 * Accessible to users with collections write permissions.
 * Includes product selection with visual cards.
 * 
 * Requirements: 11.4, 12.3, 12.4
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, X, Search, Filter, ShoppingBag, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import Image from 'next/image';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { collectionRepository, productRepository } from '@/lib/firestore';
import { ProductCollection } from '@/types/collections';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardCard from '@/components/backoffice/DashboardCard';

/**
 * Unauthorized Access Component
 */
function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to edit collections.</p>
        <Link href="/backoffice/collections">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Collections
          </button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Edit Collection Content Component
 */
function EditCollectionContent() {
  const params = useParams();
  const [collection, setCollection] = useState<ProductCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productIds: [] as string[],
  });
  
  // Product selection states
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showProductSelector, setShowProductSelector] = useState(false);

  const collectionId = params?.collectionId as string;
  
  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  useEffect(() => {
    async function fetchCollection() {
      if (!collectionId) {
        setError('Collection ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const collectionData = await collectionRepository.getById(collectionId);
        
        if (!collectionData) {
          setError('Collection not found');
        } else {
          setCollection(collectionData);
          setFormData({
            name: collectionData.name || '',
            description: collectionData.description || '',
            productIds: collectionData.productIds || [],
          });
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    }

    fetchCollection();
  }, [collectionId]);
  
  // Fetch products when product selector opens
  useEffect(() => {
    const fetchProducts = async () => {
      if (!showProductSelector) return;
      
      try {
        setProductsLoading(true);
        const productsData = await productRepository.getAllWithTailorInfo();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [showProductSelector]);
  
  // Load selected products when collection data is available
  useEffect(() => {
    const loadSelectedProducts = async () => {
      if (!collection?.productIds?.length || products.length === 0) return;
      
      const selected = products.filter(p => {
        const productId = (p as any).id || p.product_id;
        return collection.productIds?.includes(productId);
      });
      setSelectedProducts(selected);
    };
    
    loadSelectedProducts();
  }, [collection, products]);
  
  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collection) return;

    try {
      setSaving(true);
      
      await collectionRepository.update(collection.id, {
        name: formData.name,
        description: formData.description,
        productIds: formData.productIds,
      });

      toast.success('Collection updated successfully');
      
      // Redirect back to collection detail page
      window.location.href = `/backoffice/collections/${collection.id}`;
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle product selection toggle
  const handleProductToggle = (product: Product) => {
    const productId = (product as any).id || product.product_id;
    const isSelected = formData.productIds.includes(productId);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        productIds: prev.productIds.filter(id => id !== productId),
      }));
      setSelectedProducts(prev => prev.filter(p => {
        const pid = (p as any).id || p.product_id;
        return pid !== productId;
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        productIds: [...prev.productIds, productId],
      }));
      setSelectedProducts(prev => [...prev, product]);
    }
  };
  
  // Remove selected product
  const handleRemoveProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== productId),
    }));
    setSelectedProducts(prev => prev.filter(p => {
      const pid = (p as any).id || p.product_id;
      return pid !== productId;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-6">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Collection Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested collection could not be found.'}</p>
          <Link href="/backoffice/collections">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to Collections
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href={`/backoffice/collections/${collection.id}`}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Collection
            </Link>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Collection</h1>
          <p className="text-gray-600">Update the collection information and products.</p>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter collection name"
              />
            </div>

            {/* Collection Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter collection description (optional)"
              />
            </div>

            {/* Selected Products */}
            <DashboardCard
              title="Selected Products"
              icon={ShoppingBag}
              className="mb-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductSelector(true)}
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add/Remove Products
                  </Button>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No products selected</p>
                    <p className="text-sm text-gray-400">Click "Add/Remove Products" to select products for this collection</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProducts.map((product) => {
                      const productId = (product as any).id || product.product_id;
                      return (
                        <div
                          key={productId}
                          className="relative bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            onClick={() => handleRemoveProduct(productId)}
                            disabled={saving}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="flex gap-3">
                            <div className="relative w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.title || 'Product'}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.title || 'Untitled Product'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {product.vendor?.name || 'Unknown Vendor'}
                              </p>
                              {product.category && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {product.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/backoffice/collections/${collection.id}`}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Product Selector Dialog */}
      <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
            <DialogDescription>
              Choose products to include in your collection. Click on products to select or deselect them.
            </DialogDescription>
          </DialogHeader>

          {/* Product Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => {
                const productId = (product as any).id || product.product_id;
                const isSelected = formData.productIds.includes(productId);
                
                return (
                  <div
                    key={productId}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleProductToggle(product)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleProductToggle(product)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="relative w-full h-24 bg-gray-100 rounded-md mb-2 overflow-hidden">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title || 'Product'}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.title || 'Untitled Product'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {product.vendor?.name || 'Unknown Vendor'}
                        </p>
                        {product.category && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProductSelector(false)}
            >
              Done ({selectedProducts.length} selected)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Edit Collection Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function EditCollectionPage() {
  return (
    <PermissionGuard
      department="collections"
      permission="write"
      fallback={<UnauthorizedAccess />}
    >
      <EditCollectionContent />
    </PermissionGuard>
  );
}