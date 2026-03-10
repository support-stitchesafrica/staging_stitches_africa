// BOGO (Buy One Get One Free) promotion system types
import { Timestamp } from 'firebase/firestore';

/**
 * BOGO Mapping - Links main products to free products with promotion rules
 */
export interface BogoMapping {
  id: string;
  mainProductId: string;
  freeProductIds: string[]; // Array to support multiple free product options
  promotionStartDate: Timestamp;
  promotionEndDate: Timestamp;
  active: boolean;
  autoFreeShipping: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Analytics fields
  redemptionCount: number;
  totalRevenue: number;
  
  // Optional metadata
  promotionName?: string;
  description?: string;
  maxRedemptions?: number; // Optional limit on total redemptions
}

/**
 * Data for creating a new BOGO mapping
 */
export interface CreateBogoMappingData {
  mainProductId: string;
  freeProductIds: string[];
  promotionStartDate: Date | Timestamp;
  promotionEndDate: Date | Timestamp;
  active?: boolean;
  autoFreeShipping?: boolean;
  promotionName?: string;
  description?: string;
  maxRedemptions?: number;
}

/**
 * Extended CartItem interface with BOGO-specific fields
 */
export interface BogoCartItem {
  // Existing CartItem fields would be included via intersection
  // BOGO-specific fields
  isBogoFree?: boolean;
  bogoMainProductId?: string; // Links free product to its main product
  bogoMappingId?: string;
  bogoPromotionName?: string;
  bogoOriginalPrice?: number; // Original price before BOGO discount
}

/**
 * Extended Order interface with BOGO-specific fields
 */
export interface BogoOrderData {
  // BOGO-specific fields for orders
  bogoItems?: {
    mainProductId: string;
    freeProductId: string;
    mappingId: string;
    savingsAmount: number;
  }[];
  bogoFreeShipping?: boolean;
  bogoShippingSavings?: number;
  totalBogoSavings?: number;
}

/**
 * BOGO Analytics data structure
 */
export interface BogoAnalytics {
  mappingId: string;
  mainProductId: string;
  mainProductName: string;
  
  // Redemption metrics
  totalRedemptions: number;
  uniqueCustomers: number;
  
  // Revenue metrics
  totalRevenue: number;
  averageOrderValue: number;
  
  // Product metrics
  freeProductDistribution: {
    productId: string;
    productName: string;
    count: number;
    percentage: number;
  }[];
  
  // Time-based metrics
  redemptionsByDate: {
    date: string;
    count: number;
  }[];
  
  // Conversion metrics
  viewsToRedemptions: number;
  conversionRate: number;
  
  // Metadata
  lastUpdated: Timestamp;
  periodStart: Timestamp;
  periodEnd: Timestamp;
}

/**
 * Free Product Selection Modal data
 */
export interface FreeProductSelectionModal {
  mainProductId: string;
  mainProductName: string;
  freeProducts: {
    productId: string;
    name: string; // Truncated to 50 characters
    thumbnail: string;
    availability: 'in_stock' | 'low_stock' | 'out_of_stock';
    description?: string;
    originalPrice?: number;
  }[];
  onSelect: (productId: string) => void;
  onCancel: () => void;
}

/**
 * BOGO mapping validation result
 */
export interface BogoMappingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * BOGO mapping filters for queries
 */
export interface BogoMappingFilters {
  active?: boolean;
  mainProductId?: string;
  freeProductId?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'promotionStartDate' | 'promotionEndDate';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Bulk import result for BOGO mappings
 */
export interface BogoBulkImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: {
    row: number;
    error: string;
    data?: Partial<CreateBogoMappingData>;
  }[];
  warnings: {
    row: number;
    warning: string;
    data?: Partial<CreateBogoMappingData>;
  }[];
}

/**
 * BOGO cart update result
 */
export interface BogoCartUpdateResult {
  success: boolean;
  freeProductAdded?: boolean;
  freeProductId?: string;
  requiresSelection?: boolean;
  availableFreeProducts?: string[];
  error?: string;
  shippingUpdated?: boolean;
  quantityUpdated?: boolean;
  newQuantity?: number;
  itemsToRemove?: string[];
}

/**
 * BOGO dashboard data
 */
export interface BogoDashboardData {
  activeMappings: number;
  totalRedemptions: number;
  totalRevenue: number;
  topPerformingMappings: {
    mappingId: string;
    mainProductName: string;
    redemptions: number;
    revenue: number;
  }[];
  recentActivity: {
    date: string;
    redemptions: number;
    revenue: number;
  }[];
  upcomingExpirations: {
    mappingId: string;
    mainProductName: string;
    expiresAt: Date;
  }[];
}

/**
 * BOGO product badge types
 */
export type BogoProductBadgeType = 'main_product' | 'free_product' | 'none';

export interface BogoProductBadge {
  type: BogoProductBadgeType;
  text: string;
  className?: string;
  associatedProducts?: string[]; // For main products, list of free products
  mainProduct?: string; // For free products, the main product ID
}

/**
 * BOGO service error types
 */
export class BogoError extends Error {
  constructor(
    public code: string,
    public message: string,
    public userMessage: string,
    public recoverable: boolean,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BogoError';
  }
}

/**
 * BOGO error codes
 */
export enum BogoErrorCode {
  MAPPING_NOT_FOUND = 'MAPPING_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  PROMOTION_EXPIRED = 'PROMOTION_EXPIRED',
  PROMOTION_NOT_STARTED = 'PROMOTION_NOT_STARTED',
  FREE_PRODUCT_OUT_OF_STOCK = 'FREE_PRODUCT_OUT_OF_STOCK',
  MAIN_PRODUCT_OUT_OF_STOCK = 'MAIN_PRODUCT_OUT_OF_STOCK',
  MAPPING_INACTIVE = 'MAPPING_INACTIVE',
  DUPLICATE_MAPPING = 'DUPLICATE_MAPPING',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * BOGO promotion status
 */
export enum BogoPromotionStatus {
  NOT_STARTED = 'not_started',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INACTIVE = 'inactive'
}

/**
 * BOGO cart operation types
 */
export enum BogoCartOperation {
  ADD_MAIN_PRODUCT = 'add_main_product',
  ADD_FREE_PRODUCT = 'add_free_product',
  REMOVE_MAIN_PRODUCT = 'remove_main_product',
  REMOVE_FREE_PRODUCT = 'remove_free_product',
  UPDATE_QUANTITY = 'update_quantity',
  SELECT_FREE_PRODUCT = 'select_free_product'
}