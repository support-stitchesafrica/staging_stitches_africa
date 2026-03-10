'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Tailor } from '@/types';
import { productRepository, tailorRepository } from '@/lib/firestore';
import BrandLogo from '@/components/shops/ui/BrandLogo';

interface VendorWithProducts extends Tailor
{
    productCount: number;
    categories: string[];
}

export default function VendorsPage()
{
    const [vendors, setVendors] = useState<VendorWithProducts[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() =>
    {
        loadVendors();
    }, []);

    const loadVendors = async () =>
    {
        try
        {
            setLoading(true);

            // Get all products first
            const products = await productRepository.getAll();

            // Group products by tailor ID to get product counts and categories
            const productsByTailor = new Map<string, {
                products: Product[];
                categories: Set<string>;
                tailorName: string;
            }>();

            products.forEach(product =>
            {
                const tailorId = product.tailor_id;
                if (tailorId)
                {
                    if (!productsByTailor.has(tailorId))
                    {
                        productsByTailor.set(tailorId, {
                            products: [],
                            categories: new Set(),
                            tailorName: product.tailor || 'Unknown Tailor'
                        });
                    }
                    const tailorData = productsByTailor.get(tailorId)!;
                    tailorData.products.push(product);
                    tailorData.categories.add(product.category);
                }
            });

            // Try to get tailors from tailors collection
            let tailors: Tailor[] = [];
            try
            {
                tailors = await tailorRepository.getAll();
            } catch (error)
            {
                console.log('Could not fetch from tailors collection, will use product data');
            }

            // Create a map of existing tailors
            const existingTailors = new Map(tailors.map(tailor => [tailor.id, tailor]));

            // Combine tailor data with product information, creating missing tailors from product data
            const vendorList: VendorWithProducts[] = Array.from(productsByTailor.entries())
                .map(([tailorId, tailorData]) =>
                {
                    const existingTailor = existingTailors.get(tailorId);

                    if (existingTailor)
                    {
                        // Use existing tailor data
                        return {
                            ...existingTailor,
                            productCount: tailorData.products.length,
                            categories: Array.from(tailorData.categories)
                        };
                    } else
                    {
                        // Create tailor from product data
                        return {
                            id: tailorId,
                            brandName: tailorData.tailorName,
                            brand_logo: '',
                            first_name: '',
                            last_name: '',
                            email: '',
                            phoneNumber: '',
                            address: '',
                            city: '',
                            state: '',
                            country: '',
                            ratings: 0,
                            yearsOfExperience: 0,
                            type: [],
                            featured_works: [],
                            status: 'active',
                            productCount: tailorData.products.length,
                            categories: Array.from(tailorData.categories)
                        } as VendorWithProducts;
                    }
                })
                .filter(vendor => vendor.productCount > 0) // Only show vendors with products



            // Show all vendors
            setVendors(vendorList);
        } catch (error)
        {
            console.error('Error loading vendors:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const categories = Array.from(new Set(vendors.flatMap(v => v.categories)));

    const filteredVendors = vendors
        .filter(vendor =>
        {
            // Filter by category
            const categoryMatch = selectedCategory === 'all' || vendor.categories.includes(selectedCategory);

            // Filter by search query
            const searchMatch = searchQuery === '' ||
                vendor.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));

            return categoryMatch && searchMatch;
        });

    if (loading)
    {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="animate-pulse">
                                {/* Logo skeleton */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                                </div>
                                {/* Brand name skeleton */}
                                <div className="text-center mb-3">
                                    <div className="h-5 bg-gray-200 rounded mx-auto w-3/4 mb-1"></div>
                                </div>
                                {/* Product count skeleton */}
                                <div className="text-center mb-4">
                                    <div className="h-4 bg-gray-200 rounded mx-auto w-1/2"></div>
                                </div>
                                {/* Button skeleton */}
                                <div className="h-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Vendors</h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <p className="text-gray-600">Discover fashion brands and their specialties</p>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 whitespace-nowrap">
                            {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
                            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'all'
                            ? ''
                            : 'btn-secondary'
                            }`}
                    >
                        All Categories
                    </button>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${selectedCategory === category
                                ? ''
                                : 'btn-secondary'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vendors Grid - 2 columns on small screens, 4 on large screens */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredVendors.map(vendor => (
                    <div key={vendor.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 border border-gray-200">
                        {/* Brand Logo */}
                        <div className="flex justify-center mb-4">
                            <BrandLogo
                                src={vendor.brand_logo}
                                alt={`${vendor.brandName || vendor.first_name || 'Vendor'} logo`}
                                brandName={vendor.brandName || `${vendor.first_name} ${vendor.last_name}` || 'Unknown'}
                                size={80}
                                className="mx-auto"
                            />
                        </div>

                        {/* Brand Name */}
                        <div className="text-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                {vendor.brandName || `${vendor.first_name} ${vendor.last_name}` || 'Unknown Brand'}
                            </h3>
                        </div>

                        {/* Product Count */}
                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-600">
                                {vendor.productCount} {vendor.productCount === 1 ? 'Product' : 'Products'}
                            </p>
                        </div>

                        {/* View Products Button */}
                        <div className="text-center">
                            <Link href={`/shops/vendors/${vendor.id}`}>
                                <button className="w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors">
                                    View Products
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {filteredVendors.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedCategory === 'all' ? 'No Vendors Available' : 'No Vendors in This Category'}
                    </h3>
                    <p className="text-gray-500 text-lg mb-6">
                        {selectedCategory === 'all'
                            ? 'We\'re working on adding more talented tailors to our platform.'
                            : `No vendors specialize in ${selectedCategory} at the moment.`
                        }
                    </p>
                    {selectedCategory !== 'all' && (
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className="px-6 py-2 rounded-lg transition-colors"
                        >
                            View All Vendors
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}