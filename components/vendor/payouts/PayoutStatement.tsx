'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayoutRecord } from '@/types/vendor-analytics';
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatUSD } from '@/lib/utils/currency';

interface PayoutStatementProps {
  payout: PayoutRecord;
  vendorId: string;
  vendorName?: string;
  onDownload?: () => void;
}

export function PayoutStatement({
  payout,
  vendorId,
  vendorName = 'Vendor',
  onDownload
}: PayoutStatementProps) {

  const formatDate = (date: Date) => {
    return format(date, 'MMMM dd, yyyy');
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMMM dd, yyyy h:mm a');
  };

  const getStatusIcon = () => {
    switch (payout.status) {
      case 'paid':
        return <CheckCircle className="h-6 w-6 text-emerald-600" />;
      case 'processing':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (payout.status) {
      case 'paid':
        return 'text-emerald-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-gray-600" />
                <div>
                  <CardTitle className="text-2xl">Payout Statement</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Stitches Africa Marketplace
                  </p>
                </div>
              </div>
            </div>
            {onDownload && (
              <Button onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Information */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Vendor Information</p>
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900">{vendorName}</p>
                <p className="text-sm text-gray-600">Vendor ID: {vendorId}</p>
              </div>
            </div>

            {/* Statement Information */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Statement Details</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Statement ID: <span className="font-mono">{payout.id}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Generated: {formatDateTime(new Date())}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Summary */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Payout Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className={`text-lg font-bold ${getStatusColor()}`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Transfer Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(payout.transferDate)}
                </p>
              </div>
            </div>

            {/* Payment Reference */}
            {payout.paystackReference && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Payment Reference
                </p>
                <p className="text-sm font-mono text-gray-700">
                  {payout.paystackReference}
                </p>
              </div>
            )}

            {/* Failure Reason */}
            {payout.status === 'failed' && payout.failureReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-1">
                  Failure Reason
                </p>
                <p className="text-sm text-red-700">{payout.failureReason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Breakdown */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Gross Amount */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Gross Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {formatUSD(payout.amount)}
              </p>
            </div>

            {/* Deductions */}
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Platform Commission
                  </p>
                  <p className="text-xs text-gray-600">
                    {(payout.fees.commissionRate * 100).toFixed(1)}% of gross amount
                  </p>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  -{formatUSD(payout.fees.platformCommission)}
                </p>
              </div>

              {payout.fees.paymentProcessingFee > 0 && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Payment Processing Fee
                    </p>
                    <p className="text-xs text-gray-600">
                      Handled by payment provider
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-600">
                    {formatUSD(payout.fees.paymentProcessingFee)}
                  </p>
                </div>
              )}

              {payout.fees.otherFees > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Other Fees</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatUSD(payout.fees.otherFees)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900">Total Deductions</p>
                <p className="text-lg font-bold text-red-600">
                  -{formatUSD(payout.fees.totalFees)}
                </p>
              </div>
            </div>

            {/* Net Amount */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Net Amount Paid</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Amount transferred to your account
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatUSD(payout.netAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      {payout.transactions && payout.transactions.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {payout.transactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Order #{transaction.orderId}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Gross: {formatUSD(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Commission: -{formatUSD(transaction.commission)}
                    </p>
                    <p className="text-base font-bold text-emerald-600">
                      Net: {formatUSD(transaction.netAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Split Structure Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Split Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Vendor Share:</strong> 80% of gross order amount
            </p>
            <p>
              <strong>Platform Share:</strong> 20% of gross order amount
            </p>
            <p className="text-xs text-gray-600 mt-3">
              The platform commission covers operations, marketing, payment processing, 
              and platform maintenance. Payment processing fees are handled separately 
              by the payment provider (Stripe or Flutterwave).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 pt-6 border-t border-gray-200">
        <p>
          For questions about this payout, please contact{' '}
          <a
            href="mailto:support@stitchesafrica.com"
            className="text-blue-600 hover:underline"
          >
            support@stitchesafrica.com
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Document ID: {payout.id} | Generated: {formatDateTime(new Date())}
        </p>
      </div>
    </div>
  );
}
