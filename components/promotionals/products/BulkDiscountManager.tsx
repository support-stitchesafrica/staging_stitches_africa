/**
 * Bulk Discount Manager Component
 * Handles bulk discount operations for selected products
 */
'use client';

import React, { useState } from 'react';
import { Percent, Info, Zap } from 'lucide-react';

interface BulkDiscountManagerProps
{
    selectedProducts: Map<string, number>;
    onBulkDiscountApply: (discount: number) => void;
    eventName: string;
    className?: string;
}

export const BulkDiscountManager: React.FC<BulkDiscountManagerProps> = ({
    selectedProducts,
    onBulkDiscountApply,
    eventName,
    className = ''
}) =>
{
    const [bulkDiscount, setBulkDiscount] = useState<string>('');
    const [isApplying, setIsApplying] = useState(false);

    const handleBulkDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        // Allow empty string or valid numbers between 0-100
        if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100))
        {
            setBulkDiscount(value);
        }
    };

    const handleApplyBulkDiscount = async () =>
    {
        const discount = parseFloat(bulkDiscount);
        if (isNaN(discount) || discount < 0 || discount > 100)
        {
            return;
        }

        setIsApplying(true);
        try
        {
            await onBulkDiscountApply(discount);
            setBulkDiscount('');
        } finally
        {
            setIsApplying(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    {
        if (e.key === 'Enter')
        {
            handleApplyBulkDiscount();
        }
    };

    const isValidDiscount = bulkDiscount !== '' && !isNaN(parseFloat(bulkDiscount)) &&
        parseFloat(bulkDiscount) >= 0 && parseFloat(bulkDiscount) <= 100;

    if (selectedProducts.size === 0)
    {
        return null;
    }

    return (
        <div className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">
                            Bulk Discount Manager
                        </span>
                    </div>
                    <div className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                        {selectedProducts.size} products selected
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="bulk-discount" className="text-sm font-medium text-blue-900">
                            Apply to all selected:
                        </label>
                        <div className="flex items-center gap-1">
                            <input
                                id="bulk-discount"
                                type="text"
                                value={bulkDiscount}
                                onChange={handleBulkDiscountChange}
                                onKeyDown={handleKeyDown}
                                placeholder="0"
                                className="w-20 px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                disabled={isApplying}
                            />
                            <Percent className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>

                    <button
                        onClick={handleApplyBulkDiscount}
                        disabled={!isValidDiscount || isApplying}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isApplying ? 'Applying...' : 'Apply'}
                    </button>
                </div>
            </div>

            {/* Help text and tips */}
            <div className="mt-3 flex items-start gap-2 text-xs text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p>
                        <strong>💡 Bulk Discount Tips:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Enter a percentage (0-100) to apply the same discount to all selected products</li>
                        <li>Individual product discounts can still be adjusted after applying bulk discount</li>
                        <li>Individual changes will override the bulk setting for that specific product</li>
                        <li>Products with individual overrides will keep their custom discounts</li>
                    </ul>
                </div>
            </div>

            {/* Visual feedback for mixed discounts */}
            {selectedProducts.size > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                            <span className="text-blue-700">
                                <strong>Discount Summary:</strong>
                            </span>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-blue-600">Bulk Applied</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span className="text-purple-600">Individual Override</span>
                            </div>
                        </div>
                        <div className="text-blue-600">
                            Event: <strong>{eventName}</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkDiscountManager;