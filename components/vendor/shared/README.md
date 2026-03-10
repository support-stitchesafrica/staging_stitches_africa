# Vendor Shared Components

This directory contains reusable components for the vendor analytics dashboard.

## Components

### VendorSidebar
Navigation sidebar for the vendor portal with organized menu groups.

**Usage:**
```tsx
import { VendorSidebar } from '@/components/vendor/shared';

<VendorSidebar />
```

### MetricCard
Displays key metrics with optional trend indicators and icons.

**Props:**
- `title`: Metric title
- `value`: Metric value (string or number)
- `description`: Optional description
- `change`: Percentage change from previous period
- `changeLabel`: Label for the change (e.g., "vs last month")
- `icon`: Lucide icon component
- `iconColor`: Icon color class
- `iconBgColor`: Icon background color class
- `trend`: 'up' | 'down' | 'neutral'
- `currency`: Currency code for formatting
- `loading`: Show skeleton loader

**Usage:**
```tsx
import { MetricCard } from '@/components/vendor/shared';
import { TrendingUp } from 'lucide-react';

<MetricCard
  title="Total Revenue"
  value={125000}
  change={12.5}
  changeLabel="vs last month"
  icon={TrendingUp}
  currency="NGN"
/>
```

### DateRangePicker
Date range selector with preset options and custom calendar.

**Props:**
- `value`: DateRange object
- `onChange`: Callback when date range changes
- `className`: Additional CSS classes
- `placeholder`: Placeholder text

**Usage:**
```tsx
import { DateRangePicker } from '@/components/vendor/shared';

const [dateRange, setDateRange] = useState<DateRange>();

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

### ExportButton
Button for exporting data in various formats (CSV, PDF).

**Props:**
- `onExport`: Async callback function that receives the format
- `dataType`: Type of data being exported
- `formats`: Array of available formats (default: ['csv', 'pdf'])
- `loading`: Loading state
- `disabled`: Disabled state
- `variant`: Button variant
- `size`: Button size

**Usage:**
```tsx
import { ExportButton } from '@/components/vendor/shared';

const handleExport = async (format: 'csv' | 'pdf') => {
  // Export logic here
  await exportData(format);
};

<ExportButton
  onExport={handleExport}
  dataType="sales"
  formats={['csv', 'pdf']}
/>
```

### RecommendationCard
Displays actionable recommendations with priority and impact.

**Props:**
- `title`: Recommendation title
- `description`: Detailed description
- `type`: 'improvement' | 'opportunity' | 'warning' | 'info'
- `priority`: 'high' | 'medium' | 'low'
- `impact`: Expected impact description
- `actionLabel`: Action button label
- `actionUrl`: URL to navigate on action
- `onAction`: Callback for action button
- `onDismiss`: Callback for dismiss button
- `dismissable`: Show dismiss button

**Usage:**
```tsx
import { RecommendationCard, RecommendationList } from '@/components/vendor/shared';

<RecommendationCard
  title="Improve Product Images"
  description="Products with high-quality images have 40% higher conversion rates"
  type="improvement"
  priority="high"
  impact="Increase conversion rate by up to 40%"
  actionLabel="Update Images"
  actionUrl="/vendor/products"
/>

// Or use RecommendationList for multiple recommendations
<RecommendationList
  recommendations={[
    { id: '1', title: '...', description: '...', type: 'improvement', priority: 'high' },
    { id: '2', title: '...', description: '...', type: 'opportunity', priority: 'medium' }
  ]}
  onDismiss={(id) => console.log('Dismissed:', id)}
/>
```

## Requirements Validation

These components satisfy the following requirements:

- **Requirement 1.5**: Data export capabilities (ExportButton)
- **Requirement 12.1**: CSV export generation (ExportButton)
- **Requirement 12.2**: PDF report generation (ExportButton)
- **Requirement 14.1**: Actionable recommendations display (RecommendationCard)

## Design Principles

All components follow these principles:
- Mobile responsive
- Accessible (ARIA labels, keyboard navigation)
- Consistent with shadcn/ui design system
- TypeScript typed for safety
- Loading states for async operations
- Error handling built-in
