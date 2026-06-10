/**
 * Property-Based Tests: Wallet Balance Display Correctness
 *
 * Feature: vendor-order-payment-tracking
 * Property 14: Wallet display equals sum of price × quantity for unpaid orders
 * Validates: Requirements 5.1
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeWalletBalance } from "./TailorOrderService";
import type { TailorOrder } from "./TailorOrderService";

// Minimal TailorOrder factory — only fields needed for wallet computation
function makeOrder(
  price: number,
  quantity: number,
  payment_status: "unpaid" | "paid"
): TailorOrder {
  return {
    order_id: "ord-1",
    product_id: "prod-1",
    title: "Test Product",
    quantity,
    price,
    shipping_fee: 0,
    order_status: "Processing",
    delivery_date: new Date().toISOString(),
    delivery_type: "Standard",
    user_id: "user-1",
    user_address: {} as any,
    images: [],
    timestamp: new Date().toISOString(),
    tailor_id: "tailor-1",
    tailor_name: "Test Tailor",
    payment_status,
  };
}

// Arbitrary for a single TailorOrder with realistic price/quantity ranges
// fc.float requires 32-bit float boundaries — use Math.fround to satisfy the constraint
const orderArb = fc
  .record({
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10_000), noNaN: true }),
    quantity: fc.integer({ min: 1, max: 100 }),
    payment_status: fc.constantFrom("unpaid" as const, "paid" as const),
  })
  .map(({ price, quantity, payment_status }) =>
    makeOrder(price, quantity, payment_status)
  );

describe("computeWalletBalance", () => {
  // Feature: vendor-order-payment-tracking, Property 14: Wallet display equals sum of price × quantity for unpaid orders
  it("Property 14: wallet balance equals sum of price × quantity for unpaid orders only", () => {
    fc.assert(
      fc.property(fc.array(orderArb, { minLength: 0, maxLength: 50 }), (orders) => {
        const result = computeWalletBalance(orders);

        // Manually compute expected value
        const expected = orders
          .filter((o) => o.payment_status === "unpaid")
          .reduce((sum, o) => sum + o.price * o.quantity, 0);

        // Allow for floating-point rounding tolerance
        expect(result).toBeCloseTo(expected, 5);
      }),
      { numRuns: 200 }
    );
  });

  it("Property 14 (paid orders excluded): paid orders contribute zero to wallet balance", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(10_000), noNaN: true }),
            quantity: fc.integer({ min: 1, max: 100 }),
          }).map(({ price, quantity }) => makeOrder(price, quantity, "paid")),
          { minLength: 1, maxLength: 50 }
        ),
        (paidOrders) => {
          // All-paid list should always yield 0
          expect(computeWalletBalance(paidOrders)).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("Property 14 (unpaid orders included): all-unpaid list equals full sum", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(10_000), noNaN: true }),
            quantity: fc.integer({ min: 1, max: 100 }),
          }).map(({ price, quantity }) => makeOrder(price, quantity, "unpaid")),
          { minLength: 1, maxLength: 50 }
        ),
        (unpaidOrders) => {
          const result = computeWalletBalance(unpaidOrders);
          const expected = unpaidOrders.reduce(
            (sum, o) => sum + o.price * o.quantity,
            0
          );
          expect(result).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("Property 14 (empty list): empty orders list yields zero balance", () => {
    expect(computeWalletBalance([])).toBe(0);
  });
});
