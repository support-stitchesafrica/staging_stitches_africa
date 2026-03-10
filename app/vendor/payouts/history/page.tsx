'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { TransactionHistory } from '@/components/vendor/payouts/TransactionHistory';
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PayoutService } from '@/lib/vendor/payout-service';
import { PayoutRecord } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function PayoutHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PayoutRecord[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'processing' | 'failed'>('all');

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

  // Fetch payout history
  useEffect(() => {
    if (!vendorId) return;

    const fetchPayoutHistory = async () => {
      setLoading(true);
      try {
        const payoutService = new PayoutService();
        const history = await payoutService.getPayoutHistory(vendorId, 1000);
        
        setPayoutHistory(history);
        setFilteredHistory(history);
      } catch (error) {
        console.error('Error fetching payout history:', error);
        toast.error('Failed to load payout history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutHistory();
  }, [vendorId]);

  // Filter history based on search and status
  useEffect(() => {
    let filtered = payoutHistory;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payout => payout.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payout =>
        payout.id.toLowerCase().includes(query) ||
        payout.paystackReference.toLowerCase().includes(query) ||
        payout.transferDate.toLocaleDateString().toLowerCase().includes(query)
      );
    }

    setFilteredHistory(filtered);
  }, [payoutHistory, searchQuery, statusFilter]);

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

  const handleExportAll = async () => {
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

  // Calculate summary stats
  const stats = {
    total: filteredHistory.length,
    paid: filteredHistory.filter(p => p.status === 'paid').length,
    processing: filteredHistory.filter(p => p.status === 'processing').length,
    failed: filteredHistory.filter(p => p.status === 'failed').length,
    totalAmount: filteredHistory.reduce((sum, p) => sum + p.netAmount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PayoutHistorySkeleton />
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
          <Button
            variant="ghost"
            onClick={() => router.push('/vendor/payouts')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payouts
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payout History
              </h1>
              <p className="text-gray-600 text-lg">
                Complete history of all payout transactions
              </p>
            </div>
            
            <Button
              onClick={handleExportAll}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-700 mb-1">Paid</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 mb-1">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-700 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.totalAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by ID, reference, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('paid')}
                  className={statusFilter === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  Paid
                </Button>
                <Button
                  variant={statusFilter === 'processing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('processing')}
                  className={statusFilter === 'processing' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Processing
                </Button>
                <Button
                  variant={statusFilter === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('failed')}
                  className={statusFilter === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Failed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        {filteredHistory.length > 0 ? (
          <TransactionHistory
            history={filteredHistory}
            onDownloadStatement={handleDownloadStatement}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <Card className="border-gray-200">
            <CardContent className="py-12">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No payouts found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your payout history will appear here once orders are delivered'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// Skeleton loading component
function PayoutHistorySkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* History Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
