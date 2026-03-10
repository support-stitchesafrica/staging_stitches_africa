'use client';

import React from 'react';
import { Product } from '@/types';
import { getTypeSpecificStyling } from '@/lib/utils/product-type-utils';

interface ProductLayoutProps {
  product: Product;
  children: React.ReactNode;
}

interface ProductSectionProps {
  product: Product;
  title: string;
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  className?: string;
}

export const ProductLayout: React.FC<ProductLayoutProps> = ({ product, children }) => {
  const styling = getTypeSpecificStyling(product);
  
  return (
    <div className={`space-y-6 ${product.type === 'bespoke' ? 'bespoke-layout' : 'rtw-layout'}`}>
      {/* Type indicator bar */}
      <div className={`w-full h-1 rounded-full ${
        product.type === 'bespoke' 
          ? 'bg-gradient-to-r from-purple-400 to-purple-600' 
          : 'bg-gradient-to-r from-blue-400 to-blue-600'
      }`} />
      
      {children}
    </div>
  );
};

export const ProductSection: React.FC<ProductSectionProps> = ({ 
  product, 
  title, 
  children, 
  priority = 'medium',
  className = '' 
}) => {
  const styling = getTypeSpecificStyling(product);
  
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return `border-l-4 ${
          product.type === 'bespoke' 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-blue-500 bg-blue-50'
        }`;
      case 'low':
        return 'bg-gray-50 border border-gray-200';
      default:
        return `${styling.sectionClasses} border border-gray-200`;
    }
  };

  return (
    <div className={`p-4 rounded-lg ${getPriorityStyles()} ${className}`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        priority === 'high' ? styling.textClasses : 'text-gray-900'
      }`}>
        {title}
      </h3>
      {children}
    </div>
  );
};

interface TypeSpecificGridProps {
  product: Product;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

export const TypeSpecificGrid: React.FC<TypeSpecificGridProps> = ({ 
  product, 
  children, 
  columns = 2 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4`}>
      {children}
    </div>
  );
};

interface TypeSpecificBadgeProps {
  product: Product;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export const TypeSpecificBadge: React.FC<TypeSpecificBadgeProps> = ({ 
  product, 
  children, 
  variant = 'default' 
}) => {
  const styling = getTypeSpecificStyling(product);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-gray-100 text-gray-800';
      default:
        return styling.badgeClasses;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVariantStyles()}`}>
      {children}
    </span>
  );
};