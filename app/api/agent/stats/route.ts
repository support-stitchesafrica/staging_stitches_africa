import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const cacheTTL = 30; // 30 second cache
    
    // Add timeout and retry logic for Firebase operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase operation timed out')), 10000);
    });
    
    // Get collection counts with timeout
    const [tailorsCount, worksCount, ordersCount] = await Promise.race([
      Promise.all([
        adminDb.collection("staging_tailors").count().get(),
        adminDb.collection("staging_tailor_works").count().get(),
        adminDb.collection("staging_users_orders").count().get()
      ]),
      timeoutPromise
    ]) as any[];
    
    // Get actual orders for accurate counting with timeout
    const ordersSnap = await Promise.race([
      adminDb.collection("staging_users_orders").get(),
      timeoutPromise
    ]) as any;
    
    // Count order statuses accurately
    let completedOrders = 0;
    let processingOrders = 0;
    let cancelledOrders = 0;
    
    ordersSnap.forEach((doc: any) => {
      const data = doc.data();
      const orderStatus = data.order_status?.toLowerCase() || '';
      
      // Check DHL events for delivery status
      let isDelivered = false;
      if (data.dhl_events_snapshot && Array.isArray(data.dhl_events_snapshot)) {
        for (const event of data.dhl_events_snapshot) {
          const description = event.description?.toLowerCase() || '';
          const typeCode = event.typeCode || '';
          if (description.includes('delivered') || typeCode === 'OK') {
            isDelivered = true;
            break;
          }
        }
      }
      
      // Categorize orders
      if (isDelivered || orderStatus.includes('delivered') || orderStatus === 'completed') {
        completedOrders++;
      } else if (orderStatus.includes('cancelled') || orderStatus === 'cancelled') {
        cancelledOrders++;
      } else {
        processingOrders++;
      }
    });
    
    // Get works data for approvals with timeout
    const worksSnap = await Promise.race([
      adminDb.collection("staging_tailor_works")
        .where('is_disabled', '!=', true)
        .limit(100)
        .get(),
      timeoutPromise
    ]) as any;
    
    let totalRevenue = 0;
    let verifiedWorks = 0;
    let pendingWorks = 0;
    
    worksSnap.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'verified') verifiedWorks++;
      if (data.status === 'pending') pendingWorks++;
      const priceValue = Number(data.price?.base || data.price || 0);
      totalRevenue += priceValue;
    });
    
    // Calculate estimated revenue
    const estimatedTotalRevenue = worksSnap.size > 0 ? 
      Math.round((totalRevenue / worksSnap.size) * worksCount.data().count) : 0;
    
    // Get wallet balance from tailors with timeout
    const tailorsSnap = await Promise.race([
      adminDb.collection("staging_tailors")
        .where('is_disabled', '!=', true)
        .limit(50)
        .get(),
      timeoutPromise
    ]) as any;
    
    let totalWalletBalance = 0;
    tailorsSnap.forEach((doc: any) => {
      const data = doc.data();
      totalWalletBalance += Number(data.wallet || 0);
    });
    
    const estimatedWalletBalance = tailorsSnap.size > 0 ? 
      Math.round((totalWalletBalance / tailorsSnap.size) * tailorsCount.data().count) : 0;
    
    const formattedStats = {
      totalTailors: tailorsCount.data().count,
      totalProducts: worksCount.data().count,
      totalOrders: ordersSnap.size,
      pendingApprovals: pendingWorks,
      recentActivity: [
        { 
          id: '1', 
          type: 'system_update', 
          message: 'Dashboard statistics updated', 
          timestamp: new Date().toISOString() 
        }
      ],
      finance: {
        totalRevenue: estimatedTotalRevenue,
        walletBalance: estimatedWalletBalance
      },
      works: {
        total: worksCount.data().count,
        verified: verifiedWorks,
        pending: pendingWorks
      },
      orders: {
        total: ordersSnap.size,
        completed: completedOrders,
        processing: processingOrders,
        cancelled: cancelledOrders
      }
    };

    const response = NextResponse.json({ success: true, data: formattedStats });
    
    // Add caching headers
    response.headers.set('Cache-Control', `public, s-maxage=${cacheTTL}, stale-while-revalidate=60`);
    response.headers.set('CDN-Cache-Control', `max-age=${cacheTTL}`);
    
    return response;
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    
    // Return basic stats if Firebase is unavailable
    const basicStats = {
      totalTailors: 0,
      totalProducts: 0,
      totalOrders: 0,
      pendingApprovals: 0,
      recentActivity: [
        { 
          id: '1', 
          type: 'system_info', 
          message: 'Unable to connect to database. Please check your connection.', 
          timestamp: new Date().toISOString() 
        }
      ],
      finance: {
        totalRevenue: 0,
        walletBalance: 0
      },
      works: {
        total: 0,
        verified: 0,
        pending: 0
      },
      orders: {
        total: 0,
        completed: 0,
        processing: 0,
        cancelled: 0
      }
    };
    
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed',
      data: basicStats 
    }, { status: 200 }); // Return 200 with error data instead of 500
  }
}