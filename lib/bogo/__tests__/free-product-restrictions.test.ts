// BOGO Free Product Restrictions Property-Based Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import type { Product } from '@/types';
import { bogoCartService } from '../cart-service';
import { bogoBadgeService } from '../badge-service';
import { bogoMappingService } from '../mapping-service';
import { BogoError, BogoErrorCode } from '@/types/bogo';

// Mock the services
vi.mock('../mapping-service', () => ({
  bogoMappingService: {
    getActiveMapping: vi.fn(),
    getAllMappings: vi.fn(),
  },
}));

vi.mock('../badge-service', () => ({
  bogoBadgeService: {
    isBogoFreeProduct: vi.fn(),
    getMainProductForFreeProduct: vi.fn(),
  },
}));

describe('BOGO Free Product Restrictions - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper generator for products
  const productGenerator = fc.record({
    product_id: fc.string({ minLength: 1, maxLength: 20 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    price: fc.oneof(
      fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
      fc.record({
        base: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
        currency: fc.constant('USD'),
      })
    ),
    discount: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
    images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
    tailor_id: fc.string({ minLength: 1, maxLength: 20 }),
    tailor: fc.string({ minLength: 1, maxLength: 50 }),
    tags: fc.array(fc.string(), { maxLength: 10 }),
    category: fc.string(),
    type: fc.constantFrom('ready-to-wear', 'bespoke'),
    availability: fc.constantFrom('in_stock', 'pre_order', 'out_of_stock'),
    status: fc.constantFrom('verified', 'pending', 'draft', 'archived'),
    deliveryTimeline: fc.string(),
    returnPolicy: fc.string(),
  }) as fc.Arbitrary<Product>;

  // Feature: bogo-promotion, Property 10: Free Product Direct Add Prevention
  // **Validates: Requirements 4.1, 4.3**
  it('Property 10: Free Product Direct Add Prevention - For any product marked as a BOGO free product, attempting to add it directly to cart (without the main product) should return a disabled state or error message', () => {
    fc.assert(
      fc.asyncProperty(
        productGenerator,
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 1, maxLength: 20 }), // mainProductId
        async (freeProduct, quantity, mainProductId) => {
          // Setup: Mock this product as a free product in an active BOGO mapping
          const mapping = {
            id: 'test-mapping',
            mainProductId: mainProductId,
            freeProductIds: [freeProduct.product_id],
            active: true,
            autoFreeShipping: true,
            promotionStartDate: new Date('2024-12-01'),
            promotionEndDate: new Date('2024-12-31'),
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            redemptionCount: 0,
            totalRevenue: 0,
          };

          // Mock the services to indicate this is a free product
          vi.mocked(bogoMappingService.getActiveMapping).mockResolvedValue(null); // No mapping for the free product itself
          vi.mocked(bogoMappingService.getAllMappings).mockResolvedValue([mapping]);
          vi.mocked(bogoBadgeService.isBogoFreeProduct).mockResolvedValue(true);
          vi.mocked(bogoBadgeService.getMainProductForFreeProduct).mockResolvedValue(mainProductId);

          // Execute: Try to add the free product directly to cart
          try {
            const result = await bogoCartService.addProductWithBogo(
              freeProduct,
              quantity,
              [] // empty cart
            );

            // If no error is thrown, the result should indicate failure or restriction
            expect(result.success).toBe(false);
          } catch (error) {
            // Should throw a BOGO error indicating the product cannot be added directly
            expect(error).toBeInstanceOf(BogoError);
            expect((error as BogoError).code).toBe(BogoErrorCode.VALIDATION_ERROR);
            expect((error as BogoError).userMessage).toContain('December BOGO promotion');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  // Additional test for when main product is in cart
  it('Property 10b: Free Product Add Prevention with Main Product - For any free product when the corresponding main product is in cart, the free product should be addable through selection interface', () => {
    fc.assert(
      fc.asyncProperty(
        productGenerator,
        productGenerator,
        fc.integer({ min: 1, max: 5 }),
        async (mainProduct, freeProduct, quantity) => {
          // Ensure products are different
          fc.pre(mainProduct.product_id !== freeProduct.product_id);

          // Setup: Mock BOGO mapping where freeProduct is free for mainProduct
          const mapping = {
            id: 'test-mapping',
            mainProductId: mainProduct.product_id,
            freeProductIds: [freeProduct.product_id],
            active: true,
            autoFreeShipping: true,
            promotionStartDate: new Date('2024-12-01'),
            promotionEndDate: new Date('2024-12-31'),
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            redemptionCount: 0,
            totalRevenue: 0,
          };

          // Mock cart with main product already in it
          const cartWithMainProduct = [{
            product_id: mainProduct.product_id,
            title: mainProduct.title,
            description: mainProduct.description,
            price: typeof mainProduct.price === 'number' ? mainProduct.price : mainProduct.price.base,
            discount: mainProduct.discount,
            quantity: 1,
            color: null,
            size: null,
            sizes: null,
            images: mainProduct.images,
            tailor_id: mainProduct.tailor_id,
            tailor: mainProduct.tailor,
            user_id: 'test-user',
            createdAt: new Date(),
            updatedAt: new Date(),
          }];

          // Mock services
          vi.mocked(bogoMappingService.getActiveMapping).mockImplementation(async (productId) => {
            if (productId === mainProduct.product_id) {
              return mapping;
            }
            return null;
          });
          vi.mocked(bogoBadgeService.isBogoFreeProduct).mockResolvedValue(true);
          vi.mocked(bogoBadgeService.getMainProductForFreeProduct).mockResolvedValue(mainProduct.product_id);

          // Execute: Handle free product selection (simulating selection interface)
          const result = await bogoCartService.handleFreeProductSelection(
            mainProduct.product_id,
            freeProduct.product_id,
            cartWithMainProduct
          );

          // Verify: Should succeed when main product is in cart
          expect(result.success).toBe(true);
          expect(result.freeProductAdded).toBe(true);
          expect(result.freeProductId).toBe(freeProduct.product_id);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Unit test for specific error message
  // **Validates: Requirements 4.2**
  it('should show correct error message when attempting to add free product directly', async () => {
    // Setup: Create a specific free product
    const freeProduct: Product = {
      product_id: 'free-test-product',
      title: 'Test Free Product',
      description: 'A test free product',
      price: { base: 50, currency: 'USD' },
      discount: 0,
      images: ['test-image.jpg'],
      tailor_id: 'test-tailor',
      tailor: 'Test Tailor',
      tags: [],
      category: 'accessories',
      type: 'ready-to-wear',
      availability: 'in_stock',
      status: 'verified',
      deliveryTimeline: '3-5 days',
      returnPolicy: '30 days',
    };

    const mainProductId = 'main-test-product';
    
    // Mock this as a free product
    const mapping = {
      id: 'test-mapping',
      mainProductId: mainProductId,
      freeProductIds: [freeProduct.product_id],
      active: true,
      autoFreeShipping: true,
      promotionStartDate: new Date('2024-12-01'),
      promotionEndDate: new Date('2024-12-31'),
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      redemptionCount: 0,
      totalRevenue: 0,
    };

    vi.mocked(bogoMappingService.getActiveMapping).mockResolvedValue(null);
    vi.mocked(bogoMappingService.getAllMappings).mockResolvedValue([mapping]);
    vi.mocked(bogoBadgeService.isBogoFreeProduct).mockResolvedValue(true);

    // Execute: Try to add free product directly
    try {
      await bogoCartService.addProductWithBogo(freeProduct, 1, []);
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify: Should get the specific error message
      expect(error).toBeInstanceOf(BogoError);
      const bogoError = error as BogoError;
      expect(bogoError.code).toBe(BogoErrorCode.VALIDATION_ERROR);
      expect(bogoError.userMessage).toBe('This item is only available as part of the December BOGO promotion');
      expect(bogoError.message).toBe('Cannot add free product directly to cart');
    }
  });});
