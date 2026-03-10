/**
 * VVIP Order Management Service
 * 
 * Provides order management functionality for VVIP orders including:
 * - Fetching VVIP orders with filtering
 * - Approving and rejecting payments
 * - Managing admin notes
 * - Creating audit logs for payment status changes
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.13, 5.14, 5.15, 5.16, 5.17, 5.18
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  VvipOrder,
  OrderFilters,
  OrderResult,
  PaymentStatus,
  VvipOrderStatus,
  VvipError,
  VvipErrorCode,
} from '@/types/vvip';
import { vvipPermissionService } from './vvip-permission-service';
import { vvipAuditService } from './vvip-audit-service';

/**
 * VVIP Order Service Class
 * Provides order management functionality for VVIP orders
 */
export class VvipOrderService {
  private static readonly ORDERS_COLLECTION = 'orders';
  private static readonly USERS_COLLECTION = 'users';

  /**
   * Get VVIP orders with optional filtering
   * Requirements: 5.2, 5.3, 5.4
   * 
   * @param filters - Optional filters to apply
   * @returns Array of VVIP orders
   */
  static async getVvipOrders(filters?: OrderFilters): Promise<VvipOrder[]> {
    try {
      // Start with base query for VVIP orders
      let query = adminDb
        .collection(this.ORDERS_COLLECTION)
        .where('isVvip', '==', true);

      // Apply payment status filter (Requirement 5.2, 5.3, 5.4)
      if (filters?.payment_status) {
        query = query.where('payment_status', '==', filters.payment_status);
      }

      // Apply date range filter
      if (filters?.dateRange) {
        const startTimestamp = Timestamp.fromDate(filters.dateRange.start);
        const endTimestamp = Timestamp.fromDate(filters.dateRange.end);
        query = query
          .where('created_at', '>=', startTimestamp)
          .where('created_at', '<=', endTimestamp);
      }

      // Apply user ID filter
      if (filters?.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      // Order by creation date (most recent first)
      query = query.orderBy('created_at', 'desc');

      // Execute query
      const snapshot = await query.get();

      // Map documents to VvipOrder objects
      const orders: VvipOrder[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Ensure this is a VVIP order
        if (data.isVvip !== true) {
          continue;
        }

        orders.push({
          orderId: doc.id,
          userId: data.userId || '',
          payment_method: 'manual_transfer',
          isVvip: true,
          payment_status: data.payment_status || 'pending_verification',
          payment_proof_url: data.payment_proof_url || '',
          amount_paid: data.amount_paid || 0,
          payment_reference: data.payment_reference,
          payment_date: data.payment_date || Timestamp.now(),
          order_status: data.order_status || 'pending',
          admin_note: data.admin_note,
          payment_verified_by: data.payment_verified_by,
          payment_verified_at: data.payment_verified_at,
          created_at: data.created_at || Timestamp.now(),
          updated_at: data.updated_at,
          // Include standard order fields
          items: data.items || [],
          total: data.total || 0,
          shipping_address: data.shipping_address,
          user_email: data.user_email,
          user_name: data.user_name,
        });
      }

      // Fetch user details for orders that don't have them
      await this.enrichOrdersWithUserDetails(orders);

      return orders;
    } catch (error) {
      console.error('Error fetching VVIP orders:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch VVIP orders',
        500
      );
    }
  }

  /**
   * Enrich orders with user details (email, name)
   * Helper function to populate user information
   * 
   * @param orders - Array of orders to enrich
   */
  private static async enrichOrdersWithUserDetails(orders: VvipOrder[]): Promise<void> {
    // Get unique user IDs that need enrichment
    const userIdsToFetch = orders
      .filter(order => !order.user_email || !order.user_name)
      .map(order => order.userId);

    if (userIdsToFetch.length === 0) {
      return;
    }

    // Fetch user details in batches (Firestore 'in' query limit is 10)
    const uniqueUserIds = [...new Set(userIdsToFetch)];
    const userDetailsMap = new Map<string, { email: string; name: string }>();

    const batchSize = 10;
    for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
      const batch = uniqueUserIds.slice(i, i + batchSize);
      const snapshot = await adminDb
        .collection(this.USERS_COLLECTION)
        .where('__name__', 'in', batch)
        .get();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const firstName = data.first_name || data.firstName || '';
        const lastName = data.last_name || data.lastName || '';
        userDetailsMap.set(doc.id, {
          email: data.email || '',
          name: `${firstName} ${lastName}`.trim() || 'Unknown',
        });
      });
    }

    // Enrich orders with user details
    orders.forEach(order => {
      const userDetails = userDetailsMap.get(order.userId);
      if (userDetails) {
        if (!order.user_email) {
          order.user_email = userDetails.email;
        }
        if (!order.user_name) {
          order.user_name = userDetails.name;
        }
      }
    });
  }

  /**
   * Approve payment for a VVIP order
   * Requirements: 5.13, 5.14, 5.18
   * 
   * @param orderId - Order ID to approve payment for
   * @param adminId - Admin user ID performing the action
   * @param note - Optional admin note
   * @returns Result of the operation
   * @throws VvipError if order doesn't exist or is not in correct state
   */
  static async approvePayment(
    orderId: string,
    adminId: string,
    note?: string
  ): Promise<OrderResult> {
    try {
      // Validate admin has permission
      await vvipPermissionService.validatePermission(adminId, 'approve');

      // Fetch order document
      const orderDoc = await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        throw new VvipError(
          VvipErrorCode.ORDER_NOT_FOUND,
          'Order does not exist',
          404
        );
      }

      const orderData = orderDoc.data()!;

      // Validate this is a VVIP order
      if (orderData.isVvip !== true) {
        throw new VvipError(
          VvipErrorCode.INVALID_STATE,
          'Order is not a VVIP order',
          400
        );
      }

      // Validate order is in pending_verification state
      if (orderData.payment_status !== 'pending_verification') {
        throw new VvipError(
          VvipErrorCode.INVALID_STATE,
          `Cannot approve payment with status: ${orderData.payment_status}`,
          400
        );
      }

      const verifiedAt = Timestamp.now();

      // Update order with approved status (Requirements 5.13, 5.14)
      const updateData: any = {
        payment_status: 'approved',
        order_status: 'processing',
        payment_verified_by: adminId,
        payment_verified_at: verifiedAt,
        updated_at: verifiedAt,
      };

      // Add admin note if provided (Requirement 5.17)
      if (note) {
        updateData.admin_note = note;
      }

      await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .update(updateData);

      // Create audit log entry (Requirement 5.18)
      await vvipAuditService.logVvipAction({
        action_type: 'payment_approved',
        performed_by: adminId,
        affected_user: orderData.userId,
        timestamp: verifiedAt,
        metadata: {
          orderId,
          admin_note: note,
          previous_status: 'pending_verification',
          new_status: 'approved',
          amount_paid: orderData.amount_paid,
          payment_reference: orderData.payment_reference,
        },
      });

      return {
        success: true,
        message: 'Payment approved successfully',
        orderId,
        data: {
          payment_status: 'approved',
          order_status: 'processing',
          payment_verified_at: verifiedAt.toDate().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof VvipError) {
        throw error;
      }
      console.error('Error approving payment:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to approve payment',
        500
      );
    }
  }

  /**
   * Reject payment for a VVIP order
   * Requirements: 5.15, 5.16, 5.17, 5.18
   * 
   * @param orderId - Order ID to reject payment for
   * @param adminId - Admin user ID performing the action
   * @param note - Required admin note explaining rejection
   * @returns Result of the operation
   * @throws VvipError if order doesn't exist or is not in correct state
   */
  static async rejectPayment(
    orderId: string,
    adminId: string,
    note: string
  ): Promise<OrderResult> {
    try {
      // Validate admin has permission
      await vvipPermissionService.validatePermission(adminId, 'approve');

      // Validate note is provided (required for rejection)
      if (!note || note.trim().length === 0) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'Admin note is required when rejecting payment',
          400,
          'admin_note'
        );
      }

      // Fetch order document
      const orderDoc = await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        throw new VvipError(
          VvipErrorCode.ORDER_NOT_FOUND,
          'Order does not exist',
          404
        );
      }

      const orderData = orderDoc.data()!;

      // Validate this is a VVIP order
      if (orderData.isVvip !== true) {
        throw new VvipError(
          VvipErrorCode.INVALID_STATE,
          'Order is not a VVIP order',
          400
        );
      }

      // Validate order is in pending_verification state
      if (orderData.payment_status !== 'pending_verification') {
        throw new VvipError(
          VvipErrorCode.INVALID_STATE,
          `Cannot reject payment with status: ${orderData.payment_status}`,
          400
        );
      }

      const verifiedAt = Timestamp.now();

      // Update order with rejected status (Requirements 5.15, 5.16, 5.17)
      await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .update({
          payment_status: 'rejected',
          order_status: 'payment_failed',
          payment_verified_by: adminId,
          payment_verified_at: verifiedAt,
          admin_note: note,
          updated_at: verifiedAt,
        });

      // Create audit log entry (Requirement 5.18)
      await vvipAuditService.logVvipAction({
        action_type: 'payment_rejected',
        performed_by: adminId,
        affected_user: orderData.userId,
        timestamp: verifiedAt,
        metadata: {
          orderId,
          admin_note: note,
          previous_status: 'pending_verification',
          new_status: 'rejected',
          amount_paid: orderData.amount_paid,
          payment_reference: orderData.payment_reference,
        },
      });

      return {
        success: true,
        message: 'Payment rejected successfully',
        orderId,
        data: {
          payment_status: 'rejected',
          order_status: 'payment_failed',
          payment_verified_at: verifiedAt.toDate().toISOString(),
          admin_note: note,
        },
      };
    } catch (error) {
      if (error instanceof VvipError) {
        throw error;
      }
      console.error('Error rejecting payment:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to reject payment',
        500
      );
    }
  }

  /**
   * Get a single VVIP order by ID
   * 
   * @param orderId - Order ID to fetch
   * @returns VVIP order if found, null otherwise
   */
  static async getVvipOrderById(orderId: string): Promise<VvipOrder | null> {
    try {
      const orderDoc = await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        return null;
      }

      const data = orderDoc.data()!;

      // Ensure this is a VVIP order
      if (data.isVvip !== true) {
        return null;
      }

      const order: VvipOrder = {
        orderId: orderDoc.id,
        userId: data.userId || '',
        payment_method: 'manual_transfer',
        isVvip: true,
        payment_status: data.payment_status || 'pending_verification',
        payment_proof_url: data.payment_proof_url || '',
        amount_paid: data.amount_paid || 0,
        payment_reference: data.payment_reference,
        payment_date: data.payment_date || Timestamp.now(),
        order_status: data.order_status || 'pending',
        admin_note: data.admin_note,
        payment_verified_by: data.payment_verified_by,
        payment_verified_at: data.payment_verified_at,
        created_at: data.created_at || Timestamp.now(),
        updated_at: data.updated_at,
        items: data.items || [],
        total: data.total || 0,
        shipping_address: data.shipping_address,
        user_email: data.user_email,
        user_name: data.user_name,
      };

      // Enrich with user details if needed
      await this.enrichOrdersWithUserDetails([order]);

      return order;
    } catch (error) {
      console.error('Error fetching VVIP order by ID:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch VVIP order',
        500
      );
    }
  }

  /**
   * Get VVIP order statistics
   * 
   * @returns Statistics about VVIP orders
   */
  static async getVvipOrderStatistics(): Promise<{
    totalOrders: number;
    pendingVerification: number;
    approved: number;
    rejected: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      const snapshot = await adminDb
        .collection(this.ORDERS_COLLECTION)
        .where('isVvip', '==', true)
        .get();

      let pendingVerification = 0;
      let approved = 0;
      let rejected = 0;
      let totalRevenue = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const paymentStatus = data.payment_status;

        if (paymentStatus === 'pending_verification') {
          pendingVerification++;
        } else if (paymentStatus === 'approved') {
          approved++;
          totalRevenue += data.amount_paid || 0;
        } else if (paymentStatus === 'rejected') {
          rejected++;
        }
      });

      const totalOrders = snapshot.size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / approved : 0;

      return {
        totalOrders,
        pendingVerification,
        approved,
        rejected,
        totalRevenue,
        averageOrderValue,
      };
    } catch (error) {
      console.error('Error fetching VVIP order statistics:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to fetch VVIP order statistics',
        500
      );
    }
  }

  /**
   * Update admin note for an order
   * Requirement: 5.17
   * 
   * @param orderId - Order ID to update
   * @param adminId - Admin user ID performing the action
   * @param note - Admin note to add
   * @returns Result of the operation
   */
  static async updateAdminNote(
    orderId: string,
    adminId: string,
    note: string
  ): Promise<OrderResult> {
    try {
      // Validate admin has permission
      await vvipPermissionService.validatePermission(adminId, 'approve');

      // Fetch order document
      const orderDoc = await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        throw new VvipError(
          VvipErrorCode.ORDER_NOT_FOUND,
          'Order does not exist',
          404
        );
      }

      const orderData = orderDoc.data()!;

      // Validate this is a VVIP order
      if (orderData.isVvip !== true) {
        throw new VvipError(
          VvipErrorCode.INVALID_STATE,
          'Order is not a VVIP order',
          400
        );
      }

      // Update admin note
      await adminDb
        .collection(this.ORDERS_COLLECTION)
        .doc(orderId)
        .update({
          admin_note: note,
          updated_at: Timestamp.now(),
        });

      return {
        success: true,
        message: 'Admin note updated successfully',
        orderId,
        data: {
          admin_note: note,
        },
      };
    } catch (error) {
      if (error instanceof VvipError) {
        throw error;
      }
      console.error('Error updating admin note:', error);
      throw new VvipError(
        VvipErrorCode.DATABASE_ERROR,
        'Failed to update admin note',
        500
      );
    }
  }
}

// Export singleton instance methods for convenience
export const vvipOrderService = {
  getVvipOrders: VvipOrderService.getVvipOrders.bind(VvipOrderService),
  approvePayment: VvipOrderService.approvePayment.bind(VvipOrderService),
  rejectPayment: VvipOrderService.rejectPayment.bind(VvipOrderService),
  getVvipOrderById: VvipOrderService.getVvipOrderById.bind(VvipOrderService),
  getVvipOrderStatistics: VvipOrderService.getVvipOrderStatistics.bind(VvipOrderService),
  updateAdminNote: VvipOrderService.updateAdminNote.bind(VvipOrderService),
};
