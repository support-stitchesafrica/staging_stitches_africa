'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  DollarSign,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Filter,
  Download,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { VvipOrder, OrderFilters, PaymentStatus } from '@/types/vvip';
import { toast } from 'sonner';

/**
 * VVIP Orders Page
 * 
 * Displays all VVIP orders with payment verification capabilities.
 * Allows authorized users to approve/reject payments and view payment proofs.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 10.4
 */

export default function VvipOrdersPage() {
  const router = useRouter();
  const { marketingUser } = useMarketingAuth();
  
  // Data state
  const [orders, setOrders] = useState<VvipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VvipOrder | null>(null);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  
  // Permissions
  const [userPermissions, setUserPermissions] = useState({
    canView: false,
    canApprove: false,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load orders and permissions
  const loadData = async (showLoader = true) => {
    if (!marketingUser?.uid) return;

    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      // Load permissions
      const permissionsResponse = await fetch('/api/marketing/vvip/permissions');
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setUserPermissions({
          canView: permissionsData.canView,
          canApprove: permissionsData.canApprove,
        });
      }

      // Load orders if user has permission
      if (userPermissions.canView || permissionsResponse.ok) {
        const ordersResponse = await fetch('/api/marketing/vvip/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }
      }
    } catch (error) {
      console.error('Error loading VVIP orders:', error);
      toast.error('Failed to load VVIP orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const newFilters: OrderFilters = {};
    
    if (selectedStatus && selectedStatus !== 'all') {
      newFilters.payment_status = selectedStatus as PaymentStatus;
    }
    
    if (dateRange.start && dateRange.end) {
      newFilters.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      };
    }
    
    setFilters(newFilters);
    loadData(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSelectedStatus('all');
    setDateRange({ start: '', end: '' });
    loadData(false);
  };

  // Handle payment approval
  const handleApprovePayment = async () => {
    if (!selectedOrder) return;

    setProcessingAction(true);
    try {
      const response = await fetch('/api/marketing/vvip/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
          admin_note: adminNote.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Payment approved successfully');
        setShowApprovalDialog(false);
        setSelectedOrder(null);
        setAdminNote('');
        loadData(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve payment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async () => {
    if (!selectedOrder || !adminNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingAction(true);
    try {
      const response = await fetch('/api/marketing/vvip/orders/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
          admin_note: adminNote.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Payment rejected successfully');
        setShowRejectionDialog(false);
        setSelectedOrder(null);
        setAdminNote('');
        loadData(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject payment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VVIP Orders</h1>
            <p className="text-gray-600 mt-2">Review and manage manual payments</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // No permissions state
  if (!userPermissions.canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600 max-w-md">
          You don't have permission to view VVIP orders. Please contact your administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VVIP Orders</h1>
            <p className="text-gray-600 mt-2">
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Payment Status Filter */}
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus as any}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Apply
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            VVIP Orders
          </CardTitle>
          <CardDescription>
            Manual payment orders requiring verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No VVIP orders found</p>
              <p className="text-sm">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Order Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Order #{order.orderId}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {order.user_name || order.user_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {order.created_at.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(order.payment_status)}
                      </div>

                      {/* Payment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Amount Paid</div>
                          <div className="font-medium flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${order.amount_paid.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Payment Reference</div>
                          <div className="font-medium">
                            {order.payment_reference || 'Not provided'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Payment Date</div>
                          <div className="font-medium">
                            {order.payment_date.toDate().toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Admin Note */}
                      {order.admin_note && (
                        <div className="bg-blue-50 p-3 rounded mb-4">
                          <div className="text-sm text-blue-600 font-medium mb-1">Admin Note:</div>
                          <div className="text-sm text-blue-800">{order.admin_note}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {/* View Payment Proof */}
                      <Dialog open={showPaymentProof && selectedOrder?.orderId === order.orderId} onOpenChange={setShowPaymentProof}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-2"
                          >
                            <ImageIcon className="w-4 h-4" />
                            View Proof
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Payment Proof</DialogTitle>
                            <DialogDescription>
                              Order #{order.orderId} - ${order.amount_paid.toFixed(2)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <img
                              src={order.payment_proof_url}
                              alt="Payment proof"
                              className="w-full h-auto rounded-lg border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden text-center py-8 text-gray-500">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>Unable to display payment proof</p>
                              <a
                                href={order.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Open in new tab
                              </a>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Approve/Reject Actions */}
                      {userPermissions.canApprove && order.payment_status === 'pending_verification' && (
                        <>
                          {/* Approve Dialog */}
                          <Dialog open={showApprovalDialog && selectedOrder?.orderId === order.orderId} onOpenChange={setShowApprovalDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Payment</DialogTitle>
                                <DialogDescription>
                                  Confirm payment approval for Order #{order.orderId}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded">
                                  <div className="font-medium">Payment Details:</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Amount: ${order.amount_paid.toFixed(2)}<br />
                                    Reference: {order.payment_reference || 'Not provided'}<br />
                                    Date: {order.payment_date.toDate().toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="approve-note">Admin Note (Optional)</Label>
                                  <Textarea
                                    id="approve-note"
                                    placeholder="Add any notes about this approval..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleApprovePayment}
                                    disabled={processingAction}
                                    className="flex items-center gap-2"
                                  >
                                    {processingAction ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Confirm Approval
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowApprovalDialog(false);
                                      setAdminNote('');
                                    }}
                                    disabled={processingAction}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Reject Dialog */}
                          <Dialog open={showRejectionDialog && selectedOrder?.orderId === order.orderId} onOpenChange={setShowRejectionDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Payment</DialogTitle>
                                <DialogDescription>
                                  Provide a reason for rejecting Order #{order.orderId}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-red-50 p-4 rounded">
                                  <div className="font-medium">Payment Details:</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Amount: ${order.amount_paid.toFixed(2)}<br />
                                    Reference: {order.payment_reference || 'Not provided'}<br />
                                    Date: {order.payment_date.toDate().toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="reject-note">Rejection Reason (Required)</Label>
                                  <Textarea
                                    id="reject-note"
                                    placeholder="Please provide a clear reason for rejection..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleRejectPayment}
                                    disabled={processingAction || !adminNote.trim()}
                                    variant="destructive"
                                    className="flex items-center gap-2"
                                  >
                                    {processingAction ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                    Confirm Rejection
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowRejectionDialog(false);
                                      setAdminNote('');
                                    }}
                                    disabled={processingAction}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}