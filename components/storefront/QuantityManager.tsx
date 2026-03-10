"use client";

import React, { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityManagerProps {
  productId: string;
  currentQuantity: number;
  size?: string;
  color?: string;
  onQuantityChange: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  onRemove?: (productId: string, size?: string, color?: string) => Promise<void>;
  disabled?: boolean;
  showRemoveButton?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  className?: string;
}

/**
 * Quantity Manager Component
 * 
 * Provides quantity update controls for cart items with proper validation
 * and error handling. Supports both increment/decrement and direct input.
 * 
 * Requirements validated:
 * - Quantity management and updates for cart items
 * - User-friendly quantity controls
 * - Proper validation and error handling
 */
export const QuantityManager: React.FC<QuantityManagerProps> = ({
  productId,
  currentQuantity,
  size,
  color,
  onQuantityChange,
  onRemove,
  disabled = false,
  showRemoveButton = true,
  minQuantity = 1,
  maxQuantity = 99,
  className = ''
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === currentQuantity || isUpdating) return;

    // Validate quantity
    if (newQuantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    if (newQuantity > maxQuantity) {
      setError(`Maximum quantity is ${maxQuantity}`);
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await onQuantityChange(productId, newQuantity, size, color);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(error instanceof Error ? error.message : 'Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = () => {
    if (currentQuantity < maxQuantity) {
      handleQuantityChange(currentQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (currentQuantity > minQuantity) {
      handleQuantityChange(currentQuantity - 1);
    } else if (currentQuantity === minQuantity && minQuantity === 1) {
      // Remove item if decrementing from minimum quantity of 1
      handleRemove();
    }
  };

  const handleRemove = async () => {
    if (!onRemove || isUpdating) return;

    setIsUpdating(true);
    setError(null);

    try {
      await onRemove(productId, size, color);
    } catch (error) {
      console.error('Error removing item:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove item');
      setIsUpdating(false);
    }
  };

  const handleDirectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      handleQuantityChange(value);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Decrement Button */}
      <button
        onClick={handleDecrement}
        disabled={disabled || isUpdating || currentQuantity <= (minQuantity === 1 ? 0 : minQuantity)}
        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Quantity Input */}
      <input
        type="number"
        value={currentQuantity}
        onChange={handleDirectInput}
        disabled={disabled || isUpdating}
        min={minQuantity}
        max={maxQuantity}
        className="w-16 h-8 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Quantity"
      />

      {/* Increment Button */}
      <button
        onClick={handleIncrement}
        disabled={disabled || isUpdating || currentQuantity >= maxQuantity}
        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Remove Button */}
      {showRemoveButton && onRemove && (
        <button
          onClick={handleRemove}
          disabled={disabled || isUpdating}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Loading Indicator */}
      {isUpdating && (
        <div className="flex items-center justify-center w-6 h-6">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 text-red-700 text-sm rounded-md shadow-sm z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default QuantityManager;