'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from '@/components/shops/products/ProductCard';
import { ArrowRight } from 'lucide-react';
import { isValidImageUrl } from '@/lib/utils/image-validator';

interface FeaturedSectionProps
{
    title: string;
    subtitle?: string;
    products: Product[];
    viewAllLink?: string;
    loading?: boolean;
    onWishlistToggle?: (productId: string) => void;
    wishlistItems?: Set<string>;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({
    title,
    subtitle,
    products,
    viewAllLink,
    loading = false,
    onWishlistToggle,
    wishlistItems = new Set()
}) =>
{
    if (loading)
    {
        return (
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                        {subtitle && <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <div key={index} className="space-y-4">
                                    <div className="bg-gray-200 aspect-[3/4] rounded-lg"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Filter products to only show those with valid images
    const productsWithImages = products.filter(product =>
        product.images &&
        product.images.length > 0 &&
        product.images.some(img => isValidImageUrl(img))
    );

    if (productsWithImages.length === 0)
    {
        return null;
    }

    return (
        <section className="py-12">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                        {subtitle && (
                            <p className="text-gray-600">{subtitle}</p>
                        )}
                    </div>

                    {viewAllLink && (
                        <Link href={viewAllLink}>
                            <span className="flex items-center space-x-2 text-primary-600 hover:text-primary-500 font-medium">
                                <span>View All</span>
                                <ArrowRight size={16} />
                            </span>
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {productsWithImages.slice(0, 10).map((product) => (
                        <ProductCard
                            key={product.product_id}
                            product={product}
                            onWishlistToggle={onWishlistToggle}
                            isInWishlist={wishlistItems.has(product.product_id)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};