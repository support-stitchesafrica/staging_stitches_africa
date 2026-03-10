/**
 * Collection Waitlist Service Tests
 * Basic functionality tests for the collection waitlist service
 */

import { CollectionWaitlistService } from '../collection-waitlist-service';
import { CreateCollectionForm, ProductRelationship } from '@/types/vendor-waitlist';

describe('CollectionWaitlistService', () => {
  describe('Utility Methods', () => {
    test('generateCollectionSlug should create valid slug', () => {
      const name = 'Summer Collection 2024';
      const vendorId = 'vendor123';
      
      const slug = CollectionWaitlistService.generateCollectionSlug(name, vendorId);
      
      expect(slug).toBeDefined();
      expect(slug).toMatch(/^[a-z0-9-]+$/); // Should only contain lowercase letters, numbers, and hyphens
      expect(slug).toContain('vendor12'); // Should contain vendor prefix
    });

    test('canEditCollection should return correct permissions', () => {
      expect(CollectionWaitlistService.canEditCollection('draft')).toBe(true);
      expect(CollectionWaitlistService.canEditCollection('published')).toBe(true);
      expect(CollectionWaitlistService.canEditCollection('completed')).toBe(false);
      expect(CollectionWaitlistService.canEditCollection('archived')).toBe(false);
    });

    test('canDeleteCollection should return correct permissions', () => {
      expect(CollectionWaitlistService.canDeleteCollection('draft', 0)).toBe(true);
      expect(CollectionWaitlistService.canDeleteCollection('published', 0)).toBe(true);
      expect(CollectionWaitlistService.canDeleteCollection('published', 5)).toBe(false);
      expect(CollectionWaitlistService.canDeleteCollection('completed', 0)).toBe(false);
    });

    test('getAllowedStatusTransitions should return correct transitions', () => {
      const draftTransitions = CollectionWaitlistService.getAllowedStatusTransitions('draft');
      expect(draftTransitions).toContain('published');
      expect(draftTransitions).toContain('archived');

      const publishedTransitions = CollectionWaitlistService.getAllowedStatusTransitions('published');
      expect(publishedTransitions).toContain('completed');
      expect(publishedTransitions).toContain('archived');

      const archivedTransitions = CollectionWaitlistService.getAllowedStatusTransitions('archived');
      expect(archivedTransitions).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    test('should validate required fields for collection creation', async () => {
      const invalidData: Partial<CreateCollectionForm> = {
        name: '', // Invalid: empty name
        description: 'Test description',
        pairedProducts: []
      };

      const result = await CollectionWaitlistService.createCollection(
        'vendor123', 
        invalidData as CreateCollectionForm
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    test('should validate product pairs', async () => {
      const validData: CreateCollectionForm = {
        name: 'Test Collection',
        description: 'Test description for collection',
        imageUrl: 'https://example.com/image.jpg', // Add required image
        pairedProducts: [
          {
            primaryProductId: 'product1',
            secondaryProductId: 'product2',
            relationship: 'buy_with' as ProductRelationship,
            displayOrder: 0
          }
        ],
        minSubscribers: 10
      };

      // This will fail because we don't have a real database connection in tests
      // But it should pass validation and fail at the database level
      const result = await CollectionWaitlistService.createCollection('vendor123', validData);
      
      // The validation should pass, but database operation should fail
      expect(result.success).toBe(false);
      // Should not be a validation error since the data is valid
      expect(result.error?.code).not.toBe('VALIDATION_ERROR');
    });
  });
});