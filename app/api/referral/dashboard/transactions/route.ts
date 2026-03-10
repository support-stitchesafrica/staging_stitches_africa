import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/referral/auth-middleware';
import { ReferralService } from '@/lib/referral/referral-service';
import { RewardService } from '@/lib/referral/reward-service';
import { ReferralErrorCode } from '@/lib/referral/types';

/**
 * GET /api/referral/dashboard/transactions
 * Get points transaction history for a referrer
 * Requirements: 7.5
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - type: Filter by transaction type (signup, purchase, all) (default: all)
 * 
 * Returns:
 * - transactions: Array of transaction objects
 * - pagination: Page info (currentPage, totalPages, totalItems, itemsPerPage)
 * - summary: Total points by type
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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const typeFilter = searchParams.get('type') || 'all';

    // Get transaction history
    let transactions = await RewardService.getPointsHistory(userId);

    // Apply type filter if not 'all'
    if (typeFilter !== 'all' && (typeFilter === 'signup' || typeFilter === 'purchase')) {
      transactions = transactions.filter((transaction) => transaction.type === typeFilter);
    }

    // Calculate summary statistics
    const summary = {
      totalPoints: 0,
      signupPoints: 0,
      purchasePoints: 0,
      totalTransactions: transactions.length,
    };

    transactions.forEach((transaction) => {
      summary.totalPoints += transaction.points || 0;
      if (transaction.type === 'signup') {
        summary.signupPoints += transaction.points || 0;
      } else if (transaction.type === 'purchase') {
        summary.purchasePoints += transaction.points || 0;
      }
    });

    // Calculate pagination
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated results
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    // Format transactions for response
    const formattedTransactions = paginatedTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      points: transaction.points,
      amount: transaction.amount ? parseFloat(transaction.amount.toFixed(2)) : null,
      description: transaction.description,
      refereeName: transaction.metadata?.refereeName || 'Unknown',
      refereeEmail: transaction.metadata?.refereeEmail || '',
      orderId: transaction.metadata?.orderId || null,
      createdAt: transaction.createdAt && typeof transaction.createdAt.toMillis === 'function'
        ? new Date(transaction.createdAt.toMillis()).toISOString()
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        transactions: formattedTransactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        summary: {
          totalPoints: summary.totalPoints,
          signupPoints: summary.signupPoints,
          purchasePoints: summary.purchasePoints,
          totalTransactions: summary.totalTransactions,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in transactions endpoint:', error);

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
          message: 'An error occurred while fetching transactions',
        },
      },
      { status: 500 }
    );
  }
});
