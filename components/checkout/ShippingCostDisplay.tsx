/**
 * ShippingCostDisplay Component
 * Displays shipping cost with special styling for free shipping
 */

import React from 'react';
import { Price } from '@/components/common/Price';

interface ShippingCostDisplayProps
{
    shippingCost: number;
    isFreeShipping: boolean;
    currency?: string;
    className?: string;
}

export function ShippingCostDisplay({
    shippingCost,
    isFreeShipping,
    currency = 'USD',
    className = '',
}: ShippingCostDisplayProps)
{
    if (isFreeShipping)
    {
        return (
            <span className={`text-green-600 font-semibold ${className}`}>
                Free Shipping
            </span>
        );
    }

    return (
        <span className={className}>
            <Price price={shippingCost} originalCurrency={currency} />
        </span>
    );
}
