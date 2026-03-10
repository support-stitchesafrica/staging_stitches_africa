// Re-export storefront types and add service-specific types

export * from '../../types/storefront';

// Service-specific types for storefront operations
export interface CreateStorefrontRequest {
  vendorId: string;
  handle: string;
  isPublic: boolean;
  templateId: string;
  initialTheme?: Partial<ThemeConfiguration>;
}

export interface UpdateStorefrontRequest {
  id: string;
  handle?: string;
  isPublic?: boolean;
  templateId?: string;
  theme?: Partial<ThemeConfiguration>;
  analytics?: Partial<AnalyticsConfig>;
  socialPixels?: Partial<SocialPixelConfig>;
}

export interface StorefrontQueryOptions {
  vendorId?: string;
  isPublic?: boolean;
  templateId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'handle';
  sortOrder?: 'asc' | 'desc';
}

// API response types
export interface StorefrontResponse {
  success: boolean;
  data?: StorefrontConfig;
  error?: string;
  message?: string;
}

export interface StorefrontListResponse {
  success: boolean;
  data?: StorefrontConfig[];
  total?: number;
  error?: string;
  message?: string;
}

export interface HandleValidationResponse {
  success: boolean;
  data?: HandleValidationResult;
  error?: string;
}

// Firebase document types
export interface StorefrontDocument {
  id: string;
  vendorId: string;
  handle: string;
  isPublic: boolean;
  templateId: string;
  theme: ThemeConfiguration;
  pages: StorefrontPage[];
  analytics: AnalyticsConfig;
  socialPixels: SocialPixelConfig;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Import the main types for re-export
import type {
  StorefrontConfig,
  ThemeConfiguration,
  StorefrontPage,
  AnalyticsConfig,
  SocialPixelConfig,
  ProductDisplayConfig,
  PromotionalConfig,
  HandleValidationResult
} from '../../types/storefront';