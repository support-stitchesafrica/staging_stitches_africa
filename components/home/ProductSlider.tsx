'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { productRepository } from '@/lib/firestore';
import { formatPrice, calculateDiscountedPrice } from '@/lib/utils';
import { getImageWithFallback } from '@/lib/utils/image-validator';
// import { useAuth } from '@/contexts/AuthContext'; // Not available in root layout
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductSliderProps
{
    title?: string;
    subtitle?: string;
}

export const ProductSlider: React.FC<ProductSliderProps> = ({
    title = "Featured Products",
    subtitle = "Discover our latest collection"
}) =>
{
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const { user } = useAuth(); // Not available in root layout
    const user = null; // Default to not authenticated for home page

    useEffect(() =>
    {
        loadRandomProducts();
    }, []);

    const loadRandomProducts = async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            // Fetch all products
            const allProducts = await productRepository.getAllWithTailorInfo();

            // Shuffle and get 10 random products
            const shuffled = allProducts.sort(() => 0.5 - Math.random());
            const randomProducts = shuffled.slice(0, 10);

            setProducts(randomProducts);
        } catch (err)
        {
            console.error('Error loading products:', err);
            setError('Failed to load products');
        } finally
        {
            setLoading(false);
        }
    };

    const getShopNowLink = (productId: string) =>
    {
        // Always go to product details page - let the shops layout handle auth
        return `/shops/products/${productId}`;
    };

    if (loading)
    {
        return (
            <section className="py-12 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                        <p className="text-gray-600">{subtitle}</p>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div key={index} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md animate-pulse">
                                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
                                    <div className="h-8 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error)
    {
        return (
            <section className="py-12 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button
                        onClick={loadRandomProducts}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-gray-600">{subtitle}</p>
                </div>

                {/* Products Slider */}
                <div className="relative">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {products.map((product) =>
                        {
                            const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
                            const currency = typeof product.price === 'object' ? product.price.currency : 'USD';
                            const discountedPrice = product.discount > 0
                                ? calculateDiscountedPrice(basePrice, product.discount)
                                : basePrice;
                            const hasDiscount = product.discount > 0;
                            const imageUrl = getImageWithFallback(product.images);

                            return (
                                <div key={product.product_id} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                    {/* Product Image */}
                                    <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                                        {imageUrl.includes("firebasestorage.googleapis.com") || imageUrl.includes("storage.googleapis.com") ? (
                                            <img
                                                src={imageUrl}
                                                alt={product.title}
                                                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                onError={(e) =>
                                                {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/placeholder-product.svg';
                                                }}
                                                loading="lazy"
                                                decoding="async"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <Image
                                                src={imageUrl}
                                                alt={product.title}
                                                fill
                                                className="object-cover hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 256px, 256px"
                                                onError={(e) =>
                                                {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/placeholder-product.svg';
                                                }}
                                            />
                                        )}
                                        {hasDiscount && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                -{product.discount}%
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'bespoke'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {product.type === 'bespoke' ? 'Bespoke' : 'RTW'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                                            {product.title}
                                        </h3>
                                        <p className="text-gray-600 text-xs mb-2">
                                            by {product.vendor?.name || 'Unknown Vendor'}
                                        </p>

                                        {/* Price */}
                                        <div className="flex items-center gap-2 mb-3">
                                            {hasDiscount ? (
                                                <>
                                                    <span className="font-bold text-gray-900">
                                                        {formatPrice(discountedPrice, currency)}
                                                    </span>
                                                    <span className="text-sm line-through text-gray-400">
                                                        {formatPrice(basePrice, currency)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-gray-900">
                                                    {formatPrice(basePrice, currency)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Shop Now Button */}
                                        <Link href={getShopNowLink(product.product_id)}>
                                            <button className="w-full bg-black text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                                                Shop Now
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scroll Indicators */}
                    <div className="flex justify-center mt-4">
                        <div className="flex items-center gap-2">
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-500">Scroll to see more</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* View All Products Link */}
                <div className="text-center mt-8">
                    <Link href="/shops/products">
                        <button className="px-6 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors">
                            View All Products
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
};