/**
 * API Route: Send Admin Notifications
 * POST /api/hierarchical-referral/admin/notifications/send
 * Requirements: 10.1 - Notification delivery endpoints for admin communications
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/hierarchical-referral/middleware/admin-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalNotificationService } from '@/lib/hierarchical-referral/services/notification-service';

interface SendNotificationRequest {
  type: 'system_update' | 'policy_change' | 'maintenance' | 'announcement' | 'dispute_resolution';
  recipients: {
    influencerIds?: string[];
    influencerType?: 'mother' | 'mini' | 'all';
    status?: 'active' | 'suspended' | 'pending' | 'all';
  };
  notification: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channels: ('email' | 'push' | 'in_app')[];
    actionUrl?: string;
    expiresAt?: string;
  };
  metadata?: {
    campaign?: string;
    category?: string;
    tags?: string[];
  };
}

export const POST = withAdminAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'ADMIN_ACTION'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Check if admin has notification sending permission
      if (!context.permissions.canSendNotifications) {
        return NextResponse.json(
          {
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to send notifications'
          },
          { status: 403 }
        );
      }

      // Parse request body
      const body: SendNotificationRequest = await request.json();

      // Validate request
      if (!body.type || !body.recipients || !body.notification) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Type, recipients, and notification are required'
          },
          { status: 400 }
        );
      }

      if (!body.notification.title || !body.notification.message) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Notification title and message are required'
          },
          { status: 400 }
        );
      }

      if (!body.notification.channels || body.notification.channels.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'At least one notification channel is required'
          },
          { status: 400 }
        );
      }

      // Send notification
      const result = await HierarchicalNotificationService.sendAdminNotification({
        type: body.type,
        recipients: body.recipients,
        notification: {
          ...body.notification,
          expiresAt: body.notification.expiresAt ? new Date(body.notification.expiresAt) : undefined
        },
        metadata: body.metadata,
        sentBy: context.user.uid,
        sentAt: new Date()
      });

      return NextResponse.json({
        success: true,
        data: {
          notificationId: result.notificationId,
          recipientCount: result.recipientCount,
          channels: body.notification.channels,
          deliveryStatus: result.deliveryStatus,
          sentBy: context.user.uid,
          sentAt: new Date().toISOString()
        },
        message: `Notification sent to ${result.recipientCount} recipients`
      });

    } catch (error: any) {
      console.error('Admin send notification error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'SEND_NOTIFICATION_FAILED',
          message: error.message || 'Failed to send notification'
        },
        { status: 500 }
      );
    }
  },
  { requiredPermissions: ['canSendNotifications'] }
);