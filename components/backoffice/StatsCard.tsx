/**
 * Stats Card Component
 * 
 * Displays statistical information with gradient backgrounds and modern styling.
 * Implements Bumpa-style design with vibrant gradients and clean typography.
 * 
 * Requirements: 14.5
 */

'use client';

import React, { memo, ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps {
  /** Main statistic value */
  value: string | number;
  
  /** Label/description of the statistic */
  label: string;
  
  /** Icon to display */
  icon?: LucideIcon;
  
  /** Change percentage (e.g., "+12.5" or "-5.2") */
  change?: number;
  
  /** Change label (e.g., "vs last month") */
  changeLabel?: string;
  
  /** Gradient variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'purple' | 'pink';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Additional content to display below the main stat */
  children?: ReactNode;
}

const gradientVariants = {
  primary: 'from-blue-500 to-blue-600',
  secondary: 'from-gray-500 to-gray-600',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-orange-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
  pink: 'from-pink-500 to-rose-600',
};

function StatsCard({
  title,
  value,
  label,
  icon: Icon,
  change,
  changeLabel,
  variant = 'primary',
  className = '',
  onClick,
  children,
}: StatsCardProps) {
  const isPositiveChange = change !== undefined && change >= 0;
  const gradientClass = gradientVariants[variant];

  return (
    <div
      className={`
        bg-gradient-to-br ${gradientClass}
        rounded-xl shadow-lg p-6 text-white
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold">
            {value}
          </p>
        </div>

        {/* Icon */}
        {Icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          {isPositiveChange ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-semibold">
            {isPositiveChange ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="opacity-90">
              {changeLabel}
            </span>
          )}
        </div>
      )}

      {/* Additional content */}
      {children && (
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          {children}
        </div>
      )}
    </div>
  );
}


export default memo(StatsCard);