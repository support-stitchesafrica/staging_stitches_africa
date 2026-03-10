# Referral Dashboard Components

This directory contains the dashboard components for the referral program system.

## Components

### ReferralCodeCard
Displays the user's referral code and link with copy and share functionality.

**Features:**
- Display unique referral code
- Display full referral link
- Copy to clipboard functionality
- Social media share buttons (Facebook, Twitter, WhatsApp, LinkedIn)

**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5

### ReferralGrowthChart
Displays a line chart showing daily sign-ups over time with date range filtering.

**Features:**
- Line chart visualization of daily sign-ups
- Date range filter (7, 30, 90 days, all time)
- Growth percentage calculation
- Total sign-ups summary
- Responsive design
- Loading and empty states

**Requirements:** 5.1, 5.3, 5.4, 5.5

**Props:**
```typescript
interface ReferralGrowthChartProps {
  data: {
    date: string;        // ISO date string (YYYY-MM-DD)
    signups: number;     // Number of sign-ups on that date
  }[];
  isLoading?: boolean;   // Show loading state
  onRangeChange?: (range: DateRange) => void; // Callback when date range changes
}
```

**Usage:**
```tsx
import { ReferralGrowthChart } from '@/components/referral/dashboard';

<ReferralGrowthChart
  data={[
    { date: '2024-01-01', signups: 5 },
    { date: '2024-01-02', signups: 8 },
    // ...
  ]}
  onRangeChange={(range) => {
    // Fetch new data based on range
    console.log('Range changed to:', range);
  }}
/>
```

### RevenueChart
Displays a bar chart showing monthly revenue from referrals.

**Features:**
- Bar chart visualization of monthly revenue
- Detailed hover tooltips with revenue, referrals, and average per referral
- Summary statistics (total, average, highest)
- Currency formatting
- Responsive design
- Loading and empty states

**Requirements:** 5.2, 5.3, 5.4, 5.5

**Props:**
```typescript
interface RevenueChartProps {
  data: {
    month: string;       // Month label (e.g., "Jan 2024")
    revenue: number;     // Revenue amount
    referrals?: number;  // Optional: number of referrals
  }[];
  isLoading?: boolean;   // Show loading state
  currency?: string;     // Currency code (default: 'USD')
}
```

**Usage:**
```tsx
import { RevenueChart } from '@/components/referral/dashboard';

<RevenueChart
  data={[
    { month: 'Jan 2024', revenue: 1250, referrals: 25 },
    { month: 'Feb 2024', revenue: 1800, referrals: 32 },
    // ...
  ]}
  currency="USD"
/>
```

### ReferralsTable
Displays a comprehensive table of all referrals with search and sorting functionality.

**Features:**
- Display referee name, email, sign-up date, status, points, and purchases
- Real-time updates using Firestore listeners
- Search functionality by name or email
- Sortable columns (sign-up date, points earned, purchase amount)
- Status badges with color coding
- Display limit of 5 referrals with "View All" dialog for complete list
- Responsive design
- Loading and empty states

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5

**Props:**
```typescript
interface ReferralsTableProps {
  userId: string;  // The referrer's user ID
}
```

**Usage:**
```tsx
import { ReferralsTable } from '@/components/referral/dashboard';

<ReferralsTable userId={currentUser.uid} />
```

**Features:**
- **Display Limit**: Shows exactly 5 referrals in the main view to keep the dashboard clean
- **View All Dialog**: When more than 5 referrals exist, a "View All" button appears that opens a responsive, scrollable dialog showing all referrals
- **Count Indicator**: Displays "Showing X of Y referrals" to inform users of the total count
- **Search (Requirement 6.4)**: Filter referrals by name or email in real-time
- **Sorting (Requirement 6.5)**: Click column headers to sort by:
  - Sign-up date (newest/oldest first)
  - Points earned (highest/lowest first)
  - Purchase amount (highest/lowest first)
- **Status Display (Requirement 6.1)**: Color-coded badges for:
  - Pending (yellow) - Signed up but no purchases
  - Active (blue) - Has made at least one purchase
  - Converted (green) - Fully converted customer
- **Real-time Updates**: Automatically updates when new referrals are added or existing ones change
- **Responsive Dialog**: Dialog adapts to viewport size (mobile, tablet, desktop) with max-height of 80vh and smooth scrolling

### TransactionsTimeline
Displays a timeline of recent point-earning transactions with real-time updates.

**Features:**
- Display recent transactions with type, description, points, and date
- Real-time updates using Firestore listeners
- Transaction type badges (Sign-up, Purchase)
- Relative time formatting for recent transactions
- Display limit of 5 transactions with "More" button for complete history
- Transaction icons based on type
- Loading and empty states

**Requirements:** 7.5

**Props:**
```typescript
interface TransactionsTimelineProps {
  userId: string;      // The referrer's user ID
  maxItems?: number;   // Maximum number of transactions to fetch (default: 10)
}
```

**Usage:**
```tsx
import { TransactionsTimeline } from '@/components/referral/dashboard';

<TransactionsTimeline 
  userId={currentUser.uid}
  maxItems={15}
/>
```

**Features:**
- **Display Limit**: Shows exactly 5 transactions in the main view to keep the dashboard clean
- **View All Dialog**: When more than 5 transactions exist, a "More" button appears that opens a responsive, scrollable dialog showing all transactions
- **Count Indicator**: Displays "Showing X of Y transactions" to inform users of the total count
- **Transaction Types (Requirement 7.5)**: Visual distinction between:
  - Sign-up transactions (blue badge with Award icon)
  - Purchase transactions (green badge with ShoppingCart icon)
- **Transaction Details (Requirement 7.5)**: Each transaction shows:
  - Description of the transaction
  - Referee name who triggered the transaction
  - Date/time with relative formatting (e.g., "2 hours ago")
  - Purchase amount (for purchase transactions)
  - Points earned (prominently displayed)
- **Real-time Updates**: Automatically updates when new transactions are recorded
- **Responsive Dialog**: Dialog adapts to viewport size (mobile, tablet, desktop) with max-height of 80vh and smooth scrolling

## Chart Library

These components use [Recharts](https://recharts.org/) for data visualization, which is already included in the project dependencies.

## Styling

The components use:
- shadcn/ui components for consistent styling
- Tailwind CSS for responsive design
- CSS variables for theming support (light/dark mode)

## Data Format

### Date Format
Dates should be in ISO format (YYYY-MM-DD) for the ReferralGrowthChart.

### Month Format
Months should be formatted as "MMM YYYY" (e.g., "Jan 2024") for the RevenueChart.

## Examples

See `ChartExamples.tsx` for complete usage examples including:
- Basic usage
- Loading states
- Empty states
- Event handling

## Integration

These components are designed to work with the referral service API endpoints:
- `/api/referral/dashboard/charts` - Fetch chart data
- The API should return data in the format expected by these components

## Accessibility

Both chart components include:
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatible tooltips
- High contrast color schemes

## Responsive Design

### Display Limits and Dialogs

Both ReferralsTable and TransactionsTimeline implement a display limit pattern:
- **Main View**: Shows exactly 5 items to keep the dashboard clean and scannable
- **More/View All Button**: Appears when total items exceed 5
- **Dialog View**: Opens a responsive modal showing all items with smooth scrolling

### Dialog Breakpoints

The "View All" dialogs adapt to different screen sizes:

- **Mobile (< 768px)**:
  - Dialog takes full width with appropriate padding
  - Table columns may stack or hide non-essential information
  - Max-height: 80vh for optimal mobile viewing

- **Tablet (768px - 1024px)**:
  - Dialog width: 90vw, max-width: 768px
  - All columns visible
  - Max-height: 80vh

- **Desktop (> 1024px)**:
  - Dialog max-width: 1024px (4xl)
  - Full table layout with all columns
  - Max-height: 80vh
  - Sticky header for better navigation

### Scrolling Behavior

- Dialogs use `ScrollArea` component for smooth, native-like scrolling
- Content is fully scrollable when it exceeds the dialog height
- Sticky headers in table dialogs remain visible while scrolling

## Performance

- Charts use memoization to prevent unnecessary re-renders
- Data calculations are optimized with useMemo
- Responsive container ensures proper sizing
- Dialogs lazy-load and only render when opened
- Real-time listeners are properly cleaned up on component unmount
