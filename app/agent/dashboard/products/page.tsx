'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Package,
  DollarSign,
  Tag,
  Calendar,
  Eye,
  Trash2,
  Edit,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import Image from 'next/image';
import { getAllTailorWorks, deleteTailorWork } from '@/agent-services/tailorWorks';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'price' | 'createdAt' | 'category';
type SortOrder = 'asc' | 'desc';

export default function ProductsPage() {
  const { hasPermission } = useAgentAuth();
  
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the products page. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    );
  }
  
  // Error boundary effect
  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Products page error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const itemsPerPage = 12;

  // Check permissions
  const canViewProducts = hasPermission('view_products');
  const canCreateProducts = hasPermission('create_products');
  const canDeleteProducts = hasPermission('delete_products');
  const canEditProducts = hasPermission('edit_products');

  // Fetch all tailor works with pagination
  const fetchWorks = async () => {
    console.log('=== FETCHING PRODUCTS ===');
    console.log('Current page:', currentPage);
    console.log('Search term:', searchTerm);
    console.log('Category filter:', categoryFilter);
    console.log('Type filter:', typeFilter);
    
    if (!canViewProducts) {
      toast.error('You do not have permission to view products');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get paginated products with filters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        category: categoryFilter === 'all' ? '' : categoryFilter,
        type: typeFilter === 'all' ? '' : typeFilter,
        sortBy: sortField === 'createdAt' ? 'created_at' : sortField,
        sortOrder
      });

      console.log('Making request to:', `/api/agent/products?${params}`);
      const response = await fetch(`/api/agent/products?${params}`);
      console.log('Products API response status:', response.status);
      const result = await response.json();
      console.log('Products API result:', result);

      if (result.success) {
        const mapped = result.data.map((w: any) => ({
          ...w,
          wearQuantity: w.wear_quantity || w.wearQuantity || 0,
          price: w.price?.base || w.price || 0,
          currency: w.price?.currency || 'USD',
          type: w.type || 'bespoke',
          tailorName: w.tailor || 'Unknown Tailor',
          createdAt: w.created_at || w.updated_at || new Date(),
        }));
        setProducts(mapped);
        
        // Set pagination info from API response
        setTotalPages(result.pagination.totalPages);
        setTotalProducts(result.pagination.total);
      } else {
        toast.error(result.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [canViewProducts, currentPage, categoryFilter, typeFilter, sortField, sortOrder]);

  // Delete product
  const confirmDelete = async () => {
    if (!productToDelete || !canDeleteProducts) return;

    setDeleting(true);
    try {
      const res = await deleteTailorWork(productToDelete.id);
      if (res.success) {
        toast.success('Product deleted successfully');
        fetchWorks();
      } else {
        toast.error(res.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setProductToDelete(null);
      setDeleting(false);
    }
  };

  // Use products from API directly since filtering is handled server-side
  const displayProducts = products;
  
  const displayTotalPages = totalPages;

  // Memoize unique categories and types for filters
  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const types = useMemo(() => [...new Set(products.map(p => p.type).filter(Boolean))], [products]);

  if (!canViewProducts) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground text-center">
          You don't have permission to view products. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage your product catalog and inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            {displayProducts.length} products
          </Badge>
          {canCreateProducts && (
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Link href="/agent/dashboard/products/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white via-gray-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-800">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products, tailors, categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  // Clear previous timeout
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  // Set new timeout
                  searchTimeoutRef.current = setTimeout(() => {
                    fetchWorks();
                  }, 500); // 500ms debounce
                }}
                className="pl-12 h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                <SelectValue placeholder="Category" />
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

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title-asc">Name A-Z</SelectItem>
                <SelectItem value="title-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price Low-High</SelectItem>
                <SelectItem value="price-desc">Price High-Low</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none h-12 px-4"
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none h-12 px-4"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 animate-pulse">
              <CardHeader className="pb-3">
                <div className="aspect-square relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-4 w-2/3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 flex-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                    <Skeleton className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Products Display */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayProducts.map((product: any, index: number) => (
                <Card key={product.id} className="group card-hover border-0 shadow-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 stagger-animation" style={{'--stagger': index} as React.CSSProperties}>
                  <CardHeader className="pb-3">
                    <div className="aspect-square relative mb-3 rounded-xl overflow-hidden bg-muted">
                      <Image
                        src={product.images?.[0] || product.image || '/placeholder.svg'}
                        alt={product.title || 'Product image'}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {product.isNew && (
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg animate-pulse">
                          ✨ New
                        </Badge>
                      )}
                      {product.discount > 0 && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg">
                          -{product.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1 text-sm">
                          by {product.tailorName || 'Unknown Tailor'}
                        </CardDescription>
                      </div>
                      <Badge variant={product.type === 'bespoke' ? 'default' : 'secondary'} className="ml-2 shadow-sm">
                        {product.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* <DollarSign className="h-4 w-4 mr-1 text-green-600" /> */}
                          <span className="font-bold text-xl text-green-600">
                            {product.currency === 'NGN' ? '₦' : product.currency === 'USD' ? '$' : product.currency}
                            {typeof product.price === 'object' && product.price !== null 
                              ? (product.price as any).base || '0'
                              : product.price || '0'}
                          </span>
                          {product.discount > 0 && (
                            <span className="ml-2 text-sm text-muted-foreground line-through">
                              {product.currency === 'NGN' ? '₦' : product.currency === 'USD' ? '$' : product.currency}
                              {typeof product.price === 'object' && product.price !== null 
                                ? ((product.price as any).base * (1 + product.discount / 100)).toFixed(2)
                                : (product.price * (1 + product.discount / 100)).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Package className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Qty: {product.wearQuantity}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Tag className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="truncate">{product.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                        <span>
                          {product.createdAt
                            ? (() => {
                                try {
                                  const date = product.createdAt.seconds
                                    ? new Date(product.createdAt.seconds * 1000)
                                    : new Date(product.createdAt);
                                  return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                                } catch (e) {
                                  return 'Invalid date';
                                }
                              })()
                            : 'No date available'}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" variant="outline" className="flex-1 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20 transition-all duration-200">
                          <Link href={`/agent/dashboard/products/${product.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {canEditProducts && (
                              <DropdownMenuItem asChild>
                                <Link href={`/agent/dashboard/products/${product.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Product
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canDeleteProducts && (
                              <DropdownMenuItem
                                onClick={() => setProductToDelete(product)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Product
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {displayProducts.map((product: any) => (
                    <div key={product.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={product.images?.[0] || product.image || '/placeholder.svg'}
                            alt={product.title || 'Product image'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{product.title}</h3>
                              <p className="text-muted-foreground">
                                by {product.tailorName || 'Unknown Tailor'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={product.type === 'bespoke' ? 'default' : 'secondary'}>
                                {product.type}
                              </Badge>
                              <span className="font-semibold text-lg">
                                {product.currency === 'NGN' ? '₦' : product.currency === 'USD' ? '$' : product.currency}
                                {typeof product.price === 'object' && product.price !== null 
                                  ? (product.price as any).base || '0'
                                  : product.price || '0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Qty: {product.wearQuantity}</span>
                            <span>{product.category}</span>
                            <span>
                              {product.createdAt
                                ? (() => {
                                    try {
                                      const date = product.createdAt.seconds
                                        ? new Date(product.createdAt.seconds * 1000)
                                        : new Date(product.createdAt);
                                      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                                    } catch (e) {
                                      return 'Invalid date';
                                    }
                                  })()
                                : 'No date'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/agent/dashboard/products/${product.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditProducts && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/agent/dashboard/products/${product.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {canDeleteProducts && (
                                <DropdownMenuItem
                                  onClick={() => setProductToDelete(product)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {displayProducts.length === 0 && !loading && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">0</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                  No products found
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md leading-relaxed">
                  {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                    : 'Get started by adding your first product to the catalog'}
                </p>
                {canCreateProducts && (
                  <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <Link href="/agent/dashboard/products/create">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Product
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {displayTotalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(displayTotalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(displayTotalPages, currentPage + 1))}
                disabled={currentPage === displayTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <strong>{productToDelete?.title}</strong>? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
