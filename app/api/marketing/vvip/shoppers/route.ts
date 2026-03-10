import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { adminDb } from '@/lib/firebase-admin';
import { getFilteredVvipShoppers } from '@/lib/marketing/vvip-shopper-filter';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check permissions
    const canViewVvipOrders = await vvipPermissionService.canViewVvipOrders(user.uid);
    if (!canViewVvipOrders) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view VVIP shoppers' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('search') || '';
    const countryFilter = searchParams.get('country') || '';
    const statusFilter = searchParams.get('status') || '';
    const dateRangeFilter = searchParams.get('dateRange') || '';

    // Build Firestore query
    let query = adminDb.collection("staging_vvip_shoppers");

    // Apply status filter at database level if specified
    if (statusFilter && statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter);
    }

    // Execute query and get all documents
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    // Apply consistent filtering to exclude admin users
    let shoppers = getFilteredVvipShoppers(snapshot.docs);

    // Apply search filter (client-side for simplicity)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      shoppers = shoppers.filter(shopper => 
        shopper.user_email?.toLowerCase().includes(query) ||
        shopper.user_name?.toLowerCase().includes(query)
      );
    }

    // Apply country filter
    if (countryFilter && countryFilter !== 'all') {
      shoppers = shoppers.filter(shopper => 
        shopper.country === countryFilter
      );
    }

    // Apply date range filter
    if (dateRangeFilter && dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRangeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      shoppers = shoppers.filter(shopper => 
        shopper.created_at && new Date(shopper.created_at) >= startDate
      );
    }

    console.log(`VVIP Shoppers API: Found ${shoppers.length} non-admin shoppers out of ${snapshot.size} total documents`);

    return NextResponse.json({
      success: true,
      shoppers,
      total: shoppers.length,
      totalDocuments: snapshot.size,
      filters: {
        search: searchQuery,
        country: countryFilter,
        status: statusFilter,
        dateRange: dateRangeFilter
      }
    });

  } catch (error) {
    console.error('VVIP Shoppers API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VVIP shoppers' },
      { status: 500 }
    );
  }
}