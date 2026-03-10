// Storefront configuration and related types for merchant storefront upgrade feature

export interface StorefrontTemplate {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'classic' | 'minimal';
  previewImage: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  defaultTheme: ThemeConfiguration;
}

export interface StorefrontConfig {
  id: string;
  vendorId: string;
  handle: string;
  isPublic: boolean;
  templateId: string;
  template?: StorefrontTemplate;
  theme: ThemeConfiguration;
  pages: StorefrontPage[];
  analytics: AnalyticsConfig;
  socialPixels: SocialPixelConfig;
  branding?: {
    logo?: string;
    businessName?: string;
  };
  businessInfo?: {
    businessName?: string;
    description?: string;
  };
  heroContent?: {
    title?: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeConfiguration {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    surface?: string;
    border?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    sizes: FontSizeConfig;
  };
  layout: {
    headerStyle: string;
    productCardStyle: string;
    spacing: SpacingConfig;
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
    shadows?: 'none' | 'subtle' | 'medium' | 'strong';
  };
  media: {
    logoUrl?: string;
    bannerUrl?: string;
    videoUrl?: string;
  };
  variants?: {
    buttonStyle?: 'filled' | 'outlined' | 'ghost';
    cardStyle?: 'flat' | 'elevated' | 'bordered';
    animationLevel?: 'none' | 'subtle' | 'moderate' | 'high';
  };
}

export interface FontSizeConfig {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface SpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface StorefrontPage {
  id: string;
  type: 'home';
  title: string;
  content: PageSection[];
  seoMetadata: SEOMetadata;
  productDisplay: ProductDisplayConfig;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'products' | 'text' | 'image' | 'video' | 'testimonials';
  order: number;
  content: Record<string, any>;
  styling: Record<string, any>;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
}

export interface ProductDisplayConfig {
  layout: 'grid' | 'list' | 'carousel';
  productsPerPage: number;
  showFilters: boolean;
  showSorting: boolean;
  cartIntegration: {
    enabled: boolean;
    redirectToStitchesAfrica: boolean;
  };
  promotionalDisplay: {
    showBadges: boolean;
    showBanners: boolean;
    highlightPromotions: boolean;
  };
}

export interface PromotionalConfig {
  id: string;
  vendorId: string;
  type: 'bogo' | 'discount' | 'bundle';
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  applicableProducts: string[];
  displaySettings: {
    badgeText: string;
    badgeColor: string;
    bannerMessage: string;
    priority: number;
    // Enhanced badge customization
    customColors?: {
      background: string;
      text: string;
      border?: string;
    };
    customText?: {
      primary: string;
      secondary?: string;
      prefix?: string;
      suffix?: string;
    };
    badgeVariant?: 'default' | 'compact' | 'minimal' | 'savings';
    showIcon?: boolean;
  };
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  customEvents: string[];
  retentionDays: number;
  exportEnabled: boolean;
}

export interface AnalyticsEvent {
  id: string;
  storefrontId: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  productId?: string;
  metadata: Record<string, any>;
}

export interface SocialPixelConfig {
  facebook?: {
    pixelId: string;
    enabled: boolean;
  };
  tiktok?: {
    pixelId: string;
    enabled: boolean;
  };
  snapchat?: {
    pixelId: string;
    enabled: boolean;
  };
}

// Template and theme related types
export interface StorefrontTemplate {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'modern' | 'classic' | 'creative';
  previewImage: string;
  defaultTheme: ThemeConfiguration;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Validation and utility types
export interface HandleValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  suggestions?: string[];
  errors?: string[];
}

export interface StorefrontStats {
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  averageSessionDuration: number;
  topProducts: Array<{
    productId: string;
    views: number;
    conversions: number;
  }>;
}