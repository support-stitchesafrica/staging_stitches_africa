/**
 * CRL × Stitches Africa employee lifestyle waitlist — shared options & geo helpers.
 * Used by public signup API and the marketing waitlist UI.
 */

export const INDUSTRY_PHASE_1 = [
  'Finance',
  'Oil & Gas',
  'Telecoms',
  'FMCG',
  'Tech Companies',
] as const;

export const INDUSTRY_PHASE_2 = [
  'Public Service',
  'Healthcare',
  'Aviation',
  'Consulting Firms',
  'Large Retail Chains',
] as const;

export type IndustryPhase = 'phase_1' | 'phase_2';

export const EMPLOYEE_INTEREST_OPTIONS = [
  'Fashion',
  'Transport (Uber, Bolt, etc.)',
  'Grocery shopping',
  'Food',
  'Travel',
  'Media Subscriptions (DStv, Netflix, etc.)',
  'Data Subscriptions',
  'Movies',
  'Party',
] as const;

export const STAFF_STRENGTH_OPTIONS = [
  '1 – 50',
  '51 – 200',
  '201 – 500',
  '501 – 1,000',
  '1,001 – 5,000',
  '5,000+',
] as const;

export const SALARY_BAND_OPTIONS = [
  'Below ₦100,000 / month',
  '₦100,000 – ₦250,000 / month',
  '₦250,001 – ₦500,000 / month',
  '₦500,001 – ₦1,000,000 / month',
  '₦1,000,001 – ₦2,000,000 / month',
  'Above ₦2,000,000 / month',
  // 'Prefer not to say',
] as const;

/** Major salary-account banks (alphabetical) — faster than free-text. */
export const SALARY_BANK_OPTIONS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Lotus Bank',
  'Moniepoint Microfinance Bank',
  'Opay',
  'Palmpay',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank Nigeria',
  'Sterling Bank',
  'Suntrust Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
  'Other (specify below)',
] as const;

/** Nigerian states + FCT, grouped by geopolitical zone for faster navigation. */
export const NIGERIAN_STATES_BY_ZONE: Record<string, readonly string[]> = {
  'North Central': [
    'Benue',
    'Federal Capital Territory (Abuja)',
    'Kogi',
    'Kwara',
    'Nasarawa',
    'Niger',
    'Plateau',
  ],
  'North East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
  'North West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
  'South East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
  'South South': [
    'Akwa Ibom',
    'Bayelsa',
    'Cross River',
    'Delta',
    'Edo',
    'Rivers',
  ],
  'South West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
};

const STATE_TO_ZONE = (() => {
  const map = new Map<string, string>();
  for (const [zone, states] of Object.entries(NIGERIAN_STATES_BY_ZONE)) {
    for (const s of states) {
      map.set(s, zone);
    }
  }
  return map;
})();

export function getGeoZoneFromState(state: string): string {
  return STATE_TO_ZONE.get(state.trim()) ?? 'Unknown';
}

export function isValidIndustryForPhase(
  phase: IndustryPhase,
  industry: string,
): boolean {
  const list = phase === 'phase_1' ? INDUSTRY_PHASE_1 : INDUSTRY_PHASE_2;
  return (list as readonly string[]).includes(industry);
}

const STAFF_RANK: Record<string, number> = {
  '1 – 50': 1,
  '51 – 200': 2,
  '201 – 500': 3,
  '501 – 1,000': 4,
  '1,001 – 5,000': 5,
  '5,000+': 6,
};

/**
 * Lightweight lead ranking for marketing sort (higher = larger org + more interests).
 */
export function computeLeadScore(staffStrength: string, interestCount: number): number {
  const base = STAFF_RANK[staffStrength] ?? 2;
  return Math.min(99, base * 10 + interestCount * 3);
}

export const WAITLIST_FORM_VERSION = 2 as const;
