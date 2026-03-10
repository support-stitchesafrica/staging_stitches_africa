"use client";

import { Tag, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromotionalBadgeProps {
  discountPercentage: number;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal' | 'savings';
  className?: string;
  showIcon?: boolean;
  // Configurable colors - can be predefined or custom
  color?: 'red' | 'orange' | 'green' | 'blue' | 'purple';
  customColors?: {
    background: string;
    text: string;
    border?: string;
  };
  // Custom text configuration
  customText?: {
    primary: string;
    secondary?: string;
    prefix?: string;
    suffix?: string;
  };
  // Savings calculation props
  originalPrice?: number;
  salePrice?: number;
  showSavingsAmount?: boolean;
}

export function PromotionalBadge({
  discountPercentage,
  text,
  size = 'md',
  variant = 'default',
  className,
  showIcon = true,
  color = 'red',
  customColors,
  customText,
  originalPrice,
  salePrice,
  showSavingsAmount = false,
}: PromotionalBadgeProps) {
  // Calculate savings amount if prices are provided
  const savingsAmount = originalPrice && salePrice ? originalPrice - salePrice : 0;
  
  // Ensure discount percentage is valid
  if (discountPercentage <= 0 || discountPercentage > 100) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const colorClasses = {
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const solidColorClasses = {
    red: 'bg-red-600',
    orange: 'bg-orange-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
  };

  // Determine styling based on custom colors or predefined color
  const getBackgroundStyle = () => {
    if (customColors) {
      return {
        backgroundColor: customColors.background,
        color: customColors.text,
        ...(customColors.border && { borderColor: customColors.border, borderWidth: '1px' }),
      };
    }
    return {};
  };

  const getBackgroundClass = () => {
    if (customColors) {
      return customColors.border ? 'border' : '';
    }
    return variant === 'minimal' ? solidColorClasses[color] : `bg-gradient-to-r ${colorClasses[color]}`;
  };

  // Determine text content based on custom text or defaults
  const getDisplayText = () => {
    if (customText) {
      const { primary, secondary, prefix = '', suffix = '' } = customText;
      return {
        primary: `${prefix}${primary}${suffix}`,
        secondary: secondary || `${Math.round(discountPercentage)}% OFF`,
      };
    }
    return {
      primary: text || 'SAVE',
      secondary: `${Math.round(discountPercentage)}% OFF`,
    };
  };

  const displayText = getDisplayText();

  // Minimal variant - just the percentage
  if (variant === 'minimal') {
    return (
      <div
        data-testid="promotional-badge"
        className={cn(
          'inline-flex items-center justify-center font-bold rounded-full',
          customColors ? '' : 'text-white',
          getBackgroundClass(),
          sizeClasses[size],
          className
        )}
        style={getBackgroundStyle()}
      >
        <span>
          {customText?.primary || `${Math.round(discountPercentage)}%`}
        </span>
      </div>
    );
  }

  // Compact variant - percentage with optional icon
  if (variant === 'compact') {
    return (
      <div
        data-testid="promotional-badge"
        className={cn(
          'inline-flex items-center justify-center gap-1 font-bold rounded-md shadow-sm',
          customColors ? '' : 'text-white',
          getBackgroundClass(),
          sizeClasses[size],
          className
        )}
        style={getBackgroundStyle()}
      >
        {showIcon && <Percent className={iconSizes[size]} />}
        <span>{displayText.secondary}</span>
      </div>
    );
  }

  // Savings variant - shows original vs sale price with savings amount
  if (variant === 'savings' && originalPrice && salePrice) {
    return (
      <div
        data-testid="promotional-badge"
        className={cn(
          'inline-flex flex-col items-center gap-1 font-semibold rounded-lg shadow-md p-3',
          customColors ? '' : 'text-white',
          getBackgroundClass(),
          className
        )}
        style={getBackgroundStyle()}
      >
        {showIcon && <Tag className={iconSizes[size]} />}
        <div className="text-center">
          <div className="text-xs opacity-90">
            {customText?.prefix || 'Was'} ${originalPrice.toFixed(2)}
          </div>
          <div className="text-lg font-bold">
            {customText?.primary || 'Now'} ${salePrice.toFixed(2)}
          </div>
          <div className="text-xs font-bold">
            {customText?.secondary || `Save $${savingsAmount.toFixed(2)} (${Math.round(discountPercentage)}% OFF)`}
            {customText?.suffix && ` ${customText.suffix}`}
          </div>
        </div>
      </div>
    );
  }

  // Default variant - full badge with text and percentage
  return (
    <div
      data-testid="promotional-badge"
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-lg shadow-md',
        customColors ? '' : 'text-white',
        getBackgroundClass(),
        sizeClasses[size],
        className
      )}
      style={getBackgroundStyle()}
    >
      {showIcon && <Tag className={iconSizes[size]} />}
      <div className="flex flex-col">
        <span className="leading-tight">{displayText.primary}</span>
        <span className="text-xs font-bold leading-tight">
          {displayText.secondary}
          {showSavingsAmount && savingsAmount > 0 && (
            <span className="block">Save ${savingsAmount.toFixed(2)}</span>
          )}
        </span>
      </div>
    </div>
  );
}