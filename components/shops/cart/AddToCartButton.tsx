'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getActivityTracker } from '@/lib/analytics/activity-tracker';

interface AddToCartButtonProps
{
    product: Product;
    quantity?: number;
    selectedOptions?: Record<string, string>;
    className?: string;
    disabled?: boolean;
    disabledReason?: string;
}

const AddToCartButtonComponent: React.FC<AddToCartButtonProps> = ({
    product,
    quantity = 1,
    selectedOptions,
    className = '',
    disabled = false,
    disabledReason
}) =>
{
    const { addItemWithBogo } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    // Track product add to cart for AI recommendations
    const trackAddToCart = async (productId: string) => {
        try {
            // Get unique user identifier from localStorage or generate one
            let uniqueUserId = localStorage.getItem('ai-chat-unique-user-id');
            
            if (!uniqueUserId) {
                uniqueUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('ai-chat-unique-user-id', uniqueUserId);
            }
            
            // Track the add to cart interaction
            await fetch('/api/ai-assistant/user-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: uniqueUserId,
                    productId: productId,
                    interactionType: 'wishlist' // Using wishlist weight since it's a strong positive signal
                }),
            });
        } catch (error) {
            console.warn('Could not track add to cart:', error);
        }
    };

    const handleAddToCart = async () =>
    {
        if (disabled || isAdding) return;

        setIsAdding(true);

        try
        {
            await addItemWithBogo(product, quantity, selectedOptions);
            setJustAdded(true);
            
            // Track add to cart for AI recommendations (existing)
            trackAddToCart(product.product_id);

            // Track add to cart for vendor analytics (new)
            // Validates: Requirements 21.2
            const vendorId = product.tailor_id || product.vendor?.id;
            if (vendorId) {
                const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
                const activityTracker = getActivityTracker();
                activityTracker.trackAddToCart(
                    product.product_id,
                    vendorId,
                    quantity,
                    basePrice,
                    user?.uid
                ).catch(err => 
                    console.warn('Could not track add to cart for analytics:', err)
                );
            }

            // Reset the "just added" state after 2 seconds
            setTimeout(() =>
            {
                setJustAdded(false);
            }, 2000);
        } catch (error)
        {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        } finally
        {
            setIsAdding(false);
        }
    };

    const isOutOfStock = product.availability === 'out_of_stock';
    const isPreOrder = product.availability === 'pre_order';

    const getButtonText = () =>
    {
        if (isAdding) return 'Adding...';
        if (justAdded) return 'Added!';
        if (isOutOfStock) return 'Out of Stock';
        if (disabled && disabledReason) return disabledReason;
        if (isPreOrder) return 'Pre-Order Now';
        return 'Add to Cart';
    };

    return (
        <button
            onClick={handleAddToCart}
            disabled={disabled || isAdding || isOutOfStock}
            className={`
        flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200
        ${justAdded
                    ? 'bg-green-500 text-white'
                    : isOutOfStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isPreOrder
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                }
        ${isAdding ? 'opacity-75 cursor-not-allowed' : ''}
        ${className}
      `}
        >
            {isAdding ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                </>
            ) : justAdded ? (
                <>
                    <Check size={16} />
                    <span>Added!</span>
                </>
            ) : (
                <>
                    <ShoppingCart size={16} />
                    <span>{getButtonText()}</span>
                </>
            )}
        </button>
    );
};

// Memoization comparison function for AddToCartButton
const addToCartButtonComparison = (prevProps: AddToCartButtonProps, nextProps: AddToCartButtonProps): boolean =>
{
    // Compare product ID (most important for re-renders)
    if (prevProps.product.product_id !== nextProps.product.product_id) return false;

    // Compare other props
    if (prevProps.quantity !== nextProps.quantity) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;

    // Compare selectedOptions (shallow comparison)
    const prevOptions = prevProps.selectedOptions || {};
    const nextOptions = nextProps.selectedOptions || {};
    const prevKeys = Object.keys(prevOptions);
    const nextKeys = Object.keys(nextOptions);

    if (prevKeys.length !== nextKeys.length) return false;
    for (const key of prevKeys)
    {
        if (prevOptions[key] !== nextOptions[key]) return false;
    }

    // Compare product availability (affects button state)
    if (prevProps.product.availability !== nextProps.product.availability) return false;

    return true;
};

// Export memoized component
export const AddToCartButton = React.memo(AddToCartButtonComponent, addToCartButtonComparison);