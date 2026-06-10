/**
 * Free Shipping Toggle Component
 * 
 * Toggle control for enabling/disabling free shipping on collections.
 * Used in collection creation and editing forms.
 * 
 * Requirements: 2.1, 2.3
 */

'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FreeShippingToggleProps
{
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

export function FreeShippingToggle({ value, onChange, disabled }: FreeShippingToggleProps)
{
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label htmlFor="free-shipping" className="text-sm font-medium">
                    Free Shipping
                </Label>
                <p className="text-xs text-gray-500">
                    Offer free shipping for domestic (Nigeria) orders
                </p>
            </div>
            <Switch
                id="free-shipping"
                checked={value}
                onCheckedChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}
