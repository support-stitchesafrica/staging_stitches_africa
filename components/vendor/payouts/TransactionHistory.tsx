'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayoutRecord } from '@/types/vendor-analytics';
import {
  CheckCircle,
  Clock,
  XCircle,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { formatUSD } from '@/lib/utils/currency';

interface TransactionHistoryProps {
  history: PayoutRecord[];
  onDownloadStatement?: (payoutId: string) => void;
  onViewDetails?: (payoutId: string) => void;
}

export function TransactionHistory({
  history,
  onDownloadStatement,
  onViewDetails
}: TransactionHistoryProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMM dd, yyyy h:mm a');
  };

  const getStatusIcon = (status: PayoutRecord['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PayoutRecord['status']) => {
    const styles = {
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      failed: 'bg-red-100 text-red-700 border-red-200'
    };

    const labels = {
      paid: 'Paid',
      processing: 'Processing',
      failed: 'Failed'
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
          styles[status]
        }`}
      >
        {getStatusIcon(status)}
        {labels[status]}
      </span>
    );
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (history.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all your payout transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No payout history yet</p>
            <p className="text-sm text-gray-500">
              Your payout history will appear here once orders are delivered
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Complete history of all payout transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((payout) => (
            <div
              key={payout.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Main Row */}
              <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  {/* Left Section - Status and Date */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(payout.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {formatDate(payout.transferDate)}
                        </p>
                        {getStatusBadge(payout.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        ID: {payout.id}
                      </p>
                    </div>
                  </div>

                  {/* Middle Section - Amounts */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Gross</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatUSD(payout.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Fees</p>
                      <p className="text-sm font-medium text-red-600">
                        -{formatUSD(payout.fees.totalFees)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Net</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatUSD(payout.netAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Amount */}
                  <div className="md:hidden text-right">
                    <p className="text-xs text-gray-500 mb-1">Net Amount</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatUSD(payout.netAmount)}
                    </p>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onDownloadStatement && payout.status === 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadStatement(payout.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(payout.id)}
                      className="h-8 w-8 p-0"
                    >
                      {expandedRows.has(payout.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRows.has(payout.id) && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Fee Breakdown */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Fee Breakdown
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Commission:</span>
                          <span className="font-medium text-gray-900">
                            {formatUSD(payout.fees.platformCommission)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Rate:</span>
                          <span className="font-medium text-gray-900">
                            {(payout.fees.commissionRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        {payout.fees.paymentProcessingFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processing Fee:</span>
                            <span className="font-medium text-gray-900">
                              {formatUSD(payout.fees.paymentProcessingFee)}
                            </span>
                          </div>
                        )}
                        {payout.fees.otherFees > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Other Fees:</span>
                            <span className="font-medium text-gray-900">
                              {formatUSD(payout.fees.otherFees)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Payment Details
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transfer Date:</span>
                          <span className="font-medium text-gray-900">
                            {formatDateTime(payout.transferDate)}
                          </span>
                        </div>
                        {payout.paystackReference && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reference:</span>
                            <span className="font-mono text-xs text-gray-900">
                              {payout.paystackReference}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-gray-900">
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transactions */}
                  {payout.transactions && payout.transactions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Included Orders ({payout.transactions.length})
                      </p>
                      <div className="space-y-1">
                        {payout.transactions.map((transaction, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm"
                          >
                            <span className="text-gray-600">
                              Order {transaction.orderId}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-900">
                                {formatUSD(transaction.amount)}
                              </span>
                              <span className="text-emerald-600 font-medium">
                                {formatUSD(transaction.netAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failure Reason */}
                  {payout.status === 'failed' && payout.failureReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-900 mb-1">
                            Payout Failed
                          </p>
                          <p className="text-xs text-red-700">
                            {payout.failureReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(payout.id)}
                        className="text-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Statement
                      </Button>
                    )}
                    {onDownloadStatement && payout.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadStatement(payout.id)}
                        className="text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
