/**
 * Vendor-side size guide service.
 * All functions call the corresponding API routes with the vendor's Firebase ID token
 * retrieved from localStorage ("tailorToken").
 *
 * Requirements: 1.5, 5.1, 5.2, 6.1, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import type {
  SizeGuide,
  SizeGuideRow,
  SizeGuideWithRows,
  SizeGuideCategory,
  MeasurementUnit,
  SizeRegion,
} from '@/types/size-guide';
import { getVendorIdToken, vendorAuthHeaders } from '@/lib/vendor/auth-token';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchWithVendorAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      ...(await vendorAuthHeaders()),
    },
  });

  if (res.status === 401) {
    const retryToken = await getVendorIdToken(true);
    if (retryToken) {
      res = await fetch(url, {
        ...init,
        headers: {
          ...(init.headers as Record<string, string>),
          ...(await vendorAuthHeaders(true)),
        },
      });
    }
  }

  return res;
}

/** Shared error shape returned by all API routes */
interface ApiError {
  success: false;
  error: string;
  code?: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL';
}

/** Thrown when the API returns a non-2xx response */
export class SizeGuideApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'SizeGuideApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return res.json() as Promise<T>;
  }
  let body: ApiError = { success: false, error: 'Unknown error' };
  try {
    body = await res.json();
  } catch {
    // ignore parse errors
  }
  throw new SizeGuideApiError(res.status, body.code, body.error);
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateGuideInput {
  title: string;
  category: SizeGuideCategory;
  unit: MeasurementUnit;
  enabled_regions: SizeRegion[];
  rows: Omit<SizeGuideRow, 'id'>[];
  template_id?: string;
  uploaded_file_url?: string;
  uploaded_file_type?: SizeGuide['uploaded_file_type'];
  display_preference?: SizeGuide['display_preference'];
}

export interface UpdateGuideInput {
  title?: string;
  unit?: MeasurementUnit;
  enabled_regions?: SizeRegion[];
  rows?: Omit<SizeGuideRow, 'id'>[];
  uploaded_file_url?: string;
  uploaded_file_type?: SizeGuide['uploaded_file_type'];
  display_preference?: SizeGuide['display_preference'];
}

export interface AssignGuideInput {
  product_ids: string[];
  /** When true, marks this guide as the vendor's default for its category */
  set_as_default?: boolean;
}

/** Result returned by submitGuide — includes a conflict flag for 409 responses */
export interface SubmitGuideResult {
  success: true;
  guide: SizeGuide;
}

export interface SubmitGuideConflict {
  success: false;
  conflict: true;
  message: string;
}

export interface GuideReviewFeedback {
  comment: string;
  status: SizeGuide['status'];
  reviewed_at: string | null;
}

/** Statuses where marketing may have left a review message for the vendor */
export const GUIDE_REVIEW_FEEDBACK_STATUSES: SizeGuide['status'][] = [
  'needs_changes',
  'rejected',
];

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Fetch all size guides owned by the authenticated vendor.
 * Requirement: 1.1
 */
/**
 * Fetch the latest marketing review comment when a guide needs vendor action.
 */
export async function getGuideReviewFeedback(
  guideId: string,
): Promise<GuideReviewFeedback | null> {
  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}/review-feedback`, {
    method: 'GET',
  });

  if (res.status === 404) {
    return null;
  }

  const data = await handleResponse<{ feedback: GuideReviewFeedback }>(res);
  return data.feedback;
}

export async function getVendorGuides(): Promise<SizeGuide[]> {
  const res = await fetchWithVendorAuth('/api/size-guides', {
    method: 'GET',
  });
  const data = await handleResponse<{ guides: SizeGuide[] }>(res);
  return data.guides;
}

/**
 * Fetch a single guide along with its measurement rows.
 * Requirement: 5.3
 */
export async function getGuideWithRows(guideId: string): Promise<SizeGuideWithRows> {
  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}`, {
    method: 'GET',
  });
  return handleResponse<SizeGuideWithRows>(res);
}

/**
 * Create a new size guide (status = 'submitted', pending marketing approval).
 * Requirement: 1.5, 5.1, 6.1
 */
async function guideFromWriteResponse(
  data: { guide?: SizeGuide; id?: string },
  guideId?: string,
): Promise<SizeGuide> {
  if (data.guide?.id) return data.guide;
  const id = data.guide?.id ?? data.id ?? guideId;
  if (!id) {
    throw new Error('Invalid size guide response: missing guide id');
  }
  const { rows: _rows, ...guide } = await getGuideWithRows(id);
  return guide;
}

export async function createGuide(input: CreateGuideInput): Promise<SizeGuide> {
  const res = await fetchWithVendorAuth('/api/size-guides', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ guide?: SizeGuide; id?: string }>(res);
  return guideFromWriteResponse(data);
}

/**
 * Update an existing draft guide.
 * Blocked server-side when status is 'submitted' or 'under_review'.
 * Requirement: 5.1, 6.4
 */
export async function updateGuide(guideId: string, input: UpdateGuideInput): Promise<SizeGuide> {
  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ guide?: SizeGuide }>(res);
  return guideFromWriteResponse(data, guideId);
}

/**
 * Delete a guide.
 * Pass `confirmDelete: true` when the guide is assigned to products (Requirement 5.5).
 */
export async function deleteGuide(
  guideId: string,
  confirmDelete = false,
): Promise<void> {
  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirm: confirmDelete }),
  });
  await handleResponse<{ success: true }>(res);
}

/**
 * Submit a draft guide for admin approval.
 *
 * Returns a SubmitGuideConflict (success: false, conflict: true) when a prior
 * version is still under_review (HTTP 409), so callers can surface a friendly
 * message without catching an exception.
 *
 * Requirement: 6.1, 5.2
 */
export async function submitGuide(
  guideId: string,
): Promise<SubmitGuideResult | SubmitGuideConflict> {
  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}/submit`, {
    method: 'POST',
  });

  // 409 = prior version still under review — surface as a typed conflict result
  if (res.status === 409) {
    let message = 'A previous version of this guide is still under review. Please wait for it to be reviewed before submitting a new version.';
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    return { success: false, conflict: true, message };
  }

  const data = await handleResponse<{ guide: SizeGuide }>(res);
  return { success: true, guide: data.guide };
}

/**
 * Assign an approved guide to one or more products.
 *
 * Rejects non-approved guides client-side before calling the API.
 * Requirement: 8.2, 8.3, 8.4, 8.5, 8.7
 */
export async function assignGuideToProducts(
  guideId: string,
  guideStatus: SizeGuide['status'],
  input: AssignGuideInput,
): Promise<void> {
  // Client-side guard — only approved guides may be assigned (Requirement 8.7)
  if (guideStatus !== 'approved') {
    throw new SizeGuideApiError(
      422,
      'VALIDATION_ERROR',
      'Only approved size guides can be assigned to products.',
    );
  }

  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}/assign`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await handleResponse<{ success: true }>(res);
}

/**
 * Mark one approved guide as the default for its category.
 * Clears the previous default for the same category server-side.
 * Requirement: 8.3
 */
export async function setDefaultGuide(
  guideId: string,
  guideStatus: SizeGuide['status'],
): Promise<void> {
  // Client-side guard — only approved guides can be set as default
  if (guideStatus !== 'approved') {
    throw new SizeGuideApiError(
      422,
      'VALIDATION_ERROR',
      'Only approved size guides can be set as the default.',
    );
  }

  const res = await fetchWithVendorAuth(`/api/size-guides/${guideId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ product_ids: [], set_as_default: true }),
  });
  await handleResponse<{ success: true }>(res);
}
