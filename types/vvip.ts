import { Timestamp } from 'firebase/firestore';

/**
 * VVIP Shopper Program Types
 * 
 * This module defines all TypeScript interfaces and types for the VVIP Shopper Program,
 * which enables selected high-value customers to shop with manual payment confirmation.
 */

// ============================================================================
// Role-Based Permission Types
// ============================================================================

/**
 * VVIP Role Types
 * Defines the hierarchy of roles that can interact with VVIP features
 */
export type VvipRole = 'super_admin' | 'bdm' | 'team_lead' | 'team_member' | 'none';

/**
 * Role Permissions Structure
 * Defines what actions each role can perform
 */
export interface RolePermissions {
  super_admin: {
    create: true;
    edit: true;
    revoke: true;
    view: true;
    approve: true;
  };
  bdm: {
    create: true;
    edit: true;
    revoke: false;
    view: true;
    approve: true;
  };
  team_lead: {
    create: true;
    edit: true;
    revoke: false;
    view: true;
    approve: false;
  };
  team_member: {
    create: false;
    edit: false;
    revoke: false;
    view: true;
    approve: false;
  };
}

// ============================================================================
// User Document Extensions
// ============================================================================

/**
 * VVIP User Fields
 * Extension fields added to existing user documents when VVIP status is granted
 * Requirements: 9.1, 9.2, 9.3
 */
export interface VvipUserFields {
  isVvip: boolean;
  vvip_created_by: string;
  vvip_created_at: Timestamp;
}

/**
 * VVIP Shopper
 * Complete user information for VVIP shoppers displayed in lists
 */
export interface VvipShopper {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  isVvip: boolean;
  vvip_created_by: string;
  vvip_created_at: Timestamp;
  createdByName?: string; // Populated from admin user lookup
}

/**
 * VVIP Filters
 * Filter options for VVIP shopper lists
 */
export interface VvipFilters {
  country?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  createdBy?: string;
  searchQuery?: string;
}

// ============================================================================
// Order Document Extensions
// ============================================================================

/**
 * Payment Status
 * Status of manual payment verification
 */
export type PaymentStatus = 'pending_verification' | 'approved' | 'rejected';

/**
 * Order Status
 * Extended order status including VVIP-specific states
 */
export type VvipOrderStatus = 'pending' | 'processing' | 'payment_failed' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Payment Method
 * Payment methods including manual transfer for VVIP
 */
export type PaymentMethod = 'manual_transfer' | 'paystack' | 'stripe' | 'flutterwave';

/**
 * VVIP Order Fields
 * Extension fields added to order documents for VVIP orders
 * Requirements: 9.5, 9.6, 9.7, 9.8, 9.9
 */
export interface VvipOrderFields {
  payment_method: PaymentMethod;
  isVvip: boolean;
  payment_status: PaymentStatus;
  payment_proof_url: string;
  amount_paid: number;
  payment_reference?: string;
  payment_date: Timestamp;
  order_status: VvipOrderStatus;
  admin_note?: string;
  payment_verified_by?: string;
  payment_verified_at?: Timestamp;
}

/**
 * VVIP Order
 * Complete order information for VVIP orders
 */
export interface VvipOrder {
  orderId: string;
  userId: string;
  payment_method: 'manual_transfer';
  isVvip: true;
  payment_status: PaymentStatus;
  payment_proof_url: string;
  amount_paid: number;
  payment_reference?: string;
  payment_date: Timestamp;
  order_status: VvipOrderStatus;
  admin_note?: string;
  payment_verified_by?: string;
  payment_verified_at?: Timestamp;
  created_at: Timestamp;
  updated_at?: Timestamp;
  // Standard order fields
  items?: any[];
  total?: number;
  shipping_address?: any;
  user_email?: string;
  user_name?: string;
}

/**
 * Order Filters
 * Filter options for VVIP order lists
 */
export interface OrderFilters {
  payment_status?: PaymentStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * VVIP Action Types
 * All actions that can be performed on VVIP users and orders
 */
export type VvipActionType = 
  | 'vvip_created' 
  | 'vvip_revoked' 
  | 'payment_approved' 
  | 'payment_rejected';

/**
 * VVIP Action
 * Audit log entry for VVIP actions
 */
export interface VvipAction {
  action_type: VvipActionType;
  performed_by: string;
  affected_user: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Audit Log Document
 * Complete audit log entry stored in Firestore
 */
export interface AuditLogDocument {
  logId: string;
  action_type: VvipActionType;
  performed_by: string;
  performed_by_email: string;
  affected_user: string;
  affected_user_email: string;
  timestamp: Timestamp;
  metadata: {
    orderId?: string;
    admin_note?: string;
    previous_status?: string;
    new_status?: string;
    [key: string]: any;
  };
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * VVIP Result
 * Standard response format for VVIP operations
 */
export interface VvipResult {
  success: boolean;
  message: string;
  userId?: string;
  data?: any;
}

/**
 * Order Result
 * Standard response format for order operations
 */
export interface OrderResult {
  success: boolean;
  message: string;
  orderId?: string;
  data?: any;
}

/**
 * Validation Result
 * Result of validation operations
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// Checkout Types
// ============================================================================

/**
 * Bank Details
 * Bank account information displayed to VVIP users
 */
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  sortCode?: string;
  swiftCode?: string;
  iban?: string;
}

/**
 * VVIP Order Data
 * Data required to create a VVIP order
 */
export interface VvipOrderData {
  userId: string;
  items: any[];
  amount_paid: number;
  payment_reference?: string;
  payment_date: Date;
  payment_proof_url: string;
  shipping_address: any;
  total?: number;
  currency?: string;
}

/**
 * Payment Proof Upload Result
 */
export interface PaymentProofUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

/**
 * VVIP Shopper Card Props
 */
export interface VvipShopperCardProps {
  shopper: VvipShopper;
  userRole: VvipRole;
  onViewProfile?: (userId: string) => void;
  onRevokeVvip?: (userId: string) => void;
}

/**
 * VVIP Order Card Props
 */
export interface VvipOrderCardProps {
  order: VvipOrder;
  userRole: VvipRole;
  onApprove?: (orderId: string, note?: string) => void;
  onReject?: (orderId: string, note: string) => void;
  onViewProof?: (proofUrl: string) => void;
}

/**
 * Payment Proof Viewer Props
 */
export interface PaymentProofViewerProps {
  proofUrl: string;
  orderId: string;
  onClose: () => void;
}

/**
 * User Search Form Props
 */
export interface UserSearchFormProps {
  onUserSelected: (userId: string) => void;
  searchType: 'email' | 'userId';
}

/**
 * VVIP Filters Props
 */
export interface VvipFiltersProps {
  filters: VvipFilters;
  onFiltersChange: (filters: VvipFilters) => void;
  availableCountries?: string[];
  availableCreators?: Array<{ id: string; name: string }>;
}

/**
 * Manual Payment Form Props
 */
export interface ManualPaymentFormProps {
  bankDetails: BankDetails;
  onSubmit: (data: ManualPaymentFormData) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Manual Payment Form Data
 */
export interface ManualPaymentFormData {
  amount_paid: number;
  payment_reference?: string;
  payment_date: Date;
  payment_proof: File;
}

/**
 * Payment Proof Upload Props
 */
export interface PaymentProofUploadProps {
  onFileSelected: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeInMB?: number;
  error?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create VVIP Request
 */
export interface CreateVvipRequest {
  userId: string;
}

/**
 * Create VVIP Response
 */
export interface CreateVvipResponse {
  success: boolean;
  message: string;
  userId: string;
  vvip_created_at: string;
}

/**
 * Revoke VVIP Request
 */
export interface RevokeVvipRequest {
  userId: string;
  reason?: string;
}

/**
 * Revoke VVIP Response
 */
export interface RevokeVvipResponse {
  success: boolean;
  message: string;
  userId: string;
}

/**
 * Search Users Request
 */
export interface SearchUsersRequest {
  query: string;
  searchType: 'email' | 'userId';
}

/**
 * Search Users Response
 */
export interface SearchUsersResponse {
  success: boolean;
  users: Array<{
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isVvip?: boolean;
  }>;
}

/**
 * Get VVIP Shoppers Request
 */
export interface GetVvipShoppersRequest {
  filters?: VvipFilters;
  page?: number;
  limit?: number;
}

/**
 * Get VVIP Shoppers Response
 */
export interface GetVvipShoppersResponse {
  success: boolean;
  shoppers: VvipShopper[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get VVIP Orders Request
 */
export interface GetVvipOrdersRequest {
  filters?: OrderFilters;
  page?: number;
  limit?: number;
}

/**
 * Get VVIP Orders Response
 */
export interface GetVvipOrdersResponse {
  success: boolean;
  orders: VvipOrder[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Approve Payment Request
 */
export interface ApprovePaymentRequest {
  orderId: string;
  admin_note?: string;
}

/**
 * Approve Payment Response
 */
export interface ApprovePaymentResponse {
  success: boolean;
  message: string;
  orderId: string;
  payment_status: 'approved';
  order_status: 'processing';
}

/**
 * Reject Payment Request
 */
export interface RejectPaymentRequest {
  orderId: string;
  admin_note: string;
}

/**
 * Reject Payment Response
 */
export interface RejectPaymentResponse {
  success: boolean;
  message: string;
  orderId: string;
  payment_status: 'rejected';
  order_status: 'payment_failed';
}

/**
 * Upload Payment Proof Request
 */
export interface UploadPaymentProofRequest {
  file: File;
  userId: string;
  orderId?: string;
}

/**
 * Upload Payment Proof Response
 */
export interface UploadPaymentProofResponse {
  success: boolean;
  url: string;
  message?: string;
}

/**
 * Create VVIP Order Request
 */
export interface CreateVvipOrderRequest {
  orderData: VvipOrderData;
}

/**
 * Create VVIP Order Response
 */
export interface CreateVvipOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  order_status: 'pending';
  payment_status: 'pending_verification';
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * VVIP Error Codes
 */
export enum VvipErrorCode {
  UNAUTHORIZED = 'VVIP_UNAUTHORIZED',
  VALIDATION_ERROR = 'VVIP_VALIDATION_ERROR',
  INVALID_STATE = 'VVIP_INVALID_STATE',
  UPLOAD_FAILED = 'VVIP_UPLOAD_FAILED',
  DATABASE_ERROR = 'VVIP_DATABASE_ERROR',
  USER_NOT_FOUND = 'VVIP_USER_NOT_FOUND',
  ORDER_NOT_FOUND = 'VVIP_ORDER_NOT_FOUND',
  ALREADY_VVIP = 'VVIP_ALREADY_VVIP',
  NOT_VVIP = 'VVIP_NOT_VVIP',
  INVALID_FILE_TYPE = 'VVIP_INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'VVIP_FILE_TOO_LARGE',
}

/**
 * VVIP Error
 * Custom error class for VVIP operations
 */
export class VvipError extends Error {
  code: VvipErrorCode;
  statusCode: number;
  field?: string;

  constructor(code: VvipErrorCode, message: string, statusCode: number = 400, field?: string) {
    super(message);
    this.name = 'VvipError';
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
  }
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * VVIP Notification Event Types
 */
export type VvipNotificationEvent = 
  | 'vvip_created'
  | 'order_placed'
  | 'payment_approved'
  | 'payment_rejected'
  | 'order_shipped';

/**
 * VVIP Notification Data
 * Structured by event type for type safety
 */
export interface VvipNotificationData {
  vvip_created: {
    userId: string;
    userEmail: string;
    userName: string;
  };
  order_placed: {
    userId: string;
    userEmail: string;
    userName: string;
    orderId: string;
    orderDate: string;
    items: Array<{
      title: string;
      quantity: number;
      price: number;
      image?: string;
    }>;
    total: number;
    currency?: string;
    amountPaid: number;
    paymentReference?: string;
    paymentDate: string;
  };
  payment_approved: {
    userId: string;
    userEmail: string;
    userName: string;
    orderId: string;
    amountPaid: number;
    currency?: string;
    paymentReference?: string;
    adminNote?: string;
  };
  payment_rejected: {
    userId: string;
    userEmail: string;
    userName: string;
    orderId: string;
    amountPaid: number;
    currency?: string;
    paymentReference?: string;
    rejectionReason: string;
    adminNote?: string;
  };
  order_shipped: {
    userId: string;
    userEmail: string;
    userName: string;
    orderId: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    trackingUrl?: string;
  };
}

/**
 * VVIP Notification Result
 */
export interface VvipNotificationResult {
  success: boolean;
  message: string;
  event: VvipNotificationEvent;
  error?: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * VVIP Statistics
 * Dashboard statistics for VVIP program
 */
export interface VvipStatistics {
  totalVvipShoppers: number;
  activeVvipShoppers: number;
  totalVvipOrders: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  
  // Time-based metrics
  ordersThisMonth: number;
  ordersThisWeek: number;
  ordersToday: number;
  revenueThisMonth: number;
  
  // Growth metrics
  orderGrowth: number;
  revenueGrowth: number;
  
  // Additional insights
  customerSatisfaction: number;
  repeatCustomerRate: number;
  averageProcessingTime: number;
  
  // Breakdowns
  paymentMethods: Record<string, number>;
  countries: Record<string, number>;
}

/**
 * VVIP Analytics Data
 */
export interface VvipAnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  statistics: VvipStatistics;
  trends: {
    newVvipShoppers: number[];
    ordersPlaced: number[];
    paymentsApproved: number[];
    revenue: number[];
  };
  topCountries: Array<{
    country: string;
    count: number;
    revenue: number;
  }>;
}
