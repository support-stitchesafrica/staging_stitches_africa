'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  EMPLOYEE_INTEREST_OPTIONS,
  NIGERIAN_STATES_BY_ZONE,
  SALARY_BAND_OPTIONS,
  SALARY_BANK_OPTIONS,
  STAFF_STRENGTH_OPTIONS,
  type IndustryPhase,
} from '@/lib/waitlist/crl-employee-waitlist';
import {
  BNPL_SUCCESS_BODY,
  BNPL_SUCCESS_TITLE,
} from '@/components/waitlist/bnpl-waitlist-content';
import { OTHER_BANK, type BnplWaitlistFormState } from '@/components/waitlist/useBnplWaitlistForm';

export type WaitlistFormVariant = 'classic' | 'atlas' | 'sunrise' | 'night';

const variantStyles: Record<
  WaitlistFormVariant,
  {
    card: string;
    title: string;
    section: string;
    sectionLabel: string;
    label: string;
    input: string;
    selectTrigger: string;
    selectContent: string;
    selectItem: string;
    selectLabel: string;
    fieldset: string;
    legend: string;
    hint: string;
    checkboxLabel: string;
    submit: string;
    successIcon: string;
    successTitle: string;
    successBody: string;
    outlineBtn: string;
  }
> = {
  classic: {
    card: 'rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg shadow-neutral-900/5 sm:p-8',
    title: 'text-lg font-medium text-neutral-900',
    section: 'space-y-3 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3',
    sectionLabel: 'text-xs font-semibold uppercase tracking-wide text-neutral-500',
    label: 'text-neutral-800',
    input: 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400',
    selectTrigger:
      'h-11 w-full border-neutral-300 bg-neutral-100 hover:bg-neutral-100/90 focus:bg-neutral-100',
    selectContent: 'border-neutral-200 bg-neutral-50 text-neutral-900',
    selectItem: '',
    selectLabel: '',
    fieldset: 'space-y-3 rounded-lg border border-neutral-100 p-3',
    legend: 'px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500',
    hint: 'text-xs text-neutral-500',
    checkboxLabel: 'text-sm leading-snug text-neutral-800',
    submit:
      'mt-2 inline-flex h-11 w-full items-center justify-center bg-neutral-900 font-semibold text-white shadow-md hover:bg-neutral-800 disabled:opacity-50',
    successIcon:
      'mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet-700 bg-violet-50 text-violet-900',
    successTitle: 'mt-5 text-xl font-medium text-neutral-900',
    successBody: 'mt-2 text-sm text-neutral-600',
    outlineBtn: 'mt-8 border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100',
  },
  atlas: {
    card:
      'rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8',
    title: 'text-lg font-medium tracking-tight text-white',
    section: 'space-y-3 rounded-xl border border-white/10 bg-white/5 p-4',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80',
    label: 'text-slate-200',
    input:
      'border-white/15 bg-slate-900/60 text-white placeholder:text-slate-500 focus-visible:ring-amber-400/40',
    selectTrigger:
      'h-11 w-full border-white/15 bg-slate-900/60 text-white hover:bg-slate-900/80',
    selectContent: 'border-slate-700 bg-slate-900 text-slate-100',
    selectItem: '',
    selectLabel: '',
    fieldset: 'space-y-3 rounded-xl border border-white/10 bg-slate-900/30 p-4',
    legend: 'px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80',
    hint: 'text-xs text-slate-400',
    checkboxLabel: 'text-sm leading-snug text-slate-200',
    submit:
      'mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 font-semibold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50',
    successIcon:
      'mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/60 bg-amber-400/10 text-amber-300',
    successTitle: 'mt-5 text-xl font-medium text-white',
    successBody: 'mt-2 text-sm text-slate-400',
    outlineBtn:
      'mt-8 border-white/20 bg-transparent text-white hover:bg-white/10',
  },
  night: {
    card: 'rounded-lg border border-[#d4a853]/20 bg-[#121820] p-5 sm:p-6',
    title: 'text-base font-semibold tracking-tight text-[#f5f2eb]',
    section: 'space-y-4',
    sectionLabel:
      'border-l-2 border-[#d4a853] pl-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d4a853]',
    label: 'text-xs font-medium text-[#9a958c]',
    input:
      'rounded-none border-0 border-b border-[#d4a853]/25 bg-transparent px-0 text-[#f5f2eb] shadow-none! placeholder:text-[#5c5850] focus-visible:border-[#d4a853] focus-visible:ring-0',
    selectTrigger:
      'h-10 w-full rounded-none border-0 border-b border-[#d4a853]/25 bg-transparent px-0 text-[#f5f2eb]! shadow-none focus:ring-0 data-placeholder:text-[#5c5850]! [&_svg]:text-[#9a958c]!',
    selectContent:
      'border-[#d4a853]/25 bg-[#121820]! text-[#e8e4dc]! [&_[data-slot=select-item]]:text-[#e8e4dc]! [&_[data-slot=select-item]:focus]:bg-[#d4a853]/15! [&_[data-slot=select-item]:focus]:text-[#f5f2eb]! [&_[data-slot=select-label]]:text-[#7a756c]!',
    selectItem:
      'text-[#e8e4dc]! focus:bg-[#d4a853]/15! focus:text-[#f5f2eb]! data-highlighted:bg-[#d4a853]/15! data-highlighted:text-[#f5f2eb]!',
    selectLabel: 'text-[#7a756c]!',
    fieldset: 'space-y-3 border-t border-[#d4a853]/12 pt-5',
    legend: 'text-[11px] font-bold uppercase tracking-[0.16em] text-[#d4a853]',
    hint: 'text-xs text-[#7a756c]',
    checkboxLabel: 'text-sm text-[#c4bfb4]',
    submit:
      'mt-4 inline-flex h-11 w-full items-center justify-center rounded-none border border-[#d4a853] bg-[#d4a853] font-semibold text-[#0a0e16] shadow-none! hover:bg-[#e8d5a8] disabled:opacity-50',
    successIcon:
      'mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]',
    successTitle: 'mt-5 text-lg font-semibold text-[#f5f2eb]',
    successBody: 'mt-2 text-sm text-[#9a958c]',
    outlineBtn:
      'mt-8 rounded-none border-[#d4a853]/40 bg-transparent text-[#e8e4dc] hover:bg-[#d4a853]/10',
  },
  sunrise: {
    card:
      'rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/8 sm:p-8',
    title: 'text-xl font-semibold text-stone-900',
    section: 'space-y-3 rounded-2xl border border-teal-100 bg-teal-50/40 p-4',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-[0.18em] text-teal-800/70',
    label: 'font-medium text-stone-800',
    input:
      'rounded-xl border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus-visible:ring-teal-500/30',
    selectTrigger:
      'h-11 w-full rounded-xl border-stone-200 bg-stone-50 text-stone-900 hover:bg-stone-100/80',
    selectContent: 'border-stone-200 bg-white text-stone-900',
    selectItem: '',
    selectLabel: '',
    fieldset: 'space-y-3 rounded-2xl border border-orange-100 bg-orange-50/30 p-4',
    legend: 'px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-800/80',
    hint: 'text-xs text-stone-500',
    checkboxLabel: 'text-sm leading-snug text-stone-700',
    submit:
      'mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-teal-700 font-semibold text-white shadow-md shadow-teal-900/15 hover:bg-teal-800 disabled:opacity-50',
    successIcon:
      'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-teal-600 bg-teal-50 text-teal-800',
    successTitle: 'mt-5 text-xl font-semibold text-stone-900',
    successBody: 'mt-2 text-sm text-stone-600',
    outlineBtn: 'mt-8 rounded-xl border-stone-300 bg-white text-stone-900 hover:bg-stone-50',
  },
};

type Props = {
  form: BnplWaitlistFormState;
  variant?: WaitlistFormVariant;
  formTitle?: string;
  className?: string;
};

export function BnplWaitlistForm({
  form,
  variant = 'classic',
  formTitle = 'Join the waitlist',
  className,
}: Props) {
  const s = variantStyles[variant];
  const whiteSelect =
    variant === 'classic'
      ? 'h-11 w-full border-neutral-300 text-black! bg-white! hover:bg-white! focus:bg-white!'
      : variant === 'atlas'
        ? 'h-11 w-full border-white/15 bg-slate-900/60 text-white!'
        : variant === 'night'
          ? s.selectTrigger
          : 'h-11 w-full rounded-xl border-stone-200 bg-white text-stone-900!';

  const whiteSelectContent =
    variant === 'atlas'
      ? 'max-h-72 border-slate-700 bg-slate-900 text-slate-100'
      : variant === 'night'
        ? cn(s.selectContent, 'max-h-72')
        : 'max-h-72 border-stone-200 bg-white! text-stone-900';

  const iconMuted =
    variant === 'atlas' || variant === 'night' ? 'text-[#5c5850]' : 'text-neutral-400';

  useEffect(() => {
    if (variant === 'night') {
      form.toggleInterest('Fashion', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  if (form.done) {
    return (
      <div className={cn(s.card, className)}>
        <div className="py-4 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={s.successIcon}
          >
            <CheckCircle2 className="h-9 w-9" />
          </motion.div>
          <h2 className={s.successTitle}>{BNPL_SUCCESS_TITLE}</h2>
          <p className={s.successBody}>{BNPL_SUCCESS_BODY}</p>
          <Button asChild variant="outline" className={s.outlineBtn}>
            <Link href="/shops">Browse Stitches Africa</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'night') {
    return (
      <div id="waitlist-form" className={cn(s.card, className)}>
        <h2 className={s.title}>{formTitle}</h2>
        <p className="mt-1 text-xs text-[#7a756c]">
          Tell us about your organisation — we will reach out about the CRL fashion programme.
        </p>

        <form className="mt-6 space-y-6" onSubmit={form.onSubmit}>
          <section className={s.section}>
            <p className={s.sectionLabel}>Organisation</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={s.label}>Industry phase</Label>
                <Select
                  value={form.industryPhase || undefined}
                  onValueChange={(v) => {
                    form.setIndustryPhase(v as IndustryPhase);
                    form.setIndustry('');
                  }}
                >
                  <SelectTrigger className={s.selectTrigger}>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                    <SelectItem value="phase_1" className={s.selectItem}>
                      Phase 1 — Finance, Oil &amp; Gas, Telecoms, FMCG, Tech
                    </SelectItem>
                    <SelectItem value="phase_2" className={s.selectItem}>
                      Phase 2 — Public service, Healthcare, Aviation, Consulting, Retail
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={s.label}>Industry</Label>
                <Select
                  value={form.industry || undefined}
                  onValueChange={form.setIndustry}
                  disabled={!form.industryPhase}
                >
                  <SelectTrigger
                    className={cn(s.selectTrigger, 'disabled:opacity-50')}
                    disabled={!form.industryPhase}
                  >
                    <SelectValue
                      placeholder={
                        form.industryPhase ? 'Select industry' : 'Choose phase first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                    {form.industryList.map((name) => (
                      <SelectItem key={name} value={name} className={s.selectItem}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="crl-company-night" className={s.label}>
                  Company name
                </Label>
                <Input
                  id="crl-company-night"
                  className={s.input}
                  placeholder="Registered company name"
                  value={form.companyName}
                  onChange={(e) => form.setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={s.label}>Staff strength</Label>
                <Select
                  value={form.staffStrength || undefined}
                  onValueChange={form.setStaffStrength}
                >
                  <SelectTrigger className={s.selectTrigger}>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                    {STAFF_STRENGTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className={s.selectItem}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={s.label}>Average salary band</Label>
                <Select value={form.salaryBand || undefined} onValueChange={form.setSalaryBand}>
                  <SelectTrigger className={s.selectTrigger}>
                    <SelectValue placeholder="Select band" />
                  </SelectTrigger>
                  <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                    {SALARY_BAND_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className={s.selectItem}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className={s.section}>
            <p className={s.sectionLabel}>Contact</p>
            <div className="mt-4 grid gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="crl-hr-night" className={s.label}>
                  HR / Admin contact
                </Label>
                <Input
                  id="crl-hr-night"
                  className={s.input}
                  placeholder="Full name"
                  value={form.hrAdminContact}
                  onChange={(e) => form.setHrAdminContact(e.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="crl-email-night" className={s.label}>
                    Email
                  </Label>
                  <Input
                    id="crl-email-night"
                    type="email"
                    autoComplete="email"
                    className={s.input}
                    placeholder="hr@company.com"
                    value={form.email}
                    onChange={(e) => form.setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crl-phone-night" className={s.label}>
                    Phone
                  </Label>
                  <Input
                    id="crl-phone-night"
                    type="tel"
                    autoComplete="tel"
                    className={s.input}
                    placeholder="+234 …"
                    value={form.phone}
                    onChange={(e) => form.setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={s.section}>
            <p className={s.sectionLabel}>Details</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={s.label}>State</Label>
                <Select value={form.state || undefined} onValueChange={form.setState}>
                  <SelectTrigger className={s.selectTrigger}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                    {Object.entries(NIGERIAN_STATES_BY_ZONE).map(([zone, states]) => (
                      <SelectGroup key={zone}>
                        <SelectLabel className={s.selectLabel}>{zone}</SelectLabel>
                        {states.map((st) => (
                          <SelectItem key={st} value={st} className={s.selectItem}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={s.label}>Salary bank</Label>
                <Select value={form.salaryBank || undefined} onValueChange={form.setSalaryBank}>
                  <SelectTrigger className={s.selectTrigger}>
                    <SelectValue placeholder="Primary bank" />
                  </SelectTrigger>
                  <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                    {SALARY_BANK_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b} className={s.selectItem}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.salaryBank === OTHER_BANK ? (
                  <Input
                    className={cn(s.input, 'mt-2')}
                    placeholder="Bank name"
                    value={form.salaryBankOther}
                    onChange={(e) => form.setSalaryBankOther(e.target.value)}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <fieldset className={s.fieldset}>
            <legend className={s.legend}>Programme category</legend>
            <p className={s.hint}>Fashion-only access for your workforce.</p>
            <div className="mt-3">
              <span className="inline-flex items-center gap-2 border border-[#d4a853] bg-[#d4a853]/15 px-4 py-2 text-sm font-medium text-[#e8d5a8]">
                Fashion — premium African design &amp; bespoke
              </span>
            </div>
          </fieldset>

          <Button
            type="submit"
            disabled={!form.canSubmit || form.submitting}
            className={s.submit}
          >
            {form.submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                Sending…
              </>
            ) : (
              'Join the waitlist'
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div id="waitlist-form" className={cn(s.card, className)}>
      <h2 className={s.title}>{formTitle}</h2>

      <form
        className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible"
        onSubmit={form.onSubmit}
      >
        <section className={s.section}>
          <p className={s.sectionLabel}>A. Industry breakdown</p>
          <div className="space-y-2">
            <Label className={s.label}>Phase</Label>
            <Select
              value={form.industryPhase || undefined}
              onValueChange={(v) => {
                form.setIndustryPhase(v as IndustryPhase);
                form.setIndustry('');
              }}
            >
              <SelectTrigger className={s.selectTrigger}>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent className={s.selectContent}>
                <SelectItem value="phase_1">
                  Phase 1 — Finance, Oil &amp; Gas, Telecoms, FMCG, Tech
                </SelectItem>
                <SelectItem value="phase_2">
                  Phase 2 — Public service, Healthcare, Aviation, Consulting, Retail
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={s.label}>Industry</Label>
            <Select
              value={form.industry || undefined}
              onValueChange={form.setIndustry}
              disabled={!form.industryPhase}
            >
              <SelectTrigger
                className={cn(s.selectTrigger, 'disabled:opacity-60')}
                disabled={!form.industryPhase}
              >
                <SelectValue
                  placeholder={
                    form.industryPhase ? 'Select industry' : 'Choose phase first'
                  }
                />
              </SelectTrigger>
              <SelectContent className={cn(s.selectContent, 'max-h-72')}>
                {form.industryList.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="space-y-2">
          <Label htmlFor="crl-company" className={s.label}>
            B. Company name
          </Label>
          <div className="relative">
            <Building2
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                iconMuted,
              )}
            />
            <Input
              id="crl-company"
              className={cn(s.input, 'pl-9')}
              placeholder="Registered company name"
              value={form.companyName}
              onChange={(e) => form.setCompanyName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className={s.label}>C. Staff strength</Label>
            <Select value={form.staffStrength || undefined} onValueChange={form.setStaffStrength}>
              <SelectTrigger className={whiteSelect}>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className={whiteSelectContent}>
                {STAFF_STRENGTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={s.label}>D. Average salary band</Label>
            <Select value={form.salaryBand || undefined} onValueChange={form.setSalaryBand}>
              <SelectTrigger className={whiteSelect}>
                <SelectValue placeholder="Select band" />
              </SelectTrigger>
              <SelectContent className={whiteSelectContent}>
                {SALARY_BAND_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crl-hr" className={s.label}>
            E. HR / Admin contact
          </Label>
          <div className="relative">
            <Users
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                iconMuted,
              )}
            />
            <Input
              id="crl-hr"
              className={cn(s.input, 'pl-9')}
              placeholder="Full name"
              value={form.hrAdminContact}
              onChange={(e) => form.setHrAdminContact(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crl-email" className={s.label}>
            F. Email
          </Label>
          <div className="relative">
            <Mail
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                iconMuted,
              )}
            />
            <Input
              id="crl-email"
              type="email"
              autoComplete="email"
              className={cn(s.input, 'pl-9')}
              placeholder="hr@company.com"
              value={form.email}
              onChange={(e) => form.setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crl-phone" className={s.label}>
            G. Phone number
          </Label>
          <div className="relative">
            <Phone
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                iconMuted,
              )}
            />
            <Input
              id="crl-phone"
              type="tel"
              autoComplete="tel"
              className={cn(s.input, 'pl-9')}
              placeholder="+234 …"
              value={form.phone}
              onChange={(e) => form.setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className={s.label}>H. Location (state)</Label>
          <Select value={form.state || undefined} onValueChange={form.setState}>
            <SelectTrigger className={whiteSelect}>
              <SelectValue placeholder="Select state (36 + FCT)" />
            </SelectTrigger>
            <SelectContent className={whiteSelectContent}>
              {Object.entries(NIGERIAN_STATES_BY_ZONE).map(([zone, states]) => (
                <SelectGroup key={zone}>
                  <SelectLabel
                    className={variant === 'atlas' ? 'text-slate-500' : 'text-neutral-500'}
                  >
                    {zone}
                  </SelectLabel>
                  {states.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={s.label}>I. Salary bank</Label>
          <Select value={form.salaryBank || undefined} onValueChange={form.setSalaryBank}>
            <SelectTrigger className={whiteSelect}>
              <SelectValue placeholder="Primary salary account bank" />
            </SelectTrigger>
            <SelectContent className={whiteSelectContent}>
              {SALARY_BANK_OPTIONS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.salaryBank === OTHER_BANK ? (
            <Input
              className={s.input}
              placeholder="Bank name"
              value={form.salaryBankOther}
              onChange={(e) => form.setSalaryBankOther(e.target.value)}
            />
          ) : null}
        </div>

        <fieldset className={s.fieldset}>
          <legend className={s.legend}>J. Employee interests</legend>
          <p className={s.hint}>Select all that apply — fashion, food, travel &amp; more.</p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {EMPLOYEE_INTEREST_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-1 py-0.5',
                  variant === 'atlas' && 'hover:border-white/15',
                  variant === 'sunrise' && 'hover:border-teal-200',
                  variant === 'classic' && 'hover:border-neutral-200',
                )}
              >
                <Checkbox
                  checked={!!form.interests[opt]}
                  onCheckedChange={(c) => form.toggleInterest(opt, c === true)}
                  className="mt-0.5"
                />
                <span className={s.checkboxLabel}>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          disabled={!form.canSubmit || form.submitting}
          className={s.submit}
        >
          {form.submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              Sending…
            </>
          ) : (
            'Join the waitlist'
          )}
        </Button>
      </form>
    </div>
  );
}
