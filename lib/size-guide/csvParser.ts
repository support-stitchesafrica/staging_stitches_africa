import type { SizeGuideRow, SizeRegion } from '@/types/size-guide';

// ─── Constants ───────────────────────────────────────────────────────────────

const REGION_KEYS: SizeRegion[] = ['UK', 'US', 'EU', 'AU', 'JP', 'CN'];

// ─── Shared Utilities ─────────────────────────────────────────────────────────

/**
 * Converts a flat header→value record from a parsed row into a SizeGuideRow.
 * The first column is treated as the size_label; remaining columns are split
 * into regional_sizes (if the header matches a SizeRegion) or measurements.
 */
function recordToSizeGuideRow(
  record: Record<string, string>,
  index: number,
): SizeGuideRow {
  const headers = Object.keys(record);
  const labelKey = headers[0] ?? 'Size';
  const size_label = record[labelKey]?.trim() ?? '';

  const measurements: Record<string, number | null> = {};
  const regional_sizes: Partial<Record<SizeRegion, string>> = {};

  for (const header of headers.slice(1)) {
    const normalised = header.trim();
    const rawValue = record[header]?.trim() ?? '';

    if ((REGION_KEYS as string[]).includes(normalised.toUpperCase())) {
      regional_sizes[normalised.toUpperCase() as SizeRegion] = rawValue;
    } else {
      const num = rawValue === '' ? null : parseFloat(rawValue);
      measurements[normalised] = num !== null && !isNaN(num) ? num : null;
    }
  }

  return {
    id: '',           // assigned by Firestore on save
    size_label,
    order: index,
    measurements,
    regional_sizes,
  };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/**
 * Parses a CSV file into SizeGuideRow objects.
 * Uses papaparse for robust CSV handling (quoted fields, different line endings).
 * Requirements: 4.3
 */
export async function parseCSVToRows(file: File): Promise<SizeGuideRow[]> {
  const Papa = (await import('papaparse')).default;

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      complete(results) {
        try {
          const rows = results.data.map((record, i) => recordToSizeGuideRow(record, i));
          resolve(rows);
        } catch (err) {
          reject(new Error(`CSV parse error: ${(err as Error).message}`));
        }
      },
      error(err: Error) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}

// ─── XLSX Parser ──────────────────────────────────────────────────────────────

/**
 * Parses an XLSX (or XLS) file into SizeGuideRow objects.
 * Reads the first sheet only.
 * Requirements: 4.3
 */
export async function parseXLSXToRows(file: File): Promise<SizeGuideRow[]> {
  const XLSX = await import('xlsx');

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  // header: 1 → array of arrays; defval: '' → empty cells become empty string
  const rawRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rawRows.length < 2) return []; // no data rows

  const headers = (rawRows[0] as string[]).map((h) => String(h).trim());
  const dataRows = rawRows.slice(1) as string[][];

  return dataRows.map((row, i) => {
    const record: Record<string, string> = {};
    headers.forEach((h, col) => {
      record[h] = String(row[col] ?? '').trim();
    });
    return recordToSizeGuideRow(record, i);
  });
}
