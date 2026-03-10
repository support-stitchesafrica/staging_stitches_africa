# Real-Time Updates Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Vendor Dashboard (UI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Analytics   │  │   Products   │  │   Orders     │      │
│  │  Component   │  │  Component   │  │  Component   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              React Query (Caching Layer)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Query Cache                                         │   │
│  │  • Analytics (30s stale)                            │   │
│  │  • Orders (10s stale)                               │   │
│  │  • Rankings (12h stale)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  • VendorAnalyticsService                                    │
│  • ProductRankingService                                     │
│  • CustomerInsightsService                                   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firestore Database                         │
└─────────────────────────────────────────────────────────────┘
```

## Update Flow

```
User Opens Dashboard
       │
       ▼
Check Cache ──► Cache Hit ──► Show Data (< 1ms)
       │                            │
       │                            ▼
       │                    Background Refetch (if stale)
       │                            │
       ▼                            ▼
Cache Miss ──► Fetch Data ──► Update Cache ──► Show Data
```

## Real-Time Update Cycle

```
Time: 0s    ──► Initial Load (from cache or fetch)
Time: 10s   ──► Orders refetch
Time: 15s   ──► Notifications refetch
Time: 30s   ──► Analytics refetch
Time: 60s   ──► Inventory refetch
Time: 12h   ──► Rankings refetch
```

See REAL_TIME_UPDATES_GUIDE.md for details.
