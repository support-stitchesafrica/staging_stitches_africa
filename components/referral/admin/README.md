# Admin Components

This directory contains admin-specific components for the referral program.

## Components

### AdminStatsCards

Displays overall program statistics with growth metrics for the admin dashboard.

**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5

**Features:**
- Total Referrers count with growth indicator
- Total Referees count with growth indicator
- Total Points awarded with growth indicator
- Total Revenue with growth indicator
- Average referrals per referrer
- Overall conversion rate
- Growth metrics comparing last 30 days

**Props:**
- `token` (string, required): Firebase authentication token for API calls

**Usage:**
```tsx
import { AdminStatsCards } from '@/components/referral/admin';

function AdminDashboard() {
  const token = await getAuthToken(); // Get from auth context
  
  return (
    <div>
      <AdminStatsCards token={token} />
    </div>
  );
}
```

**API Endpoint:**
- `GET /api/referral/admin/stats` - Fetches overall program statistics

**Data Structure:**
```typescript
interface AdminStats {
  totalReferrers: number;
  totalReferees: number;
  totalPoints: number;
  totalRevenue: number;
  averageReferralsPerReferrer: number;
  overallConversionRate: number;
  growthMetrics: {
    referrersGrowth: number;
    refereesGrowth: number;
    revenueGrowth: number;
    pointsGrowth: number;
    period: string;
  };
}
```

**Growth Indicators:**
- Green with up arrow for positive growth
- Red with down arrow for negative growth
- Percentage displayed with one decimal place

**Loading State:**
- Displays 4 skeleton cards while loading

**Error State:**
- Displays error message in a card spanning full width

**Styling:**
- Responsive grid layout (1 column mobile, 2 columns tablet, 4 columns desktop)
- Additional performance metrics card spans 2 columns
- Uses shadcn/ui Card components
- Lucide React icons for visual indicators
