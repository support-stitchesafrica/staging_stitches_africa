'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FashionWaitlistForm } from '@/components/waitlist/FashionWaitlistForm';
import { WaitlistFashionThumbStrip } from '@/components/waitlist/WaitlistFashionThumbStrip';
import {
  BNPL_BENEFITS,
  BNPL_CTA_HINT,
  BNPL_HEADLINE,
  BNPL_SUBHEAD,
} from '@/components/waitlist/bnpl-waitlist-content';
import { CORPORATE_HERO_IMAGE } from '@/components/waitlist/corporate-hero-image';
import {
  CORPORATE_AUDIENCES,
  CORPORATE_HERO_BODY,
  CORPORATE_HERO_TITLE,
  CORPORATE_KICKER,
} from '@/components/waitlist/corporate-waitlist-content';
import { useBnplWaitlistForm } from '@/components/waitlist/useBnplWaitlistForm';

const JOURNEY = [
  { step: '01', title: 'Register', desc: 'Organisation profile, industry, and workforce size.' },
  { step: '02', title: 'Align limits', desc: 'Salary bands shape employee credit lines.' },
  { step: '03', title: 'Go live', desc: 'Wardrobe access on Stitches Africa — fashion at launch.' },
  { step: '04', title: 'Repay', desc: 'Salary-linked instalments via employer programme.' },
] as const;

export function WaitlistDesignV4() {
  const form = useBnplWaitlistForm();

  return (
    <div className="min-h-screen bg-[#ebe8e3] text-[#2a3542]">
      {/* Full-viewport hero: business splash + form overlay left */}
      <section className="relative isolate h-screen min-h-[640px] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={CORPORATE_HERO_IMAGE.src}
            alt={CORPORATE_HERO_IMAGE.alt}
            fill
            priority
            unoptimized
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0 z-[1] bg-[#1a2832]/62"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1] bg-linear-to-r from-[#1a2832]/88 via-[#1a2832]/45 to-[#1a2832]/20"
          aria-hidden
        />

        <div className="relative z-[2] flex h-full w-full flex-col lg:flex-row">
          {/* Mobile: headline over the splash before the form panel */}
          <div className="flex shrink-0 flex-col justify-end px-6 pb-8 pt-16 lg:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c5cdd6]">
              {BNPL_HEADLINE}
            </p>
            <h1 className="mt-3 text-2xl font-medium leading-snug text-[#f5f3ef]">
              {CORPORATE_HERO_TITLE}
            </h1>
          </div>

          {/* Form column — sits on top of the splash */}
          <div className="flex min-h-0 flex-1 w-full max-w-[min(100%,440px)] shrink-0 flex-col border-t border-[#2a3542]/15 bg-[#f5f3ef]/96 backdrop-blur-[2px] lg:h-full lg:flex-none lg:border-t-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-[#2a3542]/10 px-5 py-4">
              <Link href="/shops">
                <Image
                  src="/Stitches-Africa-Logo-06.png"
                  alt="Stitches Africa"
                  width={130}
                  height={52}
                  className="h-11 w-auto"
                />
              </Link>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5c6b7a]">
                {CORPORATE_KICKER}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6">
              <FashionWaitlistForm
                variant="corporate"
                form={form}
                formTitle="Employer waitlist"
                className="border-[#2a3542]/12"
              />
              <p className="mt-5 text-xs leading-relaxed text-[#5c6b7a]">{BNPL_CTA_HINT}</p>
            </div>
          </div>

          {/* Headline on the image — desktop */}
          <div className="hidden min-w-0 flex-1 flex-col justify-end px-10 pb-14 pt-24 lg:flex xl:px-16 xl:pb-20">
            <p className="max-w-xl text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c5cdd6]">
              {BNPL_HEADLINE}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-medium leading-[1.2] tracking-tight text-[#f5f3ef] xl:text-4xl">
              {CORPORATE_HERO_TITLE}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#c5cdd6]/95">
              {BNPL_SUBHEAD}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#a8b4c0]">
              {CORPORATE_HERO_BODY}
            </p>
            <p className="mt-10 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8b9aa8]">
              Starting with fashion · Pay in instalments
            </p>
          </div>
        </div>
      </section>

      {/* Content below the hero */}
      <main className="w-full">
        {/* Who it's for */}
        {/* <section className="border-b border-[#2a3542]/10 bg-[#f5f3ef]">
          <div className="mx-auto grid max-w-6xl md:grid-cols-3">
            {CORPORATE_AUDIENCES.map((a, i) => (
              <article
                key={a.role}
                className="border-[#2a3542]/10 px-6 py-9 not-last:border-b md:not-last:border-b-0 md:not-last:border-r md:px-8"
              >
                <span className="font-mono text-[10px] text-[#8b7355]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-base font-semibold text-[#2a3542]">{a.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5c6b7a]">{a.desc}</p>
              </article>
            ))}
          </div>
        </section> */}

        {/* Programme flow */}
        <section className="border-b border-[#2a3542]/10 bg-[#ebe8e3]">
          <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5c6b7a]">
              How it works
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY.map((item) => (
                <div
                  key={item.step}
                  className="border-t-2 border-[#8b7355] pt-4"
                >
                  <span className="font-mono text-xs text-[#8b7355]">{item.step}</span>
                  <p className="mt-2 text-sm font-semibold text-[#2a3542]">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#5c6b7a]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WaitlistFashionThumbStrip count={10} />

        {/* Benefits */}
        <section className="border-b border-[#2a3542]/10 bg-[#f5f3ef]">
          <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5c6b7a]">
              Programme benefits
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {BNPL_BENEFITS.map((b, i) => (
                <li
                  key={b}
                  className="flex gap-4 border border-[#2a3542]/10 bg-[#ebe8e3]/60 px-5 py-4"
                >
                  <span className="font-mono text-sm font-medium text-[#8b7355]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm leading-snug text-[#2a3542]">{b}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-2xl border-l-2 border-[#8b7355] pl-5 text-sm italic leading-relaxed text-[#5c6b7a]">
              A benefit employees notice - premium wardrobe access with instalments tied to
              payroll, delivered through Stitches Africa and CRL.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#2a3542]/10 bg-[#2a3542] px-5 py-6 text-center text-xs text-[#a8b4c0]">
        © {new Date().getFullYear()} Stitches Africa ·{' '}
        <Link href="/shops" className="text-[#f5f3ef] hover:underline">
          Shop
        </Link>
        {' · '}
        <Link href="/waitlist" className="hover:text-[#f5f3ef]">
          Editorial
        </Link>
        {' · '}
        <Link href="/waitlist_2" className="hover:text-[#f5f3ef]">
          Runway
        </Link>
        {' · '}
        <Link href="/waitlist_3" className="hover:text-[#f5f3ef]">
          Classic
        </Link>
      </footer>
    </div>
  );
}
