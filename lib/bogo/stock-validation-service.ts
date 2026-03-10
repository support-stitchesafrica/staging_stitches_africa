// BOGO Stock Validation Service - Handles stock validation for BOGO items
import { BogoError, BogoErrorCode } from '../../types/bogo';

/**
 * Stock Validation Service for BOGO items
 * Handles stock availability checks for both main and free products
 */
export class BogoStockValidationService {
  private static instance: BogoStockValidationService;

  private constructor() {}

  public static getInstance(): BogoStockValidationService {
    if (!BogoStockValidationService.instance) {
      BogoStockValidationService.instance = new BogoStockValidationService();
    }
    return BogoStockValidationService.instance;
  }

  /**
   * Validate stock availability for a product and quantity
   */
  async validateProductStock(
    productId: string, 
    requestedQuantity: number
  ): Promise<{ available: boolean; availableQuantity: number; reason?: string }> {
    try {
      // This would integrate with the actual inventory service
      // For now, we'll simulate stock validation
      
      // Simulate different stock scenarios for testing
      if (productId.includes('out-of-stock')) {
        return {
          available: false,
          availableQuantity: 0,
          reason: 'Product is out of stock'
        };
      }
      
      if (productId.includes('low-stock')) {
        const availableQuantity = 2;
        return {
          available: requestedQuantity <= availableQuantity,
          availableQuantity,
          reason: requestedQuantity > availableQuantity ? 'Insufficient stock available' : undefined
        };
      }
      
      // Default: assume stock is available
      return {
        available: true,
        availableQuantity: Math.max(requestedQuantity, 100) // Simulate high stock
      };
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to validate stock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Unable to check product availability. Please try again.',
        true
      );
    }
  }

  /**
   * Validate stock for BOGO pair (main + free products)
   */
  async validateBogoStock(
    mainProductId: string,
    freeProductIds: string[],
    quantity: number
  ): Promise<{
    isValid: boolean;
    mainProductStock: { available: boolean; availableQuantity: number; reason?: string };
    freeProductsStock: Array<{
      productId: string;
      available: boolean;
      availableQuantity: number;
      reason?: string;
    }>;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate main product stock
    const mainProductStock = await this.validateProductStock(mainProductId, quantity);
    if (!mainProductStock.available) {
      errors.push(`Main product ${mainProductId}: ${mainProductStock.reason || 'Out of stock'}`);
    }

    // Validate free products stock
    const freeProductsStock = await Promise.all(
      freeProductIds.map(async (freeProductId) => {
        const stock = await this.validateProductStock(freeProductId, quantity);
        if (!stock.available) {
          errors.push(`Free product ${freeProductId}: ${stock.reason || 'Out of stock'}`);
        }
        return {
          productId: freeProductId,
          ...stock
        };
      })
    );

    return {
      isValid: errors.length === 0,
      mainProductStock,
      freeProductsStock,
      errors
    };
  }

  /**
   * Handle out-of-stock scenarios for BOGO items
   */
  async handleOutOfStockScenario(
    mainProductId: string,
    freeProductIds: string[],
    requestedQuantity: number
  ): Promise<{
    canProceed: boolean;
    adjustedQuantity?: number;
    alternativeFreeProducts?: string[];
    fallbackOptions: {
      proceedWithMainOnly: boolean;
      suggestAlternatives: boolean;
      waitForRestock: boolean;
    };
  }> {
    const stockValidation = await this.validateBogoStock(
      mainProductId,
      freeProductIds,
      requestedQuantity
    );

    if (stockValidation.isValid) {
      return {
        canProceed: true,
        fallbackOptions: {
          proceedWithMainOnly: false,
          suggestAlternatives: false,
          waitForRestock: false
        }
      };
    }

    // Determine the maximum quantity that can be fulfilled
    const maxMainQuantity = stockValidation.mainProductStock.availableQuantity;
    const maxFreeQuantity = Math.min(
      ...stockValidation.freeProductsStock.map(fp => fp.availableQuantity)
    );
    const adjustedQuantity = Math.min(maxMainQuantity, maxFreeQuantity);

    // Find alternative free products (if any are out of stock)
    const outOfStockFreeProducts = stockValidation.freeProductsStock
      .filter(fp => !fp.available)
      .map(fp => fp.productId);

    return {
      canProceed: adjustedQuantity > 0,
      adjustedQuantity: adjustedQuantity > 0 ? adjustedQuantity : undefined,
      alternativeFreeProducts: [], // Would be populated by product recommendation service
      fallbackOptions: {
        proceedWithMainOnly: stockValidation.mainProductStock.available,
        suggestAlternatives: outOfStockFreeProducts.length > 0,
        waitForRestock: !stockValidation.mainProductStock.available
      }
    };
  }
}

// Export singleton instance
export const bogoStockValidationService = BogoStockValidationService.getInstance();