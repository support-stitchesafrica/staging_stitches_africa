import type { Metadata } from 'next';
import { WaitlistDesignV2 } from '@/components/waitlist/WaitlistDesignV2';

import './waitlist-2.css';

export const metadata: Metadata = {
  title: 'Employee Fashion Access — Waitlist (Design A) | Stitches Africa × CRL',
  description:
    'Join the waitlist for employer-backed premium fashion access — BNPL, bespoke, and ready-to-wear. Stitches Africa in collaboration with CRL.',
  openGraph: {
    title: 'Employee Fashion Access — Stitches Africa × CRL',
    description:
      'Salary-linked fashion BNPL for employees — premium African design through your employer.',
    type: 'website',
  },
};

export default function Waitlist2Page() {
  return (
    <div className="waitlist-2-page">
      <WaitlistDesignV2 />
    </div>
  );
}
