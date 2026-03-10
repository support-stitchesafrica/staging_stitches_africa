// BOGO Product Badge Component
'use client';

import React from 'react';

export type BogoBadgeType = 'main_product' | 'free_product' | 'none';

interface BogoBadgeProps {
  type: BogoBadgeType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BogoBadge: React.FC<BogoBadgeProps> = ({
  type,
  className = '',
  size = 'md'
}) => {
  if (type === 'none') {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const typeConfig = {
    main_product: {
      text: 'Buy 1 Get 1 Free',
      className: 'bg-green-100 text-green-800 border border-green-200',
      icon: '🎁'
    },
    free_product: {
      text: 'Free with Purchase',
      className: 'bg-blue-100 text-blue-800 border border-blue-200',
      icon: '🆓'
    }
  };

  const config = typeConfig[type];
  
  const badgeClass = `
    inline-flex items-center gap-1 rounded-md font-medium
    ${sizeClasses[size]}
    ${config.className}
    ${className}
  `.trim();

  return (
    <span className={badgeClass}>
      <span className="text-xs">{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
};

export default BogoBadge;