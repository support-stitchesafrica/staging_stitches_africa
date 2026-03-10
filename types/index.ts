/* eslint-disable @typescript-eslint/no-explicit-any */
// Core data models for the fashion e-commerce platform
export interface Product {
  product_id: string;
  title: string;
  description: string;
  type: 'ready-to-wear' | 'bespoke';
  category: string;

  availability: 'in_stock' | 'pre_order' | 'out_of_stock';
  status: 'verified' | 'pending' | 'draft' | 'archived';

  price: {
    base: number;
    currency: string;
    discount?: number;
  };

  discount: number;
  deliveryTimeline: string;
  returnPolicy: string;

  // ======== Ready-to-Wear (RTW) Specific ========
  rtwOptions?: {
    sizes: Array<string | { label: string; quantity: number }>;
    colors?: string[];
    fabric?: string;
    season?: string;
  };

  // ======== Bespoke Specific ========
  bespokeOptions?: {
    customization?: Record<string, any>;
    fabricChoices?: string[];
    finishingOptions?: string[];
    styleOptions?: string[];
    measurementsRequired?: string[];
    productionTime?: string;
    careInstructions?: string;
    depositAllowed?: boolean;
    notesEnabled?: boolean;
  };

  // ======== Shipping & Logistics ========
  shipping?: {
    actualWeightKg: number;
    heightCm: number;
    lengthCm: number;
    widthCm: number;
    manualOverride: boolean;
    tierKey: string;
  };

  // ======== User Sizes (for orders) ========
  userSizes?: {
    size: string;
    quantity: number;
  }[];

  userCustomSizes?: boolean | any[];

  customSizes?: boolean;
  wear_category?: string;
  wear_quantity?: number;

  // ======== Media ========
  images: string[];
  thumbnail?: string;
  videoUrl?: string;

  // ======== Vendor / Tailor Info ========
  tailor_id: string;
  tailor: string;
  vendor?: {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    location?: string;
  };

  // ======== Metadata & Tags ========
  tags: string[];
  keywords?: string[];
  featured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;

  // ======== SEO ========
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // ======== Audit Fields ========
  createdAt?: string;        // ISO string from Firestore
  updatedAt?: string;        // ISO string from Firestore
  created_at?: any;          // Firestore timestamp
  updated_at?: any;          // Firestore timestamp

  // ======== Control Fields ========
  isPublished?: boolean;
  
  // ======== Multiple Pricing Fields ========
  enableMultiplePricing?: boolean;
  individualItems?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];

  // ======== Size Guide ========
  metric_size_guide?: SizeGuide;

  // ======== Stock Exemption ========
  /** When true, skip all stock/availability checks (e.g. for collection products) */
  skipStockCheck?: boolean;
}

export interface SizeGuideColumn {
  id: string;
  label: string;
}

export interface SizeGuideRow {
  sizeLabel: string;
  values: Record<string, string>;
}

export interface SizeGuide {
  columns: SizeGuideColumn[];
  rows: SizeGuideRow[];
}



export interface User {
  uid: string;
  email: string;
  displayName?: string;
  measurements?: {
    [key: string]: number; // chest, waist, hip, etc.
  };
  addresses: UserAddress[];
  preferences: {
    categories: string[];
    brands: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  registration_country?: string;
  registration_state?: string;
  createdAt: Date;
  lastLoginAt: Date;
  is_tailor?: boolean;
  onboardingStatus: {
    measurementsCompleted: boolean;
    profileCompleted: boolean;
    firstLoginCompleted: boolean;
  };
  preferences: {
    gender?: 'man' | 'woman';
    productType?: 'bespoke' | 'ready-to-wear' | 'both';
    skipMeasurements?: boolean;
    categories?: string[];
    brands?: string[];
    priceRange?: {
      min: number;
      max: number;
    };
  };
  metadata: {
    isFirstTimeUser: boolean;
    hasCompletedOnboarding: boolean;
    onboardingStep: 'pending' | 'measurements' | 'completed';
    loginCount: number;
    isGuestCheckout?: boolean;
    guestCreatedAt?: Date;
    guestPassword?: string | null; // Temporary field, cleaned after email sent
  };
  
  // VVIP fields (optional)
  isVvip?: boolean;
  vvip_created_by?: string;
  vvip_created_at?: Date;
}

export interface UserStatus {
  isFirstTime: boolean;
  hasCompletedMeasurements: boolean;
  lastLoginDate: Date;
  onboardingStep: 'pending' | 'measurements' | 'completed';
}

export interface UserAddress {
  id?: string;
  first_name: string;
  last_name: string;
  flat_number?: string;
  street_address: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  dial_code: string;
  phone_number: string;
  post_code?: string;
  is_default: boolean;
  label?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  selectedOptions?: {
    size?: string;
    color?: string;
    customizations?: Record<string, any>;
  };
  price: number;
}

export interface UserOrder {
  id?: string;
  order_id: string;
  product_order_ref: string;
  user_id: string;
  product_id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  quantity: number;
  size?: string;
  wear_category?: string;
  tailor_id: string;
  tailor_name?: string;
  delivery_type: string;
  delivery_date?: string;
  order_status: string;
  shipping_fee: number;
  wallet_amount_moved?: number;
  wallet_processed?: boolean;
  wallet_processed_at?: Date;
  shipping: {
    carrier: string;
    createdAt: Date;
  };
  pickup?: Record<string, any>;
  timeline?: Array<{
    actor: string;
    description: string;
    location: string;
    occurredAt: string;
    status: string;
  }>;
  dhl_events_snapshot?: any[];
  last_dhl_event?: Record<string, any>;
  documents?: Array<{
    typeCode: string;
    gsPath: string;
    url: string;
  }>;
  packages?: Array<{
    referenceNumber: number;
    trackingNumber: string;
    trackingUrl: string;
  }>;
  user_address: {
    first_name: string;
    last_name: string;
    street_address: string;
    city: string;
    state: string;
    country: string;
    country_code: string;
    dial_code: string;
    phone_number: string;
    post_code?: string;
  };
  createdAt: Date;
  last_update?: Date;
  timestamp?: Date;
  // Collection order fields
  isCollectionOrder?: boolean;
  collectionId?: string; // Legacy
  collection_id?: string;
  collectionName?: string; // Legacy
  collection_name?: string;
  exemptedProducts?: string[]; // Product IDs that were exempted from the collection order

  // Promotional
  is_promotional?: boolean;
  promotional_event_id?: string;
  promotional_event_name?: string;
  promotional_discount_percentage?: number;
  total_discount_percentage?: number;
  promotional_expiry_date?: Date;
  promotional_discount_cost?: number;

  // BOGO
  is_bogo_item?: boolean;
  bogo_type?: string;
  bogo_main_product_id?: string;

  // Coupon
  coupon_code?: string;
  coupon_value?: number;
  coupon_currency?: string;

  // Source Pricing
  source_price?: number;
  source_currency?: string;

  // Duty & Tax
  original_price?: number;
  duty_charge?: number;
  platform_commission?: number;
  tax?: number;
  tax_currency?: string;
  user_email?: string;
  payment_provider?: string;
  currency?: string;
  user_measurement?: any;
}

export interface CartItem {
  id?: string;
  product_id: string;
  title: string;
  description: string;
  type?: 'ready-to-wear' | 'bespoke'; // Product type for measurements check
  price: number;
  originalPrice: number; // Raw vendor price (before duty and discount)
  dutyCharge: number; // Calculated duty amount
  platform_commission?: number; // Platform commission amount
  discount: number;
  quantity: number;
  color: string | null;
  size: string | null;
  sizes: string[] | null;
  images: string[];
  tailor_id: string;
  tailor: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
  // Source price info to prevent double conversion verification
  sourcePrice?: number;   // The original price in the source currency
  sourceCurrency?: string; // The source currency code (e.g., "NGN", "USD")
  sourcePlatformCommission?: number; // Platform commission in source currency
  sourceOriginalPrice?: number; // Original vendor price in source currency
  // Optional product reference for detailed info
  product?: Product;
  
  // Collection cart fields
  isCollectionItem?: boolean;
  collectionId?: string;
  collectionName?: string;
  isRemovable?: boolean; // For collection items, this is false
  isExempted?: boolean; // If out of stock and exempted from order
  availableSizes?: string[]; // Available sizes for selection
  availableColors?: string[]; // Available colors for selection
  
  // Individual item fields (for multiple pricing products)
  isIndividualItem?: boolean; // If this is an individual item from a multiple pricing product
  individualItemId?: string; // ID of the individual item
  individualItemName?: string; // Name of the individual item
  
  // Promotional cart fields
  isPromotional?: boolean; // If this is a promotional product
  promotionalEventId?: string; // ID of the promotional event
  promotionalEventName?: string; // Name of the promotional event
  // originalPrice removed - defined in main properties
  discountPercentage?: number; // Discount percentage (e.g., 20 for 20%)
  discountedPrice?: number; // Price after discount (same as price for promotional items)
  promotionalEndDate?: Date; // When the promotion ends
  
  // BOGO-specific fields
  isBogoFree?: boolean; // If this is a free product from BOGO promotion
  bogoMainProductId?: string; // Links free product to its main product
  bogoMappingId?: string; // ID of the BOGO mapping that created this item
  bogoPromotionName?: string; // Name of the BOGO promotion
  bogoOriginalPrice?: number; // Original price before BOGO discount (for free items)
  
  // Storefront context fields
  storefrontContext?: {
    storefrontId?: string;
    storefrontHandle?: string;
    source: 'storefront';
  };
  
  // General promotional pricing fields
  promotionalPricing?: {
    originalPrice: number;
    discountedPrice: number;
    promotionId: string;
    promotionName: string;
  };
}

// Legacy Order interface for backward compatibility
export interface Order {
  id?: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'production' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  shippingAddress: UserAddress;
  paymentDetails: {
    method: string;
    transactionId: string;
    status: 'pending' | 'completed' | 'failed';
  };
  tracking?: {
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Promotional order fields
  promotionalItems?: Array<{
    eventId: string;
    eventName: string;
    productId: string;
    originalPrice: number;
    discountedPrice: number;
    savings: number;
    discountPercentage: number;
  }>;
  totalPromotionalSavings?: number;
}

export interface WishlistItem {
  id?: string;
  product_id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  images: string[];
  is_saved: boolean;
  size: string | null;
  sizes: string[] | null;
  tailor_id: string;
  tailor: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export navigation types
export type { NavItem, NavigationConfig, NavigationVisibilityState, AuthState } from './navigation';

export interface Tailor {
  id: string;
  brandName: string;
  brand_logo: string;
  first_name: string;
  last_name: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  ratings: number;
  yearsOfExperience: number;
  type: string[];
  featured_works: string[];
  status: string;
}
// Re-export collections types
export type {
  CanvasElementType,
  CanvasElement,
  CanvasState,
  ProductCollection,
  Template,
  CollectionsUser,
  ProductSelectionState,
  ProductFilters,
  CanvasEditorState,
  CollectionFormData,
  ProductCollectionData,
  CollectionProduct,
  ProductFormData,
  CollectionProductData
} from './collections';

// Re-export collections invitation types
export type {
  InvitationStatus,
  CollectionsRole,
  CollectionsInvitation,
  CreateCollectionsInvitationData,
  CollectionsInvitationValidationResult,
  AcceptCollectionsInvitationData,
  CollectionsInvitationTokenPayload
} from './collections-invitation';

// Re-export atlas invitation types
export type {
  AtlasRole,
  AtlasInvitation,
  CreateAtlasInvitationData,
  AtlasInvitationValidationResult,
  AcceptAtlasInvitationData,
  AtlasInvitationTokenPayload
} from './atlas-invitation';

// Re-export promotional types
export type {
  PromotionalEventStatus,
  ProductDiscount,
  PromotionalBanner,
  PromotionalEvent,
  PromotionalRole,
  PromotionalUser,
  PromotionalRolePermissions,
  PromotionalInvitationStatus,
  PromotionalInvitation,
  CreatePromotionalInvitationData,
  PromotionalInvitationValidationResult,
  AcceptPromotionalInvitationData,
  PromotionalInvitationTokenPayload,
  ProductWithDiscount,
  CustomerPromotionalEvent,
  CountdownValues
} from './promotionals';

export { PROMOTIONAL_ROLE_PERMISSIONS } from './promotionals';

// Re-export BOGO types
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
  BogoProductBadgeType
} from './bogo';

export { 
  BogoError, 
  BogoErrorCode, 
  BogoPromotionStatus, 
  BogoCartOperation 
} from './bogo';

// Re-export storefront types
export type {
  StorefrontConfig,
  ThemeConfiguration,
  FontSizeConfig,
  SpacingConfig,
  StorefrontPage,
  PageSection,
  SEOMetadata,
  ProductDisplayConfig,
  PromotionalConfig,
  AnalyticsConfig,
  AnalyticsEvent,
  SocialPixelConfig,
  StorefrontTemplate,
  HandleValidationResult,
  StorefrontStats
} from './storefront';

export interface FreeGiftClaim {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postCode: string;
  createdAt: Date;
  status: 'requested' | 'shipped';
  claimedAt: Date;
  phoneNumber?: string;
}

// Re-export Tailor Storyboard types
export type {
  TailorStoryboard,
  CreateTailorStoryboardData
} from './tailor-storyboard';

// Re-export VVIP types
export type {
  VvipRole,
  RolePermissions,
  VvipUserFields,
  VvipShopper,
  VvipFilters,
  PaymentStatus,
  VvipOrderStatus,
  PaymentMethod,
  VvipOrderFields,
  VvipOrder,
  OrderFilters,
  VvipActionType,
  VvipAction,
  AuditLogDocument,
  VvipResult,
  OrderResult,
  ValidationResult,
  BankDetails,
  VvipOrderData,
  PaymentProofUploadResult,
  VvipShopperCardProps,
  VvipOrderCardProps,
  PaymentProofViewerProps,
  UserSearchFormProps,
  VvipFiltersProps,
  ManualPaymentFormProps,
  ManualPaymentFormData,
  PaymentProofUploadProps,
  CreateVvipRequest,
  CreateVvipResponse,
  RevokeVvipRequest,
  RevokeVvipResponse,
  SearchUsersRequest,
  SearchUsersResponse,
  GetVvipShoppersRequest,
  GetVvipShoppersResponse,
  GetVvipOrdersRequest,
  GetVvipOrdersResponse,
  ApprovePaymentRequest,
  ApprovePaymentResponse,
  RejectPaymentRequest,
  RejectPaymentResponse,
  UploadPaymentProofRequest,
  UploadPaymentProofResponse,
  CreateVvipOrderRequest,
  CreateVvipOrderResponse,
  VvipNotificationEvent,
  VvipNotificationData,
  VvipStatistics,
  VvipAnalyticsData
} from './vvip';

export { VvipErrorCode, VvipError } from './vvip';
