import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isKycComplete } from "../kycChecker";

const nonEmptyString = fc.string({ minLength: 1 });

describe("isKycComplete — property-based tests", () => {
  /**
   * Property 9.3a: Returns true iff at least one of identity or company verification exists.
   * When both are absent → false.
   */
  it("returns false when neither identity nor company verification is present", () => {
    fc.assert(
      fc.property(
        fc.record({
          brandName: fc.string(),
          email: fc.string(),
        }),
        (vendor) => {
          expect(isKycComplete(vendor as any)).toBe(false);
        }
      )
    );
  });

  /**
   * Property 9.3b: Returns true when identity-verification.idNumber is present (any non-empty string).
   */
  it("returns true when identity-verification.idNumber is present", () => {
    fc.assert(
      fc.property(nonEmptyString, (idNumber) => {
        const vendor = { "identity-verification": { idNumber } };
        expect(isKycComplete(vendor as any)).toBe(true);
      })
    );
  });

  /**
   * Property 9.3c: Returns true when company-verification.registrationNumber is present.
   */
  it("returns true when company-verification.registrationNumber is present", () => {
    fc.assert(
      fc.property(nonEmptyString, (registrationNumber) => {
        const vendor = { "company-verification": { registrationNumber } };
        expect(isKycComplete(vendor as any)).toBe(true);
      })
    );
  });

  /**
   * Property 9.3d: Returns true when both are present.
   */
  it("returns true when both identity and company verification are present", () => {
    fc.assert(
      fc.property(nonEmptyString, nonEmptyString, (idNumber, registrationNumber) => {
        const vendor = {
          "identity-verification": { idNumber },
          "company-verification": { registrationNumber },
        };
        expect(isKycComplete(vendor as any)).toBe(true);
      })
    );
  });

  /**
   * Property 9.3e: Empty string idNumber is treated as falsy → false (no other verification).
   */
  it("returns false when idNumber is an empty string", () => {
    const vendor = { "identity-verification": { idNumber: "" } };
    expect(isKycComplete(vendor as any)).toBe(false);
  });

  it("returns false when registrationNumber is an empty string", () => {
    const vendor = { "company-verification": { registrationNumber: "" } };
    expect(isKycComplete(vendor as any)).toBe(false);
  });

  it("returns false for completely empty vendor document", () => {
    expect(isKycComplete({} as any)).toBe(false);
  });

  it("returns false when identity-verification exists but idNumber is missing", () => {
    const vendor = { "identity-verification": { someOtherField: "value" } };
    expect(isKycComplete(vendor as any)).toBe(false);
  });
});
