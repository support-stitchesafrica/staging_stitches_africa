'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { FashionWaitlistAside } from '@/components/waitlist/FashionWaitlistAside';
import { FashionWaitlistCarousel } from '@/components/waitlist/FashionWaitlistCarousel';
import { FashionWaitlistForm } from '@/components/waitlist/FashionWaitlistForm';
import { BNPL_HEADLINE, BNPL_SUBHEAD } from '@/components/waitlist/bnpl-waitlist-content';
import { useBnplWaitlistForm } from '@/components/waitlist/useBnplWaitlistForm';

const FASHION_BENEFITS = [
  'Premium African fashion & bespoke access',
  'Buy now, pay in instalments on wardrobe spend',
  'Salary-linked repayment for employees',
  'Employer-backed fashion benefits',
] as const;

const FASHION_PILLARS = [
  { label: 'Ready-to-wear', desc: 'Curated labels & contemporary African design' },
  { label: 'Bespoke', desc: 'Tailored pieces through verified makers' },
  { label: 'BNPL', desc: 'Buy Now, Pay Later' },
  { label: 'For teams', desc: 'HR-led rollout with CRL × Stitches Africa' },
] as const;

export function WaitlistDesignV3() {
  const form = useBnplWaitlistForm();

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-900">
      <header className="border-b border-stone-300/80 bg-[#f7f5f0]">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-8 lg:px-12">
          <Link href="/shops">
            <Image
              src="/Stitches-Africa-Logo-06.png"
              alt="Stitches Africa"
              width={168}
              height={70}
              className="h-[68px] w-auto"
              priority
            />
          </Link>
          <span className="border border-stone-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900">
            Fashion · CRL
          </span>
        </div>
      </header>

      {/* Full-width hero carousel */}
      <section className="relative w-full border-b border-stone-300/80">
        <div className="relative h-[42vh] min-h-[280px] w-full sm:h-[48vh] lg:h-[52vh]">
          <FashionWaitlistCarousel slideCount={7} />
          <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-r from-stone-950/70 via-stone-950/35 to-stone-950/10" />
          <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-8 sm:px-8 lg:px-12 lg:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <span className="inline-block border border-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
                Employee fashion access
              </span>
              <h1 className="mt-4 font-serif text-3xl font-light leading-tight text-white sm:text-4xl lg:text-5xl">
                {BNPL_HEADLINE}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                {BNPL_SUBHEAD}{' '}
                <span className="font-medium text-white">
                  Starting with fashion. Repayment can be tied to salary.
                </span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="w-full">
        {/* Fashion pillars — full width */}
        <section className="grid w-full grid-cols-2 border-b border-stone-300/80 lg:grid-cols-4">
          {FASHION_PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className="border-stone-300/80 px-4 py-6 not-last:border-b sm:px-8 sm:py-8 lg:border-b-0 lg:not-last:border-r"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                0{i + 1}
              </p>
              <p className="mt-2 font-serif text-lg text-stone-900">{pillar.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{pillar.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Benefits — full width strip */}
        <section className="w-full border-b border-stone-300/80 bg-white">
          <div className="grid w-full sm:grid-cols-2 lg:grid-cols-4">
            {FASHION_BENEFITS.map((b, i) => (
              <div
                key={b}
                className="flex items-start gap-3 border-stone-200 px-4 py-5 not-last:border-b sm:odd:border-r sm:px-8 sm:py-6 lg:border-b-0 lg:not-last:border-r"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-stone-900 text-sm font-bold text-stone-900">
                  {i + 1}
                </span>
                <p className="text-sm font-medium leading-snug text-stone-800">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Programme guide + form */}
        <section className="grid w-full lg:min-h-[640px] lg:grid-cols-2">
          <FashionWaitlistAside />

          <div className="flex w-full flex-col justify-center bg-white p-4 sm:p-8 lg:p-10">
            <FashionWaitlistForm form={form} formTitle="Register for fashion access" />
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-stone-300/80 bg-white px-4 py-6 text-center text-xs text-stone-500 sm:px-8">
        © {new Date().getFullYear()} Stitches Africa ·{' '}
        <Link
          href="/shops"
          className="font-medium text-stone-900 underline-offset-4 hover:underline"
        >
          Shop
        </Link>
        {/* {' · '}
        <Link href="/waitlist_3" className="text-stone-400 hover:text-stone-600">
          Classic layout
        </Link> */}
      </footer>
    </div>
  );
}
