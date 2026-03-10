'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllTailors, TailorBrand } from '@/vendor-services/getAllTailors';
import { getImageWithFallback } from '@/lib/utils/image-validator';

interface FeaturedVendorsProps
{
    title?: string;
    subtitle?: string;
}

export const FeaturedVendors: React.FC<FeaturedVendorsProps> = ({
    title = "Featured Vendors",
    subtitle = "Discover our talented tailors and designers"
}) =>
{
    const [vendors, setVendors] = useState<TailorBrand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() =>
    {
        loadVendors();
    }, []);

    const loadVendors = async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            // Add timeout to prevent hanging (10 seconds)
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Request timeout")), 10000)
            );

            const response = await Promise.race([
                getAllTailors(),
                timeoutPromise,
            ]);

            if (response.success && response.data)
            {
                // Shuffle and get random vendors
                const shuffled = response.data.sort(() => 0.5 - Math.random());
                const randomVendors = shuffled.slice(0, 10);
                setVendors(randomVendors);
            } else
            {
                setError(response.message || 'Failed to load vendors');
            }
        } catch (err)
        {
            console.error('Error loading vendors:', err);
            setError('Failed to load vendors');
        } finally
        {
            setLoading(false);
        }
    };

    // Navigation handlers - no authentication required
    const handleVendorClick = useCallback((vendorId: string) =>
    {
        router.push(`/shops/vendors/${vendorId}`);
    }, [router]);

    const handleViewAllVendors = useCallback(() =>
    {
        router.push('/shops/vendors');
    }, [router]);

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
                            <div key={index} className="flex-shrink-0 w-48 bg-white rounded-lg shadow-md animate-pulse">
                                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
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
                        onClick={loadVendors}
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

                {/* Vendors Slider */}
                <div className="relative">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {vendors.map((vendor) => (
                            <div
                                key={vendor.id}
                                onClick={() => handleVendorClick(vendor.id)}
                                className="flex-shrink-0 w-48 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer"
                            >
                                {/* Vendor Logo */}
                                <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center p-4">
                                    <Image
                                        src={getImageWithFallback(vendor.brand_logo ? [vendor.brand_logo] : [])}
                                        alt={vendor.brandName}
                                        fill
                                        className="object-contain group-hover:scale-105 transition-transform duration-300 p-4"
                                        sizes="(max-width: 768px) 192px, 192px"
                                        onError={(e) =>
                                        {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder-product.svg';
                                        }}
                                    />
                                </div>

                                {/* Vendor Info */}
                                <div className="p-4 text-center">
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                                        {vendor.brandName}
                                    </h3>

                                    {/* Vendor Type Tags */}
                                    {vendor.type && Array.isArray(vendor.type) && vendor.type.length > 0 && (
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {vendor.type.map((type, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${type === 'Bespoke'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
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

                {/* View All Vendors Link */}
                <div className="text-center mt-8">
                    <button
                        onClick={handleViewAllVendors}
                        className="px-6 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors"
                    >
                        View All Vendors
                    </button>
                </div>
            </div>
        </section>
    );
};
