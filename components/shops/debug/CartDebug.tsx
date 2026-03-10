'use client';

import React from 'react';
import { useCart } from '@/contexts/CartContext';

export const CartDebug: React.FC = () =>
{
    const { items, itemCount, totalAmount } = useCart();

    if (process.env.NODE_ENV !== 'development')
    {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs z-50 max-w-xs">
            <div className="font-bold mb-1">Cart Debug</div>
            <div>Items: {itemCount}</div>
            <div>Total: ${totalAmount.toFixed(2)}</div>
            <div className="mt-1 max-h-20 overflow-y-auto">
                {items.map((item, index) => (
                    <div key={index} className="text-xs opacity-75">
                        {item.product_id?.slice(0, 8) || 'Unknown'}... x{item.quantity}
                    </div>
                ))}
            </div>
        </div>
    );
};