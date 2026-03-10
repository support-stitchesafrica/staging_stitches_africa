/**
 * API Route: Real-time Analytics Data Streaming
 * GET /api/hierarchical-referral/analytics/stream/[influencerId]
 * Requirements: 3.1 - Real-time data streaming for dashboard updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { HierarchicalRealTimeDashboardService } from '@/lib/hierarchical-referral/services/real-time-dashboard-service';

interface RouteParams {
  params: {
    influencerId: string;
  };
}

export const GET = withHierarchicalAuth(
  async (request: NextRequest, context, { params }: RouteParams) => {
    try {
      const { influencerId } = params;

      // Ensure user can only access their own stream or is admin
      if (context.user.uid !== influencerId && context.user.influencerType !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'You can only access your own real-time stream'
          },
          { status: 403 }
        );
      }

      // Set up Server-Sent Events headers
      const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Create a readable stream for SSE
      const stream = new ReadableStream({
        start(controller) {
          // Send initial connection message
          controller.enqueue(`data: ${JSON.stringify({
            type: 'connection',
            message: 'Connected to real-time analytics stream',
            timestamp: new Date().toISOString()
          })}\n\n`);

          // Set up real-time listener
          const unsubscribe = HierarchicalRealTimeDashboardService.subscribeToRealTimeUpdates(
            influencerId,
            (update) => {
              try {
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'update',
                  data: update,
                  timestamp: new Date().toISOString()
                })}\n\n`);
              } catch (error) {
                console.error('Error sending SSE update:', error);
              }
            }
          );

          // Send periodic heartbeat
          const heartbeatInterval = setInterval(() => {
            try {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (error) {
              console.error('Error sending heartbeat:', error);
              clearInterval(heartbeatInterval);
            }
          }, 30000); // Every 30 seconds

          // Clean up on close
          request.signal.addEventListener('abort', () => {
            clearInterval(heartbeatInterval);
            unsubscribe();
            controller.close();
          });
        }
      });

      return new NextResponse(stream, { headers });

    } catch (error: any) {
      console.error('Real-time stream error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'STREAM_FAILED',
          message: error.message || 'Failed to establish real-time stream'
        },
        { status: 500 }
      );
    }
  },
  { requireInfluencerProfile: true }
);