# Referrers Management Component Flow

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Admin Referrers Page                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Header Section                                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐       │    │
│  │  │  Title & Desc    │  │  ExportButton    │       │    │
│  │  └──────────────────┘  └──────────────────┘       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ReferrersDataTable                                │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  Search & Filters                        │     │    │
│  │  │  [Search Input] [Status] [Per Page]      │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  Table                                    │     │    │
│  │  │  Name | Email | Code | ... | [View]      │     │    │
│  │  │  ─────────────────────────────────────   │     │    │
│  │  │  John | john@... | ABC123 | ... | 👁    │     │    │
│  │  │  Jane | jane@... | XYZ789 | ... | 👁    │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  Pagination                              │     │    │
│  │  │  [<<] [<] Page 1 of 10 [>] [>>]         │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ReferrerDetailsModal (Hidden by default)         │    │
│  │                                                     │    │
│  │  Triggered when user clicks "View" button          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## User Interaction Flow

### 1. Initial Load
```
User visits page
    ↓
ReferrersDataTable fetches data
    ↓
Display referrers in table
```

### 2. Search Flow
```
User types in search box
    ↓
Debounce (500ms)
    ↓
API call with search parameter
    ↓
Update table with filtered results
    ↓
Reset to page 1
```

### 3. Filter/Sort Flow
```
User changes filter or sort
    ↓
Immediate API call
    ↓
Update table with new data
    ↓
Reset to page 1 (if filter changed)
```

### 4. View Details Flow
```
User clicks "View" button
    ↓
Set selected referrer
    ↓
Open ReferrerDetailsModal
    ↓
Modal fetches detailed data
    ↓
Display comprehensive information
```

### 5. Export Flow
```
User clicks Export button
    ↓
Dropdown menu appears
    ↓
User selects CSV or PDF
    ↓
API call to export endpoint
    ↓
Download file automatically
    ↓
Show success toast
```

## Data Flow

### ReferrersDataTable
```
Component State
├── referrers: ReferralUser[]
├── pagination: PaginationInfo
├── searchQuery: string
├── debouncedSearch: string
├── sortBy: SortField
├── sortOrder: SortOrder
├── filter: FilterType
└── itemsPerPage: number

API Request
├── GET /api/referral/admin/referrers
├── Query Params:
│   ├── page
│   ├── limit
│   ├── search
│   ├── sortBy
│   ├── sortOrder
│   └── filter
└── Response:
    ├── referrers[]
    └── pagination{}
```

### ReferrerDetailsModal
```
Component State
├── details: ReferrerDetails | null
├── loading: boolean
└── error: string | null

API Requests
├── GET /api/referral/admin/referrers (for user data)
└── GET /api/referral/dashboard/referrals (for referrals list)

Computed Stats
├── activeReferrals
├── pendingReferrals
├── convertedReferrals
├── conversionRate
├── averageRevenuePerReferral
└── totalPurchases
```

### ExportButton
```
Component State
├── exporting: boolean
└── exportingFormat: 'csv' | 'pdf' | null

API Request
├── POST /api/referral/admin/export
├── Query Params:
│   ├── format
│   └── filters (search, filter, dateFrom, dateTo)
└── Response:
    ├── data (CSV string or PDF base64)
    └── filename

File Download
├── Create Blob
├── Create download link
├── Trigger download
└── Cleanup
```

## Component Communication

```
┌─────────────────────┐
│   Parent Page       │
│                     │
│  token: string      │
│  selectedReferrer   │
│  modalOpen          │
└─────────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐
│ ReferrersDataTable  │    │  ExportButton       │
│                     │    │                     │
│ Props:              │    │ Props:              │
│ - token             │    │ - token             │
│ - onViewDetails     │    │ - filters           │
│                     │    │                     │
│ Emits:              │    │ Actions:            │
│ - onViewDetails()   │    │ - Download CSV      │
└─────────────────────┘    │ - Download PDF      │
         │                 └─────────────────────┘
         │
         │ (triggers)
         ▼
┌─────────────────────┐
│ReferrerDetailsModal │
│                     │
│ Props:              │
│ - referrer          │
│ - open              │
│ - onOpenChange      │
│ - token             │
└─────────────────────┘
```

## State Management Strategy

### Local State
- Each component manages its own UI state
- No global state management needed
- Props drilling for communication

### API State
- Fetched on mount and when dependencies change
- Loading and error states handled locally
- Optimistic updates not needed (read-only views)

### Performance Optimizations
- Debounced search (500ms)
- Pagination to limit data fetched
- useCallback for stable function references
- Conditional rendering for modals

## Error Handling

```
API Error
    ↓
Catch in component
    ↓
Set error state
    ↓
Display error message
    ↓
Show toast notification
```

## Accessibility Features

- Semantic HTML (table, button, input)
- ARIA labels for icons
- Keyboard navigation support
- Focus management in modal
- Screen reader announcements
- Proper heading hierarchy
