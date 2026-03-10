'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { BalanceDisplay } from '@/components/vendor/payouts/BalanceDisplay';
import { PayoutCalendar } from '@/components/vendor/payouts/PayoutCalendar';
import { FeeBreakdown } from '@/components/vendor/payouts/FeeBreakdown';
import { TransactionHistory } from '@/components/vendor/payouts/TransactionHistory';
import {
  DollarSign,
  TrendingUp,
  Download,
  ExternalLink,
  AlertCircle,
  History,
  Info
} from 'lucide-react';
import { PayoutService } from '@/lib/vendor/payout-service';
import { PayoutMetrics } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function PayoutDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payoutMetrics, setPayoutMetrics] = useState<PayoutMetrics | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [hasPaymentProvider, setHasPaymentProvider] = useState(false);
  const [paymentProviderDetails, setPaymentProviderDetails] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('tailorToken');
    const id = localStorage.getItem('tailorUID');
    
    if (!token) {
      router.push('/vendor');
      return;
    }
    
    setVendorId(id);
  }, [router]);

  // Fetch payout metrics and payment provider status
  useEffect(() => {
    if (!vendorId) return;

    const fetchPayoutData = async () => {
      setLoading(true);
      try {
        const payoutService = new PayoutService();
        
        // Check payment provider configuration
        const providerResponse = await payoutService.hasPaymentProviderConfigured(vendorId);
        if (providerResponse.success && providerResponse.data) {
          setHasPaymentProvider(providerResponse.data.hasProvider);
          setPaymentProviderDetails(providerResponse.data.details);
        }

        // Fetch payout details
        const response = await payoutService.getPayoutDetails(vendorId);
        
        if (response.success && response.data) {
          setPayoutMetrics(response.data);
        } else {
          toast.error(response.error?.message || 'Failed to load payout data');
        }
      } catch (error) {
        console.error('Error fetching payout data:', error);
        toast.error('Failed to load payout data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutData();
  }, [vendorId]);

  const handleDownloadStatement = async (payoutId: string) => {
    if (!vendorId) return;
    
    try {
      toast.info('Generating statement...');
      const payoutService = new PayoutService();
      const response = await payoutService.generatePayoutStatement(vendorId, payoutId);
      
      if (response.success && response.data) {
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-statement-${payoutId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Statement downloaded successfully');
      } else {
        toast.error('Failed to generate statement');
      }
    } catch (error) {
      console.error('Statement generation error:', error);
      toast.error('Failed to generate statement');
    }
  };

  const handleViewDetails = (payoutId: string) => {
    router.push(`/vendor/payouts/statements/${payoutId}`);
  };

  const handleExportHistory = async () => {
    if (!vendorId) return;
    
    try {
      toast.info('Preparing export...');
      const payoutService = new PayoutService();
      const response = await payoutService.exportPayoutHistory(vendorId);
      
      if (response.success && response.data) {
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Export downloaded successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PayoutDashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!payoutMetrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load payout data
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading your payout information
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payouts
              </h1>
              <p className="text-gray-600 text-lg">
                Track your earnings, payouts, and transaction history
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/vendor/payouts/history')}
                className="border-gray-300 hover:bg-gray-50"
              >
                <History className="h-4 w-4 mr-2" />
                Full History
              </Button>
              <Button
                variant="outline"
                onClick={handleExportHistory}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Provider Warning */}
        {!hasPaymentProvider && (
          <Card className="border-amber-200 bg-amber-50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Payment Provider Not Configured
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    To receive payouts, you need to set up either Stripe Connect or Flutterwave. 
                    This allows us to automatically transfer your earnings when orders are delivered.
                  </p>
                  <Button
                    onClick={() => router.push('/vendor/settings')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Set Up Payment Provider
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Display */}
        <div className="mb-8">
          <BalanceDisplay metrics={payoutMetrics} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payout Calendar */}
          <PayoutCalendar calendar={payoutMetrics.calendar} />

          {/* Fee Breakdown */}
          <FeeBreakdown
            fees={payoutMetrics.payoutHistory[0]?.fees || {
              platformCommission: 0,
              commissionRate: 0.20,
              paymentProcessingFee: 0,
              otherFees: 0,
              totalFees: 0
            }}
            grossAmount={payoutMetrics.payoutHistory[0]?.amount || 0}
            showDetails={true}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(payoutMetrics.totalEarnings)}
              </p>
              <p className="text-sm text-gray-600">
                Lifetime gross earnings
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(payoutMetrics.totalFees)}
              </p>
              <p className="text-sm text-gray-600">
                Platform commissions
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {formatCurrency(payoutMetrics.totalEarnings - payoutMetrics.totalFees)}
              </p>
              <p className="text-sm text-gray-600">
                Total paid to you
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transaction History */}
        <TransactionHistory
          history={payoutMetrics.payoutHistory.slice(0, 10)}
          onDownloadStatement={handleDownloadStatement}
          onViewDetails={handleViewDetails}
        />

        {/* Info Section */}
        <Card className="border-blue-200 bg-blue-50 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-blue-600" />
              How Payouts Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-1">Automatic Processing</p>
                <p>
                  Payouts are automatically processed when DHL confirms delivery of your orders. 
                  You don't need to request payouts manually.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Split Structure</p>
                <p>
                  You receive 80% of the gross order amount. The platform retains 20% to cover 
                  operations, marketing, and platform maintenance.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Payment Providers</p>
                <p>
                  We support both Stripe Connect and Flutterwave. Set up your preferred provider 
                  in settings to start receiving payouts.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Questions?</p>
                <p>
                  Contact{' '}
                  <a
                    href="mailto:support@stitchesafrica.com"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    support@stitchesafrica.com
                  </a>{' '}
                  for assistance with payouts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Skeleton loading component
function PayoutDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Balance Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-6 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-32 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
