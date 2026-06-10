'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReferralAnalyticsService } from '@/lib/atlas/unified-analytics/services/referral-analytics-service';

export default function ReferralAnalyticsDebugPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testReferrersList = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing getReferrersList...');
      const result = await ReferralAnalyticsService.getReferrersList(5);
      console.log('getReferrersList result:', result);
      setResults({ type: 'referrersList', data: result });
    } catch (err) {
      console.error('getReferrersList error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testReferralDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get a referrer ID from the list
      console.log('Getting referrers list first...');
      const referrersList = await ReferralAnalyticsService.getReferrersList(1);
      
      if (referrersList.referrers.length > 0) {
        const referrerId = referrersList.referrers[0].id;
        console.log('Testing getReferralDetails with ID:', referrerId);
        
        const result = await ReferralAnalyticsService.getReferralDetails(referrerId);
        console.log('getReferralDetails result:', result);
        setResults({ type: 'referralDetails', data: result });
      } else {
        setError('No referrers found to test with');
      }
    } catch (err) {
      console.error('getReferralDetails error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing getReferralAnalytics...');
      const dateRange = {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      };
      const result = await ReferralAnalyticsService.getReferralAnalytics(dateRange);
      console.log('getReferralAnalytics result:', result);
      setResults({ type: 'analyticsData', data: result });
    } catch (err) {
      console.error('getReferralAnalytics error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Referral Analytics Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={testReferrersList} 
          disabled={loading}
          variant="outline"
        >
          Test Referrers List
        </Button>
        
        <Button 
          onClick={testReferralDetails} 
          disabled={loading}
          variant="outline"
        >
          Test Referral Details
        </Button>
        
        <Button 
          onClick={testAnalyticsData} 
          disabled={loading}
          variant="outline"
        >
          Test Analytics Data
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results: {results.type}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}