"use client";

import React, { useState, useEffect } from 'react';
import { X, Percent, Tag, Star, Flame, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromotionService, PromotionDisplayData, StorefrontPromotion } from '@/lib/storefront/promotion-service';

interface PromotionalBannerProps {
  vendorId: string;
  position?: 'top' | 'middle' | 'bottom' | 'all';
  maxBanners?: number;
  showCloseButton?: boolean;
  autoRotate?: boolean;
  rotationInterval?: number; // in milliseconds
  className?: string;
  onPromotionClick?: (promotion: StorefrontPromotion) => void;
  onPromotionClose?: (promotionId: string) => void;
}

export function PromotionalBanner({
  vendorId,
  position = 'all',
  maxBanners = 3,
  showCloseButton = true,
  autoRotate = true,
  rotationInterval = 5000,
  className,
  onPromotionClick,
  onPromotionClose,
}: PromotionalBannerProps) {
  const [promotions, setPromotions] = useState<PromotionDisplayData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closedPromotions, setClosedPromotions] = useState<Set<string>>(new Set());

  // Load promotions on mount
  useEffect(() => {
    loadPromotions();
  }, [vendorId]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || promotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, promotions.length, rotationInterval]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const promotionData = await PromotionService.getPromotionDisplayData(vendorId);
      
      // Filter by position if specified
      let filteredPromotions = promotionData;
      if (position !== 'all') {
        filteredPromotions = promotionData.filter(
          p => p.promotion.displaySettings.position === position
        );
      }

      // Sort by priority and limit
      const sortedPromotions = PromotionService.sortPromotionsByPriority(filteredPromotions);
      const limitedPromotions = sortedPromotions.slice(0, maxBanners);

      setPromotions(limitedPromotions);
    } catch (err) {
      console.error('Error loading promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (promotionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setClosedPromotions(prev => new Set([...prev, promotionId]));
    onPromotionClose?.(promotionId);
  };

  const handlePromotionClick = (promotion: StorefrontPromotion) => {
    onPromotionClick?.(promotion);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  const getIcon = (iconType?: string) => {
    const iconClass = "w-5 h-5";
    switch (iconType) {
      case 'percent':
        return <Percent className={iconClass} />;
      case 'tag':
        return <Tag className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      case 'fire':
        return <Flame className={iconClass} />;
      default:
        return <Tag className={iconClass} />;
    }
  };

  // Don't render if loading, error, or no promotions
  if (loading || error || promotions.length === 0) {
    return null;
  }

  // Filter out closed promotions
  const visiblePromotions = promotions.filter(p => !closedPromotions.has(p.promotion.id));
  
  if (visiblePromotions.length === 0) {
    return null;
  }

  // Single banner display
  if (visiblePromotions.length === 1) {
    const { promotion, timeRemaining } = visiblePromotions[0];
    const { displaySettings } = promotion;

    return (
      <div
        className={cn(
          "relative w-full px-4 py-3 cursor-pointer transition-all duration-300 hover:shadow-md",
          className
        )}
        style={{
          backgroundColor: displaySettings.backgroundColor,
          color: displaySettings.textColor,
          borderColor: displaySettings.borderColor,
          borderWidth: displaySettings.borderColor ? '1px' : '0',
        }}
        onClick={() => handlePromotionClick(promotion)}
        data-testid="promotional-banner"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {displaySettings.showIcon && (
              <div className="flex-shrink-0">
                {getIcon(displaySettings.iconType)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium truncate">
                {promotion.bannerMessage}
              </p>
              {timeRemaining && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs opacity-90">
                    {PromotionService.formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showCloseButton && (
            <button
              onClick={(e) => handleClose(promotion.id, e)}
              className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
              aria-label="Close promotion"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Multiple banners with rotation
  const currentPromotion = visiblePromotions[currentIndex];
  const { promotion, timeRemaining } = currentPromotion;
  const { displaySettings } = promotion;

  return (
    <div
      className={cn(
        "relative w-full px-4 py-3 cursor-pointer transition-all duration-300 hover:shadow-md",
        className
      )}
      style={{
        backgroundColor: displaySettings.backgroundColor,
        color: displaySettings.textColor,
        borderColor: displaySettings.borderColor,
        borderWidth: displaySettings.borderColor ? '1px' : '0',
      }}
      onClick={() => handlePromotionClick(promotion)}
      data-testid="promotional-banner"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Navigation - Previous */}
        {visiblePromotions.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors mr-2"
            aria-label="Previous promotion"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 flex-1 min-w-0">
          {displaySettings.showIcon && (
            <div className="flex-shrink-0">
              {getIcon(displaySettings.iconType)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium truncate">
              {promotion.bannerMessage}
            </p>
            {timeRemaining && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs opacity-90">
                  {PromotionService.formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicators */}
          {visiblePromotions.length > 1 && (
            <div className="flex gap-1">
              {visiblePromotions.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-current"
                      : "bg-current/40 hover:bg-current/60"
                  )}
                  aria-label={`Go to promotion ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Navigation - Next */}
          {visiblePromotions.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
              aria-label="Next promotion"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={(e) => handleClose(promotion.id, e)}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
              aria-label="Close promotion"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized banner components for different positions
export function TopPromotionalBanner(props: Omit<PromotionalBannerProps, 'position'>) {
  return <PromotionalBanner {...props} position="top" />;
}

export function MiddlePromotionalBanner(props: Omit<PromotionalBannerProps, 'position'>) {
  return <PromotionalBanner {...props} position="middle" />;
}

export function BottomPromotionalBanner(props: Omit<PromotionalBannerProps, 'position'>) {
  return <PromotionalBanner {...props} position="bottom" />;
}