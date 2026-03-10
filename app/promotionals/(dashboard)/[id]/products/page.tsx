'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { PromotionalProductService } from '@/lib/promotionals/product-service';
import { Product } from '@/types';
import { PromotionalEvent, ProductDiscount } from '@/types/promotionals';
import { ProductSelectionGrid } from '@/components/promotionals/products/ProductSelectionGrid';
import { ProductFilters } from '@/components/promotionals/products/ProductFilters';
import { BulkDiscountManager } from '@/components/promotionals/products/BulkDiscountManager';
import { ArrowLeft, Save, Package, Percent } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';

export default function ProductSelectionPage()
{
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<PromotionalEvent | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Selection state
    const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
    const [bulkDiscountProducts, setBulkDiscountProducts] = useState<Set<string>>(new Set());

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('');

    // Load event and products
    useEffect(() =>
    {
        const loadData = async () =>
        {
            try
            {
                setLoading(true);

                // Load event
                const eventData = await PromotionalEventService.getEventById(eventId);
                if (!eventData)
                {
                    toast.error('Event not found');
                    router.push('/promotionals');
                    return;
                }
                setEvent(eventData);

                // Load existing selections
                if (eventData.products && eventData.products.length > 0)
                {
                    const selections = new Map<string, number>();
                    eventData.products.forEach(p =>
                    {
                        selections.set(p.productId, p.discountPercentage);
                    });
                    setSelectedProducts(selections);
                }

                // Load products
                const allProducts = await PromotionalProductService.getAllProducts();
                setProducts(allProducts);

                // Load vendors
                const vendorList = await PromotionalProductService.getVendors();
                setVendors(vendorList);
            } catch (error: any)
            {
                console.error('Error loading data:', error);
                toast.error(error.message || 'Failed to load products');
            } finally
            {
                setLoading(false);
            }
        };

        if (eventId)
        {
            loadData();
        }
    }, [eventId, router]);

    // Filter products
    const filteredProducts = useMemo(() =>
    {
        let filtered = products;

        // Apply search
        if (searchQuery.trim())
        {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title?.toLowerCase().includes(query) ||
                p.tailor?.toLowerCase().includes(query) ||
                p.vendor?.name?.toLowerCase().includes(query)
            );
        }

        // Apply vendor filter
        if (selectedVendor)
        {
            filtered = filtered.filter(p =>
                p.tailor === selectedVendor || p.vendor?.name === selectedVendor
            );
        }

        return filtered;
    }, [products, searchQuery, selectedVendor]);

    // Toggle product selection
    const handleToggleSelect = (productId: string) =>
    {
        setSelectedProducts(prev =>
        {
            const newMap = new Map(prev);
            if (newMap.has(productId))
            {
                newMap.delete(productId);
            } else
            {
                newMap.set(productId, 10); // Default 10% discount
            }
            return newMap;
        });
    };

    // Update discount
    const handleDiscountChange = (productId: string, discount: number) =>
    {
        setSelectedProducts(prev =>
        {
            const newMap = new Map(prev);
            if (newMap.has(productId))
            {
                newMap.set(productId, discount);
                // Remove from bulk discount tracking when individually modified
                setBulkDiscountProducts(prevBulk =>
                {
                    const newBulkSet = new Set(prevBulk);
                    newBulkSet.delete(productId);
                    return newBulkSet;
                });
            }
            return newMap;
        });
    };

    // Handle bulk discount application
    const handleBulkDiscountApply = async (discount: number) =>
    {
        if (selectedProducts.size === 0)
        {
            toast.error('Please select products first');
            return;
        }

        // Apply bulk discount to all selected products
        setSelectedProducts(prev =>
        {
            const newMap = new Map(prev);
            const bulkProducts = new Set<string>();

            prev.forEach((_, productId) =>
            {
                newMap.set(productId, discount);
                bulkProducts.add(productId);
            });

            setBulkDiscountProducts(bulkProducts);
            return newMap;
        });

        toast.success(`Applied ${discount}% discount to ${selectedProducts.size} products`);
    };

    // Save selections
    const handleSave = async () =>
    {
        if (selectedProducts.size === 0)
        {
            toast.error('Please select at least one product');
            return;
        }

        // Validate all discounts
        for (const [productId, discount] of selectedProducts.entries())
        {
            if (discount < 1 || discount > 100)
            {
                toast.error('All discounts must be between 1% and 100%');
                return;
            }
        }

        try
        {
            setSaving(true);

            // Convert to ProductDiscount format
            const productDiscounts: ProductDiscount[] = [];
            for (const [productId, discountPercentage] of selectedProducts.entries())
            {
                const product = products.find(p => p.product_id === productId);
                if (product)
                {
                    const originalPrice = product.price?.base || 0;
                    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

                    productDiscounts.push({
                        productId,
                        discountPercentage,
                        originalPrice,
                        discountedPrice,
                        addedAt: Timestamp.now(),
                    });
                }
            }

            // Save to event
            await PromotionalEventService.addProductsToEvent(eventId, productDiscounts);

            toast.success('Products saved successfully!');
            router.push(`/promotionals/${eventId}/banner`);
        } catch (error: any)
        {
            console.error('Error saving products:', error);
            toast.error(error.message || 'Failed to save products');
        } finally
        {
            setSaving(false);
        }
    };

    if (loading)
    {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={`/promotionals/${eventId}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Event
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Select Products
                        </h1>
                        <p className="text-gray-600">
                            {event?.name} - Choose products and set discount percentages
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || selectedProducts.size === 0}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save & Continue'}
                    </button>
                </div>

                {/* Selection Summary and Controls */}
                <div className="mt-4 space-y-4">
                    {/* Selection Summary */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-purple-800">
                                <Package className="w-5 h-5" />
                                <span className="font-medium">
                                    {selectedProducts.size} of {filteredProducts.length} products selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                    {
                                        const newMap = new Map<string, number>();
                                        filteredProducts.forEach(product =>
                                        {
                                            newMap.set(product.product_id, 10); // Default 10% discount
                                        });
                                        setSelectedProducts(newMap);
                                        setBulkDiscountProducts(new Set()); // Clear bulk tracking
                                    }}
                                    className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={() =>
                                    {
                                        setSelectedProducts(new Map());
                                        setBulkDiscountProducts(new Set());
                                    }}
                                    disabled={selectedProducts.size === 0}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Discount Controls */}
                    <BulkDiscountManager
                        selectedProducts={selectedProducts}
                        onBulkDiscountApply={handleBulkDiscountApply}
                        eventName={event?.name || 'Promotional Event'}
                    />
                </div>
            </div>

            {/* Filters and Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                    <ProductFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        vendors={vendors}
                        selectedVendor={selectedVendor}
                        onVendorChange={setSelectedVendor}
                    />
                </div>

                {/* Products Grid */}
                <div className="lg:col-span-3">
                    <ProductSelectionGrid
                        products={filteredProducts}
                        selectedProducts={selectedProducts}
                        onToggleSelect={handleToggleSelect}
                        onDiscountChange={handleDiscountChange}
                        eventName={event?.name}
                        showEventBadges={true}
                        bulkDiscountProducts={bulkDiscountProducts}
                    />
                </div>
            </div>
        </div>
    );
}
