'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductSearchService } from '@/lib/ai-assistant/product-search-service';
import { formatPrice, calculateDiscountedPrice } from '@/lib/utils';
import { getImageWithFallback } from '@/lib/utils/image-validator';
import { ArrowLeft, Search, Filter } from 'lucide-react';

// Use the FormattedProduct type from the service
import type { FormattedProduct as ServiceFormattedProduct } from '@/lib/ai-assistant/product-search-service';
import Price, { DiscountedPrice } from '@/components/common/Price';

type FormattedProduct = Partial<Product> & {
  product_id: string;
  title: string;
  price: number | {
    base: number;
    currency: string;
    discount?: number;
  };
  images: string[];
  type: 'ready-to-wear' | 'bespoke';
  availability: string;
  vendor: {
    id: string;
    name: string;
    logo?: string;
  };
}

export default function AIRecommendedPage() {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [vendors, setVendors] = useState<Array<{id: string, name: string}>>([]);

  // Initialize filteredProducts with all products when products change
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Get unique user identifier for tracking preferences
  const getUniqueUserId = (): string => {
    if (typeof window === 'undefined') return 'anonymous';
    
    // Check if we already have a unique user ID from chat widget
    let uniqueUserId = localStorage.getItem('ai-chat-unique-user-id');
    
    // If not, generate one
    if (!uniqueUserId) {
      uniqueUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ai-chat-unique-user-id', uniqueUserId);
    }
    
    return uniqueUserId;
  };

  // Extract unique vendors from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueVendors = Array.from(
        new Map(
          products
            .filter(p => p.vendor && p.vendor.id && p.vendor.name)
            .map(p => [p.vendor.id, { id: p.vendor.id, name: p.vendor.name }])
        ).values()
      );
      setVendors(uniqueVendors);
    }
  }, [products]);

  // Filter products based on search query and vendor selection
  useEffect(() => {
    let result = [...products]; // Create a copy to avoid mutation
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      if (query.length > 0) {
        result = result.filter(product => {
          // Check title
          if (product.title && product.title.toLowerCase().includes(query)) {
            return true;
          }
          
          // Check description
          if (product.description && product.description.toLowerCase().includes(query)) {
            return true;
          }
          
          // Check tags
          if (product.tags && product.tags.some(tag => 
            tag && tag.toLowerCase().includes(query)
          )) {
            return true;
          }
          
          // Check category
          if (product.category && product.category.toLowerCase().includes(query)) {
            return true;
          }
          
          // Check vendor name
          if (product.vendor && product.vendor.name && 
              product.vendor.name.toLowerCase().includes(query)) {
            return true;
          }
          
          return false;
        });
      }
    }
    
    // Apply vendor filter
    if (selectedVendor) {
      result = result.filter(product => 
        product.vendor && product.vendor.id === selectedVendor
      );
    }
    
    setFilteredProducts(result);
  }, [products, searchQuery, selectedVendor]);

  useEffect(() => {
    loadRecommendedProducts();
  }, []);

  const loadRecommendedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user ID for personalized recommendations
      const userId = getUniqueUserId();

      // Try to get personalized recommendations based on user preferences first
      let serviceProducts: ServiceFormattedProduct[] = [];
      
      try {
        // Use the new personalized recommendation method
        serviceProducts = await ProductSearchService.getPersonalizedRecommendations(userId, 50);
      } catch (prefError) {
        console.warn('Could not fetch personalized recommendations, falling back to general recommendations:', prefError);
        
        // Fallback to popular products
        serviceProducts = await ProductSearchService.getPopularProducts(50);
      }

      // Convert ServiceFormattedProduct to our compatible type
      const formattedProducts = serviceProducts.map(fp => ({
        product_id: fp.id,
        title: fp.title,
        description: fp.description || '',
        price: {
          base: fp.price,
          currency: fp.currency || 'USD',
          discount: fp.discount,
        },
        discount: fp.discount,
        images: fp.images,
        category: fp.category || '',
        type: fp.type as 'ready-to-wear' | 'bespoke',
        availability: fp.availability || 'in_stock',
        tailor_id: fp.vendor.id,
        tailor: fp.vendor.name,
        vendor: {
          id: fp.vendor.id,
          name: fp.vendor.name,
          logo: fp.vendor.logo,
        },
        tags: fp.tags || [],
        deliveryTimeline: fp.deliveryTimeline,
      }));
      
      // console.log('Formatted products:', formattedProducts); // Debug log

      // Filter out products without images
      const validProducts = formattedProducts.filter((product: any) => 
        product.images && product.images.length > 0
      );
      
      // console.log('Valid products:', validProducts); // Debug log

      setProducts(validProducts as FormattedProduct[]);

    } catch (err) {
      console.error('Error loading AI recommended products:', err);
      setError('Failed to load recommended products');
    } finally {
      setLoading(false);
    }
  };

  const getShopNowLink = (productId: string) => {
    return `/shops/products/${productId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-8">
            <Link href="/shops" className="flex items-center text-black hover:text-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Shop
            </Link>
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI Recommended Products
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Products recommended by our AI shopping assistant based on your preferences
            </p>
          </div>
          
          {/* Search and Filter Section */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="w-full md:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black appearance-none"
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
            {(searchQuery || selectedVendor) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedVendor('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center mb-8">
            <Link href="/shops" className="flex items-center text-black hover:text-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Shop
            </Link>
          </div>
          
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadRecommendedProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8">
          <Link href="/shops" className="flex items-center text-black hover:text-gray-700">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Shop
          </Link>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI Recommended Products
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Products recommended by our AI shopping assistant based on your preferences
          </p>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="w-full md:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black appearance-none"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
            >
              <option value="">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
          {(searchQuery || selectedVendor) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedVendor('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedVendor ? 'No products match your filters' : 'No recommendations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedVendor 
                ? 'Try adjusting your search or filter criteria' 
                : 'Start chatting with our AI assistant to get personalized product recommendations'}
            </p>
            <Link href="/shops">
              <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => {
              const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
              const currency = typeof product.price === 'object' ? product.price.currency : 'USD';
              const discountValue = product.discount || 0;
              const discountedPrice = discountValue > 0
                ? calculateDiscountedPrice(basePrice, discountValue)
                : basePrice;
              const hasDiscount = discountValue > 0;
              const imageUrl = getImageWithFallback(product.images);

              return (
                <div key={product.product_id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden">
                    {imageUrl.includes("firebasestorage.googleapis.com") || imageUrl.includes("storage.googleapis.com") ? (
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.svg';
                        }}
                        loading="lazy"
                        decoding="async"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
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
                                            <DiscountedPrice
                                              originalPrice={basePrice}
                                              salePrice={basePrice * (1 - (product.discount || 0) / 100)}
                                              originalCurrency="USD"
                                              size="sm"
                                            />
                                          ) : (
                                            <Price
                                              price={basePrice}
                                              originalCurrency="USD"
                                              size="sm"
                                              variant="accent"
                                            />
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
        )}
      </div>
    </div>
  );
}