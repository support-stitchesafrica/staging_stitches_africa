# Referrers Management Components Usage

This document demonstrates how to use the referrers management components together.

## Components Overview

### 1. ReferrersDataTable
Displays a comprehensive table of all referrers with search, filter, sort, and pagination capabilities.

### 2. ReferrerDetailsModal
Shows detailed information about a specific referrer including metrics and recent referrals.

### 3. ExportButton
Provides CSV and PDF export functionality for referrer data.

## Example Usage

```tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/ReferralAuthContext';
import {
  ReferrersDataTable,
  ReferrerDetailsModal,
  ExportButton,
} from '@/components/referral/admin';
import { ReferralUser } from '@/lib/referral/types';

export default function ReferrersManagementPage() {
  const { user, token } = useAuth();
  const [selectedReferrer, setSelectedReferrer] = useState<ReferralUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetails = (referrer: ReferralUser) => {
    setSelectedReferrer(referrer);
    setModalOpen(true);
  };

  if (!user || !token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referrers Management</h1>
          <p className="text-muted-foreground">
            View and manage all referrers in the program
          </p>
        </div>
        <ExportButton token={token} />
      </div>

      <ReferrersDataTable
        token={token}
        onViewDetails={handleViewDetails}
      />

      <ReferrerDetailsModal
        referrer={selectedReferrer}
        open={modalOpen}
        onOpenChange={setModalOpen}
        token={token}
      />
    </div>
  );
}
```

## Features

### ReferrersDataTable Features
- **Search**: Search by name, email, or referral code
- **Filter**: Filter by status (all, active, inactive)
- **Sort**: Sort by name, referrals, points, revenue, or date
- **Pagination**: Navigate through pages with customizable items per page
- **View Details**: Click the eye icon to view detailed information

### ReferrerDetailsModal Features
- **Basic Information**: Email, referral code, join date, status
- **Performance Metrics**: Total referrals, points, revenue
- **Statistics**: Conversion rate, average revenue per referral, total purchases
- **Recent Referrals**: Table showing the last 5 referrals

### ExportButton Features
- **CSV Export**: Download referrer data as CSV file
- **PDF Export**: Download referrer data as PDF file
- **Filtered Export**: Exports respect current search and filter settings

## API Integration

All components require a Firebase authentication token passed via the `token` prop. They make requests to the following endpoints:

- `GET /api/referral/admin/referrers` - Fetch referrers with pagination and filters
- `GET /api/referral/dashboard/referrals` - Fetch referrals for a specific referrer
- `POST /api/referral/admin/export` - Export referrer data

## Styling

Components use shadcn/ui components and Tailwind CSS for styling. They are fully responsive and work on mobile, tablet, and desktop devices.

## Requirements Fulfilled

- **12.1**: Display all registered referrers with their details
- **12.2**: Show referrer details including referral code, total referrals, points, and revenue
- **12.3**: Search referrers by name, email, or referral code
- **12.4**: Filter referrers by activity level and sort by various fields
- **12.5**: Export referrer data to CSV format
