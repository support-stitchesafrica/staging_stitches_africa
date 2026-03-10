'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { productRepository } from '@/lib/firestore';
import { Product } from '@/types';
import { formatPrice, calculateDiscountedPrice } from '@/lib/utils';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { StandardProtectedRoute } from '@/components/shops/auth/RouteProtectionComponents';
import { generateBlurDataURL, RESPONSIVE_SIZES, IMAGE_DIMENSIONS, shouldPrioritizeImage } from '@/lib/utils/image-utils';
import { SafeImage } from '@/components/shops/ui/SafeImage';

export default function WishlistPage()
{
    return (
        <StandardProtectedRoute>
            <WishlistContent />
        </StandardProtectedRoute>
    );
}

function WishlistContent()
{
    const { user } = useAuth();
    const { items, removeItem, loading: wishlistLoading } = useWishlist();
    const { addItem: addToCart } = useCart();
    const [products, setProducts] = useState<Record<string, Product>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() =>
    {
        if (items.length > 0)
        {
            loadProducts();
        }
    }, [items]);

    const loadProducts = async () =>
    {
        setLoading(true);
        try
        {
            const productPromises = items.map(item =>
                productRepository.getByIdWithTailorInfo(item.product_id)
            );
            const productResults = await Promise.all(productPromises);

            const productMap: Record<string, Product> = {};
            productResults.forEach(product =>
            {
                if (product)
                {
                    productMap[product.product_id] = product;
                }
            });

            setProducts(productMap);
        } catch (error)
        {
            console.error('Error loading wishlist products:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product) =>
    {
        addToCart(product, 1);
    };

    const handleRemoveFromWishlist = async (productId: string) =>
    {
        await removeItem(productId);
    };

    if (wishlistLoading || loading)
    {
        return (
            <div className="container-responsive py-6 sm:py-8 bg-white">
                <div className="animate-pulse">
                    <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-6 sm:mb-8"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="space-y-3 sm:space-y-4">
                                <div className="bg-gray-200 aspect-[4/5] sm:aspect-[3/4] rounded-lg"></div>
                                <div className="space-y-2 px-1">
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }


    if (items.length === 0)
    {
        return (
            <div className="container-responsive py-8 sm:py-12 lg:py-16 bg-white min-h-[60vh] flex items-center justify-center">
                <div className="text-center px-4">
                    <Heart size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4 sm:mb-6" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Your wishlist is empty</h1>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">Save items you love to your wishlist and shop them later.</p>
                    <Link href="/shops">
                        <button className="bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary-700 transition-colors">
                            Start Shopping
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container-responsive py-6 sm:py-8 bg-white">
            <div className="mb-6 sm:mb-8">
                <h1 className="heading-responsive font-bold text-gray-900 mb-2">My Wishlist</h1>
                <p className="text-gray-600">{items.length} items saved</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {items.map((item, index) =>
                {
                    const product = products[item.product_id];
                    if (!product) return null;

                    const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
                    const currency = typeof product.price === 'object' ? product.price.currency : 'USD';
                    const discountedPrice = product.discount > 0
                        ? calculateDiscountedPrice(basePrice, product.discount)
                        : basePrice;

                    return (
                        <div key={item.product_id} className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                            {/* Product Image */}
                            <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-t-lg">
                                <Link href={`/shops/products/${product.product_id}`}>
                                    <SafeImage
                                        src={product.images[0] || '/placeholder-product.svg'}
                                        alt={product.title}
                                        fill
                                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                        sizes={RESPONSIVE_SIZES.productCard}
                                        priority={shouldPrioritizeImage(index)}
                                        placeholder="blur"
                                        blurDataURL={generateBlurDataURL(IMAGE_DIMENSIONS.productCard.width, IMAGE_DIMENSIONS.productCard.height)}
                                        fallbackSrc="/placeholder-product.svg"
                                    />
                                </Link>

                                {/* Discount Badge */}
                                {product.discount > 0 && (
                                    <div className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 text-xs font-semibold rounded z-10">
                                        -{product.discount}%
                                    </div>
                                )}

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveFromWishlist(product.product_id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 rounded-full transition-colors duration-200 z-10 shadow-sm"
                                >
                                    <Trash2 size={14} />
                                </button>

                                {/* Product Type Badge */}
                                <div className="absolute bottom-2 left-2 z-10">
                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded shadow-sm ${product.type === 'bespoke'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {product.type === 'bespoke' ? 'Bespoke' : 'RTW'}
                                    </span>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-3 sm:p-4">
                                <div className="mb-2 sm:mb-3">
                                    <Link href={`/shops/products/${product.product_id}`}>
                                        <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
                                            {product.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{product.vendor?.name || 'Unknown Brand'}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                                    <div className="flex items-center space-x-2">
                                        {product.discount > 0 ? (
                                            <>
                                                <span className="text-sm sm:text-base font-semibold text-gray-900">
                                                    {formatPrice(discountedPrice, currency)}
                                                </span>
                                                <span className="text-xs text-gray-500 line-through">
                                                    {formatPrice(basePrice, currency)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                                                {formatPrice(basePrice, currency)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Availability Status */}
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-1 ${product.availability === 'in_stock'
                                            ? 'bg-green-500'
                                            : product.availability === 'pre_order'
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                            }`} />
                                        <span className="text-xs text-gray-500 capitalize">
                                            {product.availability.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    disabled={product.availability === 'out_of_stock'}
                                    className="w-full bg-primary-600 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 transition-colors"
                                >
                                    <ShoppingCart size={12} className="sm:w-4 sm:h-4" />
                                    <span className="truncate">
                                        {product.availability === 'out_of_stock'
                                            ? 'Out of Stock'
                                            : product.availability === 'pre_order'
                                                ? 'Pre-Order'
                                                : 'Add to Cart'
                                        }
                                    </span>
                                </button>

                                {/* Added Date */}
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                    Added {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}