/**
 * Product Collections Visual Designer - Core Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the
 * Product Collections Visual Designer feature.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Canvas element types
 */
export type CanvasElementType = 'image' | 'text';

/**
 * Individual element on the canvas (image or text)
 */
export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  
  // Image-specific properties
  imageUrl?: string;
  productId?: string;
  productSource?: 'marketplace' | 'collection'; // Track product source
  
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
}

/**
 * Canvas state containing all elements and canvas configuration
 */
export interface CanvasState {
  elements: CanvasElement[];
  backgroundColor: string;
  dimensions: { width: number; height: number };
}

/**
 * Banner metadata for collection
 */
export interface CollectionBanner {
  imageUrl: string;
  title?: string;
  description?: string;
  uploadedAt: Date | Timestamp;
}

/**
 * Product Collection document structure
 */
export interface ProductCollection {
  id: string;
  name: string;
  productIds: string[];
  canvasState: CanvasState;
  thumbnail: string; // URL to preview image
  published: boolean;
  publishedAt?: Date | Timestamp | null;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string; // User ID
  // Banner display fields
  banner?: CollectionBanner;
  badge?: string; // e.g., "Featured Collection", "New Arrivals"
  title?: string; // Custom title for banner display (deprecated - use banner.title)
  description?: string; // Custom description for banner display (deprecated - use banner.description)
}

/**
 * Template for pre-designed layouts
 */
export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  layout: CanvasState;
  productSlots: number; // How many products this template supports
}

/**
 * Collections user (for authentication)
 */
export interface CollectionsUser {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'editor';
  isCollectionsUser: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  invitedBy?: string;             // Keep for audit (UID of inviter)
  // Removed: invitationToken, invitationExpiry (moved to collectionsInvitations collection)
}

/**
 * Product selection state
 */
export interface ProductSelectionState {
  products: any[]; // Using any for now, will be typed based on existing Product type
  selectedProducts: Set<string>;
  viewMode: 'list' | 'grid';
  filters: ProductFilters;
  loading: boolean;
}

/**
 * Product filters for selection dashboard
 */
export interface ProductFilters {
  search?: string;
  category?: string;
  vendor?: string;
  priceRange?: { min: number; max: number };
}

/**
 * Canvas editor state
 */
export interface CanvasEditorState {
  canvas: any | null; // Fabric.js canvas instance
  elements: Map<string, any>; // Map of element IDs to Fabric.js objects
  selectedElement: string | null;
  history: CanvasState[];
  historyIndex: number;
  isDirty: boolean;
}

/**
 * Collection creation form data
 */
export interface CollectionFormData {
  name: string;
  productIds: string[];
}

/**
 * Firestore document data (without id)
 */
export type ProductCollectionData = Omit<ProductCollection, 'id'>;

/**
 * Product owner information
 */
export interface ProductOwner {
  name: string;
  email: string;
  phoneNumber: string;
}

/**
 * Collection Product - Custom products created specifically for collections
 */
export interface CollectionProduct {
  id: string;
  title: string;
  description: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  // Multiple pricing support
  enableMultiplePricing?: boolean;
  individualItems?: {
    id: string;
    name: string;
    price: number;
  }[];
  brandName: string;
  images: string[]; // Firebase Storage URLs
  owner: ProductOwner; // Product owner information
  createdBy: string; // User UID
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Product form data for creating/editing collection products
 */
export interface ProductFormData {
  id: string; // Temporary ID for form management
  title: string;
  description: string;
  quantity?: number; // Made optional - not used in pricing
  size: string;
  color: string;
  price: number;
  // Multiple pricing support
  enableMultiplePricing: boolean;
  individualItems?: {
    id: string;
    name: string;
    price: number;
  }[];
  brandName: string;
  images: File[];
  imagePreviewUrls: string[];
  owner: ProductOwner; // Product owner information
}

/**
 * Collection Product data (without id)
 */
export type CollectionProductData = Omit<CollectionProduct, 'id'>;
