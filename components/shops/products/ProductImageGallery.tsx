'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { generateBlurDataURL, RESPONSIVE_SIZES, IMAGE_DIMENSIONS } from '@/lib/utils/image-utils';
import { SafeImage } from '@/components/shops/ui/SafeImage';

interface ProductImageGalleryProps
{
    images: string[];
    productTitle: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
    images,
    productTitle
}) =>
{
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    const nextImage = () =>
    {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const previousImage = () =>
    {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const selectImage = (index: number) =>
    {
        setCurrentImageIndex(index);
    };

    if (!images.length)
    {
        return (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <SafeImage
                    src={images[currentImageIndex]}
                    alt={`${productTitle} - Image ${currentImageIndex + 1}`}
                    fill
                    className={`object-cover transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                        }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                    sizes={RESPONSIVE_SIZES.productDetail}
                    priority
                    placeholder="blur"
                    blurDataURL={generateBlurDataURL(600, 600)}
                    fallbackSrc="/placeholder-product.svg"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={previousImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-colors"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-colors"
                            aria-label="Next image"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {/* Zoom Icon */}
                <div className="absolute top-2 right-2 bg-white/80 text-gray-800 p-2 rounded-full shadow-md">
                    <ZoomIn size={16} />
                </div>

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${index === currentImageIndex
                                    ? 'border-primary-500'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <SafeImage
                                src={image}
                                alt={`${productTitle} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes={RESPONSIVE_SIZES.thumbnail}
                                placeholder="blur"
                                blurDataURL={generateBlurDataURL(IMAGE_DIMENSIONS.productThumbnail.width, IMAGE_DIMENSIONS.productThumbnail.height)}
                                fallbackSrc="/placeholder-product.svg"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};