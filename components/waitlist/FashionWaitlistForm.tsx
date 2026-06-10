'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Shirt,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BNPL_SUCCESS_BODY,
  BNPL_SUCCESS_TITLE,
} from '@/components/waitlist/bnpl-waitlist-content';
import {
  OTHER_BANK,
  type BnplWaitlistFormState,
} from '@/components/waitlist/useBnplWaitlistForm';
import { cn } from '@/lib/utils';
import {
  NIGERIAN_STATES_BY_ZONE,
  SALARY_BAND_OPTIONS,
  SALARY_BANK_OPTIONS,
  STAFF_STRENGTH_OPTIONS,
  type IndustryPhase,
} from '@/lib/waitlist/crl-employee-waitlist';

const STEPS_EDITORIAL = ['Organisation', 'Contact', 'Fashion programme'] as const;
const STEPS_CORPORATE = ['Organisation', 'Contact', 'Programme details'] as const;

type FormVariant = 'editorial' | 'corporate';

function formStyles(variant: FormVariant) {
  if (variant === 'corporate') {
    return {
      steps: STEPS_CORPORATE,
      fieldClass:
        'h-11 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 !shadow-none placeholder:text-slate-400 focus-visible:border-slate-900 focus-visible:ring-0',
      selectClass:
        'h-11 w-full rounded-sm border border-slate-200 bg-slate-50 pl-4 text-sm text-slate-900 !shadow-none focus:ring-0 data-[placeholder]:text-slate-400',
      card: 'border border-slate-200 bg-white',
      label: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
      selectContent: 'border-slate-200 bg-white',
      headerBorder: 'border-b border-slate-200',
      kicker: 'text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500',
      title: 'mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl',
      stepDone: 'bg-slate-900',
      stepTodo: 'bg-slate-200',
      stepLabelActive: 'text-slate-900',
      stepLabelIdle: 'text-slate-400',
      footerBorder: 'border-t border-slate-200',
      backBtn:
        'rounded-sm text-slate-600 !shadow-none hover:bg-slate-100 hover:text-slate-900',
      nextBtn:
        'h-10 rounded-sm border-slate-300 px-4 text-sm text-slate-800 !shadow-none hover:bg-slate-50',
      submitBtn:
        'h-10 rounded-sm bg-slate-900 px-5 text-sm text-white !shadow-none hover:bg-slate-800 disabled:opacity-50',
      successCard: 'border border-slate-200 bg-white p-8 sm:p-10',
      successIcon: 'border-2 border-slate-900 bg-slate-100 text-slate-900',
      successTitle: 'font-semibold text-2xl text-slate-900',
      successBody: 'text-sm text-slate-600',
      successBtn:
        'mt-8 rounded-sm border-slate-900 !shadow-none hover:bg-slate-100',
      divider: 'border-slate-200',
      body: 'text-sm text-slate-700',
      strong: 'font-semibold text-slate-900',
      fashionPanel: 'border border-slate-200 bg-slate-50 p-4',
    };
  }
  return {
    steps: STEPS_EDITORIAL,
    fieldClass:
      'h-12 rounded-none border-0 border-b-2 border-stone-300 bg-stone-50/80 px-0 text-base text-stone-900 shadow-none! placeholder:text-stone-400 focus-visible:border-stone-900 focus-visible:ring-0',
    selectClass:
      'h-12 w-full rounded-none border-0 border-b-2 border-stone-300 bg-stone-50/80 pl-4 pr-0 text-stone-900 shadow-none! focus:ring-0 data-placeholder:text-stone-400!',
    card: 'border border-stone-200 bg-white',
    label: 'text-xs font-bold uppercase tracking-wider text-stone-500',
    selectContent: 'border-stone-200 bg-white',
    headerBorder: 'border-b border-stone-200',
    kicker: 'text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500',
    title: 'mt-1 font-serif text-2xl tracking-tight text-stone-900 sm:text-3xl',
    stepDone: 'bg-stone-900',
    stepTodo: 'bg-stone-200',
    stepLabelActive: 'text-stone-900',
    stepLabelIdle: 'text-stone-400',
    footerBorder: 'border-t border-stone-200',
    backBtn:
      'rounded-none text-stone-600 shadow-none! hover:bg-stone-100 hover:text-stone-900',
    nextBtn:
      'h-10 rounded-none border-stone-300 px-4 text-sm text-stone-800 shadow-none! hover:bg-stone-50',
    submitBtn:
      'h-10 rounded-none bg-stone-900 px-5 text-sm text-white shadow-none! hover:bg-stone-800 disabled:opacity-50',
    successCard: 'border border-stone-200 bg-white p-8 sm:p-10',
    successIcon: 'border-2 border-stone-900 bg-stone-100 text-stone-900',
    successTitle: 'font-serif text-2xl text-stone-900',
    successBody: 'text-sm text-stone-600',
    successBtn: 'mt-8 rounded-none border-stone-900 shadow-none! hover:bg-stone-100',
    divider: 'border-stone-200',
    body: 'text-sm text-stone-700',
    strong: 'font-semibold text-stone-900',
    fashionPanel: 'border border-stone-200 bg-stone-50/80 p-4',
  };
}

type Props = {
  form: BnplWaitlistFormState;
  formTitle?: string;
  className?: string;
  variant?: FormVariant;
};

export function FashionWaitlistForm({
  form,
  formTitle = 'Join the fashion waitlist',
  className,
  variant = 'editorial',
}: Props) {
  const s = formStyles(variant);
  const STEPS = s.steps;
  const fieldClass = s.fieldClass;
  const selectClass = s.selectClass;
  const [step, setStep] = useState(0);

  useEffect(() => {
    form.toggleInterest('Fashion', true);
    // Fashion-only waitlist — single category pre-selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAdvanceStep0 =
    form.industryPhase &&
    form.industry &&
    form.companyName.trim() &&
    form.staffStrength &&
    form.salaryBand;

  const canAdvanceStep1 =
    form.hrAdminContact.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.state &&
    form.salaryBank &&
    (form.salaryBank !== OTHER_BANK || form.salaryBankOther.trim());

  if (form.done) {
    return (
      <div className={cn(s.successCard, className)}>
        <div className="py-4 text-center">
          <div
            className={cn(
              'mx-auto flex h-16 w-16 items-center justify-center',
              s.successIcon,
            )}
          >
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className={cn('mt-5', s.successTitle)}>{BNPL_SUCCESS_TITLE}</h2>
          <p className={cn('mt-2', s.successBody)}>{BNPL_SUCCESS_BODY}</p>
          <Button asChild variant="outline" className={s.successBtn}>
            <Link href="/shops">Browse Stitches Africa</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="waitlist-form" className={cn(s.card, className)}>
      <div className={cn(s.headerBorder, 'px-6 py-5 sm:px-8')}>
        <p className={s.kicker}>CRL × Stitches Africa</p>
        <h2 className={s.title}>{formTitle}</h2>

        <div className="mt-5 flex gap-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col">
              <div
                className={cn(
                  'h-0.5 w-full transition-colors',
                  i <= step ? s.stepDone : s.stepTodo,
                )}
              />
              <span
                className={cn(
                  'mt-2 text-[10px] font-semibold uppercase tracking-wider',
                  i === step ? s.stepLabelActive : s.stepLabelIdle,
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form
        className="px-6 py-6 sm:px-8 sm:py-8"
        onSubmit={(e) => {
          if (step < STEPS.length - 1) {
            e.preventDefault();
            return;
          }
          form.onSubmit(e);
        }}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className={s.label}>
                    Industry phase
                  </Label>
                  <Select
                    value={form.industryPhase || undefined}
                    onValueChange={(v) => {
                      form.setIndustryPhase(v as IndustryPhase);
                      form.setIndustry('');
                    }}
                  >
                    <SelectTrigger className={selectClass}>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label className={s.label}>
                    Industry
                  </Label>
                  <Select
                    value={form.industry || undefined}
                    onValueChange={form.setIndustry}
                    disabled={!form.industryPhase}
                  >
                    <SelectTrigger className={cn(selectClass, 'disabled:opacity-50')} disabled={!form.industryPhase}>
                      <SelectValue
                        placeholder={
                          form.industryPhase ? 'Select industry' : 'Choose phase first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className={cn('max-h-72', s.selectContent)}>
                      {form.industryList.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor="fashion-company"
                    className={s.label}
                  >
                    Company name
                  </Label>
                  <Input
                    id="fashion-company"
                    className={fieldClass}
                    placeholder="Registered company name"
                    value={form.companyName}
                    onChange={(e) => form.setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={s.label}>
                    Staff strength
                  </Label>
                  <Select
                    value={form.staffStrength || undefined}
                    onValueChange={form.setStaffStrength}
                  >
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent className={s.selectContent}>
                      {STAFF_STRENGTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={s.label}>
                    Salary band
                  </Label>
                  <Select value={form.salaryBand || undefined} onValueChange={form.setSalaryBand}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Select band" />
                    </SelectTrigger>
                    <SelectContent className={s.selectContent}>
                      {SALARY_BAND_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="fashion-hr" className={s.label}>
                  HR / Admin contact
                </Label>
                <Input
                  id="fashion-hr"
                  className={fieldClass}
                  placeholder="Full name"
                  value={form.hrAdminContact}
                  onChange={(e) => form.setHrAdminContact(e.target.value)}
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="fashion-email"
                    className={s.label}
                  >
                    Email
                  </Label>
                  <Input
                    id="fashion-email"
                    type="email"
                    autoComplete="email"
                    className={fieldClass}
                    placeholder="hr@company.com"
                    value={form.email}
                    onChange={(e) => form.setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="fashion-phone"
                    className={s.label}
                  >
                    Phone
                  </Label>
                  <Input
                    id="fashion-phone"
                    type="tel"
                    autoComplete="tel"
                    className={fieldClass}
                    placeholder="+234 …"
                    value={form.phone}
                    onChange={(e) => form.setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={s.label}>
                    State
                  </Label>
                  <Select value={form.state || undefined} onValueChange={form.setState}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className={cn('max-h-72', s.selectContent)}>
                      {Object.entries(NIGERIAN_STATES_BY_ZONE).map(([zone, states]) => (
                        <SelectGroup key={zone}>
                          <SelectLabel className={s.label}>{zone}</SelectLabel>
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
                  <Label className={s.label}>
                    Salary bank
                  </Label>
                  <Select value={form.salaryBank || undefined} onValueChange={form.setSalaryBank}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Primary bank" />
                    </SelectTrigger>
                    <SelectContent className={s.selectContent}>
                      {SALARY_BANK_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.salaryBank === OTHER_BANK ? (
                    <Input
                      className={cn(fieldClass, 'mt-2')}
                      placeholder="Bank name"
                      value={form.salaryBankOther}
                      onChange={(e) => form.setSalaryBankOther(e.target.value)}
                    />
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className={cn('flex gap-4 p-5', s.fashionPanel)}>
                <div
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center border bg-white',
                    variant === 'corporate' ? 'border-slate-900' : 'border-stone-900',
                  )}
                >
                  <Shirt
                    className={cn(
                      'h-7 w-7',
                      variant === 'corporate' ? 'text-slate-900' : 'text-stone-900',
                    )}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      'text-lg',
                      variant === 'corporate'
                        ? 'font-semibold text-slate-900'
                        : 'font-serif text-stone-900',
                    )}
                  >
                    {variant === 'corporate'
                      ? 'Fashion at launch'
                      : 'Fashion-only programme'}
                  </p>
                  <p className={cn('mt-1 text-sm leading-relaxed', s.successBody)}>
                    {variant === 'corporate'
                      ? 'Rollout starts with employer-backed wardrobe access on Stitches Africa — bespoke, ready-to-wear, and BNPL with salary-linked repayment. Broader lifestyle categories follow on the platform roadmap.'
                      : 'This waitlist is for employer-backed premium fashion access — bespoke, ready-to-wear, and African design. BNPL with salary-linked repayment.'}
                  </p>
                </div>
              </div>

              <ul className={cn('space-y-3 border-t pt-5', s.divider, s.body)}>
                <li className="flex gap-3">
                  <Building2 className={cn('mt-0.5 h-4 w-4 shrink-0', s.strong)} />
                  <span>
                    <strong className={s.strong}>{form.companyName || 'Your company'}</strong>
                    {form.industry ? ` · ${form.industry}` : null}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className={s.strong}>Contact:</span>
                  <span>
                    {form.hrAdminContact} · {form.email}
                  </span>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn('mt-8 flex items-center justify-between gap-4 border-t pt-6', s.footerBorder)}>
          <Button
            type="button"
            variant="ghost"
            className={s.backBtn}
            disabled={step === 0}
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="outline"
              className={s.nextBtn}
              disabled={step === 0 ? !canAdvanceStep0 : !canAdvanceStep1}
              onClick={() => setStep((prev) => prev + 1)}
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!form.canSubmit || form.submitting}
              className={s.submitBtn}
            >
              {form.submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
