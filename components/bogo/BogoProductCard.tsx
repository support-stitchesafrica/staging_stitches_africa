/**
 * Enhanced BOGO Product Card with Real-time Analytics Tracking
 * 
 * This component demonstrates how to integrate comprehensive BOGO tracking
 * into product display components with automatic event tracking.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBogoTracking } from '@/hooks/useBogoTracking';
import { Price } from '@/components/common/Price';
import { 
  ShoppingCart, 
  Eye, 
  Gift, 
  Star, 
  MapPin, 
  Users,
  TrendingUp
} from 'lucide-react';

interface BogoProductCardProps {
  mappingId: string;
  mainProduct: {
    id: string;
    name: string;
    price: number;
    image: string;
    rating?: number;
    reviewCount?: number;
  };
  freeProduct: {
    id: string;
    name: string;
    originalPrice: number;
    image: string;
  };
  userId?: string;
  userInfo?: {
    email?: string;
    name?: string;
  };
  onAddToCart?: (mainProductId: string, freeProductId: string) => void;
  className?: string;
}

export const BogoProductCard: React.FC<BogoProductCardProps> = ({
  mappingId,
  mainProduct,
  freeProduct,
  userId,
  userInfo,
  onAddToCart,
  className = ''
}) => {
  const [isViewed, setIsViewed] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize BOGO tracking with user info
  const {
    trackView,
    trackAddToCart,
    getSessionId,
    setUserInfo
  } = useBogoTracking({
    userId,
    userInfo,
    autoTrackPageViews: false, // We'll handle this manually for more control
    sessionTimeout: 30
  });

  // Set user info when available
  useEffect(() => {
    if (userId && userInfo) {
      setUserInfo(userId, userInfo);
    }
  }, [userId, userInfo, setUserInfo]);

  // Track product view when component becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isViewed) {
            setIsVisible(true);
            setIsViewed(true);
            
            // Track the view event
            trackView(mappingId, mainProduct.id, {
              productName: mainProduct.name,
              productPrice: mainProduct.price,
              freeProductName: freeProduct.name,
              freeProductValue: freeProduct.originalPrice,
              viewType: 'intersection_observer',
              sessionId: getSessionId()
            });

            // Simulate view count increment (in real app, this would come from API)
            setViewCount(prev => prev + 1);
          }
        });
      },
      {
        threshold: 0.5, // Track when 50% of the component is visible
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const cardElement = document.getElementById(`bogo-card-${mappingId}`);
    if (cardElement) {
      observer.observe(cardElement);
    }

    return () => {
      if (cardElement) {
        observer.unobserve(cardElement);
      }
    };
  }, [mappingId, mainProduct.id, mainProduct.name, mainProduct.price, freeProduct.name, freeProduct.originalPrice, isViewed, trackView, getSessionId]);

  // Handle add to cart with tracking
  const handleAddToCart = async () => {
    try {
      // Calculate cart total (main product price, free product is $0)
      const cartTotal = mainProduct.price;
      
      // Track add to cart event
      await trackAddToCart(
        mappingId,
        mainProduct.id,
        freeProduct.id,
        cartTotal,
        {
          productName: mainProduct.name,
          productPrice: mainProduct.price,
          freeProductName: freeProduct.name,
          freeProductValue: freeProduct.originalPrice,
          savings: freeProduct.originalPrice,
          sessionId: getSessionId(),
          cartAction: 'bogo_add_to_cart'
        }
      );

      setIsAddedToCart(true);

      // Call parent callback if provided
      if (onAddToCart) {
        onAddToCart(mainProduct.id, freeProduct.id);
      }

      // Show success feedback
      setTimeout(() => setIsAddedToCart(false), 3000);
    } catch (error) {
      console.error('Failed to add BOGO items to cart:', error);
    }
  };

  const totalSavings = freeProduct.originalPrice;
  const savingsPercentage = Math.round((totalSavings / (mainProduct.price + freeProduct.originalPrice)) * 100);

  return (
    <Card 
      id={`bogo-card-${mappingId}`}
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${isVisible ? 'ring-2 ring-blue-200' : ''} ${className}`}
    >
      {/* BOGO Badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold">
          <Gift className="w-3 h-3 mr-1" />
          BOGO DEAL
        </Badge>
      </div>

      {/* Savings Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Save ${totalSavings.toFixed(2)} ({savingsPercentage}%)
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Buy One, Get One FREE</CardTitle>
          {isVisible && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{viewCount}</span>
            </div>
          )}
        </div>
        <CardDescription>
          Purchase {mainProduct.name} and get {freeProduct.name} absolutely free!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Product */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <img
            src={mainProduct.image}
            alt={mainProduct.name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">{mainProduct.name}</h4>
            <div className="flex items-center gap-2">
              <Price
                price={mainProduct.price}
                originalCurrency="USD"
                size="lg"
                variant="accent"
              />
              {mainProduct.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {mainProduct.rating} ({mainProduct.reviewCount || 0})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plus Sign */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
            <span className="text-lg font-bold text-gray-600">+</span>
          </div>
        </div>

        {/* Free Product */}
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
          <img
            src={freeProduct.image}
            alt={freeProduct.name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">{freeProduct.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">FREE</span>
              <Price
                price={freeProduct.originalPrice}
                originalCurrency="USD"
                size="sm"
                variant="muted"
                className="line-through"
                showTooltip={false}
              />
            </div>
          </div>
          <Badge className="bg-green-500 text-white">FREE</Badge>
        </div>

        {/* Total Value */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Value:</span>
            <Price
              price={mainProduct.price + freeProduct.originalPrice}
              originalCurrency="USD"
              size="sm"
              variant="muted"
              className="line-through"
              showTooltip={false}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">You Pay:</span>
            <Price
              price={mainProduct.price}
              originalCurrency="USD"
              size="lg"
              variant="accent"
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-green-600">You Save:</span>
            <Price
              price={totalSavings}
              originalCurrency="USD"
              size="sm"
              className="font-semibold text-green-600"
              showTooltip={false}
            />
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          className={`w-full transition-all duration-300 ${
            isAddedToCart 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          }`}
          disabled={isAddedToCart}
        >
          {isAddedToCart ? (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add BOGO Deal to Cart
            </>
          )}
        </Button>

        {/* Analytics Info (for demo purposes) */}
        {isVisible && (
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span>Session ID:</span>
              <span className="font-mono">{getSessionId().slice(-8)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tracking Status:</span>
              <span className="text-green-600">Active</span>
            </div>
            {userId && (
              <div className="flex items-center justify-between">
                <span>User ID:</span>
                <span className="font-mono">{userId.slice(-6)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};