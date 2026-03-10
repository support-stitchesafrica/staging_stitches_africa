import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

// Use a flexible timestamp type that works with both client and admin SDKs
export type FirestoreTimestamp = AdminTimestamp | {
  toDate(): Date;
  toMillis(): number;
  seconds: number;
  nanoseconds: number;
};

export type CollectionWaitlistStatus = 'draft' | 'published' | 'completed' | 'archived';
export type ProductRelationship = 'buy_with' | 'complete_look' | 'accessory';

export interface ProductPair {
  primaryProductId: string;
  secondaryProductId: string;
  relationship: ProductRelationship;
  displayOrder: number;
}

export interface CollectionWaitlist {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  imageUrl: string;
  pairedProducts: ProductPair[];
  featuredProducts: string[]; // Array of product IDs for individual products
  minSubscribers: number;
  currentSubscribers: number;
  status: CollectionWaitlistStatus;
  slug: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  publishedAt?: FirestoreTimestamp;
  completedAt?: FirestoreTimestamp;
}

export interface WaitlistSubscription {
  id: string;
  collectionId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userId: string; // Firebase Auth UID
  subscribedAt: FirestoreTimestamp;
  source: 'direct' | 'social' | 'referral';
  metadata: {
    userAgent?: string;
    referrer?: string;
    ipAddress?: string;
  };
}

// Form interfaces
export interface CreateCollectionForm {
  name: string;
  description: string;
  imageUrl: string;
  pairedProducts: ProductPair[];
  featuredProducts: string[]; // Array of product IDs for individual products
  minSubscribers: number;
}

export interface SubscriptionForm {
  fullName: string;
  email: string;
  phoneNumber: string;
}

// API response types
export interface CollectionWaitlistResponse {
  success: boolean;
  data?: CollectionWaitlist;
  error?: string;
  message?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data?: {
    subscriptionId: string;
    collection: CollectionWaitlist;
  };
  error?: string;
  message?: string;
}

// Analytics types
export interface CollectionAnalytics {
  collectionId: string;
  totalSubscriptions: number;
  conversionRate: number;
  emailEngagementRate: number;
  clickThroughRate: number;
  subscriptionsByDate: { date: string; count: number }[];
  subscriptionsBySource: { source: string; count: number }[];
}

// Product reference for display
export interface ProductReference {
  id: string;
  name: string;
  images: string[];
  price: number;
  vendorName: string;
  category?: string;
}