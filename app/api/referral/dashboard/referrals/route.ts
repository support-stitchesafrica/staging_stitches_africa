import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/referral/auth-middleware';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode, Referral } from '@/lib/referral/types';

/**
 * GET /api/referral/dashboard/referrals
 * Get list of referrals with pagination and search
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by referee name or email
 * - sortBy: Sort field (date, points, purchases) (default: date)
 * - sortOrder: Sort order (asc, desc) (default: desc)
 * 
 * Returns:
 * - referrals: Array of referral objects with referee details
 * - pagination: Page info (currentPage, totalPages, totalItems, itemsPerPage)
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const userId = user.userId;

    // Verify user is a referral user
    const referrer = await ReferralService.getReferrerById(userId);
    
    if (!referrer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.USER_NOT_FOUND,
            message: 'Referrer not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if account is active
    if (!referrer.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Account is inactive',
          },
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get all referrals for the user
    let referrals = await ReferralService.getReferralsByReferrer(userId);

    // Apply search filter if provided
    if (search) {
      referrals = referrals.filter((referral) => {
        const nameMatch = referral.refereeName.toLowerCase().includes(search);
        const emailMatch = referral.refereeEmail.toLowerCase().includes(search);
        return nameMatch || emailMatch;
      });
    }

    // Apply sorting
    referrals.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'points':
          comparison = (a.pointsEarned || 0) - (b.pointsEarned || 0);
          break;
        case 'purchases':
          comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
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
    const totalItems = referrals.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated results
    const paginatedReferrals = referrals.slice(startIndex, endIndex);

    // Format referrals for response
    const formattedReferrals = paginatedReferrals.map((referral) => ({
      id: referral.id,
      refereeName: referral.refereeName,
      refereeEmail: referral.refereeEmail,
      status: referral.status,
      signUpDate: referral.signUpDate && typeof referral.signUpDate.toMillis === 'function'
        ? new Date(referral.signUpDate.toMillis()).toISOString()
        : null,
      firstPurchaseDate: referral.firstPurchaseDate && typeof referral.firstPurchaseDate.toMillis === 'function'
        ? new Date(referral.firstPurchaseDate.toMillis()).toISOString()
        : null,
      totalPurchases: referral.totalPurchases || 0,
      totalSpent: parseFloat((referral.totalSpent || 0).toFixed(2)),
      pointsEarned: referral.pointsEarned || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        referrals: formattedReferrals,
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
    console.error('Error in referrals list endpoint:', error);

    // Handle specific error codes
    if (error.code === ReferralErrorCode.USER_NOT_FOUND) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Referrer not found',
          },
        },
        { status: 404 }
      );
    }

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
          message: 'An error occurred while fetching referrals',
        },
      },
      { status: 500 }
    );
  }
});
