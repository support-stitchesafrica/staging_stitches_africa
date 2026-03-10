"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, Edit, Trash2, Power, PowerOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/firebase';
import { Coupon } from '@/types/coupon';
import { EditCouponDialog } from './EditCouponDialog';

interface CouponDetailsDialogProps {
  couponId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCouponUpdated: () => void;
}

export function CouponDetailsDialog({
  couponId,
  open,
  onOpenChange,
  onCouponUpdated
}: CouponDetailsDialogProps) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (open && couponId) {
      fetchCoupon();
    }
  }, [open, couponId]);

  const fetchCoupon = async () => {
    if (!couponId) return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/atlas/coupons/${couponId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Coupon fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch coupon: ${response.status}`);
      }

      const data = await response.json();
      setCoupon(data.coupon);
    } catch (error) {
      console.error('Error fetching coupon:', error);
      toast.error('Failed to load coupon details');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!couponId) return;

    try {
      setActionLoading('resend');
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/atlas/coupons/${couponId}/resend-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend email');
      }

      toast.success('Email sent successfully!');
      fetchCoupon();
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!coupon) return;

    const newStatus = coupon.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    try {
      setActionLoading('toggle');
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/atlas/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update coupon');
      }

      toast.success(`Coupon ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'} successfully`);
      fetchCoupon();
      onCouponUpdated();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update coupon status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!coupon) return;

    if (!confirm(`Are you sure you want to delete coupon ${coupon.couponCode}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading('delete');
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/atlas/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete coupon');
      }

      toast.success('Coupon deleted successfully');
      onOpenChange(false);
      onCouponUpdated();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Active' },
      USED: { variant: 'secondary', label: 'Used' },
      EXPIRED: { variant: 'destructive', label: 'Expired' },
      DISABLED: { variant: 'outline', label: 'Disabled' }
    };

    const config = variants[status] || variants.ACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading || !coupon) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Coupon Details</span>
              {getStatusBadge(coupon.status)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Coupon Code */}
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Coupon Code</p>
              <p className="text-3xl font-bold font-mono text-gray-900">{coupon.couponCode}</p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p className="text-lg font-semibold">
                  {coupon.discountType === 'PERCENTAGE'
                    ? `${coupon.discountValue}%`
                    : formatCurrency(coupon.discountValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned Email</p>
                <p className="text-lg font-semibold truncate">{coupon.assignedEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Usage</p>
                <p className="text-lg font-semibold">
                  {coupon.timesUsed} / {coupon.usageLimit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minimum Order</p>
                <p className="text-lg font-semibold">
                  {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : 'None'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiry Date</p>
                <p className="text-lg font-semibold">{formatDate(coupon.expiryDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-lg font-semibold">{formatDate(coupon.createdAt)}</p>
              </div>
            </div>

            <Separator />

            {/* Email Status */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Email Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {coupon.emailSent ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Sent {coupon.emailSentAt ? `on ${formatDate(coupon.emailSentAt)}` : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">
                          Not sent {coupon.emailError ? `- ${coupon.emailError}` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendEmail}
                  disabled={actionLoading === 'resend'}
                >
                  {actionLoading === 'resend' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span className="ml-2">Resend</span>
                </Button>
              </div>
            </div>

            {/* Usage History */}
            {coupon.usageHistory && coupon.usageHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Usage History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Order Amount</TableHead>
                        <TableHead>Discount Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupon.usageHistory.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{record.orderId}</TableCell>
                          <TableCell>{formatDate(record.usedAt)}</TableCell>
                          <TableCell>{formatCurrency(record.orderAmount)}</TableCell>
                          <TableCell className="text-green-600 font-semibold">
                            -{formatCurrency(record.discountApplied)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                  disabled={!!actionLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleStatus}
                  disabled={actionLoading === 'toggle' || coupon.status === 'USED'}
                >
                  {actionLoading === 'toggle' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : coupon.status === 'ACTIVE' ? (
                    <PowerOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  {coupon.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                </Button>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditCouponDialog
        coupon={coupon}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onCouponUpdated={() => {
          fetchCoupon();
          onCouponUpdated();
        }}
      />
    </>
  );
}
