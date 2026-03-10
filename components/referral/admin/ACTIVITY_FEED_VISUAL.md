# ActivityFeed Component - Visual Documentation

## Component Overview

The ActivityFeed component displays a real-time stream of all referral program activities including sign-ups, purchases, and points awarded.

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Activity Feed                                    [Live] [Refresh]│
│  Real-time stream of referral program activities                 │
├─────────────────────────────────────────────────────────────────┤
│  [All] [Sign-ups] [Purchases] [Points]  ← Filter Tabs           │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ┌──┐                                                       │  │
│  │ │👤│  [Sign-up]  2 minutes ago                            │  │
│  │ └──┘  Jane Smith signed up using John Doe's referral code │  │
│  │       👤 John Doe [ABC12345]  ✉ Jane Smith  +100 pts     │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ┌──┐                                                       │  │
│  │ │🛒│  [Purchase]  5 minutes ago                           │  │
│  │ └──┘  A referee made a purchase of $150.00               │  │
│  │       👤 Sarah Lee [XYZ78901]  ✉ Mike Chen               │  │
│  │       💰 $150.00  +7.50 pts  Commission: $7.50           │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ┌──┐                                                       │  │
│  │ │🏆│  [Points]  10 minutes ago                            │  │
│  │ └──┘  Points awarded for sign-up                         │  │
│  │       👤 Alex Brown [DEF45678]  ✉ Tom Wilson  +100 pts   │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ┌──┐                                                       │  │
│  │ │🛒│  [Purchase]  15 minutes ago                          │  │
│  │ └──┘  Emily Davis made a purchase of $89.99              │  │
│  │       👤 Chris Martin [GHI12345]  ✉ Emily Davis          │  │
│  │       💰 $89.99  +4.50 pts  Commission: $4.50            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Showing 50 recent activities        ● Updates automatically     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Features

### 1. Header Section
- **Title**: "Activity Feed" with activity icon
- **Live Badge**: Green pulsing dot indicating real-time updates
- **Refresh Button**: Manual refresh with loading spinner

### 2. Filter Tabs
Four filter options:
- **All**: Shows all activity types
- **Sign-ups**: Only new user registrations
- **Purchases**: Only referee purchases
- **Points**: Only points awarded transactions

### 3. Activity Items

Each activity item displays:

#### Sign-up Activity
```
┌──────────────────────────────────────────────────┐
│ 👤  [Sign-up]  2 minutes ago                     │
│     Jane Smith signed up using John's code      │
│     👤 John Doe [ABC12345]                       │
│     ✉ Jane Smith                                 │
│     🏆 +100 pts                                  │
└──────────────────────────────────────────────────┘
```

#### Purchase Activity
```
┌──────────────────────────────────────────────────┐
│ 🛒  [Purchase]  5 minutes ago                    │
│     Mike Chen made a purchase of $150.00         │
│     👤 Sarah Lee [XYZ78901]                      │
│     ✉ Mike Chen                                  │
│     💰 $150.00                                   │
│     🏆 +7.50 pts                                 │
│     Commission: $7.50                            │
└──────────────────────────────────────────────────┘
```

#### Points Activity
```
┌──────────────────────────────────────────────────┐
│ 🏆  [Points]  10 minutes ago                     │
│     Points awarded for sign-up                   │
│     👤 Alex Brown [DEF45678]                     │
│     ✉ Tom Wilson                                 │
│     🏆 +100 pts                                  │
└──────────────────────────────────────────────────┘
```

### 4. Empty State
When no activities exist:
```
┌─────────────────────────────────────────────────┐
│                                                  │
│              📊                                  │
│                                                  │
│         No activities yet                        │
│                                                  │
│  Activities will appear here as referrers        │
│  earn rewards and referees sign up or make      │
│  purchases.                                      │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 5. Loading State
Animated skeleton loaders while fetching data:
```
┌─────────────────────────────────────────────────┐
│  ⚪ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │
│     ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │
│     ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │
├─────────────────────────────────────────────────┤
│  ⚪ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │
│     ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │
└─────────────────────────────────────────────────┘
```

## Color Coding

### Badge Colors
- **Sign-up**: Blue (default variant)
- **Purchase**: Gray (secondary variant)
- **Points**: Outlined (outline variant)

### Icon Colors
- **Sign-up**: Primary color (blue)
- **Purchase**: Primary color (blue)
- **Points**: Primary color (blue)
- **Points Amount**: Primary color (blue) with bold text
- **Commission**: Green color

## Responsive Behavior

### Desktop (> 1024px)
- Full width card
- All details visible
- Horizontal layout for metadata

### Tablet (640px - 1024px)
- Full width card
- Metadata wraps to multiple lines
- Maintains readability

### Mobile (< 640px)
- Full width card
- Stacked layout
- Smaller icons and text
- Filter tabs stack if needed

## Real-time Updates

### Firestore Listeners
The component sets up real-time listeners on three collections:
1. `referrals` - For sign-up activities
2. `referralPurchases` - For purchase activities
3. `referralTransactions` - For points activities

### Update Behavior
- New activities appear at the top
- Existing activities remain in place
- Smooth transitions for new items
- Live indicator shows active connection

### Manual Refresh
- Refresh button in header
- Shows loading spinner during refresh
- Toast notification on success/error

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ActivityFeed Component                │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─ enableRealtime = true
                          │  │
                          │  ├─ Firestore Listeners
                          │  │  ├─ referrals collection
                          │  │  ├─ referralPurchases collection
                          │  │  └─ referralTransactions collection
                          │  │
                          │  └─ Auto-refresh on changes
                          │
                          └─ enableRealtime = false
                             │
                             └─ API fetch only
                                └─ /api/referral/admin/activity
```

## Requirements Mapping

- **13.1**: Display recent sign-ups with referrer information ✓
- **13.2**: Display recent purchases with commission details ✓
- **13.3**: Display points awarded with timestamps ✓
- **13.4**: Real-time updates using Firestore listeners ✓
- **13.5**: Filter activities by type ✓

## Usage Example

```tsx
import { ActivityFeed } from '@/components/referral/admin';

export default function AdminDashboard() {
  const { token } = useReferralAuth();

  return (
    <div className="container mx-auto p-6">
      <ActivityFeed 
        token={token}
        enableRealtime={true}
        maxItems={50}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `token` | `string` | Required | Firebase auth token for API calls |
| `maxItems` | `number` | `50` | Maximum number of activities to display |
| `enableRealtime` | `boolean` | `true` | Enable Firestore real-time listeners |

## Performance Considerations

1. **Pagination**: Limited to maxItems to prevent performance issues
2. **Scroll Area**: Uses virtual scrolling for large lists
3. **Debouncing**: Filter changes are debounced
4. **Memoization**: Activity items are memoized to prevent re-renders
5. **Lazy Loading**: Images and icons load on demand

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant (WCAG AA)
- Focus indicators visible
