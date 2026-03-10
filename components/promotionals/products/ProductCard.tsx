'use client';

import { Product } from '@/types';
import { DiscountService } from '@/lib/promotionals/discount-service';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PromotionalEventBadge } from '../PromotionalEventBadge';

interface ProductCardProps
{
    product: Product;
    isSelected: boolean;
    discountPercentage: number;
    onToggleSelect: (productId: string) => void;
    onDiscountChange: (productId: string, discount: number) => void;
    eventName?: string;
    showEventBadge?: boolean;
    isBulkDiscount?: boolean; // Indicates if discount came from bulk application
}

export function ProductCard({
    product,
    isSelected,
    discountPercentage,
    onToggleSelect,
    onDiscountChange,
    eventName,
    showEventBadge = false,
    isBulkDiscount = false,
}: ProductCardProps)
{
    const originalPrice = product.price?.base || 0;
    const discountedPrice = discountPercentage > 0
        ? DiscountService.calculateDiscountedPrice(originalPrice, discountPercentage)
        : originalPrice;

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0 && value <= 100)
        {
            onDiscountChange(product.product_id, value);
        }
    };

    return (
        <div
            className={cn(
                'bg-white border-2 rounded-lg p-4 transition-all',
                isSelected ? 'border-purple-500 shadow-md' : 'border-gray-200'
            )}
        >
            {/* Checkbox */}
            <div className="flex items-start gap-3 mb-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(product.product_id)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />

                {/* Product Image */}
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {product.images && product.images[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No image
                        </div>
                    )}

                    {/* Event Badge */}
                    {showEventBadge && eventName && isSelected && discountPercentage > 0 && (
                        <div className="absolute -top-1 -right-1 z-10">
                            <PromotionalEventBadge
                                eventName={eventName}
                                discount={discountPercentage}
                                size="sm"
                                showDiscount={true}
                            />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">
                        {product.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1">
                        {product.tailor || product.vendor?.name || 'Unknown Vendor'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                        ${originalPrice.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Discount Input */}
            {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                            Discount %
                        </label>
                        {isBulkDiscount && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-blue-600">Bulk</span>
                            </div>
                        )}
                        {!isBulkDiscount && discountPercentage > 0 && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs text-purple-600">Individual</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={discountPercentage || ''}
                            onChange={handleDiscountChange}
                            placeholder="0"
                            className={cn(
                                "w-20 px-3 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 text-sm",
                                isBulkDiscount
                                    ? "border-blue-300 focus:ring-blue-500"
                                    : "border-gray-300 focus:ring-purple-500"
                            )}
                        />
                        <div className="flex-1">
                            <p className="text-xs text-gray-600">
                                New price: <span className="font-semibold text-purple-600">${discountedPrice.toFixed(2)}</span>
                            </p>
                            {discountPercentage > 0 && (
                                <p className="text-xs text-green-600">
                                    Save ${(originalPrice - discountedPrice).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
