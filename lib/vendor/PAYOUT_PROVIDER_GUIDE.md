# Payout Provider Implementation Guide

## Overview

Vendors can choose between **Stripe Connect** or **Flutterwave Subaccounts** for receiving payouts, similar to Bumpa's merchant system.

## Database Schema

### Vendor Profile (tailors collection)

```typescript
interface VendorPayoutSettings {
  // Provider selection
  payoutProvider: 'stripe' | 'flutterwave';
  
  // Stripe Connect
  stripeAccountId?: string;
  stripeAccountStatus?: 'pending' | 'active' | 'restricted';
  stripeOnboardingComplete?: boolean;
  
  // Flutterwave Subaccounts
  flutterwaveAccountId?: string;
  flutterwaveSubaccountCode?: string;
  flutterwaveAccountStatus?: 'active' | 'inactive';
  
  // Common settings
  preferredCurrency: 'NGN' | 'USD' | 'GHS' | 'KES';
  payoutSchedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  minimumPayoutAmount: number;
  
  // Bank details (fallback)
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
}
```

## Integration Steps

### 1. Stripe Connect Integration

**Setup:**
```typescript
// lib/stripe/connect-service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createStripeConnectAccount(vendorId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'NG', // or detect from vendor
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });
  
  // Save to vendor profile
  await updateDoc(doc(db, 'tailors', vendorId), {
    stripeAccountId: account.id,
    stripeAccountStatus: 'pending',
    payoutProvider: 'stripe',
  });
  
  return account;
}

export async function createStripeOnboardingLink(accountId: string, vendorId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/payout?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/payout?success=true`,
    type: 'account_onboarding',
  });
  
  return accountLink.url;
}

export async function checkStripeAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    onboardingComplete: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    status: account.charges_enabled && account.payouts_enabled ? 'active' : 'pending',
  };
}
```

**API Route:**
```typescript
// app/api/vendor/stripe/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createStripeConnectAccount, createStripeOnboardingLink } from '@/lib/stripe/connect-service';

export async function POST(request: NextRequest) {
  const { vendorId, email } = await request.json();
  
  try {
    const account = await createStripeConnectAccount(vendorId, email);
    const onboardingUrl = await createStripeOnboardingLink(account.id, vendorId);
    
    return NextResponse.json({
      success: true,
      accountId: account.id,
      onboardingUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 2. Flutterwave Subaccounts Integration

**Setup:**
```typescript
// lib/flutterwave/subaccount-service.ts
import axios from 'axios';

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

export async function createFlutterwaveSubaccount(
  vendorId: string,
  data: {
    businessName: string;
    businessEmail: string;
    accountBank: string;
    accountNumber: string;
    splitType: 'percentage' | 'flat';
    splitValue: number;
  }
) {
  const response = await axios.post(
    `${FLW_BASE_URL}/subaccounts`,
    {
      account_bank: data.accountBank,
      account_number: data.accountNumber,
      business_name: data.businessName,
      business_email: data.businessEmail,
      business_contact: data.businessName,
      business_mobile: '0000000000', // Get from vendor
      country: 'NG',
      split_type: data.splitType,
      split_value: data.splitValue,
    },
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (response.data.status === 'success') {
    const subaccountId = response.data.data.id;
    const subaccountCode = response.data.data.subaccount_id;
    
    // Save to vendor profile
    await updateDoc(doc(db, 'tailors', vendorId), {
      flutterwaveAccountId: subaccountId,
      flutterwaveSubaccountCode: subaccountCode,
      flutterwaveAccountStatus: 'active',
      payoutProvider: 'flutterwave',
    });
    
    return response.data.data;
  }
  
  throw new Error(response.data.message || 'Failed to create subaccount');
}

export async function getFlutterwaveSubaccount(subaccountId: string) {
  const response = await axios.get(
    `${FLW_BASE_URL}/subaccounts/${subaccountId}`,
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
    }
  );
  
  return response.data.data;
}

export async function listFlutterwaveBanks(country: string = 'NG') {
  const response = await axios.get(
    `${FLW_BASE_URL}/banks/${country}`,
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
    }
  );
  
  return response.data.data;
}
```

**API Route:**
```typescript
// app/api/vendor/flutterwave/subaccount/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createFlutterwaveSubaccount } from '@/lib/flutterwave/subaccount-service';

export async function POST(request: NextRequest) {
  const { vendorId, ...data } = await request.json();
  
  try {
    const subaccount = await createFlutterwaveSubaccount(vendorId, data);
    
    return NextResponse.json({
      success: true,
      subaccount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## UI Components

### Payout Provider Selector

```tsx
// components/vendor/payout/PayoutProviderSelector.tsx
'use client';

import { useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import { CreditCard, Zap } from 'lucide-react';

interface PayoutProviderSelectorProps {
  value: 'stripe' | 'flutterwave';
  onChange: (value: 'stripe' | 'flutterwave') => void;
}

export function PayoutProviderSelector({ value, onChange }: PayoutProviderSelectorProps) {
  return (
    <RadioGroup value={value} onChange={onChange}>
      <RadioGroup.Label className="text-sm font-medium text-gray-700">
        Select Payout Provider
      </RadioGroup.Label>
      
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RadioGroup.Option value="stripe">
          {({ checked }) => (
            <div
              className={`
                relative flex cursor-pointer rounded-lg border p-4
                ${checked ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
              `}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <RadioGroup.Label className="font-medium text-gray-900">
                      Stripe Connect
                    </RadioGroup.Label>
                    <RadioGroup.Description className="text-sm text-gray-500">
                      Global payments, instant payouts
                    </RadioGroup.Description>
                  </div>
                </div>
                {checked && (
                  <div className="shrink-0 text-blue-600">
                    <CheckIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
            </div>
          )}
        </RadioGroup.Option>
        
        <RadioGroup.Option value="flutterwave">
          {({ checked }) => (
            <div
              className={`
                relative flex cursor-pointer rounded-lg border p-4
                ${checked ? 'border-orange-600 bg-orange-50' : 'border-gray-300'}
              `}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                  <div className="ml-3">
                    <RadioGroup.Label className="font-medium text-gray-900">
                      Flutterwave
                    </RadioGroup.Label>
                    <RadioGroup.Description className="text-sm text-gray-500">
                      African payments, local banks
                    </RadioGroup.Description>
                  </div>
                </div>
                {checked && (
                  <div className="shrink-0 text-orange-600">
                    <CheckIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
            </div>
          )}
        </RadioGroup.Option>
      </div>
    </RadioGroup>
  );
}
```

### Stripe Onboarding Flow

```tsx
// components/vendor/payout/StripeOnboarding.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function StripeOnboarding({ vendorId, email }: { vendorId: string; email: string }) {
  const [loading, setLoading] = useState(false);
  
  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/vendor/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl;
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium">Connect Stripe Account</h3>
      <p className="mt-2 text-sm text-gray-600">
        Set up your Stripe Connect account to receive payouts directly to your bank account.
      </p>
      
      <Button
        onClick={handleConnect}
        loading={loading}
        className="mt-4"
      >
        Connect with Stripe
      </Button>
    </div>
  );
}
```

### Flutterwave Subaccount Form

```tsx
// components/vendor/payout/FlutterwaveSubaccountForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function FlutterwaveSubaccountForm({ vendorId }: { vendorId: string }) {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    accountBank: '',
    accountNumber: '',
    splitType: 'percentage' as 'percentage' | 'flat',
    splitValue: 10, // 10% platform fee
  });
  
  useEffect(() => {
    // Fetch Nigerian banks
    fetch('/api/vendor/flutterwave/banks')
      .then(res => res.json())
      .then(data => setBanks(data.banks));
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/vendor/flutterwave/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, ...formData }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Subaccount created successfully!');
      }
    } catch (error) {
      console.error('Failed to create subaccount:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Business Name"
        value={formData.businessName}
        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
        required
      />
      
      <Input
        label="Business Email"
        type="email"
        value={formData.businessEmail}
        onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
        required
      />
      
      <Select
        label="Bank"
        value={formData.accountBank}
        onChange={(value) => setFormData({ ...formData, accountBank: value })}
        options={banks.map((bank: any) => ({
          value: bank.code,
          label: bank.name,
        }))}
        required
      />
      
      <Input
        label="Account Number"
        value={formData.accountNumber}
        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
        maxLength={10}
        required
      />
      
      <Button type="submit" loading={loading} className="w-full">
        Create Subaccount
      </Button>
    </form>
  );
}
```

## Testing

### Test Stripe Connect
```bash
# Use Stripe test mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Flutterwave
```bash
# Use Flutterwave test mode
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
```

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Validate vendor ownership** before creating accounts
3. **Implement rate limiting** on account creation endpoints
4. **Log all payout operations** for audit trail
5. **Verify bank account ownership** before activating payouts
6. **Use webhooks** to track account status changes
7. **Implement 2FA** for payout settings changes

## Next Steps

1. Implement Stripe Connect webhook handlers
2. Implement Flutterwave webhook handlers
3. Add automated payout scheduling
4. Create payout history dashboard
5. Add balance reconciliation
6. Implement multi-currency support
7. Add payout analytics
