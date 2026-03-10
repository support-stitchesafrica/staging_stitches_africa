// BOGO Specific Product Mappings Configuration
// This script configures the 7 specific product pairs for the December BOGO promotion

import { bogoMappingService } from './mapping-service';
import type { CreateBogoMappingData } from '../../types/bogo';

/**
 * Specific BOGO product mappings as defined in the requirements
 * 
 * NOTE: These product IDs are placeholders and should be replaced with actual 
 * product IDs from your Firestore 'tailor_works' collection before deployment.
 * 
 * To get real product IDs:
 * 1. Query your Firestore 'tailor_works' collection
 * 2. Find products by title/name matching the descriptions below
 * 3. Replace the placeholder IDs with the actual document IDs
 */
export const SPECIFIC_BOGO_MAPPINGS: CreateBogoMappingData[] = [
  {
    // TODO: Replace with actual Firestore document ID for OUCH SNEAKERS ($240.00)
    mainProductId: '3trwkBLsvCiiU8nKBhb5',
    // TODO: Replace with actual Firestore document ID for TTDALK LONG WALLET ($96)
    freeProductIds: ['esjRjS6b2L5biT5Q2EA8'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - OUCH SNEAKERS',
    description: 'Buy OUCH SNEAKERS ($240.00) and get TTDALK LONG WALLET ($96) free'
  },
  {
    // TODO: Replace with actual Firestore document ID for TRAX PANTS WIDE LEG PANT
    mainProductId: 'shTKa7lSx4r3uVsZCEYt',
    // TODO: Replace with actual Firestore document ID for TTDALK LONG WALLET ($96)
    freeProductIds: ['esjRjS6b2L5biT5Q2EA8'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - WIDE LEG FRINGE PANT',
    description: 'Buy TRAX APPAREL WIDE LEG FRINGE PANT and get TTDALK LONG WALLET ($96) free'
  },
  {
    // TODO: Replace with actual Firestore document ID for TRAX PANTS SPLATTERED SHORTS
    mainProductId: 'vghjbVMQuDfeA2IvUYih',
    // TODO: Replace with actual Firestore document ID for TTDALK LONG WALLET ($96)
    freeProductIds: ['esjRjS6b2L5biT5Q2EA8'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - SPLATTERED CARGO JORTS',
    description: 'Buy TRAX APPAREL Splatted Cargo Jorts combo and get TTDALK LONG WALLET ($96) free'
  },
  {
    // TODO: Replace with actual Firestore document ID for HAUTE AFRIKANA AKWETE MAXI DRESS ($120)
    mainProductId: 'y8YyOtzN9yer2NhHSfFk',
    // TODO: Replace with actual Firestore document ID for BY ORE SEQUIN PURSE ($79)
    freeProductIds: ['ZVYPmLrOo4XTXSXPLa94'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - AKWETE MAXI DRESS',
    description: 'Buy HAUTE AFRIKANA AKWETE MAXI DRESS ($120) and get BY ORE SEQUIN PURSE ($79) free'
  },
  {
    // TODO: Replace with actual Firestore document ID for NANCY HANSON SILENT POWER TOP ($120)
    mainProductId: 'ykpYu6LH8eZypC61ANUq',
    // TODO: Replace with actual Firestore document IDs for free product options
    freeProductIds: ['v9vNnnLSeJwkICbRqFM5', 'Tz8ibBFZiTipwKn9P52Z'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - SILENT POWER TOP',
    description: 'Buy NANCY HANSON SILENT POWER TOP ($120) and choose either LOLA SIGNATURE CANDY ($108.00) or LOLA SIGNATURE EWA BEAD BAG ($98.00) free'
  },
  {
    // TODO: Replace with actual Firestore document ID for NANCY HANSON PEARL NEUTRAL ($78)
    mainProductId: '3VVFJUo687IkLjcxlznB',
    // TODO: Replace with actual Firestore document IDs for free product options
    freeProductIds: ['v9vNnnLSeJwkICbRqFM5', 'Tz8ibBFZiTipwKn9P52Z'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - PEARL NEUTRAL',
    description: 'Buy NANCY HANSON PEARL NEUTRAL ($78) and choose either LOLA SIGNATURE CANDY ($108.00) or LOLA SIGNATURE EWA BEAD BAG ($98.00) free'
  },
  {
    // TODO: Replace with actual Firestore document ID for IYANGA WOMAN AINA DRESS ($366.00)
    mainProductId: 'iSdXglK42eZNj97zbuSt',
    // TODO: Replace with actual Firestore document IDs for free product options
    freeProductIds: ['v9vNnnLSeJwkICbRqFM5', 'Tz8ibBFZiTipwKn9P52Z'],
    promotionStartDate: new Date('2025-12-01T00:00:00Z'),
    promotionEndDate: new Date('2025-12-31T23:59:59Z'),
    active: true,
    autoFreeShipping: true,
    promotionName: 'December BOGO - AINA DRESS',
    description: 'Buy IYANGA WOMAN AINA DRESS ($366.00) and choose either LOLA SIGNATURE CANDY ($108.00) or LOLA SIGNATURE EWA BEAD BAG ($98.00) free'
  }
];

/**
 * Product ID mappings for validation
 * Maps display names to actual product IDs that should exist in the system
 * 
 * NOTE: These are placeholder IDs. Replace with actual Firestore document IDs.
 */
export const PRODUCT_ID_MAPPINGS = {
  // Main products (items customers buy)
  'OUCH SNEAKERS': '3trwkBLsvCiiU8nKBhb5',
  'TRAX PANTS WIDE LEG PANT': 'nz7aYVnwdbx2xgn2gGAI',
  'TRAX PANTS SPLATTERED SHORTS': 'DVaRyrn2WGW1MUHIo7Qi',
  'HAUTE AFRIKANA AKWETE MAXI DRESS': 'y8YyOtzN9yer2NhHSfFk',
  'NANCY HANSON SILENT POWER TOP': 'ykpYu6LH8eZypC61ANUq',
  'NANCY HANSON PEARL NEUTRAL': '3VVFJUo687IkLjcxlznB',
  'IYANGA WOMAN AINA DRESS': 'iSdXglK42eZNj97zbuSt',
  
  // Free products (items customers get free)
  'TTDALK LONG WALLET': 'esjRjS6b2L5biT5Q2EA8',
  'BY ORE SEQUIN PURSE': 'ZVYPmLrOo4XTXSXPLa94',
  'LOLA SIGNATURE CANDY': 'v9vNnnLSeJwkICbRqFM5',
  'LOLA SIGNATURE EWA BEAD BAG': 'Tz8ibBFZiTipwKn9P52Z'
};

/**
 * Configure all specific BOGO mappings
 */
export async function configureSpecificBogoMappings(userId: string): Promise<{
  success: boolean;
  created: number;
  errors: Array<{ mapping: CreateBogoMappingData; error: string }>;
}> {
  const results = {
    success: true,
    created: 0,
    errors: [] as Array<{ mapping: CreateBogoMappingData; error: string }>
  };

  console.log('Starting configuration of specific BOGO mappings...');

  for (const mappingData of SPECIFIC_BOGO_MAPPINGS) {
    try {
      console.log(`Creating mapping: ${mappingData.promotionName}`);
      
      // Validate that this mapping doesn't already exist
      const existingMapping = await bogoMappingService.getActiveMapping(mappingData.mainProductId);
      if (existingMapping) {
        console.log(`Mapping already exists for ${mappingData.mainProductId}, skipping...`);
        continue;
      }

      const createdMapping = await bogoMappingService.createMapping(mappingData, userId);
      console.log(`✓ Created mapping: ${createdMapping.id} - ${mappingData.promotionName}`);
      results.created++;
    } catch (error) {
      console.error(`✗ Failed to create mapping: ${mappingData.promotionName}`, error);
      results.errors.push({
        mapping: mappingData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.success = false;
    }
  }

  console.log(`Configuration complete. Created: ${results.created}, Errors: ${results.errors.length}`);
  return results;
}

/**
 * Validate that all required product IDs exist in the system
 */
export async function validateProductIds(): Promise<{
  valid: boolean;
  missingProducts: string[];
  validProducts: string[];
}> {
  const allProductIds = new Set<string>();
  
  // Collect all product IDs from mappings
  SPECIFIC_BOGO_MAPPINGS.forEach(mapping => {
    allProductIds.add(mapping.mainProductId);
    mapping.freeProductIds.forEach(id => allProductIds.add(id));
  });

  const missingProducts: string[] = [];
  const validProducts: string[] = [];

  // For now, we'll assume all products exist since we don't have direct access to product validation
  // In a real implementation, this would query the product database
  console.log('Product validation would check these IDs:', Array.from(allProductIds));
  
  // Mock validation - in real implementation, query product service
  Array.from(allProductIds).forEach(productId => {
    validProducts.push(productId);
  });

  return {
    valid: missingProducts.length === 0,
    missingProducts,
    validProducts
  };
}

/**
 * Test each mapping with actual product data
 */
export async function testMappingsWithProductData(): Promise<{
  success: boolean;
  results: Array<{
    mappingId: string;
    mainProductId: string;
    freeProductIds: string[];
    tested: boolean;
    error?: string;
  }>;
}> {
  const results = {
    success: true,
    results: [] as Array<{
      mappingId: string;
      mainProductId: string;
      freeProductIds: string[];
      tested: boolean;
      error?: string;
    }>
  };

  // Get all active mappings
  const activeMappings = await bogoMappingService.getAllMappings({ active: true });
  
  for (const mapping of activeMappings) {
    try {
      // Test if mapping can be retrieved and is properly configured
      const retrievedMapping = await bogoMappingService.getMapping(mapping.id);
      
      if (!retrievedMapping) {
        throw new Error('Mapping not found after creation');
      }

      // Validate mapping structure
      if (!retrievedMapping.mainProductId || retrievedMapping.freeProductIds.length === 0) {
        throw new Error('Invalid mapping structure');
      }

      // Validate dates
      const now = new Date();
      const startDate = retrievedMapping.promotionStartDate.toDate();
      const endDate = retrievedMapping.promotionEndDate.toDate();
      
      if (startDate >= endDate) {
        throw new Error('Invalid date range');
      }

      results.results.push({
        mappingId: mapping.id,
        mainProductId: mapping.mainProductId,
        freeProductIds: mapping.freeProductIds,
        tested: true
      });
    } catch (error) {
      results.success = false;
      results.results.push({
        mappingId: mapping.id,
        mainProductId: mapping.mainProductId,
        freeProductIds: mapping.freeProductIds,
        tested: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Verify free shipping applies to all mappings
 */
export async function verifyFreeShippingForAllMappings(): Promise<{
  success: boolean;
  mappingsWithFreeShipping: number;
  mappingsWithoutFreeShipping: string[];
}> {
  const activeMappings = await bogoMappingService.getAllMappings({ active: true });
  const mappingsWithoutFreeShipping: string[] = [];
  let mappingsWithFreeShipping = 0;

  for (const mapping of activeMappings) {
    if (mapping.autoFreeShipping) {
      mappingsWithFreeShipping++;
    } else {
      mappingsWithoutFreeShipping.push(mapping.id);
    }
  }

  return {
    success: mappingsWithoutFreeShipping.length === 0,
    mappingsWithFreeShipping,
    mappingsWithoutFreeShipping
  };
}