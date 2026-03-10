"use client";

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  webpSrc?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

/**
 * Optimized Image component with WebP support and fallbacks
 * Automatically handles format conversion and loading states
 */
export const OptimizedImage = React.memo<OptimizedImageProps>(({
  src,
  fallbackSrc,
  webpSrc,
  alt,
  className,
  loading = 'lazy',
  priority = false,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate WebP source if not provided
  const optimizedSrc = webpSrc || src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  
  // Determine which source to use
  const imageSrc = imageError ? (fallbackSrc || src) : optimizedSrc;

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        loading={loading}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Responsive Image component with automatic sizing
 */
export const ResponsiveImage = React.memo<OptimizedImageProps & {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}>(({
  aspectRatio = 'landscape',
  className,
  ...props
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  return (
    <div className={cn(
      "relative w-full",
      aspectRatioClasses[aspectRatio],
      className
    )}>
      <OptimizedImage
        fill
        className="object-cover"
        {...props}
      />
    </div>
  );
});

ResponsiveImage.displayName = 'ResponsiveImage';

/**
 * Hero Image component optimized for above-the-fold content
 */
export const HeroImage = React.memo<OptimizedImageProps>(({
  priority = true,
  loading = 'eager',
  ...props
}) => {
  return (
    <OptimizedImage
      priority={priority}
      loading={loading}
      {...props}
    />
  );
});

HeroImage.displayName = 'HeroImage';