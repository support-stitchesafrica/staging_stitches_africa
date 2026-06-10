export const BNPL_BENEFITS = [
  'Buy now, pay in instalments across several platforms',
  'Salary-linked repayment',
  'Premium fashion access',
  'Employer-backed benefits',
] as const;

export const BNPL_HERO_IMAGES = [
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
] as const;

/** Lifestyle pillars — fashion stays first but framing is universal */
export const LIFESTYLE_PILLARS = [
  {
    id: 'fashion',
    label: 'Fashion',
    tagline: 'Premium African design & bespoke access',
    highlight: true,
  },
  {
    id: 'mobility',
    label: 'Mobility',
    tagline: 'Rides, travel & getting there',
  },
  {
    id: 'food',
    label: 'Food & grocery',
    tagline: 'Everyday essentials, delivered',
  },
  {
    id: 'home',
    label: 'Home & media',
    tagline: 'Subscriptions, data & entertainment',
  },
] as const;

export const BNPL_HEADLINE = 'Buy now, pay later for employees';

export const BNPL_SUBHEAD =
  'Stitches Africa in collaboration with CRL is building a premium Employee Lifestyle Access Platform for you.';

export const BNPL_CTA_HINT =
  'Interested in joining the community? Use the form to join the waitlist.';

export const BNPL_SUCCESS_TITLE = "You're on the list.";

export const BNPL_SUCCESS_BODY =
  'Thank you. We will review your details and be in touch about the waitlist.';
