/**
 * Utility functions for shipping calculations
 */

/**
 * Calculate fixed shipping cost based on item count
 * @param itemCount - Total number of items in the cart
 * @returns Fixed shipping cost ($30 per item)
 */
export const calculateFixedShipping = (itemCount: number): number => {
  return itemCount * 30;
};

/**
 * Calculate total item count from cart items
 * @param items - Array of cart items with quantities
 * @returns Total number of items
 */
export const getTotalItemCount = (items: Array<{ quantity: number }>): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Calculate shipping cost for cart items
 * @param items - Array of cart items with quantities
 * @returns Fixed shipping cost based on total item count
 */
export const calculateCartShipping = (items: Array<{ quantity: number }>): number => {
  const totalItems = getTotalItemCount(items);
  return calculateFixedShipping(totalItems);
};