'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { PromotionalProductService } from '@/lib/promotionals/product-service';
import { PromotionalEvent } from '@/types/promotionals';
import { Product } from '@/types';
import { ArrowLeft, Calendar, Package, Image as ImageIcon, Eye, EyeOff, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/utils/timestamp-helpers';

export default function EventDetailsPage()
{
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<PromotionalEvent | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Load event and products
    useEffect(() =>
    {
        const loadData = async () =>
        {
            try
            {
                setLoading(true);

                const eventData = await PromotionalEventService.getEventById(eventId);
                if (!eventData)
                {
                    toast.error('Event not found');
                    router.push('/promotionals');
                    return;
                }
                setEvent(eventData);

                // Load products if any
                if (eventData.products && eventData.products.length > 0)
                {
                    const productIds = eventData.products.map(p => p.productId);
                    const productData = await PromotionalProductService.getProductsByIds(productIds);
                    setProducts(productData);
                }
            } catch (error: any)
            {
                console.error('Error loading event:', error);
                toast.error(error.message || 'Failed to load event');
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

    // Toggle publish status
    const handleTogglePublish = async () =>
    {
        if (!event) return;

        // Validate before publishing
        if (!event.isPublished)
        {
            if (!event.products || event.products.length === 0)
            {
                toast.error('Cannot publish: Add products first');
                return;
            }
            if (!event.banner || !event.banner.imageUrl)
            {
                toast.error('Cannot publish: Add banner first');
                return;
            }
        }

        try
        {
            setPublishing(true);

            if (event.isPublished)
            {
                await PromotionalEventService.unpublishEvent(eventId);
                toast.success('Event unpublished');
                setEvent({ ...event, isPublished: false });
            } else
            {
                await PromotionalEventService.publishEvent(eventId);
                toast.success('Event published successfully!');
                setEvent({ ...event, isPublished: true });
            }
        } catch (error: any)
        {
            console.error('Error toggling publish:', error);
            toast.error(error.message || 'Failed to update event');
        } finally
        {
            setPublishing(false);
        }
    };

    // Delete event
    const handleDelete = async () =>
    {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.'))
        {
            return;
        }

        try
        {
            setDeleting(true);
            await PromotionalEventService.deleteEvent(eventId);
            toast.success('Event deleted successfully');
            router.push('/promotionals');
        } catch (error: any)
        {
            console.error('Error deleting event:', error);
            toast.error(error.message || 'Failed to delete event');
            setDeleting(false);
        }
    };

    // Remove product
    const handleRemoveProduct = async (productId: string) =>
    {
        if (!confirm('Remove this product from the event?'))
        {
            return;
        }

        try
        {
            await PromotionalEventService.removeProductFromEvent(eventId, productId);
            toast.success('Product removed');

            // Update local state
            setEvent(prev => prev ? {
                ...prev,
                products: prev.products?.filter(p => p.productId !== productId) || []
            } : null);
            setProducts(prev => prev.filter(p => p.product_id !== productId));
        } catch (error: any)
        {
            console.error('Error removing product:', error);
            toast.error(error.message || 'Failed to remove product');
        }
    };

    if (loading)
    {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event)
    {
        return null;
    }

    const startDate = toDate(event.startDate);
    const endDate = toDate(event.endDate);
    const productCount = event.products?.length || 0;
    const hasBanner = event.banner && event.banner.imageUrl;

    // Get status badge
    const getStatusBadge = () =>
    {
        const config = {
            draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
            scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
            expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' },
        };
        return config[event.status];
    };

    const statusBadge = getStatusBadge();

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/promotionals"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {event.name}
                            </h1>
                            <span className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                                statusBadge.color
                            )}>
                                {statusBadge.label}
                            </span>
                            {event.isPublished ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                    <Eye className="w-4 h-4" />
                                    Published
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    <EyeOff className="w-4 h-4" />
                                    Unpublished
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span>{productCount} {productCount === 1 ? 'product' : 'products'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleTogglePublish}
                            disabled={publishing}
                            className={cn(
                                'inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50',
                                event.isPublished
                                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                            )}
                        >
                            {event.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {publishing ? 'Updating...' : event.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Products</h2>
                    <Link
                        href={`/promotionals/${eventId}/products`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 font-medium rounded-lg transition-colors"
                    >
                        {productCount > 0 ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {productCount > 0 ? 'Edit Products' : 'Add Products'}
                    </Link>
                </div>

                {productCount > 0 ? (
                    <div className="space-y-3">
                        {event.products?.map((productDiscount) =>
                        {
                            const product = products.find(p => p.product_id === productDiscount.productId);
                            return (
                                <div key={productDiscount.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{product?.title || 'Product'}</h3>
                                        <p className="text-sm text-gray-600">
                                            ${productDiscount.originalPrice.toFixed(2)} → ${productDiscount.discountedPrice.toFixed(2)} ({productDiscount.discountPercentage}% off)
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveProduct(productDiscount.productId)}
                                        className="text-red-600 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No products added yet. Click "Add Products" to get started.
                    </div>
                )}
            </div>

            {/* Banner Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Banner</h2>
                    <Link
                        href={`/promotionals/${eventId}/banner`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 font-medium rounded-lg transition-colors"
                    >
                        {hasBanner ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {hasBanner ? 'Edit Banner' : 'Create Banner'}
                    </Link>
                </div>

                {hasBanner ? (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-green-600">
                            <ImageIcon className="w-5 h-5" />
                            <span className="font-medium">Banner uploaded</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No banner created yet. Click "Create Banner" to add one.
                    </div>
                )}
            </div>
        </div>
    );
}
