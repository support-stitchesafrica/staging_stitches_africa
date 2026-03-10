/**
 * Create Collection Form Component
 * 
 * Form for creating new collections in the backoffice with Bumpa-style design.
 * Includes product selection, validation, and permission checks.
 * 
 * Requirements: 11.4, 12.3, 12.4, 13.1, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { collectionRepository, productRepository } from '@/lib/firestore';
import { ProductCollection } from '@/types/collections';
import { Product } from '@/types';
import DashboardCard from '@/components/backoffice/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import {
  Package,
  Search,
  Filter,
  Plus,
  X,
  Loader2,
  Save,
  Eye,
  ShoppingBag,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface CreateCollectionFormProps {
  /** Optional callback when collection is created */
  onCollectionCreated?: (collection: ProductCollection) => void;
  /** Optional callback when form is cancelled */
  onCancel?: () => void;
  /** Whether to show as a dialog */
  showAsDialog?: boolean;
  /** Dialog open state */
  dialogOpen?: boolean;
  /** Dialog open state setter */
  setDialogOpen?: (open: boolean) => void;
}

interface FormData {
  name: string;
  description: string;
  productIds: string[];
}

export default function CreateCollectionForm({
  onCollectionCreated,
  onCancel,
  showAsDialog = false,
  dialogOpen = false,
  setDialogOpen,
}: CreateCollectionFormProps) {
  const { user, hasPermission } = useBackOfficeAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    productIds: [],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Permission check
  const canCreate = hasPermission('collections', 'write');

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
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

    if (showProductSelector) {
      fetchProducts();
    }
  }, [showProductSelector]);

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

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate) {
      toast.error('Permission denied', {
        description: 'You do not have permission to create collections.',
      });
      return;
    }

    if (!user) {
      toast.error('Authentication required');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    if (formData.productIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      setLoading(true);

      // Create canvas state with basic layout
      const canvasState = {
        elements: [],
        backgroundColor: '#ffffff',
        dimensions: { width: 800, height: 600 },
      };

      // Generate thumbnail (placeholder for now)
      const thumbnail = selectedProducts[0]?.images?.[0] || '';

      const collectionData = {
        name: formData.name.trim(),
        productIds: formData.productIds,
        canvasState,
        thumbnail,
        createdBy: user.uid,
        ...(formData.description.trim() && { description: formData.description.trim() }),
      };

      const collectionId = await collectionRepository.create(collectionData);
      
      const newCollection: ProductCollection = {
        id: collectionId,
        ...collectionData,
        published: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      toast.success('Collection created successfully');
      
      // Reset form
      setFormData({ name: '', description: '', productIds: [] });
      setSelectedProducts([]);
      
      // Close dialog if in dialog mode
      if (showAsDialog && setDialogOpen) {
        setDialogOpen(false);
      }

      // Call callback
      onCollectionCreated?.(newCollection);
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductToggle = (product: Product) => {
    const isSelected = formData.productIds.includes(product.id);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        productIds: prev.productIds.filter(id => id !== product.id),
      }));
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setFormData(prev => ({
        ...prev,
        productIds: [...prev.productIds, product.id],
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
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Collection Details */}
      <DashboardCard
        title="Collection Details"
        icon={Package}
        className="mb-6"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter collection name"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for the collection"
              rows={3}
              disabled={loading}
            />
          </div>
        </div>
      </DashboardCard>

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
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </Button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No products selected</p>
              <p className="text-sm text-gray-400">Click "Add Products" to select products for this collection</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    onClick={() => handleRemoveProduct(product.id)}
                    disabled={loading}
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
              ))}
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading || !canCreate || !formData.name.trim() || formData.productIds.length === 0}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Collection
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">You don't have permission to create collections.</p>
        </div>
      </div>
    );
  }

  if (showAsDialog) {
    return (
      <>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Create a new product collection with selected products and custom design.
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>

        {/* Product Selector Dialog */}
        <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Products</DialogTitle>
              <DialogDescription>
                Choose products to include in your collection.
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
                  const isSelected = formData.productIds.includes(product.id);
                  
                  return (
                    <div
                      key={product.id}
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
                          onChange={() => handleProductToggle(product)}
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
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Collection</h1>
        <p className="text-gray-600">Create a new product collection with selected products and custom design.</p>
      </div>
      
      {formContent}

      {/* Product Selector Dialog */}
      <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
            <DialogDescription>
              Choose products to include in your collection.
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
                const isSelected = formData.productIds.includes(product.id);
                
                return (
                  <div
                    key={product.id}
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
                        onChange={() => handleProductToggle(product)}
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