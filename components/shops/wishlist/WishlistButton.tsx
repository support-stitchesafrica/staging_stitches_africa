'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistButtonProps
{
    productId: string;
    className?: string;
    size?: number;
    showLoginPrompt?: boolean;
}

const WishlistButtonComponent: React.FC<WishlistButtonProps> = ({
    productId,
    className = '',
    size = 20,
    showLoginPrompt = true
}) =>
{
    const { user } = useAuth();
    const { isInWishlist, toggleItem } = useWishlist();
    const [isToggling, setIsToggling] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    // Track wishlist interaction for AI recommendations
    const trackWishlistInteraction = async (productId: string, isAdding: boolean) => {
        try {
            // Get unique user identifier from localStorage or generate one
            let uniqueUserId = localStorage.getItem('ai-chat-unique-user-id');
            
            if (!uniqueUserId) {
                uniqueUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('ai-chat-unique-user-id', uniqueUserId);
            }
            
            // Track the wishlist interaction
            await fetch('/api/ai-assistant/user-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: uniqueUserId,
                    productId: productId,
                    interactionType: 'wishlist'
                }),
            });
        } catch (error) {
            console.warn('Could not track wishlist interaction:', error);
        }
    };

    const handleClick = async (e: React.MouseEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();

        const inWishlist = isInWishlist(productId);

        if (!user && showLoginPrompt)
        {
            setShowPrompt(true);
            setTimeout(() => setShowPrompt(false), 3000);
            return;
        }

        if (isToggling) return;

        const wasInWishlist = inWishlist; // Capture current state before toggling

        setIsToggling(true);
        try
        {
            await toggleItem(productId);
            
            // Track wishlist interaction for AI recommendations
            trackWishlistInteraction(productId, !wasInWishlist);
        } catch (error)
        {
            console.error('Error toggling wishlist:', error);
        } finally
        {
            setIsToggling(false);
        }
    };

    const inWishlist = isInWishlist(productId);

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                disabled={isToggling}
                className={`
          relative p-2 rounded-full bg-white! text-black! border-0! transition-all duration-200 group
          ${inWishlist
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                    }
          ${isToggling ? 'opacity-75 cursor-not-allowed' : ''}
          ${className}
        `}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                {isToggling ? (
                    <div className="animate-spin rounded-full border-2 border-current border-t-transparent"
                        style={{ width: size, height: size }} />
                ) : (
                    <Heart
                        size={size}
                        className={`transition-all duration-200 ${inWishlist ? 'fill-current scale-110' : 'group-hover:scale-110'
                            }`}
                    />
                )}
            </button>

            {/* Login Prompt Tooltip */}
            {showPrompt && !user && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                    Please log in to save items
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                </div>
            )}
        </div>
    );
};

// Memoization comparison function for WishlistButton
const wishlistButtonComparison = (prevProps: WishlistButtonProps, nextProps: WishlistButtonProps): boolean => {
    return (
        prevProps.productId === nextProps.productId &&
        prevProps.className === nextProps.className &&
        prevProps.size === nextProps.size &&
        prevProps.showLoginPrompt === nextProps.showLoginPrompt
    );
};

// Export memoized component
export const WishlistButton = React.memo(WishlistButtonComponent, wishlistButtonComparison);