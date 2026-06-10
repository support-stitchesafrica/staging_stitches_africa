import type { SizeGuideCategory, SizeGuideRow, SizeRegion } from '@/types/size-guide';
import { CATEGORY_FIELDS } from '@/types/size-guide';

export interface CategorySectionPreview {
  id: string;
  category: SizeGuideCategory;
  rows: SizeGuideRow[];
  enabledRegions: SizeRegion[];
}

export function formatCategoryLabel(category: string): string {
  return category.replace(/_/g, ' ');
}

export function formatGuideCategoriesLabel(guide: {
  category: string;
  category_sections?: { category: string }[] | null;
}): string {
  const sections = guide.category_sections;
  if (sections && sections.length > 0) {
    return sections.map((s) => formatCategoryLabel(s.category)).join(', ');
  }
  return formatCategoryLabel(guide.category);
}

/** Build per-category sections for marketing review (from stored sections or flat rows). */
export function parseGuideSections(
  guide: {
    category: SizeGuideCategory;
    enabled_regions?: SizeRegion[];
    category_sections?: Array<{
      id?: string;
      category: SizeGuideCategory;
      rows?: Omit<SizeGuideRow, 'id'>[];
      enabledRegions?: SizeRegion[];
      enabled_regions?: SizeRegion[];
    }> | null;
  },
  flatRows: SizeGuideRow[],
): CategorySectionPreview[] {
  const stored = guide.category_sections;
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored.map((s, i) => ({
      id: s.id ?? `sec-${i}`,
      category: s.category,
      rows: (s.rows ?? []).map((r, ri) => ({
        ...r,
        id: (r as SizeGuideRow).id ?? `row-${i}-${ri}`,
      })) as SizeGuideRow[],
      enabledRegions: s.enabledRegions ?? s.enabled_regions ?? [],
    }));
  }

  return [
    {
      id: 'primary',
      category: guide.category,
      rows: flatRows,
      enabledRegions: guide.enabled_regions ?? [],
    },
  ];
}

export function getMeasurementFieldsForSection(section: CategorySectionPreview): string[] {
  const fromCategory = CATEGORY_FIELDS[section.category] ?? [];
  if (fromCategory.length > 0) return fromCategory;

  if (section.rows.length === 0) return [];
  return Object.keys(section.rows[0].measurements ?? {});
}
