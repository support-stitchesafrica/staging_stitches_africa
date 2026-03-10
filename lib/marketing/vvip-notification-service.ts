// lib/marketing/vvip-notification-service.ts

/**
 * VVIP Notification Service
 * 
 * Handles all email notifications for VVIP events including:
 * - VVIP status creation
 * - Order placement
 * - Payment approval/rejection
 * - Order shipment
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
 */

import { vvipCreatedTemplate } from '@/lib/emailTemplates/vvipCreatedTemplate';
import { vvipOrderPlacedTemplate } from '@/lib/emailTemplates/vvipOrderPlacedTemplate';
import { vvipPaymentApprovedTemplate } from '@/lib/emailTemplates/vvipPaymentApprovedTemplate';
import { vvipPaymentRejectedTemplate } from '@/lib/emailTemplates/vvipPaymentRejectedTemplate';
import { vvipOrderShippedTemplate } from '@/lib/emailTemplates/vvipOrderShippedTemplate';
import {
  VvipNotificationEvent,
  VvipNotificationData,
  VvipNotificationResult,
  VvipError,
  VvipErrorCode,
} from '@/types/vvip';

/**
 * VVIP Notification Service Class
 * Provides email notification functionality for VVIP events
 */
export class VvipNotificationService {
  /**
   * Send VVIP created email
   * Requirements: 6.1
   * 
   * @param data - User data for the notification
   * @returns Result of the email send operation
   */
  static async sendVvipCreatedEmail(
    data: VvipNotificationData['vvip_created']
  ): Promise<VvipNotificationResult> {
    try {
      if (!data) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'VVIP created notification data is required',
          400
        );
      }

      const { userEmail, userName } = data;

      if (!userEmail || !userName) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'User email and name are required',
          400
        );
      }

      const html = vvipCreatedTemplate({
        customerName: userName,
        email: userEmail,
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: '⭐ Welcome to VVIP Program - Stitches Africa',
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      return {
        success: true,
        message: 'VVIP created email sent successfully',
        event: 'vvip_created',
      };
    } catch (error) {
      console.error('Error sending VVIP created email:', error);
      if (error instanceof VvipError) {
        throw error;
      }
      throw new VvipError(
        VvipErrorCode.NOTIFICATION_ERROR,
        'Failed to send VVIP created email',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Send order placed email for VVIP orders
   * Requirements: 6.2
   * 
   * @param data - Order data for the notification
   * @returns Result of the email send operation
   */
  static async sendOrderPlacedEmail(
    data: VvipNotificationData['order_placed']
  ): Promise<VvipNotificationResult> {
    try {
      if (!data) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'Order placed notification data is required',
          400
        );
      }

      const {
        userEmail,
        userName,
        orderId,
        orderDate,
        items,
        total,
        currency,
        amountPaid,
        paymentReference,
        paymentDate,
      } = data;

      if (!userEmail || !userName || !orderId) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'User email, name, and order ID are required',
          400
        );
      }

      const html = vvipOrderPlacedTemplate({
        customerName: userName,
        orderId,
        orderDate,
        items,
        total,
        currency,
        amountPaid,
        paymentReference,
        paymentDate,
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `VVIP Order Received - Order #${orderId}`,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      return {
        success: true,
        message: 'Order placed email sent successfully',
        event: 'order_placed',
      };
    } catch (error) {
      console.error('Error sending order placed email:', error);
      if (error instanceof VvipError) {
        throw error;
      }
      throw new VvipError(
        VvipErrorCode.NOTIFICATION_ERROR,
        'Failed to send order placed email',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Send payment approved email with VVIP information
   * Requirements: 6.3, 6.7
   * 
   * @param data - Payment approval data for the notification
   * @returns Result of the email send operation
   */
  static async sendPaymentApprovedEmail(
    data: VvipNotificationData['payment_approved']
  ): Promise<VvipNotificationResult> {
    try {
      if (!data) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'Payment approved notification data is required',
          400
        );
      }

      const {
        userEmail,
        userName,
        orderId,
        amountPaid,
        currency,
        paymentReference,
        adminNote,
      } = data;

      if (!userEmail || !userName || !orderId) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'User email, name, and order ID are required',
          400
        );
      }

      const html = vvipPaymentApprovedTemplate({
        customerName: userName,
        orderId,
        amountPaid,
        currency,
        paymentReference,
        adminNote,
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `✓ Payment Approved - Order #${orderId}`,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      return {
        success: true,
        message: 'Payment approved email sent successfully',
        event: 'payment_approved',
      };
    } catch (error) {
      console.error('Error sending payment approved email:', error);
      if (error instanceof VvipError) {
        throw error;
      }
      throw new VvipError(
        VvipErrorCode.NOTIFICATION_ERROR,
        'Failed to send payment approved email',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Send payment rejected email with VVIP information
   * Requirements: 6.4, 6.7
   * 
   * @param data - Payment rejection data for the notification
   * @returns Result of the email send operation
   */
  static async sendPaymentRejectedEmail(
    data: VvipNotificationData['payment_rejected']
  ): Promise<VvipNotificationResult> {
    try {
      if (!data) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'Payment rejected notification data is required',
          400
        );
      }

      const {
        userEmail,
        userName,
        orderId,
        amountPaid,
        currency,
        paymentReference,
        rejectionReason,
        adminNote,
      } = data;

      if (!userEmail || !userName || !orderId || !rejectionReason) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'User email, name, order ID, and rejection reason are required',
          400
        );
      }

      const html = vvipPaymentRejectedTemplate({
        customerName: userName,
        orderId,
        amountPaid,
        currency,
        paymentReference,
        rejectionReason,
        adminNote,
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `⚠ Payment Issue - Order #${orderId}`,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      return {
        success: true,
        message: 'Payment rejected email sent successfully',
        event: 'payment_rejected',
      };
    } catch (error) {
      console.error('Error sending payment rejected email:', error);
      if (error instanceof VvipError) {
        throw error;
      }
      throw new VvipError(
        VvipErrorCode.NOTIFICATION_ERROR,
        'Failed to send payment rejected email',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Send order shipped email for VVIP orders
   * Requirements: 6.5
   * 
   * @param data - Shipment data for the notification
   * @returns Result of the email send operation
   */
  static async sendOrderShippedEmail(
    data: VvipNotificationData['order_shipped']
  ): Promise<VvipNotificationResult> {
    try {
      if (!data) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'Order shipped notification data is required',
          400
        );
      }

      const {
        userEmail,
        userName,
        orderId,
        trackingNumber,
        carrier,
        estimatedDelivery,
        trackingUrl,
      } = data;

      if (!userEmail || !userName || !orderId) {
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          'User email, name, and order ID are required',
          400
        );
      }

      const html = vvipOrderShippedTemplate({
        customerName: userName,
        orderId,
        trackingNumber,
        carrier,
        estimatedDelivery,
        trackingUrl,
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: `🚚 Your Order Has Shipped - Order #${orderId}`,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
        }

      return {
        success: true,
        message: 'Order shipped email sent successfully',
        event: 'order_shipped',
      };
    } catch (error) {
      console.error('Error sending order shipped email:', error);
      if (error instanceof VvipError) {
        throw error;
      }
      throw new VvipError(
        VvipErrorCode.NOTIFICATION_ERROR,
        'Failed to send order shipped email',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Send notification based on event type
   * 
   * @param event - The notification event type
   * @param data - The notification data
   * @returns Result of the email send operation
   */
  static async sendNotification(
    event: VvipNotificationEvent,
    data: VvipNotificationData[VvipNotificationEvent]
  ): Promise<VvipNotificationResult> {
    switch (event) {
      case 'vvip_created':
        return this.sendVvipCreatedEmail(data as VvipNotificationData['vvip_created']);
      case 'order_placed':
        return this.sendOrderPlacedEmail(data as VvipNotificationData['order_placed']);
      case 'payment_approved':
        return this.sendPaymentApprovedEmail(data as VvipNotificationData['payment_approved']);
      case 'payment_rejected':
        return this.sendPaymentRejectedEmail(data as VvipNotificationData['payment_rejected']);
      case 'order_shipped':
        return this.sendOrderShippedEmail(data as VvipNotificationData['order_shipped']);
      default:
        throw new VvipError(
          VvipErrorCode.VALIDATION_ERROR,
          `Unknown notification event: ${event}`,
          400
        );
    }
  }
}

// Export singleton instance
export const vvipNotificationService = VvipNotificationService;
