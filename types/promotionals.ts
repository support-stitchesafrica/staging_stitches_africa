import { Timestamp } from "firebase/firestore";

/**
 * Promotional event status types
 */
export type PromotionalEventStatus = "draft" | "scheduled" | "active" | "expired";

/**
 * Product with discount information
 */
export interface ProductDiscount {
  productId: string;
  discountPercentage: number; // 1-100
  originalPrice: number;
  discountedPrice: number;
  addedAt: Timestamp;
}

/**
 * Banner metadata for promotional event
 */
export interface PromotionalBanner {
  imageUrl: string;
  title?: string;
  description?: string;
  displayPercentage?: number; // For showing "Up to X% off"
  uploadedAt: Timestamp;
}

/**
 * Promotional Event interface
 */
export interface PromotionalEvent {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: PromotionalEventStatus;
  isPublished: boolean;
  products: ProductDiscount[];
  banner?: PromotionalBanner;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Promotional role types with different permission levels
 */
export type PromotionalRole = "superadmin" | "admin" | "editor";

/**
 * Promotional User interface
 */
export interface PromotionalUser {
  uid: string;
  email: string;
  fullName: string;
  role: PromotionalRole;
  isPromotionalUser: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  invitedBy?: string;
}

/**
 * Role permissions configuration for promotional system
 */
export interface PromotionalRolePermissions {
  role: PromotionalRole;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canPublishEvents: boolean;
  canManageTeam: boolean;
}

/**
 * Role permissions mapping for promotional system
 */
export const PROMOTIONAL_ROLE_PERMISSIONS: Record<PromotionalRole, PromotionalRolePermissions> = {
  superadmin: {
    role: "superadmin",
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canPublishEvents: true,
    canManageTeam: true,
  },
  admin: {
    role: "admin",
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canPublishEvents: true,
    canManageTeam: false,
  },
  editor: {
    role: "editor",
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: false,
    canPublishEvents: false,
    canManageTeam: false,
  },
};

/**
 * Promotional invitation status
 */
export type PromotionalInvitationStatus = "pending" | "accepted" | "expired";

/**
 * Promotional Invitation interface
 */
export interface PromotionalInvitation {
  id: string;
  email: string;
  role: PromotionalRole;
  token: string;
  status: PromotionalInvitationStatus;
  invitedBy: string;
  invitedByName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
}

/**
 * Data for creating a new promotional invitation
 */
export interface CreatePromotionalInvitationData {
  email: string;
  role: PromotionalRole;
  invitedBy: string;
  invitedByName: string;
}

/**
 * Promotional invitation validation result
 */
export interface PromotionalInvitationValidationResult {
  valid: boolean;
  invitation?: PromotionalInvitation;
  error?: string;
}

/**
 * Data for accepting a promotional invitation
 */
export interface AcceptPromotionalInvitationData {
  token: string;
  password: string;
  fullName: string;
}

/**
 * Promotional invitation token payload
 */
export interface PromotionalInvitationTokenPayload {
  invitationId: string;
  email: string;
  role: PromotionalRole;
  expiresAt: number;
}

/**
 * Product with promotional discount (for customer-facing display)
 */
export interface ProductWithDiscount {
  productId: string;
  title: string;
  description: string;
  images: string[];
  originalPrice: number;
  discountPercentage: number; // Total discount percentage (from base price)
  promotionalDiscountPercentage: number; // Promotional discount only (from event.products[].discountPercentage)
  discountedPrice: number;
  savings: number;
  vendor: {
    id: string;
    name: string;
  };
  category?: string;
  type?: 'ready-to-wear' | 'bespoke'; // Product type
  availability?: string;
  rtwOptions?: {
    sizes: Array<string | { label: string; quantity: number }>;
    colors?: string[];
    fabric?: string;
    season?: string;
  };
}

/**
 * Promotional event data for customer-facing pages
 */
export interface CustomerPromotionalEvent {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  banner?: {
    imageUrl: string;
    title?: string;
    description?: string;
  };
  productsCount: number;
  maxDiscount: number; // Highest discount percentage in the event
}

/**
 * Countdown timer values
 */
export interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}
