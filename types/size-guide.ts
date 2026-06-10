import { Timestamp } from 'firebase/firestore';

// ─── Union Types ────────────────────────────────────────────────────────────

export type SizeGuideCategory =
  | 'Shoes'
  | 'Shirts'
  | 'Dresses'
  | 'Trousers'
  | 'Jackets'
  | 'Native_Wear'
  | 'Bags'
  | 'Kids_Wear'
  | 'Unisex'
  | 'Underwear'
  | 'Waist_Beads'
  | 'Bracelets'
  | 'Accessories'
  | 'Suits'
  | 'Fila';

export type MeasurementUnit = 'CM' | 'Inches';

export type SizeRegion = 'UK' | 'US' | 'EU' | 'AU' | 'JP' | 'CN';

export type GuideStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

// ─── Category → Fields Map ───────────────────────────────────────────────────

/**
 * Static map of measurement fields per category.
 * Requirements: 1.3, 2.1, 2.2, 2.3, 2.4
 */
export const CATEGORY_FIELDS: Record<SizeGuideCategory, string[]> = {
  Shoes: ['UK Size', 'US Size', 'EU Size', 'CM Length', 'Foot Width'],
  Shirts: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'],
  Dresses: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'],
  Trousers: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'],
  Jackets: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'],
  Kids_Wear: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'],
  Unisex: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'],
  Native_Wear: ['Agbada Length', 'Trouser Length', 'Shoulder', 'Cap Size', 'Arm Circumference'],
  Bags: ['Height', 'Width', 'Depth', 'Strap Length'],
  Underwear: ['Chest/Bust', 'Waist', 'Hips', 'Length'],
  Waist_Beads: ['Waist', 'Hip', 'Length'],
  Bracelets: ['Wrist Circumference', 'Length', 'Width'],
  Accessories: ['Length', 'Width', 'Height'],
  Suits: ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length', 'Jacket Length'],
  Fila: ['Head Circumference', 'Height', 'Width'],
};

/**
 * Returns the measurement fields for a given category.
 * Always returns the exact set defined in CATEGORY_FIELDS — no more, no fewer.
 */
export function getFieldsForCategory(category: SizeGuideCategory): string[] {
  return CATEGORY_FIELDS[category];
}

// ─── Core Interfaces ─────────────────────────────────────────────────────────

/**
 * A single measurement row within a size guide.
 * Stored in the `size_guide_rows` subcollection under `size_guides/{guideId}`.
 */
export interface SizeGuideRow {
  id: string;
  /** Display label, e.g. 'S', 'M', 'XL', '42', 'UK 8' */
  size_label: string;
  /** Display order within the guide */
  order: number;
  /** Field name → numeric value (null if not provided) */
  measurements: Record<string, number | null>;
  /** Regional size strings, e.g. { UK: '10', US: '8', EU: '38' } */
  regional_sizes: Partial<Record<SizeRegion, string>>;
}

/**
 * A size guide document stored in the `size_guides` Firestore collection.
 */
export interface SizeGuide {
  id: string;
  /** References the `tailors` collection document ID */
  vendor_id: string;
  title: string;
  category: SizeGuideCategory;
  unit: MeasurementUnit;
  enabled_regions: SizeRegion[];
  status: GuideStatus;
  /** Starts at 1, increments on re-submission after an approved version exists */
  version: number;
  /** Set when this document is a new version of an existing guide */
  parent_guide_id?: string;
  /** Set when the guide was started from a marketplace template */
  template_id?: string;
  /** Firebase Storage download URL for an uploaded file */
  uploaded_file_url?: string;
  uploaded_file_type?: 'image' | 'pdf' | 'csv' | 'xlsx';
  /** Controls how the customer viewer displays the guide */
  display_preference?: 'table' | 'file' | 'both';
  /** True when this is the vendor's default guide for this category */
  is_default_for_category?: boolean;
  /** Multi-category guides: each section has its own category, rows, and regions */
  category_sections?: Array<{
    id?: string;
    category: SizeGuideCategory;
    rows?: Omit<SizeGuideRow, 'id'>[];
    enabledRegions?: SizeRegion[];
    enabled_regions?: SizeRegion[];
  }>;
  submitted_at?: Timestamp;
  approved_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Approval audit record stored in the `size_guide_approvals` collection.
 */
export interface SizeGuideApproval {
  id: string;
  guide_id: string;
  vendor_id: string;
  /** Set when the guide has been reviewed by an admin */
  admin_id?: string;
  status: GuideStatus;
  /** Required for `rejected` and `needs_changes` transitions */
  comment?: string;
  submitted_at: Timestamp;
  reviewed_at?: Timestamp;
}

/**
 * Predefined template stored in the `size_guide_templates` collection.
 * Readable by all authenticated vendors; writable only by admins.
 */
export interface SizeGuideTemplate {
  id: string;
  /** e.g. 'African Fashion', 'Sneakers' */
  name: string;
  category: SizeGuideCategory;
  unit: MeasurementUnit;
  enabled_regions: SizeRegion[];
  /** Pre-populated rows (no Firestore IDs yet) */
  rows: Omit<SizeGuideRow, 'id'>[];
  /** Admin UID who created the template */
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Analytics view event stored in the `size_guide_views` collection.
 * No PII fields are stored — only anonymised session identifiers.
 */
export interface SizeGuideView {
  id: string;
  guide_id: string;
  product_id: string;
  viewed_at: Timestamp;
  /** Anonymised — no user_id, email, or other PII */
  session_id: string;
}

// ─── Composite / View Types ──────────────────────────────────────────────────

/** Guide document with its rows pre-fetched (used in review modal and viewer) */
export interface SizeGuideWithRows extends SizeGuide {
  rows: SizeGuideRow[];
}
