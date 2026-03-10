'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LazyImageProps
{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    sizes?: string;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
}

// Check if URL is from Firebase Storage
const isFirebaseStorageUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes("firebasestorage.googleapis.com") || 
           url.includes("firebase.storage") ||
           url.includes("storage.googleapis.com");
};

export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    width,
    height,
    fill = false,
    className,
    sizes,
    priority = false,
    placeholder = 'empty',
    blurDataURL
}) =>
{
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () =>
    {
        setIsLoading(false);
    };

    const handleError = () =>
    {
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError)
    {
        return (
            <div className={cn(
                "bg-gray-200 flex items-center justify-center text-gray-400",
                className
            )}>
                <span className="text-sm">Image not available</span>
            </div>
        );
    }

    // Use native img tag for Firebase Storage URLs
    const useNativeImg = isFirebaseStorageUrl(src);

    if (useNativeImg) {
        const imgStyle: React.CSSProperties = fill
            ? {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: className?.includes("object-contain") ? "contain" : "cover",
            }
            : {
                width: width ? `${width}px` : "auto",
                height: height ? `${height}px` : "auto",
            };

        return (
            <div className="relative">
                <img
                    src={src}
                    alt={alt}
                    style={imgStyle}
                    className={cn(
                        "transition-opacity duration-300",
                        isLoading ? "opacity-0" : "opacity-100",
                        className
                    )}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    crossOrigin="anonymous"
                />
                {isLoading && (
                    <div className={cn(
                        "absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center",
                        className
                    )}>
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                fill={fill}
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
                sizes={sizes}
                priority={priority}
                placeholder={placeholder}
                blurDataURL={blurDataURL}
                onLoad={handleLoad}
                onError={handleError}
            />

            {isLoading && (
                <div className={cn(
                    "absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center",
                    className
                )}>
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};