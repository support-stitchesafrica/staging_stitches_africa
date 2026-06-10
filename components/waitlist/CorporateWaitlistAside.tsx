'use client';

import { motion } from 'framer-motion';
import { Building2, ClipboardList, Shirt, Wallet } from 'lucide-react';

const JOURNEY = [
  {
    step: '01',
    icon: Building2,
    title: 'Organisation registers',
    desc: 'Company profile, industry, and workforce size — the same fields as our standard waitlist.',
  },
  {
    step: '02',
    icon: ClipboardList,
    title: 'Limits & policy aligned',
    desc: 'Salary bands and staff strength shape credit lines per employee cohort.',
  },
  {
    step: '03',
    icon: Shirt,
    title: 'Wardrobe access goes live',
    desc: 'Teams start with premium African fashion — ready-to-wear and bespoke on Stitches Africa.',
  },
  {
    step: '04',
    icon: Wallet,
    title: 'Instalments via payroll',
    desc: 'Salary-linked BNPL; broader lifestyle categories follow on the platform roadmap.',
  },
] as const;

export function CorporateWaitlistAside() {
  return (
    <aside className="flex min-h-[320px] w-full flex-col justify-between border-b border-slate-200 bg-slate-50 text-slate-900 lg:min-h-[640px] lg:border-b-0 lg:border-r">
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Programme flow
          </p>
          <h2 className="mt-3 max-w-md text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">
            From employer signup to employee access — four clear stages.
          </h2>
        </motion.div>

        <ol className="mt-10 space-y-0">
          {JOURNEY.map((item, i) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-slate-200 py-5 first:border-t-0 sm:grid-cols-[3.5rem_1fr]"
              >
                <span className="font-mono text-xs font-semibold text-slate-400">{item.step}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-600" strokeWidth={1.5} aria-hidden />
                    <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="border-t border-slate-200 px-6 py-4 text-xs leading-relaxed text-slate-500 sm:px-10 lg:px-12">
        Universal employer framing · Fashion is the first live category on the CRL × Stitches
        Africa platform.
      </p>
    </aside>
  );
}
