"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, TrendingUp, DollarSign, CheckCircle, XCircle, Download } from 'lucide-react';
import { VoucherRepository } from '@/lib/suregifts/voucher-repository';
import { VoucherAdminLog } from '@/types/suregifts';

export function VoucherAnalyticsDashboard() {
  const [logs, setLogs] = useState<VoucherAdminLog[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalRedemptions: number;
    totalAmountRedeemed: number;
    successfulRedemptions: number;
    failedRedemptions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [logsData, analyticsData] = await Promise.all([
        VoucherRepository.getAdminLogs(50),
        VoucherRepository.getVoucherAnalytics()
      ]);

      setLogs(logsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load voucher data:', err);
      setError('Failed to load voucher analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Date', 'Voucher Code', 'Order ID', 'Customer Email', 'Amount', 'Transaction ID', 'Status'];
    const rows = logs.map(log => [
      log.timestamp.toLocaleString(),
      log.voucherCode,
      log.orderId,
      log.customerEmail,
      log.amountRedeemed.toFixed(2),
      log.transactionId,
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-redemptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const successRate = analytics 
    ? ((analytics.successfulRedemptions / analytics.totalRedemptions) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">
                {analytics?.totalRedemptions || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">
                ${(analytics?.totalAmountRedeemed || 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{successRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.successfulRedemptions || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold">
                {analytics?.failedRedemptions || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Redemptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Voucher Redemptions</CardTitle>
              <CardDescription>
                Latest 50 voucher transactions
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No voucher redemptions yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium">Date</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Voucher Code</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Order ID</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Customer</th>
                      <th className="text-right py-2 px-4 text-sm font-medium">Amount</th>
                      <th className="text-center py-2 px-4 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {log.voucherCode}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-xs">
                          {log.orderId}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {log.customerEmail}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          ${log.amountRedeemed.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="flex items-center gap-1 w-fit mx-auto"
                          >
                            {log.status === 'success' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}