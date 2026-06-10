// Comprehensive interface that includes all fields from ProductFormData
export interface TailorWork {
  id: string // Firestore doc id

  // Core product information
  product_id?: string
  title?: string
  description?: string

  // Pricing information
  price?: {
    base: number
    discount?: number
    currency: string
  }
  discount?: number // Legacy field for backward compatibility

  // Product categorization
  wear_quantity?: number
  wear_category?: string
  category?: string
  type?: string // e.g., "ready_to_wear", "bespoke"

  // Product attributes
  tags?: string[]
  keywords?: string[]
  availability?: string
  deliveryTimeline?: string
  returnPolicy?: string

  // Ready-to-wear specific options
  rtwOptions?: {
    colors?: string[]
    fabric?: string
    season?: string
    sizes?: string[]
    sizingApproach?: string | null
  }

  // Bespoke specific options
  bespokeOptions?: {
    customization?: {
      fabricChoices?: string[]
      styleOptions?: string[]
      finishingOptions?: string[]
    }
    measurementsRequired?: string[]
    productionTime?: string
    /** Legacy bespoke footwear payloads only */
    sizingApproach?: string
    footwearSizing?: {
      footwearSize?: string
      sizingCountryCode?: string
      gender?: string
      width?: string
      notes?: string
    } | null
  }

  // Sizing information
  sizes?: string[]
  userCustomSizes?: string[]
  userSizes?: any[]
  customSizes?: boolean

  // Media and verification
  images?: string[]
  is_verified?: boolean

  // Tailor information
  tailor?: string
  tailor_id?: string

  // Timestamps and status
  created_at?: any // Firestore timestamp or Date
  updated_at?: any
  createdAt?: string // ISO string
  updatedAt?: string // ISO string
  status?: string

   shipping?: {
    tierKey?: string;               // e.g., 'tier_medium'
    manualOverride?: boolean;       // true if vendor provided custom values
    actualWeightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  
  // Multiple pricing support
  enableMultiplePricing?: boolean;
  individualItems?: {
    id: string;
    name: string;
    price: number;
  }[];

  /** Footwear RTW: size chart image URLs stored on the product */
  sizeGuideImages?: string[];

  /** Hidden from public shop unless viewer is admin or vendor */
  isTest?: boolean;
}

export interface TailorWorksResponse {
  success: boolean
  data?: TailorWork[]
  message?: string

  
}

export interface TailorWorkResponse {
  success: boolean
  data?: TailorWork
  message?: string
}
