import type { Metadata } from 'next';
import { BnplWaitlistPage } from '@/components/waitlist/BnplWaitlistPage';

export const metadata: Metadata = {
  title: 'Employee Lifestyle Access — Waitlist (Classic) | Stitches Africa × CRL',
  description:
    'Stitches Africa in collaboration with CRL: salary-linked lifestyle credit, BNPL, and premium fashion access for employees. Join the employer waitlist.',
  openGraph: {
    title: 'Employee Lifestyle Access — Stitches Africa × CRL',
    description:
      'Join the waitlist for employer-backed benefits, buy-now-pay-small-small, and premium fashion access.',
    type: 'website',
  },
};

export default function WaitlistClassicPage() {
  return <BnplWaitlistPage />;
}
