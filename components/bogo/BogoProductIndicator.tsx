"use client";

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { SPECIFIC_BOGO_MAPPINGS } from '@/lib/bogo/configure-specific-mappings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface BogoProductIndicatorProps {
  productId: string;
  className?: string;
}

interface FreeProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface BogoPromotion {
  promotionName: string;
  description: string;
  freeProducts: FreeProduct[];
  totalSavings: number;
  endDate: Date;
}

export const BogoProductIndicator: React.FC<BogoProductIndicatorProps> = ({
  productId,
  className = ""
}) => {
  const [bogoPromotion, setBogoPromotion] = useState<BogoPromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkBogoPromotion();
  }, [productId]);



  const checkBogoPromotion = async () => {
    try {
      setLoading(true);
      
      console.log('[BogoProductIndicator] Checking BOGO for product:', productId);
      
      // Find if this product is a main product in any BOGO mapping
      const mapping = SPECIFIC_BOGO_MAPPINGS.find(m => m.mainProductId === productId);
      
      console.log('[BogoProductIndicator] Found mapping:', mapping);
      
      if (!mapping) {
        console.log('[BogoProductIndicator] No mapping found for product:', productId);
        setBogoPromotion(null);
        return;
      }

      // Check if promotion is currently active
      const now = new Date();
      const startDate = mapping.promotionStartDate instanceof Date 
        ? mapping.promotionStartDate 
        : new Date(mapping.promotionStartDate.toMillis());
      const endDate = mapping.promotionEndDate instanceof Date 
        ? mapping.promotionEndDate 
        : new Date(mapping.promotionEndDate.toMillis());
      
      console.log('[BogoProductIndicator] Date check:', { now, startDate, endDate });
      
      if (now < startDate || now > endDate) {
        console.log('[BogoProductIndicator] Promotion not active for dates');
        setBogoPromotion(null);
        return;
      }

      // Fetch free product details
      const freeProducts: FreeProduct[] = [];
      let totalSavings = 0;

      for (const freeProductId of mapping.freeProductIds) {
        try {
          const freeProductDoc = await getDoc(doc(db, 'tailor_works', freeProductId));
          if (freeProductDoc.exists()) {
            const freeProductData = freeProductDoc.data();
            const price = typeof freeProductData.price === 'number' 
              ? freeProductData.price 
              : freeProductData.price?.base || 0;
            
            freeProducts.push({
              id: freeProductId,
              title: freeProductData.title || 'Free Product',
              price: price,
              image: freeProductData.images?.[0] || '/placeholder-product.svg'
            });
            
            totalSavings += price;
          }
        } catch (error) {
          console.error(`Error fetching free product ${freeProductId}:`, error);
        }
      }

      if (freeProducts.length > 0) {
        console.log('[BogoProductIndicator] Setting BOGO promotion:', {
          promotionName: mapping.promotionName,
          freeProducts,
          totalSavings
        });
        
        setBogoPromotion({
          promotionName: mapping.promotionName || 'BOGO Promotion',
          description: mapping.description || 'Buy one, get one free!',
          freeProducts,
          totalSavings,
          endDate: mapping.promotionEndDate instanceof Date 
            ? mapping.promotionEndDate 
            : new Date(mapping.promotionEndDate.toMillis())
        });
      } else {
        console.log('[BogoProductIndicator] No free products found');
      }
    } catch (error) {
      console.error('[BogoProductIndicator] Error checking BOGO promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-16 ${className}`} />
    );
  }

  if (!bogoPromotion) {
    // For debugging - show if this product should have BOGO
    const mapping = SPECIFIC_BOGO_MAPPINGS.find(m => m.mainProductId === productId);
    if (mapping) {
      console.log('[BogoProductIndicator] Product has mapping but no promotion set:', { productId, mapping });
    }
    return null;
  }

  const daysUntilExpiry = Math.ceil(
    (bogoPromotion.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 ${className}`}>
      {/* Main BOGO Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold text-sm">
            <Gift className="w-4 h-4" />
            <span>BOGO</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {bogoPromotion.promotionName.replace('December BOGO - ', '')}
            </h3>
            <p className="text-sm text-gray-600">
              Get {bogoPromotion.freeProducts.length > 1 ? 'your choice of' : ''} FREE gift worth ${bogoPromotion.totalSavings.toFixed(2)}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm"
        >
          Details
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Free Products Preview */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium text-gray-700">You get FREE:</span>
        <div className="flex gap-2">
          {bogoPromotion.freeProducts.slice(0, 3).map((product, index) => (
            <div key={product.id} className="relative">
              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-green-200">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full px-1">
                FREE
              </div>
            </div>
          ))}
          {bogoPromotion.freeProducts.length > 3 && (
            <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-500">+{bogoPromotion.freeProducts.length - 3}</span>
            </div>
          )}
        </div>
      </div>

      {/* Savings and Urgency */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm">
            Save ${bogoPromotion.totalSavings.toFixed(2)}
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium text-sm">
            Free Shipping Included
          </div>
        </div>
        
        {daysUntilExpiry <= 7 && (
          <div className="text-red-600 font-medium text-sm">
            {daysUntilExpiry === 1 ? 'Last day!' : `${daysUntilExpiry} days left`}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <h4 className="font-semibold text-gray-900 mb-3">Free Products Available:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bogoPromotion.freeProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full px-1">
                    FREE
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 text-sm">{product.title}</h5>
                  <p className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</p>
                  <p className="text-sm font-bold text-green-600">FREE</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>How it works:</strong> Add this item to your cart and your free gift{bogoPromotion.freeProducts.length > 1 ? 's' : ''} will be automatically included. 
              {bogoPromotion.freeProducts.length > 1 && ' You can choose your preferred free item during checkout.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};