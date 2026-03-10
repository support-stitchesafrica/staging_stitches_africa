/**
 * Instagram Insights Service
 * Fetches data from Facebook Graph API for Instagram Business accounts
 */

interface InstagramInsights {
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
  followerCount: number;
  engagement: number;
}

interface InstagramMetric {
  name: string;
  period: string;
  values: Array<{
    value: number;
    end_time: string;
  }>;
}

/**
 * Fetch Instagram insights for the last 30 days
 */
export async function getInstagramInsights(): Promise<InstagramInsights> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const instagramAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !instagramAccountId) {
    throw new Error('Instagram API credentials not configured');
  }

  try {
    // Fetch insights from Instagram Graph API
    const metricsToFetch = [
      'impressions',
      'reach',
      'profile_views',
      'website_clicks',
      'follower_count'
    ];

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?` +
      `metric=${metricsToFetch.join(',')}&` +
      `period=day&` +
      `access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process the metrics
    const insights: InstagramInsights = {
      impressions: 0,
      reach: 0,
      profileViews: 0,
      websiteClicks: 0,
      followerCount: 0,
      engagement: 0
    };

    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((metric: InstagramMetric) => {
        const latestValue = metric.values[metric.values.length - 1]?.value || 0;
        
        switch (metric.name) {
          case 'impressions':
            insights.impressions = latestValue;
            break;
          case 'reach':
            insights.reach = latestValue;
            break;
          case 'profile_views':
            insights.profileViews = latestValue;
            break;
          case 'website_clicks':
            insights.websiteClicks = latestValue;
            break;
          case 'follower_count':
            insights.followerCount = latestValue;
            break;
        }
      });
    }

    // Calculate engagement rate
    if (insights.followerCount > 0) {
      insights.engagement = ((insights.reach + insights.profileViews) / insights.followerCount) * 100;
    }

    return insights;
  } catch (error) {
    console.error('Error fetching Instagram insights:', error);
    throw error;
  }
}

/**
 * Fetch Instagram media (posts) performance
 */
export async function getInstagramMediaInsights(limit = 10) {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const instagramAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !instagramAccountId) {
    throw new Error('Instagram API credentials not configured');
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media?` +
      `fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)&` +
      `limit=${limit}&` +
      `access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    throw error;
  }
}
