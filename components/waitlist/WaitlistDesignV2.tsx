'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { FashionImageMarquee } from '@/components/waitlist/FashionImageMarquee';
import { RunwayWaitlistForm } from '@/components/waitlist/RunwayWaitlistForm';
import {
  BNPL_CTA_HINT,
  BNPL_HEADLINE,
  BNPL_SUBHEAD,
} from '@/components/waitlist/bnpl-waitlist-content';
import { useBnplWaitlistForm } from '@/components/waitlist/useBnplWaitlistForm';

const FASHION_BENEFITS = [
  'Premium African fashion & bespoke access',
  'Buy now, pay in instalments on wardrobe spend',
  'Salary-linked repayment for employees',
  'Employer-backed fashion benefits',
] as const;

export function WaitlistDesignV2() {
  const form = useBnplWaitlistForm();

  return (
    <div className="min-h-screen bg-[#faf6f1] text-[#1a1a1a] lg:flex">
      {/* Fixed left rail — unique split layout (V3 uses stacked light sections) */}
      <aside className="relative flex shrink-0 flex-col border-b-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#faf6f1] lg:w-[min(36vw,420px)] lg:border-b-0 lg:border-r-2">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:border-b-0 lg:px-6 lg:pt-6">
          <Link href="/shops">
            <Image
              src="/Stitches-Africa-Logo-06.png"
              alt="Stitches Africa"
              width={140}
              height={56}
              className="h-12 w-auto brightness-0 invert"
              priority
            />
          </Link>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#e85d4c]">
            × CRL
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between px-5 py-8 lg:px-6 lg:py-10">
          <div>
            <p
              className="font-black uppercase leading-none tracking-tighter text-[#e85d4c]"
              style={{ fontSize: 'clamp(3.5rem, 12vw, 5.5rem)' }}
            >
              FASH
              <br />
              ION
            </p>
            <p className="mt-6 max-w-[240px] text-sm leading-relaxed text-white/70">
              {BNPL_SUBHEAD}
            </p>

            {/* Single category tab */}
            <div className="mt-8 inline-flex border-2 border-[#e85d4c] bg-[#e85d4c] px-4 py-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                Fashion
              </span>
            </div>
            <p className="mt-3 text-xs text-white/45">
              Mobility · Food · Home &amp; media not included
            </p>
          </div>

          <ul className="mt-10 hidden space-y-4 lg:block">
            {FASHION_BENEFITS.map((b, i) => (
              <li key={b} className="flex gap-3 text-sm text-white/80">
                <span className="font-mono text-xs font-bold text-[#e85d4c]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="border-t border-white/10 px-5 py-4 text-[10px] uppercase tracking-wider text-white/35 lg:px-6">
          Design A · Runway ledger
        </p>
      </aside>

      {/* Scrollable main panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <FashionImageMarquee />

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#e85d4c]">
              {BNPL_HEADLINE}
            </p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-[#1a1a1a] sm:text-4xl">
              Employer-backed wardrobe credit for African teams.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#1a1a1a]/60 sm:text-base">
              Ready-to-wear, bespoke, and BNPL — one fashion programme. Register below to bring
              it to your organisation.
            </p>
          </motion.div>

          {/* Mobile benefits */}
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:hidden">
            {FASHION_BENEFITS.map((b) => (
              <li
                key={b}
                className="border-2 border-[#1a1a1a]/10 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a]/80"
              >
                {b}
              </li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-10 max-w-2xl"
          >
            <RunwayWaitlistForm form={form} formTitle="Register your organisation" />
            <p className="mt-6 text-sm text-[#1a1a1a]/50">{BNPL_CTA_HINT}</p>
          </motion.div>
        </main>

        <footer className="border-t-2 border-[#1a1a1a]/10 px-4 py-5 text-center text-xs text-[#1a1a1a]/45 sm:px-8">
          © {new Date().getFullYear()} Stitches Africa ·{' '}
          <Link href="/shops" className="font-semibold text-[#1a1a1a] hover:text-[#e85d4c]">
            Shop
          </Link>
          {' · '}
          <Link href="/waitlist" className="hover:text-[#1a1a1a]">
            Design B
          </Link>
          {' · '}
          <Link href="/waitlist_3" className="hover:text-[#1a1a1a]">
            Classic
          </Link>
        </footer>
      </div>
    </div>
  );
}
