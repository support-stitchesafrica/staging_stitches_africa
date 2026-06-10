'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

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

const field =
  'h-11 rounded-xl border-2 border-[#1a1a1a]/12 bg-white !text-[#1a1a1a] !shadow-none placeholder:text-[#1a1a1a]/40 focus-visible:border-[#e85d4c] focus-visible:ring-0';
const selectTrigger =
  'h-11 w-full rounded-xl border-2 border-[#1a1a1a]/12 !bg-[#f0ebe4] pl-4 !text-[#1a1a1a] !shadow-none focus:ring-0 focus:!bg-[#ebe4da] data-[placeholder]:!text-[#1a1a1a]/40 [&_svg]:!text-[#1a1a1a]/50';
const selectContent =
  'rounded-xl border-2 border-[#1a1a1a]/10 !bg-white !text-[#1a1a1a] [&_[data-slot=select-item]]:!text-[#1a1a1a] [&_[data-slot=select-item]:focus]:!bg-[#e85d4c]/10 [&_[data-slot=select-item]:focus]:!text-[#1a1a1a] [&_[data-slot=select-label]]:!text-[#1a1a1a]/50';
const selectItem =
  'rounded-lg !text-[#1a1a1a] focus:!bg-[#e85d4c]/10 focus:!text-[#1a1a1a] data-highlighted:!bg-[#e85d4c]/10';
const box = 'rounded-2xl border-2 border-[#1a1a1a] bg-white p-5 sm:p-6';

type Props = {
  form: BnplWaitlistFormState;
  formTitle?: string;
  className?: string;
};

export function RunwayWaitlistForm({
  form,
  formTitle = 'Join the waitlist',
  className,
}: Props) {
  useEffect(() => {
    form.toggleInterest('Fashion', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (form.done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('border-2 border-[#1a1a1a] bg-white p-10 text-center', className)}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e85d4c] text-white">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="mt-5 font-serif text-2xl text-[#1a1a1a]">{BNPL_SUCCESS_TITLE}</h2>
        <p className="mt-2 text-sm text-[#1a1a1a]/65">{BNPL_SUCCESS_BODY}</p>
        <Button
          asChild
          className="mt-8 rounded-full bg-[#1a1a1a] text-white shadow-none! hover:bg-[#333]"
        >
          <Link href="/shops">Browse Stitches Africa</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div id="waitlist-form" className={cn(className)}>
      <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-[#1a1a1a] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e85d4c]">
            Register
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#1a1a1a] sm:text-3xl">{formTitle}</h2>
        </div>
        <span className="hidden rounded-full bg-[#1a1a1a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:inline">
          Fashion
        </span>
      </div>

      <form className="space-y-5" onSubmit={form.onSubmit}>
        <div className={box}>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e85d4c]">
            Organisation
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-bold uppercase text-[#1a1a1a]/55">Phase</Label>
              <Select
                value={form.industryPhase || undefined}
                onValueChange={(v) => {
                  form.setIndustryPhase(v as IndustryPhase);
                  form.setIndustry('');
                }}
              >
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent className={selectContent}>
                  <SelectItem value="phase_1" className={selectItem}>
                    Phase 1 — Finance, Oil &amp; Gas, Telecoms, FMCG, Tech
                  </SelectItem>
                  <SelectItem value="phase_2" className={selectItem}>
                    Phase 2 — Public service, Healthcare, Aviation, Consulting, Retail
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-bold uppercase text-[#1a1a1a]/55">Industry</Label>
              <Select
                value={form.industry || undefined}
                onValueChange={form.setIndustry}
                disabled={!form.industryPhase}
              >
                <SelectTrigger className={cn(selectTrigger, 'disabled:opacity-50')} disabled={!form.industryPhase}>
                  <SelectValue
                    placeholder={form.industryPhase ? 'Select industry' : 'Choose phase first'}
                  />
                </SelectTrigger>
                <SelectContent className={cn(selectContent, 'max-h-72')}>
                  {form.industryList.map((name) => (
                    <SelectItem key={name} value={name} className={selectItem}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="runway-company" className="text-xs font-bold uppercase text-[#1a1a1a]/55">
                Company
              </Label>
              <Input
                id="runway-company"
                className={field}
                placeholder="Registered company name"
                value={form.companyName}
                onChange={(e) => form.setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#1a1a1a]/55">Staff</Label>
              <Select value={form.staffStrength || undefined} onValueChange={form.setStaffStrength}>
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="Strength" />
                </SelectTrigger>
                <SelectContent className={selectContent}>
                  {STAFF_STRENGTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className={selectItem}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#1a1a1a]/55">Salary band</Label>
              <Select value={form.salaryBand || undefined} onValueChange={form.setSalaryBand}>
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="Band" />
                </SelectTrigger>
                <SelectContent className={selectContent}>
                  {SALARY_BAND_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className={selectItem}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className={box}>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#e85d4c]">
            Contact
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="runway-hr" className="text-xs font-bold uppercase text-[#1a1a1a]/55">
                HR contact
              </Label>
              <Input
                id="runway-hr"
                className={field}
                placeholder="Full name"
                value={form.hrAdminContact}
                onChange={(e) => form.setHrAdminContact(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runway-email" className="text-xs font-bold uppercase text-[#1a1a1a]/55">
                Email
              </Label>
              <Input
                id="runway-email"
                type="email"
                className={field}
                placeholder="hr@company.com"
                value={form.email}
                onChange={(e) => form.setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runway-phone" className="text-xs font-bold uppercase text-[#1a1a1a]/55">
                Phone
              </Label>
              <Input
                id="runway-phone"
                type="tel"
                className={field}
                placeholder="+234 …"
                value={form.phone}
                onChange={(e) => form.setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#1a1a1a]/55">State</Label>
              <Select value={form.state || undefined} onValueChange={form.setState}>
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className={cn(selectContent, 'max-h-72')}>
                  {Object.entries(NIGERIAN_STATES_BY_ZONE).map(([zone, states]) => (
                    <SelectGroup key={zone}>
                      <SelectLabel className="text-[#1a1a1a]/50">{zone}</SelectLabel>
                      {states.map((st) => (
                        <SelectItem key={st} value={st} className={selectItem}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#1a1a1a]/55">Salary bank</Label>
              <Select value={form.salaryBank || undefined} onValueChange={form.setSalaryBank}>
                <SelectTrigger className={selectTrigger}>
                  <SelectValue placeholder="Bank" />
                </SelectTrigger>
                <SelectContent className={selectContent}>
                  {SALARY_BANK_OPTIONS.map((b) => (
                    <SelectItem key={b} value={b} className={selectItem}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.salaryBank === OTHER_BANK ? (
                <Input
                  className={cn(field, 'mt-2')}
                  placeholder="Bank name"
                  value={form.salaryBankOther}
                  onChange={(e) => form.setSalaryBankOther(e.target.value)}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#e85d4c]/50 bg-[#e85d4c]/5 px-4 py-3">
          <span className="rounded-full bg-[#e85d4c] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            Fashion
          </span>
          <p className="text-sm text-[#1a1a1a]/70">
            Programme category locked — premium African fashion &amp; bespoke only.
          </p>
        </div> */}

        <Button
          type="submit"
          disabled={!form.canSubmit || form.submitting}
          className="h-11 w-full rounded-full bg-[#e85d4c] text-sm font-semibold text-white shadow-none! hover:bg-[#d14a3a] disabled:opacity-50"
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
      </form>
    </div>
  );
}
