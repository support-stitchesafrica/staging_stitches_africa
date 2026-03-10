# Referrer Dashboard

This is the main dashboard page for referrers in the referral program.

## Features

### Authentication
- Protected route using `ReferralAuthGuard`
- Automatic redirect to login if not authenticated
- Real-time authentication state management

### Components

1. **ReferralCodeCard**
   - Displays unique referral code
   - Copy to clipboard functionality
   - Social media sharing buttons
   - Full referral link with copy button

2. **StatsCards**
   - Total referrals count
   - Total points earned
   - Total revenue generated
   - Conversion rate percentage
   - Real-time updates via Firestore listeners

3. **ReferralGrowthChart**
   - Line chart showing daily sign-ups
   - Date range filter (7, 30, 90 days, all time)
   - Growth percentage calculation
   - Interactive tooltips

4. **RevenueChart**
   - Bar chart showing monthly revenue
   - Revenue statistics (total, average, highest)
   - Detailed tooltips with purchase information

5. **ReferralsTable**
   - List of all referrals with details
   - Search by name or email
   - Sort by date, points, or purchase amount
   - Status badges (pending, active, converted)
   - Real-time updates

6. **TransactionsTimeline**
   - Recent point-earning transactions
   - Transaction type badges
   - Relative timestamps
   - Scrollable timeline

### Responsive Design

The dashboard is fully responsive across all device sizes:

- **Mobile (< 640px)**
  - Single column layout
  - Collapsible mobile menu
  - Touch-optimized interactions
  - Stacked components

- **Tablet (640px - 1024px)**
  - Two-column grid for stats cards
  - Stacked charts
  - Optimized spacing

- **Desktop (> 1024px)**
  - Four-column stats grid
  - Side-by-side charts
  - Three-column layout for table and timeline
  - Maximum width container (7xl)

### Real-time Updates

The dashboard implements real-time data updates:

1. **Stats Cards**: Firestore listeners on referralUsers collection
2. **Referrals Table**: Firestore listeners on referrals collection
3. **Transactions Timeline**: Firestore listeners on referralTransactions collection
4. **Charts**: Fetched on mount and when date range changes

### Animations

Smooth animations enhance the user experience:

- Fade-in and slide-up animations on page load
- Staggered delays for sequential component appearance
- Smooth transitions on hover and interactions
- Mobile menu slide-in animation

### API Integration

The dashboard fetches chart data from:
- `/api/referral/dashboard/charts?range={dateRange}`

Authentication is handled via Firebase ID tokens in the Authorization header.

## Usage

Users access the dashboard at `/referral/dashboard` after logging in. The page automatically:

1. Verifies authentication status
2. Redirects to login if not authenticated
3. Loads user data and statistics
4. Sets up real-time listeners
5. Fetches chart data
6. Displays all components with smooth animations

## Requirements Satisfied

- **2.5**: Referrer dashboard with all metrics and visualizations
- **15.1**: Responsive layout for mobile, tablet, desktop
- **15.2**: Real-time data updates via Firestore listeners
- **15.3**: Modern UI with smooth animations and loading states
