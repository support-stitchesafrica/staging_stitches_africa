// BOGO Mapping Service - Core service for managing BOGO product mappings
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  QueryConstraint
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { 
  BogoMapping, 
  CreateBogoMappingData, 
  BogoMappingFilters, 
  BogoMappingValidationResult,
  BogoBulkImportResult
} from '../../types/bogo';
import { 
  BogoError,
  BogoErrorCode,
  BogoPromotionStatus
} from '../../types/bogo';

/**
 * BOGO Mapping Service
 * Handles CRUD operations for BOGO product mappings
 */
export class BogoMappingService {
  private static instance: BogoMappingService;
  private db: any = null;

  private constructor() {}

  public static getInstance(): BogoMappingService {
    if (!BogoMappingService.instance) {
      BogoMappingService.instance = new BogoMappingService();
    }
    return BogoMappingService.instance;
  }

  private async getDb() {
    if (!this.db) {
      this.db = await getFirebaseDb();
    }
    return this.db;
  }

  /**
   * Create a new BOGO mapping
   */
  async createMapping(data: CreateBogoMappingData, userId: string): Promise<BogoMapping> {
    try {
      const db = await this.getDb();
      
      // Validate the mapping data
      const validation = await this.validateMapping(data);
      if (!validation.isValid) {
        throw new BogoError(
          BogoErrorCode.VALIDATION_ERROR,
          `Validation failed: ${validation.errors.join(', ')}`,
          'Please check your mapping data and try again.',
          true,
          { errors: validation.errors }
        );
      }

      // Check for duplicate mappings
      const existingMapping = await this.getActiveMapping(data.mainProductId);
      if (existingMapping) {
        throw new BogoError(
          BogoErrorCode.DUPLICATE_MAPPING,
          `Active mapping already exists for product ${data.mainProductId}`,
          'This product already has an active BOGO promotion.',
          false,
          { existingMappingId: existingMapping.id }
        );
      }

      const now = Timestamp.now();
      const mappingData: Omit<BogoMapping, 'id'> = {
        mainProductId: data.mainProductId,
        freeProductIds: data.freeProductIds,
        promotionStartDate: data.promotionStartDate instanceof Date 
          ? Timestamp.fromDate(data.promotionStartDate) 
          : data.promotionStartDate,
        promotionEndDate: data.promotionEndDate instanceof Date 
          ? Timestamp.fromDate(data.promotionEndDate) 
          : data.promotionEndDate,
        active: data.active ?? true,
        autoFreeShipping: data.autoFreeShipping ?? true,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        redemptionCount: 0,
        totalRevenue: 0,
        promotionName: data.promotionName,
        description: data.description,
        maxRedemptions: data.maxRedemptions
      };

      const docRef = await addDoc(collection(db, 'bogo_mappings'), mappingData);
      
      // Log the creation
      await this.logAuditEvent('CREATE_MAPPING', userId, docRef.id, mappingData);

      return {
        id: docRef.id,
        ...mappingData
      };
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to create BOGO mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to create promotion. Please try again.',
        true
      );
    }
  }

  /**
   * Update an existing BOGO mapping
   */
  async updateMapping(id: string, data: Partial<BogoMapping>, userId: string): Promise<void> {
    try {
      const db = await this.getDb();
      const docRef = doc(db, 'bogo_mappings', id);
      
      // Check if mapping exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new BogoError(
          BogoErrorCode.MAPPING_NOT_FOUND,
          `BOGO mapping with ID ${id} not found`,
          'The promotion you are trying to update does not exist.',
          false
        );
      }

      // Validate update data if it includes mapping fields
      if (data.mainProductId || data.freeProductIds || data.promotionStartDate || data.promotionEndDate) {
        const currentData = docSnap.data() as BogoMapping;
        const updateData: CreateBogoMappingData = {
          mainProductId: data.mainProductId || currentData.mainProductId,
          freeProductIds: data.freeProductIds || currentData.freeProductIds,
          promotionStartDate: data.promotionStartDate || currentData.promotionStartDate,
          promotionEndDate: data.promotionEndDate || currentData.promotionEndDate,
          active: data.active ?? currentData.active,
          autoFreeShipping: data.autoFreeShipping ?? currentData.autoFreeShipping
        };

        const validation = await this.validateMapping(updateData);
        if (!validation.isValid) {
          throw new BogoError(
            BogoErrorCode.VALIDATION_ERROR,
            `Validation failed: ${validation.errors.join(', ')}`,
            'Please check your mapping data and try again.',
            true,
            { errors: validation.errors }
          );
        }
      }

      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
      
      // Log the update
      await this.logAuditEvent('UPDATE_MAPPING', userId, id, updateData);
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to update BOGO mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to update promotion. Please try again.',
        true
      );
    }
  }

  /**
   * Delete a BOGO mapping
   */
  async deleteMapping(id: string, userId: string): Promise<void> {
    try {
      const db = await this.getDb();
      const docRef = doc(db, 'bogo_mappings', id);
      
      // Check if mapping exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new BogoError(
          BogoErrorCode.MAPPING_NOT_FOUND,
          `BOGO mapping with ID ${id} not found`,
          'The promotion you are trying to delete does not exist.',
          false
        );
      }

      await deleteDoc(docRef);
      
      // Log the deletion
      await this.logAuditEvent('DELETE_MAPPING', userId, id, { deleted: true });
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to delete BOGO mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to delete promotion. Please try again.',
        true
      );
    }
  }

  /**
   * Get a BOGO mapping by ID
   */
  async getMapping(id: string): Promise<BogoMapping | null> {
    try {
      const db = await this.getDb();
      const docRef = doc(db, 'bogo_mappings', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as BogoMapping;
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to get BOGO mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to load promotion data.',
        true
      );
    }
  }

  /**
   * Get active BOGO mapping for a main product
   */
  async getActiveMapping(productId: string): Promise<BogoMapping | null> {
    try {
      const db = await this.getDb();
      const now = Timestamp.now();
      
      const q = query(
        collection(db, 'bogo_mappings'),
        where('mainProductId', '==', productId),
        where('active', '==', true),
        where('promotionStartDate', '<=', now),
        where('promotionEndDate', '>', now)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      // Return the first active mapping (there should only be one per product)
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as BogoMapping;
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to get active mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to check for active promotions.',
        true
      );
    }
  }

  /**
   * Get all BOGO mappings with optional filters
   */
  async getAllMappings(filters?: BogoMappingFilters): Promise<BogoMapping[]> {
    try {
      const db = await this.getDb();
      const constraints: QueryConstraint[] = [];

      // Apply filters
      if (filters?.active !== undefined) {
        constraints.push(where('active', '==', filters.active));
      }
      if (filters?.mainProductId) {
        constraints.push(where('mainProductId', '==', filters.mainProductId));
      }
      if (filters?.freeProductId) {
        constraints.push(where('freeProductIds', 'array-contains', filters.freeProductId));
      }
      if (filters?.createdBy) {
        constraints.push(where('createdBy', '==', filters.createdBy));
      }
      if (filters?.startDate) {
        constraints.push(where('promotionStartDate', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        constraints.push(where('promotionEndDate', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Apply ordering
      const orderField = filters?.orderBy || 'createdAt';
      const orderDirection = filters?.orderDirection || 'desc';
      constraints.push(orderBy(orderField, orderDirection));

      // Apply limit
      if (filters?.limit) {
        constraints.push(firestoreLimit(filters.limit));
      }

      const q = query(collection(db, 'bogo_mappings'), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BogoMapping));
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to get mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to load promotions.',
        true
      );
    }
  }

  /**
   * Bulk import BOGO mappings from array
   */
  async bulkImportMappings(mappings: CreateBogoMappingData[], userId: string): Promise<BogoBulkImportResult> {
    const result: BogoBulkImportResult = {
      success: false,
      totalProcessed: mappings.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      warnings: []
    };

    try {
      const db = await this.getDb();
      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (let i = 0; i < mappings.length; i++) {
        const mappingData = mappings[i];
        
        try {
          // Validate each mapping
          const validation = await this.validateMapping(mappingData);
          if (!validation.isValid) {
            result.errors.push({
              row: i + 1,
              error: `Validation failed: ${validation.errors.join(', ')}`,
              data: mappingData
            });
            result.errorCount++;
            continue;
          }

          // Check for duplicates
          const existingMapping = await this.getActiveMapping(mappingData.mainProductId);
          if (existingMapping) {
            result.warnings.push({
              row: i + 1,
              warning: `Product ${mappingData.mainProductId} already has an active mapping`,
              data: mappingData
            });
          }

          // Create the mapping document
          const docRef = doc(collection(db, 'bogo_mappings'));
          const bogoMapping: Omit<BogoMapping, 'id'> = {
            mainProductId: mappingData.mainProductId,
            freeProductIds: mappingData.freeProductIds,
            promotionStartDate: mappingData.promotionStartDate instanceof Date 
              ? Timestamp.fromDate(mappingData.promotionStartDate) 
              : mappingData.promotionStartDate,
            promotionEndDate: mappingData.promotionEndDate instanceof Date 
              ? Timestamp.fromDate(mappingData.promotionEndDate) 
              : mappingData.promotionEndDate,
            active: mappingData.active ?? true,
            autoFreeShipping: mappingData.autoFreeShipping ?? true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            redemptionCount: 0,
            totalRevenue: 0,
            promotionName: mappingData.promotionName,
            description: mappingData.description,
            maxRedemptions: mappingData.maxRedemptions
          };

          batch.set(docRef, bogoMapping);
          result.successCount++;
        } catch (error) {
          result.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: mappingData
          });
          result.errorCount++;
        }
      }

      // Commit the batch if there are successful mappings
      if (result.successCount > 0) {
        await batch.commit();
        
        // Log bulk import
        await this.logAuditEvent('BULK_IMPORT', userId, 'bulk', {
          totalProcessed: result.totalProcessed,
          successCount: result.successCount,
          errorCount: result.errorCount
        });
      }

      result.success = result.successCount > 0;
      return result;
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to import promotions. Please try again.',
        true
      );
    }
  }

  /**
   * Export BOGO mappings to CSV format
   */
  async exportMappingsToCSV(filters?: BogoMappingFilters): Promise<string> {
    try {
      const mappings = await this.getAllMappings(filters);
      
      // CSV headers
      const headers = [
        'ID',
        'Main Product ID',
        'Free Product IDs',
        'Promotion Start Date',
        'Promotion End Date',
        'Active',
        'Auto Free Shipping',
        'Promotion Name',
        'Description',
        'Max Redemptions',
        'Redemption Count',
        'Total Revenue',
        'Created By',
        'Created At',
        'Updated At'
      ];

      // Convert mappings to CSV rows
      const rows = mappings.map(mapping => [
        mapping.id,
        mapping.mainProductId,
        mapping.freeProductIds.join(';'),
        mapping.promotionStartDate.toDate().toISOString(),
        mapping.promotionEndDate.toDate().toISOString(),
        mapping.active.toString(),
        mapping.autoFreeShipping.toString(),
        mapping.promotionName || '',
        mapping.description || '',
        mapping.maxRedemptions?.toString() || '',
        mapping.redemptionCount.toString(),
        mapping.totalRevenue.toString(),
        mapping.createdBy,
        mapping.createdAt.toDate().toISOString(),
        mapping.updatedAt.toDate().toISOString()
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to export mappings to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to export data. Please try again.',
        true
      );
    }
  }

  /**
   * Export BOGO mappings to JSON format
   */
  async exportMappingsToJSON(filters?: BogoMappingFilters): Promise<string> {
    try {
      const mappings = await this.getAllMappings(filters);
      
      // Convert Firestore Timestamps to ISO strings for JSON serialization
      const jsonMappings = mappings.map(mapping => ({
        ...mapping,
        promotionStartDate: mapping.promotionStartDate.toDate().toISOString(),
        promotionEndDate: mapping.promotionEndDate.toDate().toISOString(),
        createdAt: mapping.createdAt.toDate().toISOString(),
        updatedAt: mapping.updatedAt.toDate().toISOString()
      }));

      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalCount: jsonMappings.length,
        mappings: jsonMappings
      }, null, 2);
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to export mappings to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to export data. Please try again.',
        true
      );
    }
  }

  /**
   * Import BOGO mappings from CSV content
   */
  async importMappingsFromCSV(csvContent: string, userId: string): Promise<BogoBulkImportResult> {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new BogoError(
          BogoErrorCode.VALIDATION_ERROR,
          'CSV file must contain at least a header row and one data row',
          'Please provide a valid CSV file with mapping data.',
          true
        );
      }

      // Parse CSV (simple implementation - for production, consider using a CSV library)
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const mappings: CreateBogoMappingData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length !== headers.length) {
          continue; // Skip malformed rows
        }

        const mapping: CreateBogoMappingData = {
          mainProductId: values[headers.indexOf('Main Product ID')] || '',
          freeProductIds: (values[headers.indexOf('Free Product IDs')] || '').split(';').filter(id => id.trim()),
          promotionStartDate: new Date(values[headers.indexOf('Promotion Start Date')] || ''),
          promotionEndDate: new Date(values[headers.indexOf('Promotion End Date')] || ''),
          active: values[headers.indexOf('Active')] === 'true',
          autoFreeShipping: values[headers.indexOf('Auto Free Shipping')] === 'true',
          promotionName: values[headers.indexOf('Promotion Name')] || undefined,
          description: values[headers.indexOf('Description')] || undefined,
          maxRedemptions: values[headers.indexOf('Max Redemptions')] ? 
            parseInt(values[headers.indexOf('Max Redemptions')]) : undefined
        };

        mappings.push(mapping);
      }

      return await this.bulkImportMappings(mappings, userId);
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to import CSV file. Please check the format and try again.',
        true
      );
    }
  }

  /**
   * Import BOGO mappings from JSON content
   */
  async importMappingsFromJSON(jsonContent: string, userId: string): Promise<BogoBulkImportResult> {
    try {
      const data = JSON.parse(jsonContent);
      
      if (!data.mappings || !Array.isArray(data.mappings)) {
        throw new BogoError(
          BogoErrorCode.VALIDATION_ERROR,
          'JSON must contain a "mappings" array',
          'Please provide a valid JSON file with mapping data.',
          true
        );
      }

      const mappings: CreateBogoMappingData[] = data.mappings.map((mapping: any) => ({
        mainProductId: mapping.mainProductId,
        freeProductIds: mapping.freeProductIds,
        promotionStartDate: new Date(mapping.promotionStartDate),
        promotionEndDate: new Date(mapping.promotionEndDate),
        active: mapping.active,
        autoFreeShipping: mapping.autoFreeShipping,
        promotionName: mapping.promotionName,
        description: mapping.description,
        maxRedemptions: mapping.maxRedemptions
      }));

      return await this.bulkImportMappings(mappings, userId);
    } catch (error) {
      if (error instanceof BogoError) {
        throw error;
      }
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to import JSON file. Please check the format and try again.',
        true
      );
    }
  }

  /**
   * Validate BOGO mapping data
   */
  async validateMapping(data: CreateBogoMappingData): Promise<BogoMappingValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!data.mainProductId) {
      errors.push('Main product ID is required');
    }
    if (!data.freeProductIds || data.freeProductIds.length === 0) {
      errors.push('At least one free product ID is required');
    }
    if (!data.promotionStartDate) {
      errors.push('Promotion start date is required');
    }
    if (!data.promotionEndDate) {
      errors.push('Promotion end date is required');
    }

    // Validate date range
    if (data.promotionStartDate && data.promotionEndDate) {
      const startDate = data.promotionStartDate instanceof Date 
        ? data.promotionStartDate 
        : data.promotionStartDate.toDate();
      const endDate = data.promotionEndDate instanceof Date 
        ? data.promotionEndDate 
        : data.promotionEndDate.toDate();

      if (startDate >= endDate) {
        errors.push('Promotion end date must be after start date');
      }

      // Warn if promotion is very short (less than 1 day)
      const duration = endDate.getTime() - startDate.getTime();
      if (duration < 24 * 60 * 60 * 1000) {
        warnings.push('Promotion duration is less than 24 hours');
      }
    }

    // Validate product IDs format (basic validation)
    if (data.mainProductId && typeof data.mainProductId !== 'string') {
      errors.push('Main product ID must be a string');
    }
    if (data.freeProductIds) {
      for (const productId of data.freeProductIds) {
        if (typeof productId !== 'string') {
          errors.push('All free product IDs must be strings');
          break;
        }
      }
    }

    // Check for self-referencing (main product cannot be in free products list)
    if (data.mainProductId && data.freeProductIds?.includes(data.mainProductId)) {
      errors.push('Main product cannot be included in free products list');
    }

    // Validate max redemptions if provided
    if (data.maxRedemptions !== undefined && data.maxRedemptions <= 0) {
      errors.push('Max redemptions must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get promotion status for a mapping
   */
  getPromotionStatus(mapping: BogoMapping): BogoPromotionStatus {
    if (!mapping.active) {
      return BogoPromotionStatus.INACTIVE;
    }

    const now = new Date();
    const startDate = mapping.promotionStartDate.toDate();
    const endDate = mapping.promotionEndDate.toDate();

    if (now < startDate) {
      return BogoPromotionStatus.NOT_STARTED;
    }
    if (now > endDate) {
      return BogoPromotionStatus.EXPIRED;
    }
    return BogoPromotionStatus.ACTIVE;
  }

  /**
   * Activate/deactivate a BOGO mapping
   */
  async toggleMappingStatus(id: string, active: boolean, userId: string): Promise<void> {
    await this.updateMapping(id, { active }, userId);
  }

  /**
   * Log audit events for BOGO operations
   */
  private async logAuditEvent(action: string, userId: string, mappingId: string, data: any): Promise<void> {
    try {
      const db = await this.getDb();
      await addDoc(collection(db, 'bogo_audit_logs'), {
        action,
        userId,
        mappingId,
        data,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      // Don't throw on audit log failures, just log the error
      console.error('Failed to log BOGO audit event:', error);
    }
  }
}

// Export singleton instance
export const bogoMappingService = BogoMappingService.getInstance();