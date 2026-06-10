import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isDeliveryEvent } from "../deliveryDetector";

// Arbitraries
const deliveredStatus = fc.constantFrom(
  "delivered",
  "ok - delivered",
  "shipment delivered",
  "DELIVERED",
  "OK - Delivered",
  "Shipment Delivered"
);

const nonDeliveredStatus = fc.constantFrom(
  "in transit",
  "out for delivery",
  "picked up",
  "processing",
  "shipped",
  "",
  "transit",
  "customs clearance"
);

const orderWithDeliveredDhlEvent = deliveredStatus.map((s) => ({
  last_dhl_event: { status: s },
  order_status: "shipped",
}));

const orderWithDeliveredOrderStatus = fc.record({
  last_dhl_event: fc.record({ status: nonDeliveredStatus }),
  order_status: fc.constant("delivered"),
});

const deliveredOrder = fc.oneof(
  orderWithDeliveredDhlEvent,
  orderWithDeliveredOrderStatus
);

const nonDeliveredOrder = fc.record({
  last_dhl_event: fc.record({ status: nonDeliveredStatus }),
  order_status: nonDeliveredStatus.filter((s) => s !== "delivered"),
});

describe("isDeliveryEvent — property-based tests", () => {
  /**
   * Property 9.1a: Only returns true on transition FROM non-delivered TO delivered.
   * For any non-delivered before and delivered after, must return true.
   */
  it("returns true when transitioning from non-delivered to delivered", () => {
    fc.assert(
      fc.property(nonDeliveredOrder, deliveredOrder, (before, after) => {
        expect(isDeliveryEvent(before, after)).toBe(true);
      })
    );
  });

  /**
   * Property 9.1b: Never returns true when the order was already delivered before.
   * Idempotency — re-triggering on an already-delivered order must not fire again.
   */
  it("never returns true when order was already delivered before", () => {
    fc.assert(
      fc.property(deliveredOrder, deliveredOrder, (before, after) => {
        expect(isDeliveryEvent(before, after)).toBe(false);
      })
    );
  });

  /**
   * Property 9.1c: Returns false when after state is not delivered (regardless of before).
   */
  it("returns false when after state is not delivered", () => {
    fc.assert(
      fc.property(
        fc.oneof(nonDeliveredOrder, deliveredOrder),
        nonDeliveredOrder,
        (before, after) => {
          expect(isDeliveryEvent(before, after)).toBe(false);
        }
      )
    );
  });

  // Concrete regression cases
  it("handles explicit delivered transition via last_dhl_event", () => {
    const before = { last_dhl_event: { status: "in transit" }, order_status: "shipped" };
    const after = { last_dhl_event: { status: "delivered" }, order_status: "shipped" };
    expect(isDeliveryEvent(before, after)).toBe(true);
  });

  it("handles explicit delivered transition via order_status", () => {
    const before = { last_dhl_event: { status: "in transit" }, order_status: "shipped" };
    const after = { last_dhl_event: { status: "in transit" }, order_status: "delivered" };
    expect(isDeliveryEvent(before, after)).toBe(true);
  });

  it("returns false when both before and after are non-delivered", () => {
    const before = { last_dhl_event: { status: "in transit" }, order_status: "shipped" };
    const after = { last_dhl_event: { status: "out for delivery" }, order_status: "shipped" };
    expect(isDeliveryEvent(before, after)).toBe(false);
  });

  it("returns false when before is already delivered (no double-trigger)", () => {
    const before = { last_dhl_event: { status: "delivered" }, order_status: "delivered" };
    const after = { last_dhl_event: { status: "delivered" }, order_status: "delivered" };
    expect(isDeliveryEvent(before, after)).toBe(false);
  });
});
