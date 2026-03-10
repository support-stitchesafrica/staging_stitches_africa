'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import
    {
        CheckCircle,
        XCircle,
        Clock,
        RefreshCw,
        Eye,
        AlertTriangle,
        TrendingUp,
        Calendar,
        DollarSign,
        FileText,
        ChevronLeft,
        ChevronRight,
        Filter
    } from 'lucide-react';
import { toast } from 'sonner';
import
    {
        fetchPayoutHistory,
        type PayoutRecord,
        type PayoutHistoryFilters,
        type PayoutHistoryResponse,
        formatCurrency,
        formatDate,
        getStatusColor,
        getFailureSuggestions
    } from '@/lib/stripe/payout-history-service';

interface PayoutHistoryProps
{
    tailorUID: string;
}

export const PayoutHistory: React.FC<PayoutHistoryProps> = ({ tailorUID }) =>
{
    const [payoutData, setPayoutData] = useState<PayoutHistoryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
    const [filters, setFilters] = useState<PayoutHistoryFilters>({
        status: 'all',
        limit: 10,
        offset: 0
    });

    useEffect(() =>
    {
        loadPayoutHistory();
    }, [tailorUID, filters]);

    const loadPayoutHistory = async () =>
    {
        if (!tailorUID) return;

        try
        {
            setLoading(true);
            setError(null);

            const data = await fetchPayoutHistory(tailorUID, filters);
            setPayoutData(data);

            console.log('[PayoutHistory] Loaded payout data:', data);
        } catch (err: any)
        {
            console.error('[PayoutHistory] Error loading payout history:', err);
            setError(err.message || 'Failed to load payout history');
            toast.error('Failed to load payout history');
        } finally
        {
            setLoading(false);
        }
    };

    const handleStatusFilter = (status: string) =>
    {
        setFilters(prev => ({
            ...prev,
            status: status as PayoutHistoryFilters['status'],
            offset: 0 // Reset pagination
        }));
    };

    const handlePagination = (direction: 'prev' | 'next') =>
    {
        const currentOffset = filters.offset || 0;
        const limit = filters.limit || 10;

        if (direction === 'next' && payoutData?.hasMore)
        {
            setFilters(prev => ({
                ...prev,
                offset: currentOffset + limit
            }));
        } else if (direction === 'prev' && currentOffset > 0)
        {
            setFilters(prev => ({
                ...prev,
                offset: Math.max(0, currentOffset - limit)
            }));
        }
    };

    const getStatusIcon = (status: string) =>
    {
        switch (status)
        {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const renderPayoutDetails = (payout: PayoutRecord) => (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPayout(payout)}
                >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        {getStatusIcon(payout.status)}
                        <span>Payout Details - Order #{payout.orderId}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Transaction processed on {formatDate(payout.createdAt)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Status</h4>
                            <Badge className={getStatusColor(payout.status)}>
                                {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                            </Badge>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Payout Amount</h4>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(payout.vendorAmount)}
                            </p>
                        </div>
                    </div>

                    {/* Amount Breakdown */}
                    <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-3">Amount Breakdown</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm">Order Total:</span>
                                <span className="font-medium">{formatCurrency(payout.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Your Share (80%):</span>
                                <span className="font-medium text-green-600">{formatCurrency(payout.vendorAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Platform Fee (20%):</span>
                                <span className="font-medium text-gray-600">{formatCurrency(payout.platformAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-3">Transaction Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Order ID</p>
                                <p className="font-mono">{payout.orderId}</p>
                            </div>
                            {payout.stripeTransferId && (
                                <div>
                                    <p className="text-gray-500">Transfer ID</p>
                                    <p className="font-mono">{payout.stripeTransferId}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-500">Created</p>
                                <p>{formatDate(payout.createdAt)}</p>
                            </div>
                            {payout.deliveryConfirmedAt && (
                                <div>
                                    <p className="text-gray-500">Delivery Confirmed</p>
                                    <p>{formatDate(payout.deliveryConfirmedAt)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Failure Details */}
                    {payout.status === 'failed' && payout.failureDetails && (
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Failure Information</h4>
                            <Alert className="border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium text-red-900">Error Details</p>
                                            <p className="text-sm text-red-800">{payout.failureDetails.errorMessage}</p>
                                            {payout.failureDetails.errorCode && (
                                                <p className="text-xs text-red-700 mt-1">
                                                    Error Code: {payout.failureDetails.errorCode}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="font-medium text-red-900 mb-2">Suggested Actions</p>
                                            <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                                                {getFailureSuggestions(
                                                    payout.failureDetails.errorCode,
                                                    payout.failureDetails.errorType
                                                ).map((suggestion, idx) => (
                                                    <li key={idx}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {payout.failureDetails.retryable && (
                                            <div className="pt-2 border-t border-red-200">
                                                <p className="text-sm text-red-800">
                                                    ✓ This payout can be retried automatically when the issue is resolved.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Order Details */}
                    {payout.orderDetails && (
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Order Information</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Payment Status</p>
                                        <p className="capitalize">{payout.orderDetails.paymentStatus}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Currency</p>
                                        <p className="uppercase">{payout.orderDetails.currency || 'USD'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Processing Metadata */}
                    {payout.processingMetadata && (
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Processing Information</h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="font-medium">Processed by:</span> {payout.processingMetadata.processedBy}
                                    </div>
                                    <div>
                                        <span className="font-medium">Method:</span> {payout.processingMetadata.calculationMethod}
                                    </div>
                                    <div>
                                        <span className="font-medium">Platform:</span> v{payout.processingMetadata.platformVersion}
                                    </div>
                                    <div>
                                        <span className="font-medium">API:</span> {payout.processingMetadata.apiVersion}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );

    if (loading && !payoutData)
    {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Loading payout history...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {payoutData?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Earnings</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(payoutData.summary.totalEarnings)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Successful</p>
                                    <p className="text-xl font-bold">{payoutData.summary.successfulPayouts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Failed</p>
                                    <p className="text-xl font-bold">{payoutData.summary.failedPayouts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-yellow-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Pending</p>
                                    <p className="text-xl font-bold">{payoutData.summary.pendingPayouts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payout History Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5" />
                                <span>Payout History</span>
                            </CardTitle>
                            <CardDescription>
                                Track your earnings and payout transactions
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={filters.status} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadPayoutHistory}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert className="border-red-200 bg-red-50 mb-4">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                                <p className="font-medium text-red-900">Error loading payout history</p>
                                <p className="text-sm text-red-800">{error}</p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {payoutData?.payouts.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No payouts found</h3>
                            <p className="text-gray-600">
                                {filters.status === 'all'
                                    ? "You haven't received any payouts yet. Payouts are processed automatically when orders are delivered."
                                    : `No ${filters.status} payouts found. Try changing the filter or check back later.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Payout List */}
                            <div className="space-y-3">
                                {payoutData?.payouts.map((payout) => (
                                    <div
                                        key={payout.id}
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {getStatusIcon(payout.status)}
                                                <div>
                                                    <p className="font-medium">Order #{payout.orderId}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(payout.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">
                                                        {formatCurrency(payout.vendorAmount)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        from {formatCurrency(payout.totalAmount)}
                                                    </p>
                                                </div>

                                                <Badge className={getStatusColor(payout.status)}>
                                                    {payout.status}
                                                </Badge>

                                                {renderPayoutDetails(payout)}
                                            </div>
                                        </div>

                                        {payout.status === 'failed' && payout.error && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                                <p className="text-sm text-red-800">
                                                    <strong>Failed:</strong> {payout.error}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {payoutData && (payoutData.hasMore || (filters.offset || 0) > 0) && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <p className="text-sm text-gray-600">
                                        Showing {(filters.offset || 0) + 1} to{' '}
                                        {Math.min((filters.offset || 0) + (filters.limit || 10), payoutData.totalCount)} of{' '}
                                        {payoutData.totalCount} payouts
                                    </p>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePagination('prev')}
                                            disabled={(filters.offset || 0) === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePagination('next')}
                                            disabled={!payoutData.hasMore}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};