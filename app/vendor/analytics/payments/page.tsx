'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentMethodsOverview } from '@/components/vendor/analytics/PaymentMethodsOverview';
import { PaymentSuccessRates } from '@/components/vendor/analytics/PaymentSuccessRates';
import { PaymentMethodsBySegment } from '@/components/vendor/analytics/PaymentMethodsBySegment';
import { PaymentMethodTrends } from '@/components/vendor/analytics/PaymentMethodTrends';
import { PaymentAbandonmentChart } from '@/components/vendor/analytics/PaymentAbandonmentChart';
import { DateRangePicker } from '@/components/vendor/shared/DateRangePicker';
import { ExportButton } from '@/components/vendor/shared/ExportButton';
import { DateRange as ReactDayPickerDateRange } from 'react-day-picker';
import { CreditCard, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { ModernNavbar } from '@/components/vendor/modern-navbar';

export default function PaymentAnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<ReactDayPickerDateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && dateRange?.from && dateRange?.to) {
      fetchSummary();
    }
  }, [user?.uid, dateRange]);

  const fetchSummary = async () => {
    if (!user?.uid || !dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: user.uid,
          dateRange: {
            start: dateRange.from,
            end: dateRange.to,
            preset: 'custom'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    try {
      const response = await fetch('/api/vendor/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: user?.uid,
          dataType: 'payments',
          format,
          dateRange: {
            start: dateRange.from,
            end: dateRange.to,
            preset: 'custom'
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-insights-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to view payment analytics</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ModernNavbar />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Method Insights</h1>
          <p className="text-muted-foreground mt-1">
            Understand customer payment preferences and optimize checkout experience
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ExportButton
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Methods
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : summary?.totalMethods || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active payment options
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${summary?.overallSuccessRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall payment success
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Popular
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : summary?.mostPopular || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Preferred payment method
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Abandonment Rate
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${summary?.overallAbandonmentRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average across methods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="success-rates">Success Rates</TabsTrigger>
          <TabsTrigger value="segments">By Customer Segment</TabsTrigger>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="abandonment">Abandonment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {dateRange?.from && dateRange?.to && (
            <PaymentMethodsOverview 
              vendorId={user.uid} 
              dateRange={{
                start: dateRange.from,
                end: dateRange.to,
                preset: 'custom'
              }} 
            />
          )}
        </TabsContent>

        <TabsContent value="success-rates" className="space-y-4">
          {dateRange?.from && dateRange?.to && (
            <PaymentSuccessRates 
              vendorId={user.uid} 
              dateRange={{
                start: dateRange.from,
                end: dateRange.to,
                preset: 'custom'
              }} 
            />
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {dateRange?.from && dateRange?.to && (
            <PaymentMethodsBySegment 
              vendorId={user.uid} 
              dateRange={{
                start: dateRange.from,
                end: dateRange.to,
                preset: 'custom'
              }} 
            />
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {dateRange?.from && dateRange?.to && (
            <PaymentMethodTrends 
              vendorId={user.uid} 
              dateRange={{
                start: dateRange.from,
                end: dateRange.to,
                preset: 'custom'
              }} 
            />
          )}
        </TabsContent>

        <TabsContent value="abandonment" className="space-y-4">
          {dateRange?.from && dateRange?.to && (
            <PaymentAbandonmentChart 
              vendorId={user.uid} 
              dateRange={{
                start: dateRange.from,
                end: dateRange.to,
                preset: 'custom'
              }} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
