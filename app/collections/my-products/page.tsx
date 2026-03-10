'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CollectionProduct } from '@/types/collections';
import { Product } from '@/types';
import { getUserProducts, deleteProduct } from '@/lib/collections/product-service';
import { Loader2, Plus, Search, X, SlidersHorizontal, Check, Edit, Trash2, Package, Filter, ShoppingBag, Box } from 'lucide-react';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import { toast } from 'sonner';
import Image from 'next/image';
import { CreateProductDialog } from '@/components/collections/products/CreateProductDialog';
import { DeleteProductDialog } from '@/components/collections/products/DeleteProductDialog';
import { ProductGridSkeleton } from '@/components/collections/products/ProductCardSkeleton';
import { EmptyState } from '@/components/collections/products/EmptyState';
import { CollectionCreationDialog } from '@/components/collections/CollectionCreationDialog';
import { collectionRepository, productRepository } from '@/lib/firestore';

export default function MyProductsPage()
{
    const router = useRouter();
    const { user } = useCollectionsAuth();
    const [customProducts, setCustomProducts] = useState<CollectionProduct[]>([]);
    const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'custom' | 'marketplace'>('custom');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });
    const [showFilters, setShowFilters] = useState(false);

    // Edit and delete states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<CollectionProduct | null>(null);

    // Collection creation states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() =>
    {
        if (user)
        {
            loadProducts();
        }
    }, [user]);

    const loadProducts = async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Validate user ID
            if (!user.uid) {
                throw new Error('Invalid user ID');
            }

            // Load both custom and marketplace products in parallel
            const [fetchedCustomProducts, fetchedMarketplaceProducts] = await Promise.all([
                getUserProducts(user.uid),
                productRepository.getAllWithTailorInfo()
            ]);

            setCustomProducts(fetchedCustomProducts);
            setMarketplaceProducts(fetchedMarketplaceProducts);
        } catch (err: any)
        {
            console.error('Error loading products:', err);
            
            // Provide more specific error messages to user
            let errorMessage = 'Failed to load products. Please try again.';
            
            if (err?.message?.includes('permissions')) {
                errorMessage = 'You do not have permission to access your products. Please contact support.';
            } else if (err?.message?.includes('network')) {
                errorMessage = 'Network connection error. Please check your internet connection and try again.';
            } else if (err?.message?.includes('authentication')) {
                errorMessage = 'Authentication error. Please log in again.';
            }
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally
        {
            setLoading(false);
        }
    };

    // Get current products based on active tab
    const currentProducts = activeTab === 'custom' ? customProducts : marketplaceProducts;

    // Toggle product selection with source prefix
    const toggleProductSelection = (productId: string, source: 'custom' | 'marketplace') =>
    {
        const prefixedId = source === 'custom' ? `collection:${productId}` : `marketplace:${productId}`;

        setSelectedProducts(prev =>
        {
            const newSet = new Set(prev);
            if (newSet.has(prefixedId))
            {
                newSet.delete(prefixedId);
            } else
            {
                newSet.add(prefixedId);
            }
            return newSet;
        });
    };

    // Select all products on current page
    const selectAllOnPage = () =>
    {
        const prefix = activeTab === 'custom' ? 'collection:' : 'marketplace:';
        const pageProducts = paginatedProducts.map(p => `${prefix}${getProductId(p)}`);
        setSelectedProducts(prev =>
        {
            const newSet = new Set(prev);
            pageProducts.forEach(id => newSet.add(id));
            return newSet;
        });
    };

    // Clear all selections
    const clearSelection = () =>
    {
        setSelectedProducts(new Set());
    };

    // Get unique brands for filter
    const uniqueBrands = useMemo(() =>
    {
        if (activeTab === 'custom')
        {
            const brands = new Set(customProducts.map(p => p.brandName));
            return Array.from(brands).sort();
        } else
        {
            const brands = new Set(marketplaceProducts.map(p => p.vendor?.name || p.tailor || 'Unknown'));
            return Array.from(brands).sort();
        }
    }, [customProducts, marketplaceProducts, activeTab]);

    // Filter and search products
    const filteredProducts = useMemo(() =>
    {
        return currentProducts.filter(product =>
        {
            if (activeTab === 'custom')
            {
                const p = product as CollectionProduct;
                const matchesSearch = searchQuery === '' ||
                    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.brandName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesBrand = selectedBrand === '' || p.brandName === selectedBrand;
                const matchesPrice = p.price >= priceRange.min &&
                    (priceRange.max === Infinity || p.price <= priceRange.max);
                return matchesSearch && matchesBrand && matchesPrice;
            } else
            {
                const p = product as Product;
                const brandName = p.vendor?.name || p.tailor || 'Unknown';
                const matchesSearch = searchQuery === '' ||
                    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    brandName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesBrand = selectedBrand === '' || brandName === selectedBrand;
                const price = p.price?.base || 0;
                const matchesPrice = price >= priceRange.min &&
                    (priceRange.max === Infinity || price <= priceRange.max);
                return matchesSearch && matchesBrand && matchesPrice;
            }
        });
    }, [currentProducts, searchQuery, selectedBrand, priceRange, activeTab]);

    // Paginate products
    const paginatedProducts = useMemo(() =>
    {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Handle add to collection
    const handleAddToCollection = () =>
    {
        if (selectedProducts.size === 0)
        {
            toast.error('Please select at least one product');
            return;
        }

        setIsDialogOpen(true);
    };

    // Handle collection creation
    const handleCreateCollection = async (name: string) =>
    {
        try
        {
            setIsCreating(true);

            // Validate authentication
            if (!user)
            {
                toast.error('Authentication required', {
                    description: 'You must be logged in to create a collection.'
                });
                setIsDialogOpen(false);
                return;
            }

            // Create initial canvas state
            const canvasState = {
                elements: [],
                backgroundColor: '#ffffff',
                dimensions: { width: 1200, height: 800 }
            };

            // Product IDs are already prefixed with source
            const productIdsWithSource = Array.from(selectedProducts);

            // Create collection in Firestore
            const collectionId = await collectionRepository.create({
                name,
                productIds: productIdsWithSource,
                canvasState,
                thumbnail: '',
                createdBy: user.uid,
            });

            // Show success message
            toast.success('Collection created!', {
                description: `"${name}" has been created successfully.`
            });

            // Close dialog and navigate to banner configuration
            setIsDialogOpen(false);
            router.push(`/collections/${collectionId}/banner`);
        } catch (err)
        {
            console.error('Error creating collection:', err);
            toast.error('Creation failed', {
                description: 'Failed to create collection. Please try again.'
            });
        } finally
        {
            setIsCreating(false);
        }
    };

    // Reset filters
    const resetFilters = () =>
    {
        setSearchQuery('');
        setSelectedBrand('');
        setPriceRange({ min: 0, max: Infinity });
        setCurrentPage(1);
    };

    // Handle edit product
    const handleEditProduct = (product: CollectionProduct, e: React.MouseEvent) =>
    {
        e.stopPropagation(); // Prevent card selection
        setSelectedProduct(product);
        setEditDialogOpen(true);
    };

    // Handle delete product
    const handleDeleteProduct = (product: CollectionProduct, e: React.MouseEvent) =>
    {
        e.stopPropagation(); // Prevent card selection
        setSelectedProduct(product);
        setDeleteDialogOpen(true);
    };

    // Confirm delete
    const confirmDelete = async () =>
    {
        if (!selectedProduct || !user) return;

        try
        {
            await deleteProduct(selectedProduct.id, user.uid);
            toast.success('Product deleted successfully');

            // Reload products
            await loadProducts();

            // Clear selection if deleted product was selected
            const prefixedId = `collection:${selectedProduct.id}`;
            if (selectedProducts.has(prefixedId))
            {
                setSelectedProducts(prev =>
                {
                    const newSet = new Set(prev);
                    newSet.delete(prefixedId);
                    return newSet;
                });
            }
        } catch (error)
        {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    // Handle edit success
    const handleEditSuccess = async () =>
    {
        toast.success('Product updated successfully');
        await loadProducts();
    };

    // Helper to get product ID
    const getProductId = (product: any) =>
    {
        return product.id || product.product_id;
    };

    // Helper to get product title
    const getProductTitle = (product: any) =>
    {
        return product.title;
    };

    // Helper to get product brand/vendor
    const getProductBrand = (product: any) =>
    {
        if (activeTab === 'custom')
        {
            return (product as CollectionProduct).brandName;
        } else
        {
            return (product as Product).vendor?.name || (product as Product).tailor || 'Unknown';
        }
    };

    // Helper to get product price
    const getProductPrice = (product: any) =>
    {
        if (activeTab === 'custom')
        {
            return (product as CollectionProduct).price;
        } else
        {
            return (product as Product).price?.base || 0;
        }
    };

    // Helper to get product images
    const getProductImages = (product: any) =>
    {
        return product.images || [];
    };

    // Helper to check if product is selected
    const isProductSelected = (product: any) =>
    {
        const productId = getProductId(product);
        const prefix = activeTab === 'custom' ? 'collection:' : 'marketplace:';
        return selectedProducts.has(`${prefix}${productId}`);
    };

    if (loading)
    {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-6 animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-64" />
                    </div>

                    {/* Toolbar Skeleton */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 animate-pulse">
                        <div className="flex gap-4">
                            <div className="flex-1 h-10 bg-gray-200 rounded" />
                            <div className="w-24 h-10 bg-gray-200 rounded" />
                            <div className="w-20 h-10 bg-gray-200 rounded" />
                        </div>
                    </div>

                    {/* Products Skeleton */}
                    <ProductGridSkeleton count={12} />
                </div>
            </div>
        );
    }

    if (error)
    {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <EmptyState
                    icon={Package}
                    title="Failed to Load Products"
                    description={error}
                    actionLabel="Try Again"
                    onAction={loadProducts}
                />
            </div>
        );
    }

    if (customProducts.length === 0 && marketplaceProducts.length === 0)
    {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <EmptyState
                    icon={Package}
                    title="No Products Available"
                    description="Create your first custom product or wait for marketplace products to be available."
                    actionLabel="Create Product"
                    onAction={() => router.push('/collections/products')}
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Select Products</h1>
                <p className="text-gray-600">
                    Choose products from your custom products or marketplace to create a collection
                </p>
            </div>

            {/* Product Source Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() =>
                            {
                                setActiveTab('custom');
                                setCurrentPage(1);
                            }}
                            className={`
                                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === 'custom'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            <Box className="w-5 h-5" />
                            My Products
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'custom' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {customProducts.length}
                            </span>
                            {Array.from(selectedProducts).filter(id => id.startsWith('collection:')).length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                    {Array.from(selectedProducts).filter(id => id.startsWith('collection:')).length} selected
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() =>
                            {
                                setActiveTab('marketplace');
                                setCurrentPage(1);
                            }}
                            className={`
                                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === 'marketplace'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Marketplace Products
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'marketplace' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {marketplaceProducts.length}
                            </span>
                            {Array.from(selectedProducts).filter(id => id.startsWith('marketplace:')).length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                    {Array.from(selectedProducts).filter(id => id.startsWith('marketplace:')).length} selected
                                </span>
                            )}
                        </button>
                    </nav>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, brand, description, or color..."
                            value={searchQuery}
                            onChange={(e) =>
                            {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 text-black pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
                            ? 'bg-primary-50 border-primary-500 text-black'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        Filters
                        {(selectedBrand || priceRange.min > 0 || priceRange.max < Infinity) && (
                            <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                                {[selectedBrand, priceRange.min > 0, priceRange.max < Infinity].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Brand Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brand
                            </label>
                            <select
                                value={selectedBrand}
                                onChange={(e) =>
                                {
                                    setSelectedBrand(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All Brands</option>
                                {uniqueBrands.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price Range
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min === 0 ? '' : priceRange.min}
                                    onChange={(e) =>
                                    {
                                        setPriceRange(prev => ({ ...prev, min: parseFloat(e.target.value) || 0 }));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max === Infinity ? '' : priceRange.max}
                                    onChange={(e) =>
                                    {
                                        setPriceRange(prev => ({ ...prev, max: parseFloat(e.target.value) || Infinity }));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(selectedBrand || priceRange.min > 0 || priceRange.max < Infinity) && (
                            <div className="md:col-span-2">
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selection Info */}
            {selectedProducts.size > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-medium">
                            {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={clearSelection}
                            className="text-sm text-primary hover:underline"
                        >
                            Clear Selection
                        </button>
                    </div>
                    <button
                        onClick={selectAllOnPage}
                        className="text-sm text-primary hover:underline"
                    >
                        Select All on Page
                    </button>
                </div>
            )}

            {/* Results Info */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {paginatedProducts.length} of {filteredProducts.length} {activeTab === 'custom' ? 'custom' : 'marketplace'} products
                {filteredProducts.length !== currentProducts.length && ` (filtered from ${currentProducts.length} total)`}
            </div>

            {/* Products Grid/List */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm">
                    <EmptyState
                        icon={Filter}
                        title="No Products Found"
                        description="No products match your current filters. Try adjusting your search criteria or reset all filters to see all products."
                        actionLabel="Reset Filters"
                        onAction={resetFilters}
                    />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {paginatedProducts.map(product =>
                        {
                            const productId = getProductId(product);
                            const isSelected = isProductSelected(product);
                            const images = getProductImages(product);
                            const title = getProductTitle(product);
                            const brand = getProductBrand(product);
                            const price = getProductPrice(product);

                            return (
                                <div
                                    key={productId}
                                    className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-2 cursor-pointer ${isSelected ? 'border-purple-600 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {/* Source Badge */}
                                    <div className="absolute top-2 right-2 z-10">
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${activeTab === 'custom' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {activeTab === 'custom' ? 'My Product' : 'Marketplace'}
                                        </span>
                                    </div>

                                    {/* Selection Checkbox */}
                                    <div className="absolute top-2 left-2 z-10">
                                        <div
                                            onClick={() => toggleProductSelection(productId, activeTab)}
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-purple-600 border-purple-600'
                                                : 'bg-white border-gray-300 hover:border-purple-400'
                                                }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>

                                    {/* Product Image */}
                                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                                        {images && images.length > 0 ? (
                                            <Image
                                                src={images[0]}
                                                alt={title}
                                                fill
                                                className="object-cover"
                                                loading="lazy"
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info - Compact */}
                                    <div className="p-2">
                                        <h3 className="text-xs font-semibold text-gray-900 line-clamp-1 mb-0.5">
                                            {title}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-1">
                                            {brand}
                                        </p>

                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-900">
                                                ${price.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Action Buttons - Only for custom products */}
                                        {activeTab === 'custom' && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => handleEditProduct(product as CollectionProduct, e)}
                                                    className="flex-1 flex bg-black text-white items-center justify-center gap-1 px-2 py-1 text-[10px] border border-gray-300 rounded hover:bg-gray-50 hover:text-black transition-colors"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteProduct(product as CollectionProduct, e)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page =>
                            {
                                // Show first page, last page, current page, and pages around current
                                return page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, index, array) => (
                                <React.Fragment key={page}>
                                    {index > 0 && array[index - 1] !== page - 1 && (
                                        <span className="px-2 text-gray-600 font-bold">...</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[44px] px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm ${currentPage === page
                                            ? 'bg-black text-white shadow-md'
                                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </React.Fragment>
                            ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Floating Action Button */}
            {selectedProducts.size > 0 && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={handleAddToCollection}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg shadow-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Add to Collection ({selectedProducts.size})
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Edit Product Dialog */}
            <CreateProductDialog
                isOpen={editDialogOpen}
                onClose={() =>
                {
                    setEditDialogOpen(false);
                    setSelectedProduct(null);
                }}
                onSuccess={handleEditSuccess}
                editProduct={selectedProduct}
                mode="edit"
            />

            {/* Delete Product Dialog */}
            <DeleteProductDialog
                isOpen={deleteDialogOpen}
                onClose={() =>
                {
                    setDeleteDialogOpen(false);
                    setSelectedProduct(null);
                }}
                onConfirm={confirmDelete}
                product={selectedProduct}
            />

            {/* Collection Creation Dialog */}
            <CollectionCreationDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={handleCreateCollection}
                selectedCount={selectedProducts.size}
            />
        </div>
    );
}
