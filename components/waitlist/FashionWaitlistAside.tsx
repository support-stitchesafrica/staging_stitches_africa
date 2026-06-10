'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, Ruler, Shirt, Users, Wallet } from 'lucide-react';

const JOURNEY = [
  {
    step: '01',
    icon: Users,
    title: 'HR registers',
    desc: 'Share company profile, industry, and team size in the form.',
  },
  {
    step: '02',
    icon: Ruler,
    title: 'We tailor limits',
    desc: 'Salary bands and staff strength shape each employee’s fashion line.',
  },
  {
    step: '03',
    icon: Shirt,
    title: 'Wardrobe goes live',
    desc: 'Teams access premium African fashion - ready-to-wear and bespoke.',
  },
  {
    step: '04',
    icon: Wallet,
    title: 'Pay in instalments',
    desc: 'Salary-linked BNPL on Stitches Africa. No mixed lifestyle categories.',
  },
] as const;

export function FashionWaitlistAside() {
  return (
    <aside className="relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden border-b border-stone-300/80 bg-[#f7f5f0] text-stone-900 lg:min-h-[640px] lg:border-b-0 lg:border-r">
      {/* Soft warm wash — no grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-amber-50/50 via-transparent to-stone-100/80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-1 bg-stone-900"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-500">
            How the programme works
          </p>
          <h2 className="mt-3 max-w-md font-serif text-2xl font-light leading-snug text-stone-900 sm:text-3xl">
            From HR signup to employee wardrobe — in four moves.
          </h2>
        </motion.div>

        <ol className="relative mt-10 space-y-0">
          <div
            className="absolute left-[15px] top-3 bottom-3 w-px bg-stone-300"
            aria-hidden
          />
          {JOURNEY.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.08 }}
                className="relative flex gap-5 pb-8 last:pb-0"
              >
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-stone-900 bg-white text-[10px] font-bold text-stone-900">
                  {item.step}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-stone-700" />
                    <p className="font-semibold text-stone-900">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {item.desc}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 border-l-2 border-stone-900 bg-white/60 py-4 pl-5 pr-4"
        >
          <p className="font-serif text-lg italic leading-relaxed text-stone-800">
            “Fashion benefits people actually wear — not another perk lost in the intranet.”
          </p>
          <footer className="mt-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            — Built for HR &amp; People teams
          </footer>
        </motion.blockquote>
      </div>

      <div className="relative z-10 border-t border-stone-300/80 bg-white px-6 py-5 sm:px-10 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              Programme focus
            </p>
            <p className="mt-1 text-sm font-medium text-stone-900">
              Fashion only · African design · Employer-backed
            </p>
          </div>
          <div className="flex items-center gap-2 text-stone-900">
            <span className="text-xs font-bold uppercase tracking-wider">Start right</span>
            <ArrowDownRight className="h-5 w-5 lg:-rotate-90" aria-hidden />
          </div>
        </div>
      </div>
    </aside>
  );
}
