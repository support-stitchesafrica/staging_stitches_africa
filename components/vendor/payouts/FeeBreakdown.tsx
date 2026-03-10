'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeeBreakdown as FeeBreakdownType } from '@/types/vendor-analytics';
import { Info, TrendingDown, CreditCard, DollarSign } from 'lucide-react';
import { formatUSD } from '@/lib/utils/currency';

interface FeeBreakdownProps {
  fees: FeeBreakdownType;
  grossAmount: number;
  showDetails?: boolean;
}

export function FeeBreakdown({
  fees,
  grossAmount,
  showDetails = true
}: FeeBreakdownProps) {

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const netAmount = grossAmount - fees.totalFees;

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-600" />
          Fee Breakdown
        </CardTitle>
        <CardDescription>
          Detailed breakdown of platform fees and commissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gross Amount */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Amount</p>
              <p className="text-xs text-gray-500 mt-1">Total order value</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatUSD(grossAmount)}
            </p>
          </div>

          {showDetails && (
            <>
              {/* Platform Commission */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Platform Commission
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(fees.commissionRate)} of gross amount
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  -{formatUSD(fees.platformCommission)}
                </p>
              </div>

              {/* Payment Processing Fee */}
              {fees.paymentProcessingFee > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Payment Processing Fee
                      </p>
                      <p className="text-xs text-gray-500">
                        Handled by payment provider
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-600">
                    {formatUSD(fees.paymentProcessingFee)}
                  </p>
                </div>
              )}

              {/* Other Fees */}
              {fees.otherFees > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Info className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Other Fees
                      </p>
                      <p className="text-xs text-gray-500">
                        Additional charges
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatUSD(fees.otherFees)}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 my-2" />
            </>
          )}

          {/* Total Fees */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Total Deductions</p>
              <p className="text-xs text-gray-600 mt-1">
                All fees and commissions
              </p>
            </div>
            <p className="text-xl font-bold text-red-600">
              -{formatUSD(fees.totalFees)}
            </p>
          </div>

          {/* Net Amount */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Net Amount</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                Amount paid to you (80% of gross)
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatUSD(netAmount)}
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700">
                <p className="font-medium mb-1">Split Structure</p>
                <p>
                  Vendors receive 80% of the gross order amount. The platform retains 20% 
                  to cover operations, marketing, and platform maintenance. Payment processing 
                  fees are handled separately by the payment provider.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
