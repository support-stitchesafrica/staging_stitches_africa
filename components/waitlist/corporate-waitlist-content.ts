/** Copy and structure for Design D — corporate / universal lifestyle waitlist */

export const CORPORATE_KICKER = 'Stitches Africa × CRL';

export const CORPORATE_HERO_TITLE =
  'Employee lifestyle credit, built for the modern workplace';

export const CORPORATE_HERO_BODY =
  'A salary-linked benefits layer for organisations that want to reward teams with dignity - starting with premium wardrobe access, with a broader lifestyle platform on the horizon.';

export const CORPORATE_AUDIENCES = [
  {
    role: 'HR & People',
    desc: 'Roll out a tangible perk with clear policy, onboarding, and employee comms.',
  },
  {
    role: 'Finance',
    desc: 'Salary-band alignment, predictable instalments, and employer-backed structure.',
  },
  {
    role: 'Leadership',
    desc: 'Differentiate your EVP without building benefits infrastructure from scratch.',
  },
] as const;

export const CORPORATE_STATS = [
  { value: 'BNPL', label: 'Buy now, pay in instalments' },
  { value: 'Salary-linked', label: 'Repayment aligned to payroll' },
  { value: 'Fashion-first', label: 'Wardrobe access at launch' },
] as const;
