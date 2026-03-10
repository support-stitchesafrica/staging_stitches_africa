'use client';

/**
 * Product Bundling Insights Page
 * 
 * Displays bundling opportunities and cross-sell insights for vendors
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BundlingOverview } from '@/components/vendor/bundling/BundlingOverview';
import { FrequentlyBoughtTogether } from '@/components/vendor/bundling/FrequentlyBoughtTogether';
import { SuggestedBundles } from '@/components/vendor/bundling/SuggestedBundles';
import { ComplementaryProducts } from '@/components/vendor/bundling/ComplementaryProducts';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { ModernNavbar } from '@/components/vendor/modern-navbar';

export default function BundlingInsightsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchOverallStats();
    }
  }, [user]);

  const fetchOverallStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/bundling/stats?vendorId=${user?.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bundling statistics');
      }

      const data = await response.json();
      setOverallStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Bundling Insights</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ModernNavbar />
      <div>
        <h1 className="text-3xl font-bold mb-2">Product Bundling Insights</h1>
        <p className="text-muted-foreground">
          Discover cross-selling opportunities and optimize your product bundles
        </p>
      </div>

      {/* Overall Statistics */}
      <BundlingOverview stats={overallStats} />

      {/* Detailed Insights Tabs */}
      <Tabs defaultValue="frequently-bought" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frequently-bought">Frequently Bought Together</TabsTrigger>
          <TabsTrigger value="suggested-bundles">Suggested Bundles</TabsTrigger>
          <TabsTrigger value="complementary">Complementary Products</TabsTrigger>
        </TabsList>

        <TabsContent value="frequently-bought" className="space-y-4">
          <FrequentlyBoughtTogether vendorId={user?.uid || ''} />
        </TabsContent>

        <TabsContent value="suggested-bundles" className="space-y-4">
          <SuggestedBundles vendorId={user?.uid || ''} />
        </TabsContent>

        <TabsContent value="complementary" className="space-y-4">
          <ComplementaryProducts vendorId={user?.uid || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
