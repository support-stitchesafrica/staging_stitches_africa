'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  EMPLOYEE_INTEREST_OPTIONS,
  INDUSTRY_PHASE_1,
  INDUSTRY_PHASE_2,
  WAITLIST_FORM_VERSION,
  type IndustryPhase,
} from '@/lib/waitlist/crl-employee-waitlist';

export const OTHER_BANK = 'Other (specify below)';

export function useBnplWaitlistForm() {
  const [industryPhase, setIndustryPhase] = useState<IndustryPhase | ''>('');
  const [industry, setIndustry] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [staffStrength, setStaffStrength] = useState('');
  const [salaryBand, setSalaryBand] = useState('');
  const [hrAdminContact, setHrAdminContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [salaryBank, setSalaryBank] = useState('');
  const [salaryBankOther, setSalaryBankOther] = useState('');
  const [interests, setInterests] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const industryList = useMemo(() => {
    if (industryPhase === 'phase_1') return [...INDUSTRY_PHASE_1];
    if (industryPhase === 'phase_2') return [...INDUSTRY_PHASE_2];
    return [];
  }, [industryPhase]);

  const selectedInterests = useMemo(
    () =>
      EMPLOYEE_INTEREST_OPTIONS.filter((k) => interests[k]).sort((a, b) =>
        a.localeCompare(b),
      ),
    [interests],
  );

  const canSubmit = useMemo(() => {
    const phoneOk = phone.replace(/\s/g, '').length >= 10;
    const bankOk =
      salaryBank &&
      (salaryBank !== OTHER_BANK || salaryBankOther.trim().length >= 2);
    return (
      !!industryPhase &&
      !!industry &&
      companyName.trim().length >= 2 &&
      !!staffStrength &&
      !!salaryBand &&
      hrAdminContact.trim().length >= 2 &&
      email.trim().length > 0 &&
      phoneOk &&
      !!state &&
      bankOk &&
      selectedInterests.length > 0
    );
  }, [
    industryPhase,
    industry,
    companyName,
    staffStrength,
    salaryBand,
    hrAdminContact,
    email,
    phone,
    state,
    salaryBank,
    salaryBankOther,
    selectedInterests.length,
  ]);

  function toggleInterest(key: string, checked: boolean) {
    setInterests((prev) => ({ ...prev, [key]: checked }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !industryPhase) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist/bnpl-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formVersion: WAITLIST_FORM_VERSION,
          industryPhase,
          industry,
          companyName: companyName.trim(),
          staffStrength,
          salaryBand,
          hrAdminContact: hrAdminContact.trim(),
          email: email.trim(),
          phone: phone.trim(),
          state,
          salaryBank,
          salaryBankOther: salaryBank === OTHER_BANK ? salaryBankOther.trim() : '',
          employeeInterests: selectedInterests,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setDone(true);
      toast.success("You're on the list.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    industryPhase,
    setIndustryPhase,
    industry,
    setIndustry,
    companyName,
    setCompanyName,
    staffStrength,
    setStaffStrength,
    salaryBand,
    setSalaryBand,
    hrAdminContact,
    setHrAdminContact,
    email,
    setEmail,
    phone,
    setPhone,
    state,
    setState,
    salaryBank,
    setSalaryBank,
    salaryBankOther,
    setSalaryBankOther,
    interests,
    toggleInterest,
    industryList,
    canSubmit,
    submitting,
    done,
    onSubmit,
  };
}

export type BnplWaitlistFormState = ReturnType<typeof useBnplWaitlistForm>;
