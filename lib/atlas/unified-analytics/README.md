# Atlas Unified Analytics Infrastructure

This directory contains the unified analytics infrastructure for the Atlas dashboard, integrating vendor analytics, BOGO analytics, and storefront analytics into a centralized management interface.

## Architecture Overview

The unified analytics system follows a layered architecture:

1. **Presentation Layer**: React components for displaying analytics data
2. **Service Layer**: Business logic and data aggregation services
3. **Data Access Layer**: Firebase/Firestore integration
4. **Authentication Layer**: Role-based access control

## Directory Structure

```
lib/atlas/unified-analytics/
├── types.ts                    # TypeScript interfaces and types
├── interfaces.ts               # Service interfaces
├── services/                   # Service implementations
│   ├── unified-analytics-service.ts
│   └── role-based-access-service.ts
├── __tests__/                  # Property-based tests
│   ├── setup.ts
│   ├── generators.ts
│   └── *.test.ts
└── README.md                   # This file

components/atlas/unified-analytics/
├── UnifiedAnalyticsDashboard.tsx    # Main dashboard container
├── VendorAnalyticsSection.tsx       # Vendor analytics display
├── BogoAnalyticsSection.tsx         # BOGO analytics display
├── StorefrontAnalyticsSection.tsx   # Storefront analytics display
└── CrossAnalyticsSection.tsx        # Cross-analytics insights

app/atlas/(dashboard)/
├── vendor-analytics/page.tsx       # Vendor analytics page
├── bogo-analytics/page.tsx          # BOGO analytics page
├── storefront-analytics/page.tsx    # Storefront analytics page
└── cross-analytics/page.tsx         # Cross-analytics page
```

## Key Features

### Role-Based Access Control
- **Superadmin**: Full access to all analytics sections
- **Founder**: Access to all analytics except team management
- **Sales Lead**: Access to vendor, storefront, and cross-analytics
- **Brand Lead**: Access to all analytics sections
- **Logistics Lead**: Limited access to vendor analytics only

### Analytics Sections
1. **Vendor Analytics**: Performance metrics for all vendors
2. **BOGO Analytics**: Campaign performance and insights
3. **Storefront Analytics**: Aggregated storefront performance
4. **Cross Analytics**: Correlations and unified insights

### Real-Time Data Synchronization
- Data updates within 5 minutes of source changes
- Automatic retry mechanisms for failed synchronization
- Data freshness indicators

## Usage

### Basic Usage

```typescript
import { UnifiedAnalyticsDashboard } from '@/lib/atlas/unified-analytics';

// Display vendor analytics
<UnifiedAnalyticsDashboard activeSection="vendor" />

// Display BOGO analytics
<UnifiedAnalyticsDashboard activeSection="bogo" />
```

### Service Usage

```typescript
import { 
  UnifiedAnalyticsService, 
  RoleBasedAccessService 
} from '@/lib/atlas/unified-analytics';

const accessService = new RoleBasedAccessService();
const analyticsService = new UnifiedAnalyticsService(/* dependencies */);

// Check access permissions
const hasAccess = accessService.hasAccessToSection('sales_lead', 'vendor');

// Get analytics data
const vendorData = await analyticsService.getVendorAnalytics(dateRange, userRole);
```

## Testing

The infrastructure includes comprehensive property-based tests using fast-check:

```bash
# Run all unified analytics tests
npm test lib/atlas/unified-analytics

# Run specific test file
npm test lib/atlas/unified-analytics/__tests__/role-based-access-service.test.ts
```

### Property-Based Testing

Tests are designed to verify correctness properties across all possible inputs:

- **Property 1**: Role-based analytics access control
- **Property 2**: Analytics data aggregation and display
- **Property 3**: Real-time data synchronization
- And more...

## Configuration

### Navigation Integration

The analytics sections are automatically added to the Atlas sidebar navigation based on user role permissions. The navigation items are defined in:

- `lib/atlas/types.ts` - Role permissions configuration
- `components/analytics/AnalyticsSidebar.tsx` - Navigation items

### Route Configuration

Analytics pages are automatically routed under `/atlas/` with the following structure:

- `/atlas/vendor-analytics` - Vendor analytics
- `/atlas/bogo-analytics` - BOGO analytics  
- `/atlas/storefront-analytics` - Storefront analytics
- `/atlas/cross-analytics` - Cross-analytics insights

## Development

### Adding New Analytics Sections

1. Define types in `types.ts`
2. Add service interfaces in `interfaces.ts`
3. Implement service logic in `services/`
4. Create React components in `components/atlas/unified-analytics/`
5. Add routes in `app/atlas/(dashboard)/`
6. Update navigation in `components/analytics/AnalyticsSidebar.tsx`
7. Add property-based tests in `__tests__/`

### Property-Based Test Guidelines

When adding new tests:

1. Use generators from `__tests__/generators.ts`
2. Tag tests with the format: `**Feature: atlas-unified-analytics, Property {number}: {property_text}**`
3. Run tests with minimum 100 iterations
4. Focus on correctness properties, not implementation details

## Dependencies

- React 18+
- Next.js 14+
- Firebase/Firestore
- fast-check (for property-based testing)
- Vitest (for testing)
- Lucide React (for icons)
- Tailwind CSS (for styling)

## Future Enhancements

- Real-time WebSocket connections for live data updates
- Advanced filtering and search capabilities
- Custom dashboard creation
- Automated alerting system
- Export functionality (CSV, PDF, JSON)
- Mobile-responsive design improvements