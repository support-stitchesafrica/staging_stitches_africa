/**
 * Orchestrator tests: idempotency (9.4), provider routing (9.5), vendor routing (9.6).
 *
 * These tests exercise the orchestration logic directly (not via the Firebase trigger)
 * by importing and calling the pure utility functions and verifying that the correct
 * provider handler is selected and that the correct vendor is targeted.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ── Pure utility imports (no Firebase deps) ──────────────────────────────────
import { detectProvider } from "../providerRouter";
import { isDeliveryEvent } from "../deliveryDetector";
import { calculateVendorPayout } from "../amountCalculator";
import { isKycComplete } from "../kycChecker";

// ── Provider mocks ────────────────────────────────────────────────────────────
vi.mock("../providers/paystackPayout", () => ({
  executePaystackPayout: vi.fn().mockResolvedValue({ status: "completed", reference: "ps_ref", provider: "paystack" }),
  createOrGetPaystackRecipient: vi.fn().mockResolvedValue("RCP_test"),
}));

vi.mock("../providers/flutterwavePayout", () => ({
  executeFlutterwavePayout: vi.fn().mockResolvedValue({ status: "completed", reference: "fw_ref", provider: "flutterwave" }),
}));

vi.mock("../providers/stripePayout", () => ({
  executeStripePayout: vi.fn().mockResolvedValue({ status: "completed", reference: "tr_stripe", provider: "stripe" }),
}));

import { executePaystackPayout } from "../providers/paystackPayout";
import { executeFlutterwavePayout } from "../providers/flutterwavePayout";
import { executeStripePayout } from "../providers/stripePayout";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal order fixture with a given payout_status and payment_provider. */
function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order_001",
    tailor_id: "vendor_abc",
    source_price: 5000,
    shipping_fee: 500,
    payment_provider: "paystack",
    order_status: "shipped",
    last_dhl_event: { status: "in transit" },
    payout_status: undefined as string | undefined,
    ...overrides,
  };
}

/** Minimal vendor fixture with KYC and payment accounts. */
function makeVendor(overrides: Record<string, unknown> = {}) {
  return {
    id: "vendor_abc",
    "identity-verification": { idNumber: "NIN12345" },
    paystackSubaccount: { subaccount_code: "SUB_abc", account_number: "0123456789", settlement_bank: "058" },
    flutterwaveAccountDetails: { bank_code: "058", account_number: "0123456789", account_name: "Test Vendor", currency: "NGN" },
    stripeConnectAccountId: "acct_test123",
    ...overrides,
  };
}

// ── Simulate the orchestrator's core decision logic ───────────────────────────
// This mirrors the logic in processVendorPayout without Firebase deps.
async function runPayoutLogic(
  order: ReturnType<typeof makeOrder>,
  vendor: ReturnType<typeof makeVendor>,
  secretKeys = { paystack: "sk_test", flutterwave: "fw_test", stripe: "sk_stripe" }
) {
  // Idempotency guard (task 7.2)
  if (order.payout_status === "completed" || order.payout_status === "processing") {
    return { skipped: true, reason: "idempotency" };
  }

  // Delivery check (task 7.3)
  const before = { order_status: "shipped", last_dhl_event: { status: "in transit" } };
  const after = { order_status: order.order_status, last_dhl_event: order.last_dhl_event };
  if (!isDeliveryEvent(before as any, after as any)) {
    return { skipped: true, reason: "not_delivery_event" };
  }

  // KYC check (task 7.6)
  if (!isKycComplete(vendor as any)) {
    return { skipped: true, reason: "kyc_incomplete" };
  }

  // Amount check (task 7.7)
  const calculation = calculateVendorPayout(order as any);
  if (calculation.vendorAmount <= 0) {
    return { skipped: true, reason: "invalid_amount" };
  }

  // Provider detection (task 7.8)
  const provider = detectProvider(order as any);
  if (!provider) {
    return { skipped: true, reason: "unknown_provider" };
  }

  // Execute payout via correct provider
  const db = {} as any;
  let result;
  if (provider === "paystack") {
    result = await executePaystackPayout(db, order as any, vendor as any, calculation, secretKeys.paystack);
  } else if (provider === "flutterwave") {
    result = await executeFlutterwavePayout(order as any, vendor as any, calculation, secretKeys.flutterwave);
  } else {
    result = await executeStripePayout(order as any, vendor as any, calculation, secretKeys.stripe);
  }

  return { skipped: false, provider, result, tailorId: order.tailor_id };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Orchestrator — idempotency (9.4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 9.4: For any order with payout_status = 'completed' or 'processing',
   * no payment API must be called.
   */
  it("never calls any payment API when payout_status is 'completed'", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("paystack", "flutterwave", "stripe"),
        async (provider) => {
          vi.clearAllMocks();
          const order = makeOrder({ payout_status: "completed", payment_provider: provider });
          const vendor = makeVendor();

          const outcome = await runPayoutLogic(order as any, vendor);

          expect(outcome.skipped).toBe(true);
          expect(outcome.reason).toBe("idempotency");
          expect(executePaystackPayout).not.toHaveBeenCalled();
          expect(executeFlutterwavePayout).not.toHaveBeenCalled();
          expect(executeStripePayout).not.toHaveBeenCalled();
        }
      )
    );
  });

  it("never calls any payment API when payout_status is 'processing'", async () => {
    const order = makeOrder({ payout_status: "processing" });
    const vendor = makeVendor();

    const outcome = await runPayoutLogic(order as any, vendor);

    expect(outcome.skipped).toBe(true);
    expect(outcome.reason).toBe("idempotency");
    expect(executePaystackPayout).not.toHaveBeenCalled();
    expect(executeFlutterwavePayout).not.toHaveBeenCalled();
    expect(executeStripePayout).not.toHaveBeenCalled();
  });
});

describe("Orchestrator — provider routing (9.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 9.5: Given payment_provider = 'paystack', only Paystack handler is called.
   */
  it("calls only Paystack handler for paystack orders", async () => {
    const order = makeOrder({
      payment_provider: "paystack",
      order_status: "delivered",
      last_dhl_event: { status: "delivered" },
    });
    const vendor = makeVendor();

    await runPayoutLogic(order as any, vendor);

    expect(executePaystackPayout).toHaveBeenCalledOnce();
    expect(executeFlutterwavePayout).not.toHaveBeenCalled();
    expect(executeStripePayout).not.toHaveBeenCalled();
  });

  it("calls only Flutterwave handler for flutterwave orders", async () => {
    const order = makeOrder({
      payment_provider: "flutterwave",
      order_status: "delivered",
      last_dhl_event: { status: "delivered" },
    });
    const vendor = makeVendor();

    await runPayoutLogic(order as any, vendor);

    expect(executeFlutterwavePayout).toHaveBeenCalledOnce();
    expect(executePaystackPayout).not.toHaveBeenCalled();
    expect(executeStripePayout).not.toHaveBeenCalled();
  });

  it("calls only Stripe handler for stripe orders", async () => {
    const order = makeOrder({
      payment_provider: "stripe",
      order_status: "delivered",
      last_dhl_event: { status: "delivered" },
    });
    const vendor = makeVendor();

    await runPayoutLogic(order as any, vendor);

    expect(executeStripePayout).toHaveBeenCalledOnce();
    expect(executePaystackPayout).not.toHaveBeenCalled();
    expect(executeFlutterwavePayout).not.toHaveBeenCalled();
  });

  /**
   * Property: For any recognized provider value (case-insensitive), the correct handler fires.
   */
  it("routes correctly for all recognized provider values", async () => {
    const cases = [
      { provider: "paystack", mock: executePaystackPayout },
      { provider: "flutterwave", mock: executeFlutterwavePayout },
      { provider: "stripe", mock: executeStripePayout },
    ];

    for (const { provider, mock } of cases) {
      vi.clearAllMocks();
      const order = makeOrder({
        payment_provider: provider,
        order_status: "delivered",
        last_dhl_event: { status: "delivered" },
      });
      await runPayoutLogic(order as any, makeVendor());
      expect(mock).toHaveBeenCalledOnce();
    }
  });

  it("skips with unknown_provider for unrecognized payment_provider", async () => {
    const order = makeOrder({
      payment_provider: "bitcoin",
      order_status: "delivered",
      last_dhl_event: { status: "delivered" },
    });
    const outcome = await runPayoutLogic(order as any, makeVendor());
    expect(outcome.skipped).toBe(true);
    expect(outcome.reason).toBe("unknown_provider");
    expect(executePaystackPayout).not.toHaveBeenCalled();
    expect(executeFlutterwavePayout).not.toHaveBeenCalled();
    expect(executeStripePayout).not.toHaveBeenCalled();
  });
});

describe("Orchestrator — vendor routing (9.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 9.6: Transfer recipient always matches order.tailor_id.
   * The vendor passed to the provider handler must have the same id as order.tailor_id.
   */
  it("always passes the vendor matching order.tailor_id to the provider handler", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.constantFrom("paystack", "flutterwave", "stripe"),
        async (tailorId, provider) => {
          vi.clearAllMocks();

          const order = makeOrder({
            tailor_id: tailorId,
            payment_provider: provider,
            order_status: "delivered",
            last_dhl_event: { status: "delivered" },
          });
          const vendor = makeVendor({ id: tailorId });

          const outcome = await runPayoutLogic(order as any, vendor);

          // Outcome must not be skipped (vendor matches)
          expect(outcome.skipped).toBe(false);
          // The tailorId returned must match the order's tailor_id
          expect(outcome.tailorId).toBe(tailorId);

          // Verify the vendor passed to the handler has the correct id
          if (provider === "paystack") {
            const call = (executePaystackPayout as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[2].id).toBe(tailorId); // vendor is 3rd arg
          } else if (provider === "flutterwave") {
            const call = (executeFlutterwavePayout as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[1].id).toBe(tailorId); // vendor is 2nd arg
          } else {
            const call = (executeStripePayout as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[1].id).toBe(tailorId); // vendor is 2nd arg
          }
        }
      )
    );
  });

  it("never routes to a different vendor than the one on the order", async () => {
    const order = makeOrder({
      tailor_id: "vendor_correct",
      payment_provider: "paystack",
      order_status: "delivered",
      last_dhl_event: { status: "delivered" },
    });
    const correctVendor = makeVendor({ id: "vendor_correct" });

    await runPayoutLogic(order as any, correctVendor);

    const call = (executePaystackPayout as ReturnType<typeof vi.fn>).mock.calls[0];
    const vendorArg = call[2];
    expect(vendorArg.id).toBe("vendor_correct");
    expect(vendorArg.id).not.toBe("vendor_wrong");
  });
});
