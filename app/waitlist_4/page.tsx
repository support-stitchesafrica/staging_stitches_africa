import type { Metadata } from 'next';
import { WaitlistDesignV4 } from '@/components/waitlist/WaitlistDesignV4';

import './waitlist-4.css';

export const metadata: Metadata = {
  title: 'Employer Waitlist — Employee Lifestyle Access | Stitches Africa × CRL',
  description:
    'Register your organisation for CRL × Stitches Africa employer-backed lifestyle credit — fashion access at launch, salary-linked BNPL.',
  openGraph: {
    title: 'Employee Lifestyle Access — Stitches Africa × CRL',
    description:
      'Corporate employer waitlist: BNPL, salary-linked repayment, and premium fashion as the first live category.',
    type: 'website',
  },
};

export default function Waitlist4Page() {
  return (
    <div className="waitlist-4-page">
      <WaitlistDesignV4 />
    </div>
  );
}
