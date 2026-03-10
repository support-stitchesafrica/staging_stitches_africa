"use client";

import React from 'react';
import { TrendingDown, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromotionService } from '@/lib/storefront/promotion-service';

interface SavingsCalculatorProps {
  originalPrice: number;
  salePrice: number;
  variant?: 'inline' | 'card' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showAmount?: boolean;
  showIcon?: boolean;
  currency?: string;
  className?: string;
}

export function SavingsCalculator({
  originalPrice,
  salePrice,
  variant = 'inline',
  size = 'md',
  showPercentage = true,
  showAmount = true,
  showIcon = true,
  currency = 'USD',
  className,
}: SavingsCalculatorProps) {
  // Calculate savings
  const savingsAmount = PromotionService.calculateSavingsAmount(originalPrice, salePrice);
  const discountPercentage = PromotionService.calculateDiscountPercentage(originalPrice, salePrice);

  // Don't render if no savings
  if (savingsAmount <= 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Inline variant - simple text display
  if (variant === 'inline') {
    return (
      <div
        data-testid="savings-calculator"
        className={cn(
          'inline-flex items-center gap-1 text-green-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <TrendingDown className={iconSizes[size]} />}
        <span>
          {showAmount && `Save ${PromotionService.formatPrice(savingsAmount, currency)}`}
          {showAmount && showPercentage && ' '}
          {showPercentage && `(${Math.round(discountPercentage)}% off)`}
        </span>
      </div>
    );
  }

  // Card variant - compact card display
  if (variant === 'card') {
    return (
      <div
        data-testid="savings-calculator"
        className={cn(
          'inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200',
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <DollarSign className={iconSizes[size]} />}
        <div className="flex flex-col">
          {showAmount && (
            <span className="font-bold">
              Save {PromotionService.formatPrice(savingsAmount, currency)}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs opacity-80">
              {Math.round(discountPercentage)}% discount
            </span>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant - full breakdown
  return (
    <div
      data-testid="savings-calculator"
      className={cn(
        'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {showIcon && <Percent className="w-5 h-5 text-green-600" />}
        <h3 className="font-bold text-green-800">Your Savings</h3>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Original Price:</span>
          <span className="line-through text-gray-500">
            {PromotionService.formatPrice(originalPrice, currency)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Sale Price:</span>
          <span className="font-bold text-green-600">
            {PromotionService.formatPrice(salePrice, currency)}
          </span>
        </div>

        <div className="border-t border-green-200 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-green-800">You Save:</span>
            <div className="text-right">
              <div className="font-bold text-green-600 text-lg">
                {PromotionService.formatPrice(savingsAmount, currency)}
              </div>
              <div className="text-sm text-green-600">
                ({Math.round(discountPercentage)}% off)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized components for different use cases
export function InlineSavings(props: Omit<SavingsCalculatorProps, 'variant'>) {
  return <SavingsCalculator {...props} variant="inline" />;
}

export function SavingsCard(props: Omit<SavingsCalculatorProps, 'variant'>) {
  return <SavingsCalculator {...props} variant="card" />;
}

export function DetailedSavings(props: Omit<SavingsCalculatorProps, 'variant'>) {
  return <SavingsCalculator {...props} variant="detailed" />;
}