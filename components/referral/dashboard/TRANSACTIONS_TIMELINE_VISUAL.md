# TransactionsTimeline Component Visual Guide

## Component Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  🕐 Recent Transactions                                         │
│  Your latest point-earning activities                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Scrollable Area - 400px height]                         │  │
│  │                                                           │  │
│  │  ┌───┐  Sign-up bonus for Jane Smith      [Sign-up]     │  │
│  │  │ 🏆 │  Jane Smith • 2 hours ago                +100   │  │
│  │  └───┘                                          points   │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │                                                           │  │
│  │  ┌───┐  Purchase commission from John Doe [Purchase]    │  │
│  │  │ 🛒 │  John Doe • 1 day ago • $150.00         +7      │  │
│  │  └───┘                                          points   │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │                                                           │  │
│  │  ┌───┐  Sign-up bonus for Alice Brown    [Sign-up]      │  │
│  │  │ 🏆 │  Alice Brown • 3 days ago               +100    │  │
│  │  └───┘                                          points   │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │                                                           │  │
│  │  ┌───┐  Purchase commission from Jane Smith [Purchase]  │  │
│  │  │ 🛒 │  Jane Smith • 5 days ago • $200.00      +10     │  │
│  │  └───┘                                          points   │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │                                                           │  │
│  │  ┌───┐  Sign-up bonus for Bob Wilson      [Sign-up]     │  │
│  │  │ 🏆 │  Bob Wilson • Jan 15, 2024              +100    │  │
│  │  └───┘                                          points   │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Anatomy

### 1. Header Section
```
┌─────────────────────────────────────────┐
│  🕐 Recent Transactions                 │
│  Your latest point-earning activities   │
└─────────────────────────────────────────┘
```
- Clock icon with title
- Descriptive subtitle

### 2. Transaction Item Structure
```
┌───┐  Transaction Description          [Badge]
│ 🏆 │  Referee Name • Time • Amount    +Points
└───┘                                    points
```

**Components:**
- **Icon Circle**: 40x40px rounded circle with muted background
  - 🏆 Award icon (blue) for sign-ups
  - 🛒 Shopping cart icon (green) for purchases
  
- **Content Area**:
  - **Description**: Bold text describing the transaction
  - **Badge**: Color-coded type indicator
    - Blue badge for "Sign-up"
    - Green badge for "Purchase"
  - **Metadata**: Small gray text with:
    - Referee name
    - Time (relative or absolute)
    - Purchase amount (for purchases only)
    
- **Points Display**: Right-aligned
  - Large green "+XXX" text
  - Small "points" label below

### 3. Empty State
```
┌─────────────────────────────────────────┐
│                                         │
│              🕐                         │
│                                         │
│      No transactions yet                │
│                                         │
│  Your transaction history will appear   │
│  here once you start earning points     │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Loading State
```
┌─────────────────────────────────────────┐
│  🕐 Recent Transactions                 │
│  Loading your transaction history...    │
├─────────────────────────────────────────┤
│                                         │
│  ┌───┐  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  │▓▓▓│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  └───┘                                  │
│                                         │
│  ┌───┐  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  │▓▓▓│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  └───┘                                  │
│                                         │
└─────────────────────────────────────────┘
```

## Color Scheme

### Transaction Types
- **Sign-up Transactions**:
  - Icon: Blue (text-blue-600)
  - Badge: Blue background (bg-blue-50), blue text (text-blue-700), blue border (border-blue-200)
  
- **Purchase Transactions**:
  - Icon: Green (text-green-600)
  - Badge: Green background (bg-green-50), green text (text-green-700), green border (border-green-200)

### Points Display
- Color: Green (text-green-600)
- Font: Large, bold
- Format: "+XXX" with "points" label

### Metadata
- Color: Muted gray (text-muted-foreground)
- Font: Extra small (text-xs)
- Separators: Bullet points (•)

## Responsive Behavior

### Desktop (> 1024px)
- Full width card
- 400px scrollable height
- All metadata visible

### Tablet (640px - 1024px)
- Adjusted padding
- Maintained scroll height
- Compact metadata

### Mobile (< 640px)
- Stacked layout
- Smaller icons (h-8 w-8)
- Abbreviated metadata
- Maintained functionality

## Time Formatting Examples

### Relative Time (Recent)
- "Just now" - Less than 1 minute ago
- "5 minutes ago" - Less than 1 hour ago
- "3 hours ago" - Less than 24 hours ago
- "2 days ago" - Less than 7 days ago

### Absolute Date (Older)
- "Jan 15, 2024" - More than 7 days ago
- Format: MMM DD, YYYY

## Interaction States

### Hover
- Subtle background color change on transaction items
- Smooth transition (150ms)

### Scroll
- Custom scrollbar styling
- Smooth scrolling behavior
- Visible scroll indicator

### Loading
- Pulsing skeleton animation
- Gray placeholder blocks
- Maintains layout structure

## Accessibility Features

### Screen Readers
- Semantic HTML structure
- Descriptive labels
- Transaction type announcements
- Points value announcements

### Keyboard Navigation
- Scrollable with keyboard
- Focus indicators
- Tab navigation support

### Visual
- High contrast colors
- Clear typography
- Sufficient spacing
- Color-blind friendly icons

## Integration Example

```tsx
// In your dashboard page
import { TransactionsTimeline } from '@/components/referral/dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Stats and charts */}
        <div className="space-y-6">
          <StatsCards userId={user.uid} />
          <ReferralGrowthChart userId={user.uid} />
        </div>
        
        {/* Right column - Transactions timeline */}
        <div>
          <TransactionsTimeline userId={user.uid} maxItems={10} />
        </div>
      </div>
    </div>
  );
}
```

## Data Flow

```
Firestore (referralTransactions)
         ↓
   onSnapshot listener
         ↓
   Component State
         ↓
   Render Timeline
         ↓
   User Interface
```

### Real-time Updates
When a new transaction is added to Firestore:
1. Firestore triggers the onSnapshot listener
2. Component state updates with new data
3. New transaction appears at the top of the list
4. Smooth animation (if implemented)
5. User sees the update immediately

## Performance Considerations

- **Query Limit**: Default 10 items (configurable)
- **Indexing**: Requires composite index on referrerId + createdAt
- **Memory**: Efficient with limited results
- **Network**: Real-time listener uses minimal bandwidth
- **Rendering**: Optimized with proper React patterns

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- React 18+
- Firebase/Firestore 9+
- shadcn/ui components
- Lucide React icons
- Tailwind CSS
- Sonner (for toast notifications)
