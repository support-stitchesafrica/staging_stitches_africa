import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { calculateVendorPayout } from "../amountCalculator";

// Arbitrary for a positive price (up to 1,000,000 to avoid float precision edge cases)
const positivePrice = fc.float({ min: 1, max: 1_000_000, noNaN: true, noDefaultInfinity: true });
const nonNegativeFee = fc.float({ min: 0, max: 500_000, noNaN: true, noDefaultInfinity: true });

describe("calculateVendorPayout — property-based tests", () => {
  /**
   * Property 9.2a: vendorAmount == (source_price - shipping_fee) * 0.20
   * for any valid price and shipping_fee where price > shipping_fee.
   */
  it("vendorAmount equals (price - shipping_fee) * 0.20", () => {
    fc.assert(
      fc.property(
        positivePrice,
        nonNegativeFee,
        (price, shippingFee) => {
          // Ensure price > shippingFee so netAmount > 0
          fc.pre(price > shippingFee);

          const result = calculateVendorPayout({ source_price: price, shipping_fee: shippingFee });
          const expectedVendorAmount = parseFloat(((price - shippingFee) * 0.20).toFixed(2));

          expect(result.vendorAmount).toBeCloseTo(expectedVendorAmount, 2);
        }
      )
    );
  });

  /**
   * Property 9.2b: vendorAmount + platformAmount == netAmount (within floating point tolerance).
   */
  it("vendorAmount + platformAmount equals netAmount", () => {
    fc.assert(
      fc.property(
        positivePrice,
        nonNegativeFee,
        (price, shippingFee) => {
          fc.pre(price > shippingFee);

          const result = calculateVendorPayout({ source_price: price, shipping_fee: shippingFee });

          // Allow 1 cent tolerance for floating point rounding
          expect(result.vendorAmount + result.platformAmount).toBeCloseTo(result.netAmount, 1);
        }
      )
    );
  });

  /**
   * Property 9.2c: vendorAmount is always >= 0 (never negative).
   */
  it("vendorAmount is never negative", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (price, shippingFee) => {
          const result = calculateVendorPayout({ source_price: price, shipping_fee: shippingFee });
          expect(result.vendorAmount).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  /**
   * Property 9.2d: Falls back to `price` field when `source_price` is absent.
   */
  it("falls back to price field when source_price is absent", () => {
    fc.assert(
      fc.property(positivePrice, nonNegativeFee, (price, shippingFee) => {
        fc.pre(price > shippingFee);

        const withSourcePrice = calculateVendorPayout({ source_price: price, shipping_fee: shippingFee });
        const withFallback = calculateVendorPayout({ price, shipping_fee: shippingFee });

        expect(withFallback.vendorAmount).toBeCloseTo(withSourcePrice.vendorAmount, 2);
      })
    );
  });

  /**
   * Property 9.2e: When shipping_fee >= price, netAmount is 0 and vendorAmount is 0.
   */
  it("returns zero vendorAmount when shipping_fee >= price", () => {
    fc.assert(
      fc.property(positivePrice, (price) => {
        const shippingFee = price + 1;
        const result = calculateVendorPayout({ source_price: price, shipping_fee: shippingFee });
        expect(result.netAmount).toBe(0);
        expect(result.vendorAmount).toBe(0);
      })
    );
  });

  // Concrete cases
  it("calculates correctly for a known example: price=1000, shipping=200", () => {
    const result = calculateVendorPayout({ source_price: 1000, shipping_fee: 200 });
    expect(result.netAmount).toBe(800);
    expect(result.vendorAmount).toBe(160);
    expect(result.platformAmount).toBe(640);
  });

  it("uses source_currency when available, falls back to currency then NGN", () => {
    const withSourceCurrency = calculateVendorPayout({ source_price: 100, source_currency: "USD" });
    expect(withSourceCurrency.currency).toBe("USD");

    const withCurrency = calculateVendorPayout({ source_price: 100, currency: "GBP" });
    expect(withCurrency.currency).toBe("GBP");

    const withDefault = calculateVendorPayout({ source_price: 100 });
    expect(withDefault.currency).toBe("NGN");
  });
});
