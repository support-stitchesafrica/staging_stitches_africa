// BOGO Checkout Integration Service
// Handles BOGO-specific checkout processing, order validation, and analytics

import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  increment,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { 
  CartItem, 
  UserOrder, 
  Order,
  OrderItem 
} from '../../types';
import type { 
  BogoMapping, 
  BogoOrderData,
  BogoAnalytics
} from '../../types/bogo';
import { 
  BogoError,
  BogoErrorCode
} from '../../types/bogo';
import { bogoMappingService } from './mapping-service';

/**
 * Extended Order interface with BOGO metadata
 */
export interface BogoOrder extends Order {
  // BOGO-specific fields
  bogoItems?: {
    mainProductId: string;
    freeProductId: string;
    mappingId: string;
    savingsAmount: number;
    quantity: number;
  }[];
  bogoFreeShipping?: boolean;
  bogoShippingSavings?: number;
  totalBogoSavings?: number;
  bogoPromotionNames?: string[];
}

/**
 * Extended UserOrder interface with BOGO metadata
 */
export interface BogoUserOrder extends UserOrder {
  // BOGO-specific fields
  isBogoItem?: boolean;
  bogoType?: 'main' | 'free';
  bogoMainProductId?: string; // For free items, reference to main product
  bogoMappingId?: string;
  bogoPromotionName?: string;
  bogoOriginalPrice?: number; // Original price before BOGO discount
  bogoSavingsAmount?: number;
}

/**
 * Checkout validation result
 */
export interface BogoCheckoutValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  expiredMappings?: string[];
  unavailableProducts?: string[];
}

/**
 * Order creation result
 */
export interface BogoOrderCreationResult {
  success: boolean;
  orderId?: string;
  userOrders?: BogoUserOrder[];
  bogoSavings?: number;
  error?: string;
  warnings?: string[];
}

/**
 * BOGO Checkout Integration Service
 */
export class BogoCheckoutService {
  private static instance: BogoCheckoutService;
  private db: any = null;

  private constructor() {}

  public static getInstance(): BogoCheckoutService {
    if (!BogoCheckoutService.instance) {
      BogoCheckoutService.instance = new BogoCheckoutService();
    }
    return BogoCheckoutService.instance;
  }

  private async getDb() {
    if (!this.db) {
      this.db = await getFirebaseDb();
    }
    return this.db;
  }

  /**
   * Validate BOGO cart before checkout
   * Ensures all BOGO mappings are still active and products are available
   */
  async validateBogoCheckout(cartItems: CartItem[]): Promise<BogoCheckoutValidationResult> {
    const result: BogoCheckoutValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      expiredMappings: [],
      unavailableProducts: []
    };

    try {
      const bogoItems = cartItems.filter(item => item.isBogoFree || 
        cartItems.some(otherItem => otherItem.bogoMainProductId === item.product_id));

      if (bogoItems.length === 0) {
        return result; // No BOGO items to validate
      }

      // Group BOGO items by main product
      const bogoGroups = new Map<string, { main: CartItem; free: CartItem[] }>();
      
      for (const item of bogoItems) {
        if (item.isBogoFree && item.bogoMainProductId) {
          // This is a free item
          const mainProductId = item.bogoMainProductId;
          if (!bogoGroups.has(mainProductId)) {
            const mainItem = cartItems.find(i => i.product_id === mainProductId);
            if (mainItem) {
              bogoGroups.set(mainProductId, { main: mainItem, free: [] });
            }
          }
          const group = bogoGroups.get(mainProductId);
          if (group) {
            group.free.push(item);
          }
        } else if (!item.isBogoFree) {
          // This might be a main product
          const hasAssociatedFreeItems = cartItems.some(i => i.bogoMainProductId === item.product_id);
          if (hasAssociatedFreeItems) {
            if (!bogoGroups.has(item.product_id)) {
              bogoGroups.set(item.product_id, { main: item, free: [] });
            }
            const freeItems = cartItems.filter(i => i.bogoMainProductId === item.product_id);
            bogoGroups.get(item.product_id)!.free = freeItems;
          }
        }
      }

      // Validate each BOGO group
      for (const [mainProductId, group] of bogoGroups) {
        try {
          // Check if mapping is still active
          const activeMapping = await bogoMappingService.getActiveMapping(mainProductId);
          
          if (!activeMapping) {
            result.errors.push(`BOGO promotion for product ${mainProductId} is no longer active`);
            result.expiredMappings?.push(mainProductId);
            result.isValid = false;
            continue;
          }

          // Validate quantities match (1:1 ratio)
          const mainQuantity = group.main.quantity;
          for (const freeItem of group.free) {
            if (freeItem.quantity !== mainQuantity) {
              result.errors.push(`Quantity mismatch for BOGO pair: ${mainProductId} and ${freeItem.product_id}`);
              result.isValid = false;
            }
          }

          // Check if free products are still in the mapping
          for (const freeItem of group.free) {
            if (!activeMapping.freeProductIds.includes(freeItem.product_id)) {
              result.warnings?.push(`Free product ${freeItem.product_id} is no longer available for this promotion`);
            }
          }

          // Check max redemptions if set
          if (activeMapping.maxRedemptions && 
              activeMapping.redemptionCount >= activeMapping.maxRedemptions) {
            result.errors.push(`BOGO promotion for product ${mainProductId} has reached maximum redemptions`);
            result.isValid = false;
          }

        } catch (error) {
          console.error(`Error validating BOGO group for ${mainProductId}:`, error);
          result.errors.push(`Failed to validate BOGO promotion for product ${mainProductId}`);
          result.isValid = false;
        }
      }

    } catch (error) {
      console.error('Error validating BOGO checkout:', error);
      result.errors.push('Failed to validate BOGO promotions');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Create BOGO order with proper metadata and analytics tracking
   */
  async createBogoOrder(
    orderData: Order,
    cartItems: CartItem[],
    userId: string
  ): Promise<BogoOrderCreationResult> {
    const result: BogoOrderCreationResult = {
      success: false,
      warnings: []
    };

    try {
      const db = await this.getDb();

      // Validate checkout first
      const validation = await this.validateBogoCheckout(cartItems);
      if (!validation.isValid) {
        result.error = `Checkout validation failed: ${validation.errors.join(', ')}`;
        return result;
      }

      // Add warnings from validation
      if (validation.warnings && validation.warnings.length > 0) {
        result.warnings = validation.warnings;
      }

      // Process BOGO items and create extended order data
      const bogoOrderData = await this.processBogoItems(orderData, cartItems);
      
      // Use transaction to ensure consistency
      const transactionResult = await runTransaction(db, async (transaction) => {
        // Create the main order document
        const orderRef = doc(collection(db, "staging_orders"));
        const extendedOrder: BogoOrder = {
          ...orderData,
          id: orderRef.id,
          ...bogoOrderData.orderExtensions
        };
        
        transaction.set(orderRef, extendedOrder);

        // Create individual user orders for each cart item
        const userOrders: BogoUserOrder[] = [];
        
        for (const item of cartItems) {
          const userOrderData = await this.createUserOrderFromCartItem(
            item, 
            orderData, 
            orderRef.id,
            userId
          );
          
          const userOrderRef = doc(collection(db, `users_orders/${userId}/user_orders`));
          userOrderData.id = userOrderRef.id;
          
          transaction.set(userOrderRef, userOrderData);
          userOrders.push(userOrderData);
        }

        // Update BOGO mapping analytics
        for (const bogoItem of bogoOrderData.bogoItems) {
          const mappingRef = doc(db, 'bogo_mappings', bogoItem.mappingId);
          transaction.update(mappingRef, {
            redemptionCount: increment(bogoItem.quantity),
            totalRevenue: increment(bogoItem.mainProductPrice * bogoItem.quantity),
            updatedAt: Timestamp.now()
          });
        }

        // Deduct inventory for both main and free products
        await this.deductBogoInventory(transaction, cartItems);

        // Record BOGO analytics
        await this.recordBogoAnalytics(transaction, bogoOrderData, orderRef.id, userId);

        return {
          orderId: orderRef.id,
          userOrders,
          bogoSavings: bogoOrderData.totalBogoSavings
        };
      });

      result.success = true;
      result.orderId = transactionResult.orderId;
      result.userOrders = transactionResult.userOrders;
      result.bogoSavings = transactionResult.bogoSavings;

    } catch (error) {
      console.error('Error creating BOGO order:', error);
      result.error = error instanceof Error ? error.message : 'Failed to create order';
    }

    return result;
  }

  /**
   * Process BOGO items and create order extensions
   */
  private async processBogoItems(orderData: Order, cartItems: CartItem[]) {
    const bogoItems: {
      mainProductId: string;
      freeProductId: string;
      mappingId: string;
      savingsAmount: number;
      quantity: number;
      mainProductPrice: number;
    }[] = [];
    
    let totalBogoSavings = 0;
    let bogoShippingSavings = 0;
    const bogoPromotionNames: string[] = [];

    // Identify BOGO pairs
    const processedMainProducts = new Set<string>();
    
    for (const item of cartItems) {
      if (item.isBogoFree && item.bogoMainProductId && !processedMainProducts.has(item.bogoMainProductId)) {
        const mainItem = cartItems.find(i => i.product_id === item.bogoMainProductId);
        if (mainItem) {
          const mapping = await bogoMappingService.getActiveMapping(item.bogoMainProductId);
          if (mapping) {
            const savingsAmount = (item.bogoOriginalPrice || 0) * item.quantity;
            
            bogoItems.push({
              mainProductId: item.bogoMainProductId,
              freeProductId: item.product_id,
              mappingId: mapping.id,
              savingsAmount,
              quantity: item.quantity,
              mainProductPrice: mainItem.price
            });

            totalBogoSavings += savingsAmount;
            
            if (mapping.promotionName && !bogoPromotionNames.includes(mapping.promotionName)) {
              bogoPromotionNames.push(mapping.promotionName);
            }
          }
          processedMainProducts.add(item.bogoMainProductId);
        }
      }
    }

    // Calculate shipping savings if BOGO items qualify for free shipping
    const hasBogoItems = bogoItems.length > 0;
    if (hasBogoItems && orderData.totalAmount > 0) {
      // Assume standard shipping would have been applied
      bogoShippingSavings = this.calculateStandardShipping(cartItems);
      totalBogoSavings += bogoShippingSavings;
    }

    return {
      bogoItems,
      totalBogoSavings,
      orderExtensions: {
        bogoItems: bogoItems.map(item => ({
          mainProductId: item.mainProductId,
          freeProductId: item.freeProductId,
          mappingId: item.mappingId,
          savingsAmount: item.savingsAmount,
          quantity: item.quantity
        })),
        bogoFreeShipping: hasBogoItems,
        bogoShippingSavings: hasBogoItems ? bogoShippingSavings : 0,
        totalBogoSavings,
        bogoPromotionNames: bogoPromotionNames.length > 0 ? bogoPromotionNames : undefined
      }
    };
  }

  /**
   * Create user order from cart item with BOGO metadata
   */
  private async createUserOrderFromCartItem(
    item: CartItem,
    orderData: Order,
    orderId: string,
    userId: string
  ): Promise<BogoUserOrder> {
    const baseUserOrder: UserOrder = {
      order_id: orderId,
      product_order_ref: `${orderId}-${item.product_id}`,
      user_id: userId,
      product_id: item.product_id,
      title: item.title,
      description: item.description,
      images: item.images,
      price: item.price,
      quantity: item.quantity,
      size: item.size || undefined,
      tailor_id: item.tailor_id,
      tailor_name: item.tailor,
      delivery_type: 'standard', // Default delivery type
      order_status: 'pending',
      shipping_fee: 0, // BOGO items get free shipping
      shipping: {
        carrier: 'standard',
        createdAt: new Date()
      },
      user_address: orderData.shippingAddress,
      createdAt: new Date(),
      timestamp: new Date()
    };

    // Add BOGO-specific metadata
    const bogoUserOrder: BogoUserOrder = {
      ...baseUserOrder,
      isBogoItem: item.isBogoFree || !!item.bogoMainProductId,
      bogoType: item.isBogoFree ? 'free' : 'main',
      bogoMainProductId: item.bogoMainProductId,
      bogoMappingId: item.bogoMappingId,
      bogoPromotionName: item.bogoPromotionName,
      bogoOriginalPrice: item.bogoOriginalPrice,
      bogoSavingsAmount: item.isBogoFree ? (item.bogoOriginalPrice || 0) : 0
    };

    return bogoUserOrder;
  }

  /**
   * Deduct inventory for both main and free products
   */
  private async deductBogoInventory(transaction: any, cartItems: CartItem[]): Promise<void> {
    const db = await this.getDb();
    
    // Group items by product to handle quantity properly
    const inventoryUpdates = new Map<string, number>();
    
    for (const item of cartItems) {
      const currentQuantity = inventoryUpdates.get(item.product_id) || 0;
      inventoryUpdates.set(item.product_id, currentQuantity + item.quantity);
    }

    // Update inventory for each product
    for (const [productId, quantity] of inventoryUpdates) {
      const productRef = doc(db, 'products', productId);
      
      // Note: This assumes products have an 'inventory' or 'stock' field
      // Adjust field name based on your product schema
      transaction.update(productRef, {
        inventory: increment(-quantity),
        updatedAt: Timestamp.now()
      });
    }
  }

  /**
   * Record BOGO analytics data
   */
  private async recordBogoAnalytics(
    transaction: any,
    bogoData: any,
    orderId: string,
    userId: string
  ): Promise<void> {
    const db = await this.getDb();
    
    // Create analytics record for this order
    const analyticsRef = doc(collection(db, 'bogo_analytics'));
    const analyticsData = {
      orderId,
      userId,
      timestamp: Timestamp.now(),
      bogoItems: bogoData.bogoItems.map((item: any) => ({
        mappingId: item.mappingId,
        mainProductId: item.mainProductId,
        freeProductId: item.freeProductId,
        quantity: item.quantity,
        savingsAmount: item.savingsAmount,
        mainProductRevenue: item.mainProductPrice * item.quantity
      })),
      totalSavings: bogoData.totalBogoSavings,
      freeShippingApplied: bogoData.orderExtensions.bogoFreeShipping,
      shippingSavings: bogoData.orderExtensions.bogoShippingSavings
    };

    transaction.set(analyticsRef, analyticsData);
  }

  /**
   * Calculate standard shipping cost (for savings calculation)
   */
  private calculateStandardShipping(cartItems: CartItem[]): number {
    // This is a simplified calculation - adjust based on your shipping logic
    const totalWeight = cartItems.reduce((sum, item) => sum + (item.quantity * 1), 0); // Assume 1 unit weight per item
    const baseShipping = 10; // Base shipping cost
    const weightMultiplier = 2; // Cost per unit weight
    
    return Math.min(baseShipping + (totalWeight * weightMultiplier), 50); // Cap at $50
  }

  /**
   * Get BOGO order summary for display
   */
  async getBogoOrderSummary(orderId: string): Promise<{
    hasBogo: boolean;
    totalSavings: number;
    freeShipping: boolean;
    bogoItems: Array<{
      mainProduct: string;
      freeProduct: string;
      savings: number;
    }>;
  }> {
    try {
      const db = await this.getDb();
      const orderRef = doc(db, "staging_orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        return {
          hasBogo: false,
          totalSavings: 0,
          freeShipping: false,
          bogoItems: []
        };
      }

      const orderData = orderSnap.data() as BogoOrder;
      
      return {
        hasBogo: !!orderData.bogoItems && orderData.bogoItems.length > 0,
        totalSavings: orderData.totalBogoSavings || 0,
        freeShipping: orderData.bogoFreeShipping || false,
        bogoItems: orderData.bogoItems?.map(item => ({
          mainProduct: item.mainProductId,
          freeProduct: item.freeProductId,
          savings: item.savingsAmount
        })) || []
      };
    } catch (error) {
      console.error('Error getting BOGO order summary:', error);
      return {
        hasBogo: false,
        totalSavings: 0,
        freeShipping: false,
        bogoItems: []
      };
    }
  }

  /**
   * Handle order cancellation for BOGO orders
   */
  async handleBogoOrderCancellation(orderId: string): Promise<void> {
    try {
      const db = await this.getDb();
      
      await runTransaction(db, async (transaction) => {
        // Get order data
        const orderRef = doc(db, "staging_orders", orderId);
        const orderSnap = await transaction.get(orderRef);
        
        if (!orderSnap.exists()) {
          throw new BogoError(
            BogoErrorCode.UNKNOWN_ERROR,
            'Order not found',
            'The order you are trying to cancel does not exist.',
            false
          );
        }

        const orderData = orderSnap.data() as BogoOrder;
        
        if (orderData.bogoItems && orderData.bogoItems.length > 0) {
          // Reverse BOGO analytics
          for (const bogoItem of orderData.bogoItems) {
            const mappingRef = doc(db, 'bogo_mappings', bogoItem.mappingId);
            transaction.update(mappingRef, {
              redemptionCount: increment(-bogoItem.quantity),
              totalRevenue: increment(-(bogoItem.savingsAmount)), // Reverse the revenue impact
              updatedAt: Timestamp.now()
            });
          }

          // Mark analytics record as cancelled
          const analyticsQuery = collection(db, 'bogo_analytics');
          // Note: In a real implementation, you'd query for the specific analytics record
          // and update it to mark as cancelled
        }

        // Update order status
        transaction.update(orderRef, {
          status: 'cancelled',
          updatedAt: Timestamp.now(),
          cancelledAt: Timestamp.now()
        });
      });
    } catch (error) {
      console.error('Error handling BOGO order cancellation:', error);
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to cancel BOGO order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to cancel order. Please try again.',
        true
      );
    }
  }
}

// Export singleton instance
export const bogoCheckoutService = BogoCheckoutService.getInstance();