import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

// Use a flexible timestamp type that works with both client and admin SDKs
export type FirestoreTimestamp = AdminTimestamp | {
  toDate(): Date;
  toMillis(): number;
  seconds: number;
  nanoseconds: number;
};

export type WaitlistType = 'COLLECTION' | 'PRODUCT';
export type WaitlistStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'BOTH';

export interface Waitlist {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  type: WaitlistType;
  productIds: string[]; // References to tailor_works collection
  countdownEndAt: FirestoreTimestamp;
  status: WaitlistStatus;
  notificationChannels: NotificationChannel[];
  createdBy: string; // User ID
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  // Optional fields for better UX
  slug?: string; // URL-friendly identifier
  shortDescription?: string; // For cards/previews
  launchUrl?: string; // Where to redirect after countdown
}

export interface WaitlistSignup {
  id: string;
  waitlistId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  source: string; // 'landing_page', 'social_media', etc.
  createdAt: FirestoreTimestamp;
  // Optional fields for analytics
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface WaitlistProduct {
  id: string; // From tailor_works
  name: string;
  images: string[];
  price?: number;
  status: string;
  // Additional fields from tailor_works
  category?: string;
  vendor_name?: string;
  description?: string;
}

// Form interfaces for creating/editing waitlists
export interface CreateWaitlistForm {
  title: string;
  description: string;
  shortDescription?: string;
  bannerImage: string;
  type: WaitlistType;
  productIds: string[];
  countdownEndAt: Date;
  notificationChannels: NotificationChannel[];
  launchUrl?: string;
}

export interface WaitlistSignupForm {
  fullName: string;
  email: string;
  whatsapp: string;
  waitlistId: string;
}

// Analytics interfaces
export interface WaitlistAnalytics {
  waitlistId: string;
  totalSignups: number;
  signupsByDate: { date: string; count: number }[];
  signupsBySource: { source: string; count: number }[];
  conversionRate?: number; // If we track views
}

// Marketing dashboard interfaces
export interface WaitlistDashboardData {
  waitlists: Waitlist[];
  totalSignups: number;
  activeWaitlists: number;
  upcomingLaunches: number;
  recentSignups: WaitlistSignup[];
}

// Role-based permissions
export type MarketingRole = 'super_admin' | 'team_lead' | 'bdm';

export interface WaitlistPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canViewSignups: boolean;
  canExportSignups: boolean;
}

// API response types
export interface WaitlistApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface WaitlistSignupResponse extends WaitlistApiResponse {
  data?: {
    signupId: string;
    waitlist: Waitlist;
  };
}

// Countdown timer interface
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

// Email/WhatsApp notification templates
export interface NotificationTemplate {
  subject: string;
  message: string;
  variables: Record<string, string>;
}

export interface WaitlistNotificationData {
  waitlist: Waitlist;
  signup: WaitlistSignup;
  products: WaitlistProduct[];
}