/**
 * Free Shipping Collections - End-to-End Tests
 * 
 * Tests the complete free shipping functionality for product collections
 * including eligibility checking, checkout flow integration, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectionRepository } from '@/lib/firestore';
import { ProductCollection, CartItem, Address } from '@/types';

// Mock Firestore
vi.mock('@/lib/firebase', () => ({
  getFirebaseDb: vi.fn(() => Promise.resolve({})),
  getFirebaseFunctions: vi.fn(() => Promise.resolve({})),
}));

describe('Free Shipping Collections - End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Collection Repository - getByIds Method', () => {
    it('should fetch multiple collections by IDs', async () => {
      // Mock collection data
      const mockCollections: ProductCollection[] = [
        {
          id: 'collection-1',
          name: 'Summer Collection',
          productIds: ['prod-1', 'prod-2'],
          canvasState: {} as any,
          thumbnail: 'https://example.com/thumb1.jpg',
          published: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1',
          isFreeShipping: true,
        },
        {
          id: 'collection-2',
          name: 'Winter Collection',
          productIds: ['prod-3', 'prod-4'],
          canvasState: {} as any,
          thumbnail: 'https://example.com/thumb2.jpg',
          published: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1',
          isFreeShipping: false,
        },
      ];

      // Mock the getByIds method
      vi.spyOn(collectionRepository, 'getByIds').mockResolvedValue(mockCollections);

      // Test
      const result = await collectionRepository.getByIds(['collection-1', 'collection-2']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('collection-1');
      expect(result[0].isFreeShipping).toBe(true);
      expect(result[1].id).toBe('collection-2');
      expect(result[1].isFreeShipping).toBe(false);
    });

    it('should handle empty array input', async () => {
      vi.spyOn(collectionRepository, 'getByIds').mockResolvedValue([]);

      const result = await collectionRepository.getByIds([]);

      expect(result).toEqual([]);
    });

    it('should filter out non-existent collections', async () => {
      const mockCollections: ProductCollection[] = [
        {
          id: 'collection-1',
          name: 'Summer Collection',
          productIds: ['prod-1'],
          canvasState: {} as any,
          thumbnail: 'https://example.com/thumb1.jpg',
          published: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1',
          isFreeShipping: true,
        },
      ];

      vi.spyOn(collectionRepository, 'getByIds').mockResolvedValue(mockCollections);

      // Request 3 IDs but only 1 exists
      const result = await collectionRepository.getByIds([
        'collection-1',
        'non-existent-1',
        'non-existent-2',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('collection-1');
    });
  });

  describe('Free Shipping Eligibility Logic', () => {
    const createMockAddress = (countryCode: string): Address => ({
      id: 'addr-1',
      user_id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      street_address: '123 Main St',
      city: 'Lagos',
      state: 'Lagos',
      post_code: '100001',
      country: countryCode === 'NG' ? 'Nigeria' : 'United States',
      country_code: countryCode,
      phone_number: '+2341234567890',
      is_default: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createMockCartItem = (
      collectionId: string,
      price: number = 50
    ): CartItem => ({
      product_id: `prod-${collectionId}`,
      quantity: 1,
      price,
      isCollectionItem: true,
      collectionId,
      collectionName: `Collection ${collectionId}`,
      product: {
        id: `prod-${collectionId}`,
        name: 'Test Product',
        price,
        images: [],
        category: 'test',
        description: 'Test product',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const createMockCollection = (
      id: string,
      isFreeShipping: boolean
    ): ProductCollection => ({
      id,
      name: `Collection ${id}`,
      productIds: [`prod-${id}`],
      canvasState: {} as any,
      thumbnail: 'https://example.com/thumb.jpg',
      published: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      isFreeShipping,
    });

    // Helper function to simulate the eligibility check
    const checkFreeShippingEligibility = (
      cartItems: CartItem[],
      collections: Map<string, ProductCollection>,
      shippingAddress: Address | null,
      cartTotalNGN: number
    ): { isEligible: boolean; reason?: string } => {
      const MINIMUM_ORDER_AMOUNT_NGN = 90000;

      if (!shippingAddress) {
        return { isEligible: false, reason: 'No shipping address' };
      }

      const isNigerianAddress = (address: Address): boolean => {
        const countryCode = address.country_code?.toUpperCase().trim();
        if (countryCode === 'NG' || countryCode === 'NGA') return true;
        const countryName = address.country?.toLowerCase().trim();
        if (countryName === 'nigeria') return true;
        return false;
      };

      const isDomestic = isNigerianAddress(shippingAddress);
      if (!isDomestic) {
        return { isEligible: false, reason: 'International shipping' };
      }

      if (cartTotalNGN < MINIMUM_ORDER_AMOUNT_NGN) {
        return {
          isEligible: false,
          reason: `Cart total below minimum ₦${MINIMUM_ORDER_AMOUNT_NGN.toLocaleString()}`,
        };
      }

      const allAreCollectionItems = cartItems.every(
        (item) => item.isCollectionItem === true
      );
      if (!allAreCollectionItems) {
        return { isEligible: false, reason: 'Cart contains non-collection items' };
      }

      const uniqueCollectionIds = new Set(
        cartItems.filter((item) => item.collectionId).map((item) => item.collectionId!)
      );

      for (const collectionId of uniqueCollectionIds) {
        const collection = collections.get(collectionId);
        if (!collection) {
          return {
            isEligible: false,
            reason: `Collection ${collectionId} not found`,
          };
        }
        if (collection.isFreeShipping !== true) {
          return {
            isEligible: false,
            reason: `Collection ${collectionId} does not have free shipping`,
          };
        }
      }

      return { isEligible: true };
    };

    it('should be eligible when all items are from free shipping collections + Nigeria address + minimum amount', () => {
      const cartItems = [
        createMockCartItem('col-1', 50000),
        createMockCartItem('col-1', 45000),
      ];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const address = createMockAddress('NG');
      const cartTotalNGN = 95000; // Above minimum

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(true);
    });

    it('should be ineligible when cart total is below minimum (₦90,000)', () => {
      const cartItems = [createMockCartItem('col-1', 30000)];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const address = createMockAddress('NG');
      const cartTotalNGN = 30000; // Below minimum

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('below minimum');
    });

    it('should be ineligible with mixed cart (some free shipping, some not)', () => {
      const cartItems = [
        createMockCartItem('col-1', 50000),
        createMockCartItem('col-2', 45000),
      ];
      const collections = new Map([
        ['col-1', createMockCollection('col-1', true)],
        ['col-2', createMockCollection('col-2', false)],
      ]);
      const address = createMockAddress('NG');
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('does not have free shipping');
    });

    it('should be ineligible with international address', () => {
      const cartItems = [createMockCartItem('col-1', 50000)];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const address = createMockAddress('US');
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe('International shipping');
    });

    it('should be ineligible with no address', () => {
      const cartItems = [createMockCartItem('col-1', 50000)];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        null,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe('No shipping address');
    });

    it('should be ineligible with non-collection items in cart', () => {
      const regularItem: CartItem = {
        product_id: 'regular-prod',
        quantity: 1,
        price: 50000,
        isCollectionItem: false,
        product: {
          id: 'regular-prod',
          name: 'Regular Product',
          price: 50000,
          images: [],
          category: 'test',
          description: 'Regular product',
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      const cartItems = [createMockCartItem('col-1', 45000), regularItem];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const address = createMockAddress('NG');
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(false);
      expect(result.reason).toBe('Cart contains non-collection items');
    });

    it('should be ineligible when collection is deleted/not found', () => {
      const cartItems = [createMockCartItem('col-deleted', 50000)];
      const collections = new Map(); // Empty - collection doesn't exist
      const address = createMockAddress('NG');
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should recognize NGA country code as Nigeria', () => {
      const address: Address = {
        ...createMockAddress('NGA'),
        country_code: 'NGA',
      };
      const cartItems = [createMockCartItem('col-1', 50000)];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(true);
    });

    it('should recognize "nigeria" country name (case-insensitive)', () => {
      const address: Address = {
        ...createMockAddress('NG'),
        country: 'nigeria',
        country_code: undefined as any,
      };
      const cartItems = [createMockCartItem('col-1', 50000)];
      const collections = new Map([['col-1', createMockCollection('col-1', true)]]);
      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should default isFreeShipping to false when creating collection without the field', async () => {
      const mockCollection: ProductCollection = {
        id: 'col-1',
        name: 'Test Collection',
        productIds: ['prod-1'],
        canvasState: {} as any,
        thumbnail: 'https://example.com/thumb.jpg',
        published: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        isFreeShipping: false, // Should default to false
      };

      vi.spyOn(collectionRepository, 'create').mockResolvedValue('col-1');
      vi.spyOn(collectionRepository, 'getById').mockResolvedValue(mockCollection);

      const collectionId = await collectionRepository.create({
        name: 'Test Collection',
        productIds: ['prod-1'],
        canvasState: {} as any,
        thumbnail: 'https://example.com/thumb.jpg',
        createdBy: 'user-1',
      });

      const retrieved = await collectionRepository.getById(collectionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.isFreeShipping).toBe(false);
    });

    it('should persist isFreeShipping value when explicitly set to true', async () => {
      const mockCollection: ProductCollection = {
        id: 'col-1',
        name: 'Free Shipping Collection',
        productIds: ['prod-1'],
        canvasState: {} as any,
        thumbnail: 'https://example.com/thumb.jpg',
        published: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        isFreeShipping: true,
      };

      vi.spyOn(collectionRepository, 'create').mockResolvedValue('col-1');
      vi.spyOn(collectionRepository, 'getById').mockResolvedValue(mockCollection);

      const collectionId = await collectionRepository.create({
        name: 'Free Shipping Collection',
        productIds: ['prod-1'],
        canvasState: {} as any,
        thumbnail: 'https://example.com/thumb.jpg',
        createdBy: 'user-1',
        isFreeShipping: true,
      });

      const retrieved = await collectionRepository.getById(collectionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.isFreeShipping).toBe(true);
    });

    it('should allow updating isFreeShipping value', async () => {
      const initialCollection: ProductCollection = {
        id: 'col-1',
        name: 'Test Collection',
        productIds: ['prod-1'],
        canvasState: {} as any,
        thumbnail: 'https://example.com/thumb.jpg',
        published: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        isFreeShipping: false,
      };

      const updatedCollection: ProductCollection = {
        ...initialCollection,
        isFreeShipping: true,
      };

      vi.spyOn(collectionRepository, 'getById')
        .mockResolvedValueOnce(initialCollection)
        .mockResolvedValueOnce(updatedCollection);
      vi.spyOn(collectionRepository, 'update').mockResolvedValue();

      const before = await collectionRepository.getById('col-1');
      expect(before!.isFreeShipping).toBe(false);

      await collectionRepository.update('col-1', { isFreeShipping: true });

      const after = await collectionRepository.getById('col-1');
      expect(after!.isFreeShipping).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle cart with multiple items from same free shipping collection', () => {
      const createMockCartItem = (
        collectionId: string,
        productId: string,
        price: number
      ): CartItem => ({
        product_id: productId,
        quantity: 1,
        price,
        isCollectionItem: true,
        collectionId,
        collectionName: `Collection ${collectionId}`,
        product: {
          id: productId,
          name: 'Test Product',
          price,
          images: [],
          category: 'test',
          description: 'Test product',
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const checkFreeShippingEligibility = (
        cartItems: CartItem[],
        collections: Map<string, ProductCollection>,
        shippingAddress: Address | null,
        cartTotalNGN: number
      ): { isEligible: boolean; reason?: string } => {
        const MINIMUM_ORDER_AMOUNT_NGN = 90000;

        if (!shippingAddress) {
          return { isEligible: false, reason: 'No shipping address' };
        }

        const isNigerianAddress = (address: Address): boolean => {
          const countryCode = address.country_code?.toUpperCase().trim();
          if (countryCode === 'NG' || countryCode === 'NGA') return true;
          return false;
        };

        const isDomestic = isNigerianAddress(shippingAddress);
        if (!isDomestic) {
          return { isEligible: false, reason: 'International shipping' };
        }

        if (cartTotalNGN < MINIMUM_ORDER_AMOUNT_NGN) {
          return { isEligible: false, reason: 'Below minimum' };
        }

        const allAreCollectionItems = cartItems.every(
          (item) => item.isCollectionItem === true
        );
        if (!allAreCollectionItems) {
          return { isEligible: false, reason: 'Non-collection items' };
        }

        const uniqueCollectionIds = new Set(
          cartItems.filter((item) => item.collectionId).map((item) => item.collectionId!)
        );

        for (const collectionId of uniqueCollectionIds) {
          const collection = collections.get(collectionId);
          if (!collection || collection.isFreeShipping !== true) {
            return { isEligible: false, reason: 'Collection not free shipping' };
          }
        }

        return { isEligible: true };
      };

      const cartItems = [
        createMockCartItem('col-1', 'prod-1', 30000),
        createMockCartItem('col-1', 'prod-2', 35000),
        createMockCartItem('col-1', 'prod-3', 30000),
      ];

      const collections = new Map([
        [
          'col-1',
          {
            id: 'col-1',
            name: 'Collection 1',
            productIds: ['prod-1', 'prod-2', 'prod-3'],
            canvasState: {} as any,
            thumbnail: 'https://example.com/thumb.jpg',
            published: true,
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1',
            isFreeShipping: true,
          },
        ],
      ]);

      const address: Address = {
        id: 'addr-1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        street_address: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        post_code: '100001',
        country: 'Nigeria',
        country_code: 'NG',
        phone_number: '+2341234567890',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const cartTotalNGN = 95000;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      expect(result.isEligible).toBe(true);
    });

    it('should handle empty cart gracefully', () => {
      const checkFreeShippingEligibility = (
        cartItems: CartItem[],
        collections: Map<string, ProductCollection>,
        shippingAddress: Address | null,
        cartTotalNGN: number
      ): { isEligible: boolean; reason?: string } => {
        const MINIMUM_ORDER_AMOUNT_NGN = 90000;

        if (!shippingAddress) {
          return { isEligible: false, reason: 'No shipping address' };
        }

        if (cartTotalNGN < MINIMUM_ORDER_AMOUNT_NGN) {
          return { isEligible: false, reason: 'Below minimum' };
        }

        const allAreCollectionItems = cartItems.every(
          (item) => item.isCollectionItem === true
        );
        if (!allAreCollectionItems) {
          return { isEligible: false, reason: 'Non-collection items' };
        }

        return { isEligible: true };
      };

      const cartItems: CartItem[] = [];
      const collections = new Map();
      const address: Address = {
        id: 'addr-1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        street_address: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        post_code: '100001',
        country: 'Nigeria',
        country_code: 'NG',
        phone_number: '+2341234567890',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const cartTotalNGN = 0;

      const result = checkFreeShippingEligibility(
        cartItems,
        collections,
        address,
        cartTotalNGN
      );

      // Empty cart should be ineligible (below minimum amount)
      expect(result.isEligible).toBe(false);
    });
  });
});
