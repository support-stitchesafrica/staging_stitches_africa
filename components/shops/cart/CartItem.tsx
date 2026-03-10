'use client';

import React, { useCallback } from 'react';
import { CartItem as CartItemType, Product } from '@/types';
import { Price } from '@/components/common/Price';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { generateBlurDataURL, RESPONSIVE_SIZES, IMAGE_DIMENSIONS } from '@/lib/utils/image-utils';
import { SafeImage } from '@/components/shops/ui/SafeImage';

interface CartItemProps {
    item: CartItemType;
    product: Product | null;
    onQuantityChange: (productId: string, newQuantity: number) => void;
    onRemove: (productId: string) => void;
}

const CartItemComponent: React.FC<CartItemProps> = ({
    item,
    product,
    onQuantityChange,
    onRemove
}) => {
    const handleQuantityDecrease = useCallback(() => {
        onQuantityChange(item.product_id, item.quantity - 1);
    }, [item.product_id, item.quantity, onQuantityChange]);

    const handleQuantityIncrease = useCallback(() => {
        onQuantityChange(item.product_id, item.quantity + 1);
    }, [item.product_id, item.quantity, onQuantityChange]);

    const handleRemove = useCallback(() => {
        onRemove(item.product_id);
    }, [item.product_id, onRemove]);

    if (!product) return null;

    return (
        <div className="flex space-x-4 py-6 border-b border-gray-100 last:border-b-0">
            <div className="relative w-24 h-24 flex-shrink-0">
                <SafeImage
                    src={product.images[0] || '/placeholder-product.svg'}
                    alt={product.title}
                    fill
                    className="object-cover rounded-lg"
                    sizes={RESPONSIVE_SIZES.orderItem}
                    placeholder="blur"
                    blurDataURL={generateBlurDataURL(IMAGE_DIMENSIONS.orderItem.width, IMAGE_DIMENSIONS.orderItem.height)}
                    fallbackSrc="/placeholder-product.svg"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                            {product.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{product.vendor?.name || 'Unknown Brand'}</p>

                        {(item.color || item.size) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {item.color && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Color: {item.color}
                                    </span>
                                )}
                                {item.size && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Size: {item.size}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <span
                        onClick={handleRemove}
                        className="text-red-500 hover:text-red-700 p-1"
                    >
                        <Trash2 size={16} />
                    </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleQuantityDecrease}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-lg font-medium w-12 text-center">
                            {item.quantity}
                        </span>
                        <button
                            onClick={handleQuantityIncrease}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                            <Price price={item.price * item.quantity} originalCurrency="USD" size="lg" variant="accent" />
                        </p>
                        <p className="text-sm text-gray-500">
                            <Price price={item.price} originalCurrency="USD" size="sm" variant="muted" showTooltip={false} /> each
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Optimized comparison function for CartItem
const cartItemComparison = (prevProps: CartItemProps, nextProps: CartItemProps): boolean => {
    // Compare item properties that affect rendering
    if (prevProps.item.product_id !== nextProps.item.product_id) return false;
    if (prevProps.item.quantity !== nextProps.item.quantity) return false;
    if (prevProps.item.price !== nextProps.item.price) return false;
    if (prevProps.item.color !== nextProps.item.color) return false;
    if (prevProps.item.size !== nextProps.item.size) return false;
    
    // Compare product properties
    if (prevProps.product?.title !== nextProps.product?.title) return false;
    if (prevProps.product?.vendor?.name !== nextProps.product?.vendor?.name) return false;
    if (prevProps.product?.images?.[0] !== nextProps.product?.images?.[0]) return false;
    
    // Function references should be stable due to useCallback
    if (prevProps.onQuantityChange !== nextProps.onQuantityChange) return false;
    if (prevProps.onRemove !== nextProps.onRemove) return false;
    
    return true;
};

// Export memoized component
export const CartItem = React.memo(CartItemComponent, cartItemComparison);