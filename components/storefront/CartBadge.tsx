'use client';

import React, { useState, useEffect } from 'react';

// Simple cart badge for storefront cart
export default function CartBadge() {
  const [itemCount, setItemCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Try to get storefront cart context safely
    try {
      // Dynamic import to avoid hook order issues
      import('@/contexts/StorefrontCartContext').then(({ useStorefrontCart }) => {
        try {
          // This would need to be called within a component that has the provider
          // For now, we'll just show a static badge
          setItemCount(0);
        } catch (err) {
          // Context not available
          setItemCount(0);
        }
      });
    } catch (err) {
      // Module not available
      setItemCount(0);
    }
  }, []);

  if (!mounted || itemCount === 0) {
    return null;
  }
  
  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  );
}