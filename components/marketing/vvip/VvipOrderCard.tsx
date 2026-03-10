"use client";

import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { VvipOrderCardProps } from '@/types/vvip';

/**
 * VvipOrderCard Component
 * 
 * Displays VVIP order information with payment proof and admin actions.
 * Requirements: 5.5, 5.6, 5.7, 5.8, 5.9
 */
export function VvipOrderCard({ 
  order, 
  userRole, 
  onApprove, 
  onReject, 
  onViewProof 
}: VvipOrderCardProps) {
  const [adminNote, setAdminNote] = useState(order.admin_note || '');
  const [isProcessing, setIsProcessing] = useState(false);

  // Format dates
  const orderDate = order.created_at?.toDate?.() || 
                   (order.created_at as any)?.seconds ? 
                   new Date((order.created_at as any).seconds * 1000) : 
                   new Date();

  const paymentDate = order.payment_date?.toDate?.() || 
                     (order.payment_date as any)?.seconds ? 
                     new Date((order.payment_date as any).seconds * 1000) : 
                     new Date();

  // Determine if user can perform actions
  const canApprove = (userRole === 'super_admin' || userRole === 'bdm') && 
                    order.payment_status === 'pending_verification';
  const canReject = (userRole === 'super_admin' || userRole === 'bdm') && 
                   order.payment_status === 'pending_verification';

  // Get status badge variant and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' };
      case 'approved':
        return { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' };
      case 'rejected':
        return { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' };
      default:
        return { variant: 'secondary' as const, icon: AlertCircle, color: 'text-gray-600' };
    }
  };

  const statusBadge = getStatusBadge(order.payment_status);
  const StatusIcon = statusBadge.icon;

  // Handle approve action
  const handleApprove = async () => {
    if (!onApprove) return;
    
    setIsProcessing(true);
    try {
      await onApprove(order.orderId, adminNote || undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!onReject || !adminNote.trim()) return;
    
    setIsProcessing(true);
    try {
      await onReject(order.orderId, adminNote);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Order #{order.orderId.slice(-8)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {order.user_name || order.user_email || 'Unknown User'}
              </p>
            </div>
          </div>
          <Badge variant={statusBadge.variant} className="flex items-center space-x-1">
            <StatusIcon className={`w-3 h-3 ${statusBadge.color}`} />
            <span className="capitalize">{order.payment_status.replace('_', ' ')}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-medium">
              {format(orderDate, 'MMM dd, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">
              ${order.amount_paid?.toLocaleString() || order.total?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm">Payment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Payment Date:</span>
              <span className="ml-2 font-medium">
                {format(paymentDate, 'MMM dd, yyyy')}
              </span>
            </div>
            {order.payment_reference && (
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <span className="ml-2 font-medium">{order.payment_reference}</span>
              </div>
            )}
          </div>
          
          {/* Payment Proof */}
          {order.payment_proof_url && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Payment Proof:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProof?.(order.payment_proof_url)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Proof
              </Button>
            </div>
          )}
        </div>

        {/* Admin Note */}
        {(canApprove || canReject || order.admin_note) && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Note</label>
            {canApprove || canReject ? (
              <Textarea
                placeholder="Add a note about this payment verification..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="min-h-[80px]"
              />
            ) : order.admin_note ? (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                {order.admin_note}
              </div>
            ) : null}
          </div>
        )}

        {/* Verification Info */}
        {order.payment_verified_by && order.payment_verified_at && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>
              Verified by {order.payment_verified_by} on{' '}
              {format(
                order.payment_verified_at?.toDate?.() || 
                new Date((order.payment_verified_at as any).seconds * 1000),
                'MMM dd, yyyy HH:mm'
              )}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {(canApprove || canReject) && (
          <div className="flex space-x-2 pt-2 border-t">
            {canApprove && onApprove && (
              <Button
                variant="default"
                size="sm"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isProcessing ? 'Approving...' : 'Approve Payment'}
              </Button>
            )}
            
            {canReject && onReject && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={isProcessing || !adminNote.trim()}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isProcessing ? 'Rejecting...' : 'Reject Payment'}
              </Button>
            )}
          </div>
        )}

        {/* Read-only indicator for team members */}
        {userRole === 'team_member' && (
          <div className="text-xs text-muted-foreground text-center py-2 border-t">
            Read-only access
          </div>
        )}
      </CardContent>
    </Card>
  );
}