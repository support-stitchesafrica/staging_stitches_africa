import { useState, useEffect } from 'react';

interface InstagramInsights {
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
  followerCount: number;
  engagement: number;
}

export function useInstagramInsights() {
  const [data, setData] = useState<InstagramInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        const response = await fetch('/api/instagram/insights');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Instagram insights');
        }

        const insights = await response.json();
        setData(insights);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
