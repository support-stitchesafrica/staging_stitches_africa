/** Firestore `bnpl_waitlist_signups` row as returned to marketing dashboard. */
export type BnplSignupSerialized = {
  id: string;
  formVersion: number;
  createdAt: string | null;
  source: string;
  firstName: string;
  lastName: string;
  bankCode: string;
  bankName: string;
  position: string;
  email: string;
  phone: string;
  industryPhase: string;
  industry: string;
  companyName: string;
  staffStrength: string;
  salaryBand: string;
  hrAdminContact: string;
  state: string;
  salaryBank: string;
  employeeInterests: string[];
  geoZone: string;
  industryTier: string;
  leadScore: number;
  interestCount: number;
};
