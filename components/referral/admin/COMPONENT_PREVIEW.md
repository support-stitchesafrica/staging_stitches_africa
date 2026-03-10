# Admin Charts Component Preview

## ProgramGrowthChart

### Desktop View
```
╔═══════════════════════════════════════════════════════════════════════════╗
║  📈 Program Growth                    [All Metrics ▼]  [Last 30 days ▼]  ║
║  Track referrers, referees, and revenue trends over time                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐             ║
║  │Total        │Total        │Total        │Avg Revenue  │             ║
║  │Referrers    │Referees     │Revenue      │per Day      │             ║
║  │    125      │    450      │  $12,500    │   $416.67   │             ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘             ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────┐   ║
║  │ 500 ┤                                                      ●     │   ║
║  │     │                                                   ●──       │   ║
║  │ 400 ┤                                              ●──            │   ║
║  │     │                                         ●──                 │   ║
║  │ 300 ┤                                    ●──                      │   ║
║  │     │                               ●──                           │   ║
║  │ 200 ┤                          ●──                                │   ║
║  │     │                     ●──                                     │   ║
║  │ 100 ┤                ●──                                          │   ║
║  │     │           ●──                                               │   ║
║  │   0 ┤      ●──                                                    │   ║
║  │     └────────────────────────────────────────────────────────── │   ║
║  │      Jan 1   Jan 8   Jan 15  Jan 22  Jan 29                     │   ║
║  │                                                                   │   ║
║  │  ─── Active Referrers   ─── New Referees   ─── Revenue ($)     │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Features Visible
- ✅ Multi-line chart with 3 metrics
- ✅ Metric filter dropdown (All Metrics, Referrers, Referees, Revenue)
- ✅ Date range filter dropdown (7 days, 30 days, 90 days, All time)
- ✅ Summary statistics cards
- ✅ Interactive legend
- ✅ Smooth line animations

---

## TopPerformersTable

### Desktop View - By Referrals Tab
```
╔═══════════════════════════════════════════════════════════════════════════╗
║  🏆 Top Performers                                                        ║
║  Leaderboard of highest performing referrers                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌───────────────────────────────────────────────────────────────────┐  ║
║  │  [👥 By Referrals]  [ 💰 By Revenue ]                            │  ║
║  └───────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  ┌───────────────────────────────────────────────────────────────────┐  ║
║  │ Rank │ Referrer              │ Code    │ Referrals │ Revenue      │  ║
║  ├──────┼───────────────────────┼─────────┼───────────┼──────────────┤  ║
║  │  🥇  │ John Doe              │ ABC123  │ 👥 125    │ 💰 $6,250.00 │  ║
║  │      │ 📧 john@example.com   │         │           │ 🏆 12,500    │  ║
║  ├──────┼───────────────────────┼─────────┼───────────┼──────────────┤  ║
║  │  🥈  │ Jane Smith            │ XYZ789  │ 👥 98     │ 💰 $4,900.00 │  ║
║  │      │ 📧 jane@example.com   │         │           │ 🏆 9,800     │  ║
║  ├──────┼───────────────────────┼─────────┼───────────┼──────────────┤  ║
║  │  🥉  │ Bob Johnson           │ DEF456  │ 👥 87     │ 💰 $4,350.00 │  ║
║  │      │ 📧 bob@example.com    │         │           │ 🏆 8,700     │  ║
║  ├──────┼───────────────────────┼─────────┼───────────┼──────────────┤  ║
║  │  #4  │ Alice Williams        │ GHI012  │ 👥 76     │ 💰 $3,800.00 │  ║
║  │      │ 📧 alice@example.com  │         │           │ 🏆 7,600     │  ║
║  ├──────┼───────────────────────┼─────────┼───────────┼──────────────┤  ║
║  │  #5  │ Charlie Brown         │ JKL345  │ 👥 65     │ 💰 $3,250.00 │  ║
║  │      │ 📧 charlie@ex.com     │         │           │ 🏆 6,500     │  ║
║  └──────┴───────────────────────┴─────────┴───────────┴──────────────┘  ║
║                                                                           ║
║  📊 Showing top 10 referrers by total referrals                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Features Visible
- ✅ Tabbed interface (By Referrals / By Revenue)
- ✅ Medal badges for top 3 (🥇🥈🥉)
- ✅ Rank numbers for positions 4+
- ✅ Referrer name and email
- ✅ Referral code badge
- ✅ Icon indicators for metrics
- ✅ Formatted numbers and currency

---

## Mobile View (< 640px)

### ProgramGrowthChart - Mobile
```
┌─────────────────────────────┐
│ 📈 Program Growth           │
│ Track trends over time      │
│                             │
│ [Metric ▼] [Range ▼]       │
├─────────────────────────────┤
│ Total Referrers    125      │
│ Total Referees     450      │
│ Total Revenue   $12,500     │
│ Avg/Day         $416.67     │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐ │
│  │      Chart Area       │ │
│  │   (Touch-friendly)    │ │
│  │                       │ │
│  └───────────────────────┘ │
│                             │
│  Legend (stacked)           │
│  ─── Active Referrers       │
│  ─── New Referees           │
│  ─── Revenue                │
└─────────────────────────────┘
```

### TopPerformersTable - Mobile
```
┌─────────────────────────────┐
│ 🏆 Top Performers           │
│ Leaderboard                 │
├─────────────────────────────┤
│ [By Referrals][By Revenue]  │
├─────────────────────────────┤
│ 🥇 #1                       │
│ John Doe                    │
│ john@example.com            │
│ Code: ABC123                │
│ 👥 125  💰 $6,250  🏆 12,500│
├─────────────────────────────┤
│ 🥈 #2                       │
│ Jane Smith                  │
│ jane@example.com            │
│ Code: XYZ789                │
│ 👥 98   💰 $4,900  🏆 9,800 │
├─────────────────────────────┤
│ 🥉 #3                       │
│ Bob Johnson                 │
│ bob@example.com             │
│ Code: DEF456                │
│ 👥 87   💰 $4,350  🏆 8,700 │
└─────────────────────────────┘
```

---

## Interactive States

### Hover State (ProgramGrowthChart)
```
When hovering over a data point:

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

### Loading State
```
┌─────────────────────────────┐
│ 📈 Program Growth           │
│ Track trends over time      │
├─────────────────────────────┤
│                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░   │
│  Loading chart data...      │
│  ░░░░░░░░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░░░░░░░   │
│                             │
└─────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────┐
│ 🏆 Top Performers           │
│ Leaderboard                 │
├─────────────────────────────┤
│                             │
│         🏆                  │
│                             │
│    No performers yet        │
│                             │
│  Data will appear as        │
│  referrers earn rewards     │
│                             │
└─────────────────────────────┘
```

---

## Color Palette

### Chart Lines
- **Active Referrers**: Blue (`hsl(var(--chart-1))`)
- **New Referees**: Green (`hsl(var(--chart-2))`)
- **Revenue**: Purple (`hsl(var(--chart-3))`)

### Medals
- **1st Place**: 🥇 Gold
- **2nd Place**: 🥈 Silver
- **3rd Place**: 🥉 Bronze

### UI Elements
- **Background**: Card background
- **Text**: Foreground color
- **Muted**: Muted foreground for secondary text
- **Border**: Border color for separators

---

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons and selects
- Arrow keys to navigate dropdowns
- Escape to close dropdowns

### Screen Reader Support
- ARIA labels on all interactive elements
- Semantic HTML structure
- Descriptive alt text for icons
- Table headers properly associated

### Visual Accessibility
- High contrast ratios (WCAG AA compliant)
- Focus indicators on all interactive elements
- No reliance on color alone for information
- Readable font sizes (minimum 12px)

---

## Performance Characteristics

### Render Performance
- Memoized calculations prevent unnecessary re-renders
- Efficient data transformations
- Optimized chart rendering with Recharts

### Data Loading
- Loading states prevent layout shift
- Skeleton loaders maintain layout
- Graceful error handling

### Bundle Size
- Tree-shakeable imports
- Lazy loading compatible
- Minimal dependencies
