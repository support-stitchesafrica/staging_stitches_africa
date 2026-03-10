# Admin Charts Components

This directory contains chart components for the referral program admin dashboard.

## Components

### ProgramGrowthChart

Displays a multi-line chart showing program growth metrics over time.

**Features:**
- Multi-line chart showing referrers, referees, and revenue trends
- Date range filter (7 days, 30 days, 90 days, all time)
- Metric filter to show all metrics or individual ones
- Summary statistics (total referrers, referees, revenue, avg revenue/day)
- Custom tooltip with detailed information
- Responsive design

**Props:**
```typescript
interface ProgramGrowthChartProps {
  data: {
    labels: string[];           // Date labels (ISO format)
    referees: number[];         // New referees per date
    purchases: number[];        // Purchases per date
    revenue: number[];          // Revenue per date
    activeReferrers: number[];  // Active referrers per date
  };
  isLoading?: boolean;
  onRangeChange?: (range: DateRange) => void;
}
```

**Usage:**
```tsx
import { ProgramGrowthChart } from '@/components/referral/admin';

<ProgramGrowthChart
  data={chartData}
  isLoading={false}
  onRangeChange={(range) => console.log('Range changed:', range)}
/>
```

**Requirements:** 14.1

---

### TopPerformersTable

Displays a leaderboard of top referrers by referrals and revenue.

**Features:**
- Tabbed interface to switch between "By Referrals" and "By Revenue"
- Medal badges for top 3 performers (🥇🥈🥉)
- Displays referrer name, email, referral code, referrals, revenue, and points
- Responsive table layout
- Empty state when no data available

**Props:**
```typescript
interface TopPerformersTableProps {
  topPerformersByReferrals: TopPerformer[];
  topPerformersByRevenue: TopPerformer[];
  isLoading?: boolean;
}

interface TopPerformer {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalReferrals: number;
  totalPoints: number;
  totalRevenue: number;
}
```

**Usage:**
```tsx
import { TopPerformersTable } from '@/components/referral/admin';

<TopPerformersTable
  topPerformersByReferrals={topByReferrals}
  topPerformersByRevenue={topByRevenue}
  isLoading={false}
/>
```

**Requirements:** 14.2

---

## Integration Example

See `AdminChartsExample.tsx` for a complete example of how to integrate these components with the analytics API.

```tsx
import { ProgramGrowthChart, TopPerformersTable } from '@/components/referral/admin';

// Fetch data from API
const response = await fetch('/api/referral/admin/analytics?range=30days', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { analytics } = await response.json();

// Render components
<div className="space-y-6">
  <ProgramGrowthChart
    data={analytics.chartData}
    onRangeChange={handleRangeChange}
  />
  
  <TopPerformersTable
    topPerformersByReferrals={analytics.topPerformers.byReferrals}
    topPerformersByRevenue={analytics.topPerformers.byRevenue}
  />
</div>
```

## API Integration

Both components are designed to work with the `/api/referral/admin/analytics` endpoint:

**Endpoint:** `GET /api/referral/admin/analytics`

**Query Parameters:**
- `range`: Date range (7days, 30days, 90days, all)
- `startDate`: Custom start date (ISO string)
- `endDate`: Custom end date (ISO string)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "chartData": {
      "labels": ["2024-01-01", "2024-01-02", ...],
      "referees": [5, 8, ...],
      "purchases": [2, 4, ...],
      "revenue": [150.00, 320.00, ...],
      "activeReferrers": [3, 5, ...]
    },
    "topPerformers": {
      "byReferrals": [...],
      "byRevenue": [...]
    }
  }
}
```

## Styling

Components use:
- shadcn/ui components (Card, Table, Tabs, Badge, Select)
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Screen reader compatible
- Color contrast compliant (WCAG AA)
- Focus indicators on all interactive elements
