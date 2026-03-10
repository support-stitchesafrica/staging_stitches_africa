'use client';

import React, { useState, useEffect } from 'react';
import { useStorefrontCart } from '@/contexts/StorefrontCartContext';

export default function StorefrontCartBadge() {
  const [mounted, setMounted] = useState(false);
  const { itemCount } = useStorefrontCart();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted on client
  if (!mounted || itemCount === 0) {
    return null;
  }
  
  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  );
}