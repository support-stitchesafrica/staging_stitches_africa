/**
 * Pure validation engine for the Vendor Size Guide System.
 * No React or Firestore dependencies — all functions are pure and testable.
 * Requirements: 2.7, 2.8, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4
 */

import type { SizeGuide, SizeGuideRow, SizeRegion } from '@/types/size-guide';

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface ValidationError {
  rowIndex?: number;
  field?: string;
  message: string;
}

export interface ValidationWarning {
  rowIndex?: number;
  field?: string;
  message: string;
  acknowledged: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ─── Standard UK → EU shoe size mapping ──────────────────────────────────────
// Used by validateShoeRegions (Property 9, Requirement 10.3)

const UK_TO_EU: Record<number, number> = {
  1: 33, 2: 34, 3: 36, 4: 37, 5: 38, 6: 39, 7: 40,
  8: 42, 9: 43, 10: 44, 11: 45, 12: 46, 13: 47, 14: 48,
};

// ─── Exported Validation Functions ───────────────────────────────────────────

/**
 * Top-level guide validator. Runs all sub-validators and aggregates results.
 * Returns valid=false when title or category is missing (Requirement 1.4).
 */
export function validateGuide(
  guide: Partial<SizeGuide>,
  rows: SizeGuideRow[],
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Require title and category (Property 2)
  if (!guide.title || guide.title.trim() === '') {
    errors.push({ message: 'Guide title is required.' });
  }
  if (!guide.category) {
    errors.push({ message: 'Guide category is required.' });
  }

  // Require at least one row (Requirement 1.6)
  if (!rows || rows.length === 0) {
    errors.push({ message: 'At least one measurement row is required.' });
    return { valid: false, errors, warnings };
  }

  // Determine which measurement fields to validate based on category
  const fields = guide.category
    ? getNumericFieldsForCategory(guide.category)
    : [];

  // Numeric field validation (Requirements 2.7, 2.8)
  errors.push(...validateNumericFields(rows, fields));

  // Duplicate size label check (Requirement 10.4)
  errors.push(...validateDuplicateLabels(rows));

  // Monotonicity warnings (Requirement 10.2)
  warnings.push(...validateMonotonicity(rows, fields));

  // Waist > Hips warnings (Requirement 10.1)
  warnings.push(...validateWaistHips(rows));

  // Shoe region range warnings (Requirement 10.3)
  if (guide.category === 'Shoes') {
    warnings.push(...validateShoeRegions(rows));
  }

  // Region completeness warnings (Requirement 3.5)
  if (guide.enabled_regions && guide.enabled_regions.length > 0) {
    warnings.push(...validateRegionCompleteness(rows, guide.enabled_regions));
  }

  // Duplicate regional row warnings (Requirement 3.4)
  warnings.push(...validateDuplicateRegionalRows(rows, guide.enabled_regions ?? []));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that all numeric measurement fields contain positive numeric values.
 * Rejects non-numeric strings and values ≤ 0.
 * Requirements: 2.7, 2.8 — Property 4
 */
export function validateNumericFields(
  rows: SizeGuideRow[],
  fields: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  rows.forEach((row, rowIndex) => {
    fields.forEach((field) => {
      const raw = row.measurements[field];

      // null/undefined means the field was left blank — skip (not an error by itself)
      if (raw === null || raw === undefined) return;

      const value = typeof raw === 'string' ? parseFloat(raw as unknown as string) : raw;

      if (isNaN(value)) {
        errors.push({
          rowIndex,
          field,
          message: `Row ${rowIndex + 1}: "${field}" must be a numeric value.`,
        });
      } else if (value <= 0) {
        errors.push({
          rowIndex,
          field,
          message: `Row ${rowIndex + 1}: "${field}" must be greater than zero.`,
        });
      }
    });
  });

  return errors;
}

/**
 * Validates that measurement values increase monotonically across rows.
 * Flags any row where a field value is strictly less than the same field in the preceding row.
 * Requirement 10.2 — Property 8
 */
export function validateMonotonicity(
  rows: SizeGuideRow[],
  fields: string[],
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];

    fields.forEach((field) => {
      const prevVal = prev.measurements[field];
      const currVal = curr.measurements[field];

      if (
        prevVal !== null && prevVal !== undefined &&
        currVal !== null && currVal !== undefined &&
        currVal < prevVal
      ) {
        warnings.push({
          rowIndex: i,
          field,
          message: `Row ${i + 1}: "${field}" (${currVal}) is less than the previous row's value (${prevVal}). Sizes should increase monotonically.`,
          acknowledged: false,
        });
      }
    });
  }

  return warnings;
}

/**
 * Flags any clothing row where Waist > Hips.
 * Requirement 10.1 — Property 7
 */
export function validateWaistHips(rows: SizeGuideRow[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  rows.forEach((row, rowIndex) => {
    const waist = row.measurements['Waist'];
    const hips = row.measurements['Hips'];

    if (
      waist !== null && waist !== undefined &&
      hips !== null && hips !== undefined &&
      waist > hips
    ) {
      warnings.push({
        rowIndex,
        field: 'Waist',
        message: `Row ${rowIndex + 1}: Waist (${waist}) exceeds Hips (${hips}). Please verify these measurements.`,
        acknowledged: false,
      });
    }
  });

  return warnings;
}

/**
 * Flags shoe rows where the EU size is outside ±2 of the standard UK→EU mapping.
 * Requirement 10.3 — Property 9
 */
export function validateShoeRegions(rows: SizeGuideRow[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  rows.forEach((row, rowIndex) => {
    const ukRaw = row.measurements['UK Size'];
    const euRaw = row.measurements['EU Size'];

    if (
      ukRaw === null || ukRaw === undefined ||
      euRaw === null || euRaw === undefined
    ) {
      return;
    }

    const ukSize = typeof ukRaw === 'string' ? parseFloat(ukRaw as unknown as string) : ukRaw;
    const euSize = typeof euRaw === 'string' ? parseFloat(euRaw as unknown as string) : euRaw;

    if (isNaN(ukSize) || isNaN(euSize)) return;

    const expectedEU = UK_TO_EU[Math.round(ukSize)];
    if (expectedEU === undefined) return; // UK size outside our table range — skip

    if (Math.abs(euSize - expectedEU) > 2) {
      warnings.push({
        rowIndex,
        field: 'EU Size',
        message: `Row ${rowIndex + 1}: EU size ${euSize} is outside the expected range (${expectedEU - 2}–${expectedEU + 2}) for UK size ${ukSize}.`,
        acknowledged: false,
      });
    }
  });

  return warnings;
}

/**
 * Returns an error for each pair of rows sharing the same size_label.
 * Requirement 10.4 — Property 6
 */
export function validateDuplicateLabels(rows: SizeGuideRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number>(); // label → first rowIndex

  rows.forEach((row, rowIndex) => {
    const label = row.size_label?.trim().toLowerCase();
    if (!label) return;

    if (seen.has(label)) {
      errors.push({
        rowIndex,
        field: 'size_label',
        message: `Row ${rowIndex + 1}: Size label "${row.size_label}" is already used in row ${seen.get(label)! + 1}.`,
      });
    } else {
      seen.set(label, rowIndex);
    }
  });

  return errors;
}

/**
 * Warns when a region has more than 20% of its rows missing values.
 * Requirement 3.5 — Property 10
 */
export function validateRegionCompleteness(
  rows: SizeGuideRow[],
  regions: SizeRegion[],
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (rows.length === 0) return warnings;

  const threshold = 0.2;

  regions.forEach((region) => {
    const missingCount = rows.filter((row) => {
      const val = row.regional_sizes[region];
      return val === undefined || val === null || val.toString().trim() === '';
    }).length;

    const missingRatio = missingCount / rows.length;

    if (missingRatio > threshold) {
      warnings.push({
        field: region,
        message: `Region "${region}" is missing values in ${missingCount} of ${rows.length} rows (${Math.round(missingRatio * 100)}%). Consider completing this region or removing it.`,
        acknowledged: false,
      });
    }
  });

  return warnings;
}

/**
 * Warns when two rows have identical values for all enabled regional size fields.
 * Requirement 3.4 — Property 11
 */
export function validateDuplicateRegionalRows(
  rows: SizeGuideRow[],
  enabledRegions: SizeRegion[],
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (enabledRegions.length === 0) return warnings;

  // Build a fingerprint for each row's regional sizes
  const fingerprint = (row: SizeGuideRow): string =>
    enabledRegions
      .map((r) => `${r}:${row.regional_sizes[r] ?? ''}`)
      .join('|');

  const seen = new Map<string, number>(); // fingerprint → first rowIndex

  rows.forEach((row, rowIndex) => {
    const fp = fingerprint(row);

    // Skip rows where all regional values are empty (no data to compare)
    const hasAnyValue = enabledRegions.some((r) => {
      const v = row.regional_sizes[r];
      return v !== undefined && v !== null && v.toString().trim() !== '';
    });
    if (!hasAnyValue) return;

    if (seen.has(fp)) {
      warnings.push({
        rowIndex,
        message: `Row ${rowIndex + 1} has identical regional sizes to row ${seen.get(fp)! + 1}.`,
        acknowledged: false,
      });
    } else {
      seen.set(fp, rowIndex);
    }
  });

  return warnings;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the numeric measurement fields for a category.
 * Shoes fields are numeric; regional size fields (UK Size, US Size, EU Size) are also numeric for shoes.
 */
function getNumericFieldsForCategory(category: SizeGuide['category']): string[] {
  switch (category) {
    case 'Shoes':
      return ['UK Size', 'US Size', 'EU Size', 'CM Length', 'Foot Width'];
    case 'Shirts':
    case 'Dresses':
    case 'Trousers':
    case 'Jackets':
    case 'Kids_Wear':
    case 'Unisex':
      return ['Chest/Bust', 'Waist', 'Hips', 'Shoulder Width', 'Sleeve Length', 'Neck', 'Inseam', 'Length'];
    case 'Native_Wear':
      return ['Agbada Length', 'Trouser Length', 'Shoulder', 'Cap Size', 'Arm Circumference'];
    case 'Bags':
      return ['Height', 'Width', 'Depth', 'Strap Length'];
    default:
      return [];
  }
}
