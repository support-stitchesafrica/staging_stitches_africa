# AdminStatsCards Visual Documentation

## Component Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Admin Dashboard                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────┐│
│  │ Total Referrers  │  │ Total Referees   │  │  Total Points    │  │Total││
│  │      [👥]        │  │      [✓👤]       │  │      [🏆]        │  │ Rev ││
│  │                  │  │                  │  │                  │  │ [$] ││
│  │      1,234       │  │      5,678       │  │     125,000      │  │$45K ││
│  │                  │  │                  │  │                  │  │     ││
│  │ Registered       │  │ Sign-ups via     │  │ Points awarded   │  │From ││
│  │ referrers        │  │ referrals        │  │                  │  │ref. ││
│  │ [↑] +12.5%       │  │ [↑] +18.3%       │  │ [↑] +15.7%       │  │[↑]  ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └─────┘│
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Program Performance                                │ │
│  │                                                                         │ │
│  │  Avg. Referrals per Referrer          Overall Conversion Rate         │ │
│  │           4.6                                  32.5%                   │ │
│  │                                                                         │ │
│  │  Growth metrics based on last 30 days                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Card Details

### Card 1: Total Referrers
- **Icon**: Users (👥)
- **Main Value**: Total number of registered referrers
- **Description**: "Registered referrers"
- **Growth Indicator**: Percentage change in last 30 days
- **Color**: Green (↑) for positive, Red (↓) for negative

### Card 2: Total Referees
- **Icon**: UserCheck (✓👤)
- **Main Value**: Total number of sign-ups via referrals
- **Description**: "Sign-ups via referrals"
- **Growth Indicator**: Percentage change in last 30 days
- **Color**: Green (↑) for positive, Red (↓) for negative

### Card 3: Total Points
- **Icon**: Award (🏆)
- **Main Value**: Total points awarded across all referrers
- **Description**: "Points awarded"
- **Growth Indicator**: Percentage change in last 30 days
- **Color**: Green (↑) for positive, Red (↓) for negative

### Card 4: Total Revenue
- **Icon**: DollarSign ($)
- **Main Value**: Total revenue from referral purchases (formatted as currency)
- **Description**: "From referral purchases"
- **Growth Indicator**: Percentage change in last 30 days
- **Color**: Green (↑) for positive, Red (↓) for negative

### Card 5: Program Performance (Spans 2 columns)
- **Title**: "Program Performance"
- **Metrics**:
  - Average Referrals per Referrer (left side)
  - Overall Conversion Rate (right side)
- **Footer**: "Growth metrics based on last 30 days"

## Responsive Behavior

### Mobile (< 640px)
```
┌─────────────────┐
│ Total Referrers │
│      1,234      │
│   [↑] +12.5%    │
└─────────────────┘

┌─────────────────┐
│ Total Referees  │
│      5,678      │
│   [↑] +18.3%    │
└─────────────────┘

┌─────────────────┐
│  Total Points   │
│     125,000     │
│   [↑] +15.7%    │
└─────────────────┘

┌─────────────────┐
│  Total Revenue  │
│    $45,000.00   │
│   [↑] +22.1%    │
└─────────────────┘

┌─────────────────┐
│    Program      │
│  Performance    │
│                 │
│  Avg: 4.6       │
│  Conv: 32.5%    │
└─────────────────┘
```

### Tablet (640px - 1024px)
```
┌─────────────────┐  ┌─────────────────┐
│ Total Referrers │  │ Total Referees  │
│      1,234      │  │      5,678      │
│   [↑] +12.5%    │  │   [↑] +18.3%    │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│  Total Points   │  │  Total Revenue  │
│     125,000     │  │    $45,000.00   │
│   [↑] +15.7%    │  │   [↑] +22.1%    │
└─────────────────┘  └─────────────────┘

┌───────────────────────────────────────┐
│         Program Performance           │
│  Avg: 4.6          Conv: 32.5%       │
└───────────────────────────────────────┘
```

### Desktop (> 1024px)
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Referrers │  │ Referees │  │  Points  │  │ Revenue  │
│  1,234   │  │  5,678   │  │ 125,000  │  │ $45,000  │
│[↑]+12.5% │  │[↑]+18.3% │  │[↑]+15.7% │  │[↑]+22.1% │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

┌─────────────────────────────────────────────────────┐
│              Program Performance                     │
│  Avg: 4.6                    Conv: 32.5%            │
└─────────────────────────────────────────────────────┘
```

## States

### Loading State
- Shows 4 skeleton cards with pulsing animation
- Each card has placeholder rectangles for title, value, and description

### Error State
- Shows a single card spanning full width
- Displays error message in red text
- Example: "Failed to load statistics"

### Success State
- Shows all 5 cards with actual data
- Growth indicators show green/red based on positive/negative growth
- Numbers formatted with commas and currency symbols

## Color Scheme

- **Primary Text**: Default text color
- **Muted Text**: Gray for descriptions
- **Positive Growth**: Green (#10B981) with TrendingUp icon
- **Negative Growth**: Red (#EF4444) with TrendingDown icon
- **Icons**: Muted foreground color
- **Card Background**: Default card background

## Typography

- **Card Title**: Small, medium weight
- **Main Value**: 2xl, bold
- **Description**: Extra small, muted
- **Growth Indicator**: Extra small, colored based on direction

## Accessibility

- All cards have proper ARIA labels
- Icons are decorative and don't interfere with screen readers
- Color is not the only indicator (icons + text for growth)
- Proper heading hierarchy
- Keyboard navigable (if interactive elements added)
