'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Sparkles,
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
  INDUSTRY_PHASE_1,
  INDUSTRY_PHASE_2,
  NIGERIAN_STATES_BY_ZONE,
  SALARY_BAND_OPTIONS,
  SALARY_BANK_OPTIONS,
  STAFF_STRENGTH_OPTIONS,
  WAITLIST_FORM_VERSION,
  type IndustryPhase,
} from '@/lib/waitlist/crl-employee-waitlist';

const OTHER_BANK = 'Other (specify below)';

const HERO_IMAGES = [
  {
    src: '/images/african-fashion-7.png',
    alt: 'African fashion',
    className: 'rotate-[-4deg] translate-x-0 z-30',
  },
  {
    src: '/images/african-fashion-2.png',
    alt: 'African fashion',
    className: 'rotate-[5deg] translate-x-8 -translate-y-6 z-20',
  },
  {
    src: '/images/african-fashion-5.png',
    alt: 'African fashion',
    className: 'rotate-[-2deg] translate-x-4 translate-y-8 z-10',
  },
];

const BENEFITS = [
  'Buy now, pay in instalments across several platforms',
  'Salary-linked repayment',
  'Premium fashion access',
  'Employer-backed benefits',
];

export function BnplWaitlistPage() {
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-neutral-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <header className="relative z-20 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/shops" className="flex shrink-0 items-center space-x-2">
            <Image
              src="/Stitches-Africa-Logo-06.png"
              alt="Stitches Africa"
              width={182}
              height={76}
              className="h-[76px] w-auto max-w-[min(182px,72vw)]"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-stretch lg:gap-16 lg:px-10 lg:py-14">
        <motion.div
          className="flex flex-1 flex-col justify-center lg:max-w-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium tracking-wide text-orange-900">
            Stitches Africa × CRL
          </div>

          <h1 className="font-serif text-3xl font-light leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl sm:leading-[1.12]">
            Reshaping Africa&apos;s employee lifestyle credit structure
          </h1>
          <p className="mt-4 text-sm font-medium text-neutral-800 sm:text-base">
            Stitches Africa in collaboration with CRL is building a premium{' '}
            <span className="text-orange-600">Employee Lifestyle Access Platform</span> for you.
          </p>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Benefits
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-800">
              {BENEFITS.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-neutral-600">
            Interested in joining the community? Use the form on the right to join the waitlist
          </p>

          <div className="relative mt-10 hidden h-[280px] w-full max-w-md sm:block">
            {HERO_IMAGES.map((img, i) => (
              <div
                key={img.src}
                className={cn(
                  'absolute left-0 top-0 h-52 w-40 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 sm:h-56 sm:w-44',
                  img.className,
                )}
                style={{ zIndex: 30 - i * 10 }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 200px, 220px"
                  priority={i === 0}
                />
              </div>
            ))}
            <div className="absolute bottom-2 right-0 max-w-[200px] rounded-md border border-neutral-900 bg-neutral-900 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white">
              Lifestyle access
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-1 items-start justify-center lg:justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <div
            id="waitlist-form"
            className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg shadow-neutral-900/5 sm:p-8"
          >
            {!done ? (
              <>
                <h2 className="text-lg font-medium text-neutral-900">Join the waitlist</h2>

                <form
                  className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible"
                  onSubmit={onSubmit}
                >
                  <section className="space-y-3 rounded-lg border border-neutral-100 bg-neutral-50/50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      A. Industry breakdown
                    </p>
                    <div className="space-y-2">
                      <Label className="text-neutral-800">Phase</Label>
                      <Select
                        value={industryPhase || undefined}
                        onValueChange={(v) => {
                          setIndustryPhase(v as IndustryPhase);
                          setIndustry('');
                        }}
                      >
                        <SelectTrigger className="h-11 w-full border-neutral-300 bg-neutral-100 hover:bg-neutral-100/90 focus:bg-neutral-100">
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent className="border-neutral-200 bg-neutral-50 text-neutral-900">
                          <SelectItem value="phase_1">Phase 1 — Finance, Oil &amp; Gas, Telecoms, FMCG, Tech</SelectItem>
                          <SelectItem value="phase_2">
                            Phase 2 — Public service, Healthcare, Aviation, Consulting, Retail
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-800">Industry</Label>
                      <Select
                        value={industry || undefined}
                        onValueChange={setIndustry}
                        disabled={!industryPhase}
                      >
                        <SelectTrigger className="h-11 w-full border-neutral-300 bg-neutral-100 hover:bg-neutral-100/90 focus:bg-neutral-100 disabled:bg-neutral-50/80">
                          <SelectValue
                            placeholder={industryPhase ? 'Select industry' : 'Choose phase first'}
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 border-neutral-200 bg-neutral-50 text-neutral-900">
                          {industryList.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </section>

                  <div className="space-y-2">
                    <Label htmlFor="crl-company" className="text-neutral-800">
                      B. Company name
                    </Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="crl-company"
                        className="border-neutral-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400"
                        placeholder="Registered company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-neutral-800">C. Staff strength</Label>
                      <Select value={staffStrength || undefined} onValueChange={setStaffStrength}>
                        <SelectTrigger className="h-11 w-full border-neutral-300 text-black! bg-white! hover:bg-white! focus:bg-white!">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="border-neutral-200 bg-white! text-neutral-900">
                          {STAFF_STRENGTH_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-800">D. Average salary band</Label>
                      <Select value={salaryBand || undefined} onValueChange={setSalaryBand}>
                        <SelectTrigger className="h-11 w-full border-neutral-300 text-black! bg-white! hover:bg-white! focus:bg-white!">
                          <SelectValue placeholder="Select band" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 border-neutral-200 bg-white! text-neutral-900">
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
                    <Label htmlFor="crl-hr" className="text-neutral-800">
                      E. HR / Admin contact
                    </Label>
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="crl-hr"
                        className="border-neutral-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400"
                        placeholder="Full name"
                        value={hrAdminContact}
                        onChange={(e) => setHrAdminContact(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crl-email" className="text-neutral-800">
                      F. Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="crl-email"
                        type="email"
                        autoComplete="email"
                        className="border-neutral-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400"
                        placeholder="hr@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crl-phone" className="text-neutral-800">
                      G. Phone number
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="crl-phone"
                        type="tel"
                        autoComplete="tel"
                        className="border-neutral-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400"
                        placeholder="+234 …"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-800">H. Location (state)</Label>
                    <Select value={state || undefined} onValueChange={setState}>
                      <SelectTrigger className="h-11 w-full border-neutral-300! text-black! bg-white! hover:bg-white! focus:bg-white!">
                        <SelectValue placeholder="Select state (36 + FCT)" className="text-black!" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 border-neutral-200 bg-white! text-neutral-900">
                        {Object.entries(NIGERIAN_STATES_BY_ZONE).map(([zone, states]) => (
                          <SelectGroup key={zone}>
                            <SelectLabel className="text-neutral-500">{zone}</SelectLabel>
                            {states.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-800">I. Salary bank</Label>
                    <Select value={salaryBank || undefined} onValueChange={setSalaryBank}>
                      <SelectTrigger className="h-11 w-full border-neutral-300 text-black! bg-white! hover:bg-white! focus:bg-white!">
                        <SelectValue placeholder="Primary salary account bank" className="text-black!" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 border-neutral-200 bg-white! text-neutral-900">
                        {SALARY_BANK_OPTIONS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {salaryBank === OTHER_BANK ? (
                      <Input
                        className="border-neutral-300 bg-white text-neutral-900"
                        placeholder="Bank name"
                        value={salaryBankOther}
                        onChange={(e) => setSalaryBankOther(e.target.value)}
                      />
                    ) : null}
                  </div>

                  <fieldset className="space-y-3 rounded-lg border border-neutral-100 p-3">
                    <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      J. Employee interests
                    </legend>
                    <p className="text-xs text-neutral-500">Select all that apply.</p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {EMPLOYEE_INTEREST_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-1 py-0.5 hover:border-neutral-200"
                        >
                          <Checkbox
                            checked={!!interests[opt]}
                            onCheckedChange={(c) => toggleInterest(opt, c === true)}
                            className="mt-0.5"
                          />
                          <span className="text-sm leading-snug text-neutral-800">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <Button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center bg-neutral-900 font-semibold text-white shadow-md hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Join the waitlist'
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="py-4 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet-700 bg-violet-50 text-violet-900"
                >
                  <CheckCircle2 className="h-9 w-9" />
                </motion.div>
                <h2 className="mt-5 text-xl font-medium text-neutral-900">You&apos;re on the list.</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Thank you. Our team will review your organisation details and reach out about the CRL ×
                  Stitches Africa employee lifestyle programme.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-8 border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100"
                >
                  <Link href="/shops">Browse Stitches Africa</Link>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <footer className="relative z-10 border-t border-neutral-200 bg-white px-4 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Stitches Africa ·{' '}
        <Link href="/shops" className="text-neutral-900 underline-offset-4 hover:underline">
          Shop
        </Link>
      </footer>
    </div>
  );
}
