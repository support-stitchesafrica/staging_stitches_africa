import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/referral/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { ReferralErrorCode, ReferralUser } from '@/lib/referral/types';

/**
 * GET /api/referral/admin/referrers
 * Get all referrers with pagination and filters
 * Requirements: 12.1, 12.2, 12.3, 12.4
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by name, email, or referral code
 * - sortBy: Sort field (name, referrals, points, revenue, date) (default: date)
 * - sortOrder: Sort order (asc, desc) (default: desc)
 * - filter: Activity filter (all, active, inactive) (default: all)
 * - dateFrom: Filter by creation date from (ISO string)
 * - dateTo: Filter by creation date to (ISO string)
 * 
 * Returns:
 * - referrers: Array of referrer objects with all details
 * - pagination: Page info (currentPage, totalPages, totalItems, itemsPerPage)
 */
export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const filter = searchParams.get('filter') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    let query = adminDb.collection("staging_referralUsers");

    // Apply date filters if provided
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      query = query.where('createdAt', '>=', fromDate) as any;
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      query = query.where('createdAt', '<=', toDate) as any;
    }

    // Get all referrers (we'll filter and sort in memory for flexibility)
    const snapshot = await query.get();
    let referrers = snapshot.docs.map(doc => doc.data() as ReferralUser);

    // Apply activity filter
    if (filter === 'active') {
      referrers = referrers.filter(r => r.isActive);
    } else if (filter === 'inactive') {
      referrers = referrers.filter(r => !r.isActive);
    }

    // Apply search filter if provided
    if (search) {
      referrers = referrers.filter((referrer) => {
        const nameMatch = referrer.fullName.toLowerCase().includes(search);
        const emailMatch = referrer.email.toLowerCase().includes(search);
        const codeMatch = referrer.referralCode.toLowerCase().includes(search);
        return nameMatch || emailMatch || codeMatch;
      });
    }

    // Apply sorting
    referrers.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'referrals':
          comparison = (a.totalReferrals || 0) - (b.totalReferrals || 0);
          break;
        case 'points':
          comparison = (a.totalPoints || 0) - (b.totalPoints || 0);
          break;
        case 'revenue':
          comparison = (a.totalRevenue || 0) - (b.totalRevenue || 0);
          break;
        case 'date':
        default:
          // Sort by creation date
          const aTime = a.createdAt && typeof a.createdAt.toMillis === 'function' 
            ? a.createdAt.toMillis() 
            : 0;
          const bTime = b.createdAt && typeof b.createdAt.toMillis === 'function' 
            ? b.createdAt.toMillis() 
            : 0;
          comparison = aTime - bTime;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Calculate pagination
    const totalItems = referrers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated results
    const paginatedReferrers = referrers.slice(startIndex, endIndex);

    // Format referrers for response
    const formattedReferrers = paginatedReferrers.map((referrer) => ({
      userId: referrer.userId,
      fullName: referrer.fullName,
      email: referrer.email,
      referralCode: referrer.referralCode,
      totalReferrals: referrer.totalReferrals || 0,
      totalPoints: referrer.totalPoints || 0,
      totalRevenue: parseFloat((referrer.totalRevenue || 0).toFixed(2)),
      isActive: referrer.isActive,
      isAdmin: referrer.isAdmin,
      createdAt: referrer.createdAt && typeof referrer.createdAt.toMillis === 'function'
        ? new Date(referrer.createdAt.toMillis()).toISOString()
        : null,
      updatedAt: referrer.updatedAt && typeof referrer.updatedAt.toMillis === 'function'
        ? new Date(referrer.updatedAt.toMillis()).toISOString()
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        referrers: formattedReferrers,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in admin referrers endpoint:', error);

    // Handle specific error codes
    if (error.code === ReferralErrorCode.UNAUTHORIZED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Unauthorized access',
          },
        },
        { status: 401 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching referrers',
        },
      },
      { status: 500 }
    );
  }
});
