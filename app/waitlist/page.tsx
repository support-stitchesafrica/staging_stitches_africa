import type { Metadata } from 'next';
import { WaitlistDesignV3 } from '@/components/waitlist/WaitlistDesignV3';

export const metadata: Metadata = {
  title: 'Employee Fashion Access — Join the Waitlist | Stitches Africa × CRL',
  description:
    'Join the waitlist for employer-backed premium fashion access — BNPL, bespoke, and ready-to-wear. Stitches Africa in collaboration with CRL.',
  openGraph: {
    title: 'Employee Fashion Access — Stitches Africa × CRL',
    description:
      'Salary-linked fashion BNPL for employees — premium African design and bespoke access through your employer.',
    type: 'website',
  },
};

export default function WaitlistPage() {
  return <WaitlistDesignV3 />;
}
