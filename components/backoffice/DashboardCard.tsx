/**
 * Dashboard Card Component
 * 
 * Reusable card component for dashboard content with Bumpa styling.
 * Features hover effects, clean shadows, and modern design.
 * 
 * Requirements: 14.5
 */

'use client';

import React, { memo, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DashboardCardProps {
  /** Card title */
  title?: string;
  
  /** Card description/subtitle */
  description?: string;
  
  /** Icon to display in header */
  icon?: LucideIcon;
  
  /** Card content */
  children: ReactNode;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Click handler for the entire card */
  onClick?: () => void;
  
  /** Whether the card is clickable/hoverable */
  hoverable?: boolean;
  
  /** Footer content */
  footer?: ReactNode;
}

function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  onClick,
  hoverable = false,
  footer,
}: DashboardCardProps) {
  const isClickable = onClick || hoverable;

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
        transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      {(title || description || Icon) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {/* Icon */}
            {Icon && (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Title and description */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
}


export default memo(DashboardCard);