# Admin Charts Visual Guide

## ProgramGrowthChart Component

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  📈 Program Growth                    [Metric ▼] [Range ▼]      │
│  Track referrers, referees, and revenue trends over time        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Total Referrers    Total Referees    Total Revenue    Avg/Day  │
│       125                 450           $12,500        $416.67   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  350 ┤                                          ●──●   │    │
│  │      │                                    ●──●          │    │
│  │  300 ┤                              ●──●               │    │
│  │      │                        ●──●                     │    │
│  │  250 ┤                  ●──●                           │    │
│  │      │            ●──●                                 │    │
│  │  200 ┤      ●──●                                       │    │
│  │      │●──●                                             │    │
│  │  150 ┤                                                 │    │
│  │      └─────────────────────────────────────────────── │    │
│  │       Jan 1  Jan 8  Jan 15  Jan 22  Jan 29           │    │
│  │                                                         │    │
│  │  Legend: ─── Active Referrers  ─── New Referees       │    │
│  │          ─── Revenue ($)                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Features
- **Multi-line Chart**: Shows 3 metrics simultaneously
- **Metric Filter**: Toggle between all metrics or individual ones
- **Date Range Filter**: 7 days, 30 days, 90 days, all time
- **Summary Stats**: Quick overview at the top
- **Interactive Tooltip**: Hover for detailed information
- **Responsive**: Adapts to mobile, tablet, and desktop

### Tooltip Example
```
┌─────────────────────────┐
│ Mon, Jan 15, 2024       │
├─────────────────────────┤
│ ● Active Referrers:  45 │
│ ● New Referees:     12  │
│ ● Revenue:      $1,250  │
│ ─────────────────────── │
│ Purchases:          8   │
└─────────────────────────┘
```

---

## TopPerformersTable Component

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  🏆 Top Performers                                               │
│  Leaderboard of highest performing referrers                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [👥 By Referrals]  [💰 By Revenue]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Rank │ Referrer          │ Code    │ Referrals │ Revenue│   │
│  ├──────┼───────────────────┼─────────┼───────────┼────────┤   │
│  │  🥇  │ John Doe          │ ABC123  │    125    │ $6,250 │   │
│  │      │ john@example.com  │         │           │        │   │
│  ├──────┼───────────────────┼─────────┼───────────┼────────┤   │
│  │  🥈  │ Jane Smith        │ XYZ789  │    98     │ $4,900 │   │
│  │      │ jane@example.com  │         │           │        │   │
│  ├──────┼───────────────────┼─────────┼───────────┼────────┤   │
│  │  🥉  │ Bob Johnson       │ DEF456  │    87     │ $4,350 │   │
│  │      │ bob@example.com   │         │           │        │   │
│  ├──────┼───────────────────┼─────────┼───────────┼────────┤   │
│  │  #4  │ Alice Williams    │ GHI012  │    76     │ $3,800 │   │
│  │      │ alice@example.com │         │           │        │   │
│  ├──────┼───────────────────┼─────────┼───────────┼────────┤   │
│  │  #5  │ Charlie Brown     │ JKL345  │    65     │ $3,250 │   │
│  │      │ charlie@ex.com    │         │           │        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📊 Showing top 10 referrers by total referrals                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Features
- **Tabbed Interface**: Switch between "By Referrals" and "By Revenue"
- **Medal Badges**: 🥇🥈🥉 for top 3 performers
- **Detailed Info**: Name, email, code, metrics for each referrer
- **Responsive Table**: Adapts to different screen sizes
- **Empty State**: Friendly message when no data available
- **Icon Indicators**: Visual icons for each metric type

### Tab Views

#### By Referrals Tab
- Sorted by total number of referrals (highest first)
- Shows who has the most successful referral network
- Useful for identifying top recruiters

#### By Revenue Tab
- Sorted by total revenue generated (highest first)
- Shows who generates the most value
- Useful for identifying high-value referrers

---

## Color Scheme

### Chart Colors
- **Chart 1 (Referrers)**: `hsl(var(--chart-1))` - Blue
- **Chart 2 (Referees)**: `hsl(var(--chart-2))` - Green
- **Chart 3 (Revenue)**: `hsl(var(--chart-3))` - Purple

### Medal Colors
- **Gold (1st)**: 🥇 Yellow/Gold
- **Silver (2nd)**: 🥈 Gray/Silver
- **Bronze (3rd)**: 🥉 Amber/Bronze

---

## Responsive Behavior

### Desktop (> 1024px)
- Full table layout with all columns visible
- Chart at full width with detailed tooltips
- Summary stats in 4-column grid

### Tablet (640px - 1024px)
- Condensed table with wrapped text
- Chart maintains full functionality
- Summary stats in 2-column grid

### Mobile (< 640px)
- Stacked table rows with key info
- Simplified chart with touch-friendly tooltips
- Summary stats in 2-column grid
- Horizontal scroll for table if needed

---

## Integration with Admin Dashboard

These components are designed to be used together in the admin analytics page:

```tsx
// app/referral/admin/analytics/page.tsx
import { ProgramGrowthChart, TopPerformersTable } from '@/components/referral/admin';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1>Analytics Dashboard</h1>
      
      {/* Program Growth Chart */}
      <ProgramGrowthChart
        data={chartData}
        onRangeChange={handleRangeChange}
      />
      
      {/* Top Performers Table */}
      <TopPerformersTable
        topPerformersByReferrals={topByReferrals}
        topPerformersByRevenue={topByRevenue}
      />
    </div>
  );
}
```
