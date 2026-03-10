'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { PayoutStatement } from '@/components/vendor/payouts/PayoutStatement';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { PayoutService } from '@/lib/vendor/payout-service';
import { PayoutRecord } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function PayoutStatementPage() {
  const router = useRouter();
  const params = useParams();
  const statementId = params.statementId as string;
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [payout, setPayout] = useState<PayoutRecord | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>('Vendor');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('tailorToken');
    const id = localStorage.getItem('tailorUID');
    const name = localStorage.getItem('tailorName') || 'Vendor';
    
    if (!token) {
      router.push('/vendor');
      return;
    }
    
    setVendorId(id);
    setVendorName(name);
  }, [router]);

  // Fetch payout record
  useEffect(() => {
    if (!vendorId || !statementId) return;

    const fetchPayoutRecord = async () => {
      setLoading(true);
      try {
        const payoutService = new PayoutService();
        const response = await payoutService.getPayoutRecord(statementId);
        
        if (response.success && response.data) {
          setPayout(response.data);
        } else {
          toast.error(response.error?.message || 'Failed to load payout statement');
          router.push('/vendor/payouts/history');
        }
      } catch (error) {
        console.error('Error fetching payout record:', error);
        toast.error('Failed to load payout statement');
        router.push('/vendor/payouts/history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutRecord();
  }, [vendorId, statementId, router]);

  const handleDownload = async () => {
    if (!vendorId || !statementId) return;
    
    setDownloading(true);
    try {
      toast.info('Generating PDF statement...');
      const payoutService = new PayoutService();
      const response = await payoutService.generatePayoutStatement(vendorId, statementId);
      
      if (response.success && response.data) {
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-statement-${statementId}.pdf`;
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
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PayoutStatementSkeleton />
        </main>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Statement not found
            </h3>
            <p className="text-gray-600 mb-4">
              The requested payout statement could not be found
            </p>
            <Button onClick={() => router.push('/vendor/payouts/history')}>
              Back to History
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/vendor/payouts/history')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </div>

        {/* Statement */}
        <PayoutStatement
          payout={payout}
          vendorId={vendorId!}
          vendorName={vendorName}
          onDownload={handleDownload}
        />

        {/* Download Button (Mobile) */}
        <div className="mt-8 flex justify-center md:hidden">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full max-w-md gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF Statement
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

// Skeleton loading component
function PayoutStatementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Skeleton className="h-10 w-32 mb-4" />

      {/* Statement Header Skeleton */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-64 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Breakdown Skeleton */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Transactions Skeleton */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
