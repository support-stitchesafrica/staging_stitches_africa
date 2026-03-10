'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Image as ImageIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

// Unified product interface for canvas editor
interface UnifiedProduct
{
    id: string;
    title: string;
    images: string[];
    source: 'marketplace' | 'collection';
}

interface ProductImageSelectorProps
{
    products: UnifiedProduct[];
    onSelectImage: (imageUrl: string, productId: string, productSource?: 'marketplace' | 'collection') => void;
    onClose: () => void;
}

/**
 * ProductImageSelector Component
 * Allows users to browse and select product images to add to the canvas
 */
export function ProductImageSelector({
    products,
    onSelectImage,
    onClose,
}: ProductImageSelectorProps)
{
    const [searchTerm, setSearchTerm] = useState('');

    // Filter products based on search
    const filteredProducts = products.filter((product) =>
        product.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleImageSelect = (imageUrl: string, productId: string, productSource?: 'marketplace' | 'collection') =>
    {
        onSelectImage(imageUrl, productId, productSource);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
            onClick={onClose}
        >
            <Card
                className="w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-white shadow-2xl rounded-lg sm:rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Select Product Images</h3>
                        <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">({filteredProducts.length} products)</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 hover:bg-red-100 flex-shrink-0 ml-2"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm"
                        />
                    </div>
                </div>

                {/* Product List - Scrollable Area */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="space-y-1 sm:space-y-1.5">
                                    <h4 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                                        {product.title || 'Untitled Product'}
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 sm:gap-2">
                                        {product.images?.map((imageUrl, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleImageSelect(imageUrl, product.id, product.source)}
                                                className="relative aspect-square rounded-md sm:rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 active:border-blue-600 transition-all hover:shadow-lg group bg-gray-100"
                                            >
                                                <Image
                                                    src={imageUrl}
                                                    alt={`${product.title || 'Product'} - Image ${index + 1}`}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                    unoptimized
                                                    onError={(e) =>
                                                    {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                                    <span className="text-white text-xs font-medium px-2 text-center">
                                                        Select
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {filteredProducts.length === 0 && (
                                <div className="text-center py-8 sm:py-12 text-gray-500">
                                    <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 text-gray-300" />
                                    <p className="text-base sm:text-lg font-medium">No products found</p>
                                    <p className="text-xs sm:text-sm">Try adjusting your search</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </Card>
        </div>
    );
}
