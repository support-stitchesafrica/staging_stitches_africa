/**
 * VVIP Orders API Route
 * 
 * GET /api/marketing/vvip/orders - List VVIP orders with filtering
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { vvipOrderService } from '@/lib/marketing/vvip-order-service';
import { vvipPermissionService } from '@/lib/marketing/vvip-permission-service';
import { VvipError, VvipErrorCode, OrderFilters } from '@/types/vvip';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

/**
 * GET /api/marketing/vvip/orders
 * 
 * Fetch VVIP orders with optional filtering
 * Supports filtering by payment status, date range, and user ID
 * 
 * Query Parameters:
 * - payment_status: 'pending_verification' | 'approved' | 'rejected'
 * - start_date: ISO date string
 * - end_date: ISO date string
 * - user_id: User ID to filter by
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userId = authResult.user.uid;

    // Validate user has permission to view VVIP orders
    const hasPermission = await vvipPermissionService.canViewVvipOrders(userId);
    if (!hasPermission) {
      return NextResponse.json(
        { 
          error: VvipErrorCode.UNAUTHORIZED, 
          message: 'Insufficient permissions to view VVIP orders' 
        },
        { status: 403 }
      );
    }

    // Get user role for response formatting (Requirements 5.10, 5.11, 5.12)
    const userRole = await vvipPermissionService.getUserRole(userId);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: OrderFilters = {};

    // Payment status filter (Requirements 5.2, 5.3, 5.4)
    const paymentStatus = searchParams.get('payment_status');
    if (paymentStatus) {
      if (!['pending_verification', 'approved', 'rejected'].includes(paymentStatus)) {
        return NextResponse.json(
          { 
            error: VvipErrorCode.VALIDATION_ERROR, 
            message: 'Invalid payment_status value',
            field: 'payment_status'
          },
          { status: 400 }
        );
      }
      filters.payment_status = paymentStatus as 'pending_verification' | 'approved' | 'rejected';
    }

    // Date range filter
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    if (startDate && endDate) {
      try {
        filters.dateRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      } catch (error) {
        return NextResponse.json(
          { 
            error: VvipErrorCode.VALIDATION_ERROR, 
            message: 'Invalid date format',
            field: 'date_range'
          },
          { status: 400 }
        );
      }
    }

    // User ID filter
    const userIdFilter = searchParams.get('user_id');
    if (userIdFilter) {
      filters.userId = userIdFilter;
    }

    // Fetch VVIP orders
    const orders = await vvipOrderService.getVvipOrders(filters);

    // Format response based on user role (Requirements 5.10, 5.11, 5.12)
    const formattedOrders = orders.map(order => {
      const baseOrder = {
        orderId: order.orderId,
        userId: order.userId,
        user_email: order.user_email,
        user_name: order.user_name,
        payment_status: order.payment_status,
        payment_proof_url: order.payment_proof_url,
        amount_paid: order.amount_paid,
        payment_reference: order.payment_reference,
        payment_date: order.payment_date.toDate().toISOString(),
        order_status: order.order_status,
        created_at: order.created_at.toDate().toISOString(),
        items: order.items,
        total: order.total,
        shipping_address: order.shipping_address,
      };

      // Include admin-specific fields for authorized roles
      if (userRole === 'super_admin' || userRole === 'bdm') {
        return {
          ...baseOrder,
          admin_note: order.admin_note,
          payment_verified_by: order.payment_verified_by,
          payment_verified_at: order.payment_verified_at?.toDate().toISOString(),
          // Include action buttons flag
          canApprove: order.payment_status === 'pending_verification',
          canReject: order.payment_status === 'pending_verification',
          canAddNote: true,
        };
      }

      // Team leads can see some admin fields but cannot approve
      if (userRole === 'team_lead') {
        return {
          ...baseOrder,
          admin_note: order.admin_note,
          payment_verified_by: order.payment_verified_by,
          payment_verified_at: order.payment_verified_at?.toDate().toISOString(),
          canApprove: false,
          canReject: false,
          canAddNote: false,
        };
      }

      // Team members get read-only view
      return {
        ...baseOrder,
        canApprove: false,
        canReject: false,
        canAddNote: false,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total: formattedOrders.length,
      filters: {
        payment_status: filters.payment_status,
        date_range: filters.dateRange ? {
          start: filters.dateRange.start.toISOString(),
          end: filters.dateRange.end.toISOString(),
        } : undefined,
        user_id: filters.userId,
      },
    });

  } catch (error) {
    console.error('VVIP Orders API Error:', error);

    if (error instanceof VvipError) {
      return NextResponse.json(
        { 
          error: error.code, 
          message: error.message,
          field: error.field,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: VvipErrorCode.DATABASE_ERROR, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
