'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { PayoutMetrics } from '@/types/vendor-analytics';
import { formatUSD } from '@/lib/utils/currency';

interface BalanceDisplayProps {
  metrics: PayoutMetrics;
}

export function BalanceDisplay({ metrics }: BalanceDisplayProps) {

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const totalBalance = metrics.pendingBalance + metrics.availableBalance;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Balance */}
      <Card className="border-gray-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Balance
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatUSD(totalBalance)}
          </p>
          <p className="text-sm text-gray-600">
            Pending + Available
          </p>
        </CardContent>
      </Card>

      {/* Available Balance */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available Balance
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatUSD(metrics.availableBalance)}
          </p>
          <p className="text-sm text-emerald-600 font-medium">
            Ready for payout
          </p>
        </CardContent>
      </Card>

      {/* Pending Balance */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Balance
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatUSD(metrics.pendingBalance)}
          </p>
          <p className="text-sm text-gray-600">
            Awaiting delivery
          </p>
        </CardContent>
      </Card>

      {/* Next Payout */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Next Payout
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <AlertCircle className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatUSD(metrics.nextPayoutAmount)}
          </p>
          <p className="text-sm text-gray-600">
            {formatDate(metrics.nextPayoutDate)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
