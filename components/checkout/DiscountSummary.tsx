"use client";

import { CheckCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscountSummaryProps {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  className?: string;
}

export function DiscountSummary({
  originalAmount,
  discountAmount,
  finalAmount,
  couponCode,
  discountType,
  discountValue,
  className
}: DiscountSummaryProps) {
  const savingsPercentage = originalAmount > 0 
    ? Math.round((discountAmount / originalAmount) * 100) 
    : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Success Banner */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-900">
            Coupon Applied Successfully!
          </p>
          <p className="text-xs text-green-700 font-mono mt-0.5">
            {couponCode}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            {savingsPercentage}% OFF
          </span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">
            Discount Applied
          </h3>
        </div>

        <div className="space-y-2 text-sm">
          {/* Original Amount */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Original Total</span>
            <span className="text-gray-900 line-through">
              ${originalAmount.toFixed(2)}
            </span>
          </div>

          {/* Discount Amount */}
          <div className="flex justify-between items-center">
            <span className="text-green-700 font-medium">
              Discount
              {discountType && discountValue && (
                <span className="text-xs ml-1">
                  ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`})
                </span>
              )}
            </span>
            <span className="text-green-700 font-semibold">
              -${discountAmount.toFixed(2)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-purple-200 my-2"></div>

          {/* Final Amount */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-base font-bold text-purple-900">
              You Pay
            </span>
            <span className="text-xl font-bold text-purple-900">
              ${finalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Savings Badge */}
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-purple-700">🎉</span>
            <span className="font-medium text-purple-900">
              You're saving ${discountAmount.toFixed(2)} on this order!
            </span>
            <span className="text-purple-700">🎉</span>
          </div>
        </div>
      </div>
    </div>
  );
}
