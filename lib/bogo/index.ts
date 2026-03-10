// BOGO System - Main exports
export { bogoMappingService } from './mapping-service';
export { bogoCartService } from './cart-service';
export { bogoBadgeService } from './badge-service';
export { bogoProductService } from './product-service';

// Re-export types
export type {
  BogoMapping,
  CreateBogoMappingData,
  BogoCartItem,
  BogoOrderData,
  BogoAnalytics,
  FreeProductSelectionModal,
  BogoMappingValidationResult,
  BogoMappingFilters,
  BogoBulkImportResult,
  BogoCartUpdateResult,
  BogoDashboardData,
  BogoProductBadge,
  BogoProductBadgeType,
  BogoError,
  BogoErrorCode,
  BogoPromotionStatus,
  BogoCartOperation,
} from '../types/bogo';