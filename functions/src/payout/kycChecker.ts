import { Tailor } from "../../../types";

type VendorData = Partial<Tailor>;

/**
 * Returns true if the vendor has completed KYC via identity or company verification.
 */
export function isKycComplete(vendorDoc: VendorData): boolean {
  const hasIdentity = !!vendorDoc["identity-verification"]?.idNumber;
  const hasCompany = !!vendorDoc["company-verification"]?.registrationNumber;
  return hasIdentity || hasCompany;
}
