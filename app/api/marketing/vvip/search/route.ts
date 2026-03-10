import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check permissions
    const canCreateVvip = await vvipPermissionService.canCreateVvip(user.uid);
    if (!canCreateVvip) {
      return NextResponse.json(
        { error: 'Insufficient permissions to search users' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const searchType = searchParams.get('type') || 'email';
    const searchQuery = searchParams.get('query') || '';

    if (!searchQuery.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log(`VVIP Search: ${searchType} = "${searchQuery}"`);

    let customers: any[] = [];

    if (searchType === 'email') {
      // Search by email in users collection
      const usersSnapshot = await adminDb
        .collection("staging_users")
        .where('email', '==', searchQuery.toLowerCase())
        .limit(10)
        .get();

      customers = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.firstName + ' ' + data.lastName || 'Unknown',
          email: data.email,
          phone: data.phone,
          country: data.country,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.created_at?.toDate?.()?.toISOString(),
          isVvip: data.isVvip || false,
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0
        };
      });
    } else if (searchType === 'userId') {
      // Search by user ID
      try {
        const userDoc = await adminDb.collection("staging_users").doc(searchQuery).get();
        
        if (userDoc.exists) {
          const data = userDoc.data()!;
          customers = [{
            id: userDoc.id,
            name: data.name || data.firstName + ' ' + data.lastName || 'Unknown',
            email: data.email,
            phone: data.phone,
            country: data.country,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.created_at?.toDate?.()?.toISOString(),
            isVvip: data.isVvip || false,
            totalOrders: data.totalOrders || 0,
            totalSpent: data.totalSpent || 0
          }];
        }
      } catch (error) {
        console.error('Error fetching user by ID:', error);
      }
    }

    // Check VVIP status from vvip_shoppers collection
    if (customers.length > 0) {
      const vvipShoppersSnapshot = await adminDb.collection("staging_vvip_shoppers").get();
      const vvipUserIds = new Set(vvipShoppersSnapshot.docs.map(doc => doc.id));
      
      customers = customers.map(customer => ({
        ...customer,
        isVvip: vvipUserIds.has(customer.id)
      }));
    }

    console.log(`VVIP Search Results: Found ${customers.length} customers`);

    return NextResponse.json({
      success: true,
      customers,
      total: customers.length,
      searchType,
      searchQuery
    });

  } catch (error) {
    console.error('VVIP Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}