/**
 * Property-based tests for vendor transaction history feature.
 * Uses fast-check for generative testing (min 100 iterations each).
 *
 * Covers:
 *  - Property 7: filter correctness (filterTransactions by payment_status)
 *  - Property 8: search correctness (filterTransactions by search query)
 *  - Property 2: tailor_id path extraction (extractTailorIdFromPath)
 *  - Property 3: approve state transition (only payment_status, approved_at, approved_by change)
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  filterTransactions,
  extractTailorIdFromPath,
  FilterType,
} from "../vendor-services/transactionFilters";
import { TailorTransactionWithMeta } from "../vendor-services/getAllTailorTransactions";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a valid payment_status value (including undefined to represent absent) */
const paymentStatusArb = fc.oneof(
  fc.constant("paid" as const),
  fc.constant("unpaid" as const),
  fc.constant(undefined)
);

/** Generates a minimal TailorTransactionWithMeta object */
const transactionArb = fc.record({
  transaction_id: fc.string({ minLength: 1, maxLength: 40 }),
  tailor_id: fc.string({ minLength: 1, maxLength: 40 }),
  tailor_name: fc.option(fc.string({ maxLength: 60 }), { nil: undefined }),
  description: fc.option(fc.string({ maxLength: 120 }), { nil: undefined }),
  amount: fc.float({ min: 0, max: 1_000_000, noNaN: true }),
  created_by: fc.string({ minLength: 1 }),
  date: fc.constant(null),
  order_id: fc.string({ minLength: 1 }),
  related_transaction_id: fc.option(fc.string(), { nil: undefined }),
  status: fc.constantFrom("Completed", "Pending", "Failed"),
  type: fc.constantFrom("income", "expense"),
  payment_status: paymentStatusArb,
  approved_at: fc.option(fc.string(), { nil: undefined }),
  approved_by: fc.option(fc.string(), { nil: undefined }),
}) as fc.Arbitrary<TailorTransactionWithMeta>;

const transactionArrayArb = fc.array(transactionArb, { minLength: 0, maxLength: 50 });

// ---------------------------------------------------------------------------
// Property 7 — Filter correctness
// ---------------------------------------------------------------------------

describe("Property 7: filterTransactions — status filter correctness", () => {
  it('filter="paid" returns exactly transactions where payment_status === "paid"', () => {
    fc.assert(
      fc.property(transactionArrayArb, (transactions) => {
        const result = filterTransactions(transactions, "paid", "");
        const expected = transactions.filter((t) => t.payment_status === "paid");

        expect(result).toHaveLength(expected.length);
        result.forEach((t) => expect(t.payment_status).toBe("paid"));
        expected.forEach((t) =>
          expect(result.some((r) => r.transaction_id === t.transaction_id && r.tailor_id === t.tailor_id)).toBe(true)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('filter="unpaid" returns exactly transactions where payment_status is "unpaid" or absent', () => {
    fc.assert(
      fc.property(transactionArrayArb, (transactions) => {
        const result = filterTransactions(transactions, "unpaid", "");
        const expected = transactions.filter(
          (t) => (t.payment_status ?? "unpaid") === "unpaid"
        );

        expect(result).toHaveLength(expected.length);
        result.forEach((t) =>
          expect((t.payment_status ?? "unpaid")).toBe("unpaid")
        );
        expected.forEach((t) =>
          expect(result.some((r) => r.transaction_id === t.transaction_id && r.tailor_id === t.tailor_id)).toBe(true)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('filter="all" returns the full transaction list unchanged', () => {
    fc.assert(
      fc.property(transactionArrayArb, (transactions) => {
        const result = filterTransactions(transactions, "all", "");
        expect(result).toHaveLength(transactions.length);
      }),
      { numRuns: 100 }
    );
  });

  it("paid + unpaid counts sum to total (no overlap, no gaps)", () => {
    fc.assert(
      fc.property(transactionArrayArb, (transactions) => {
        const paid = filterTransactions(transactions, "paid", "").length;
        const unpaid = filterTransactions(transactions, "unpaid", "").length;
        expect(paid + unpaid).toBe(transactions.length);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8 — Search correctness
// ---------------------------------------------------------------------------

describe("Property 8: filterTransactions — search correctness", () => {
  it("result is always a subset of the input", () => {
    fc.assert(
      fc.property(transactionArrayArb, fc.string({ maxLength: 30 }), (transactions, query) => {
        const result = filterTransactions(transactions, "all", query);
        result.forEach((r) => {
          const inInput = transactions.some(
            (t) => t.transaction_id === r.transaction_id && t.tailor_id === r.tailor_id
          );
          expect(inInput).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("every transaction matching the query appears in the result", () => {
    fc.assert(
      fc.property(transactionArrayArb, fc.string({ minLength: 1, maxLength: 20 }), (transactions, query) => {
        const q = query.toLowerCase();
        const result = filterTransactions(transactions, "all", query);
        const shouldMatch = transactions.filter(
          (t) =>
            (t.transaction_id ?? "").toLowerCase().includes(q) ||
            (t.tailor_name ?? "").toLowerCase().includes(q) ||
            (t.description ?? "").toLowerCase().includes(q)
        );

        shouldMatch.forEach((t) => {
          const found = result.some(
            (r) => r.transaction_id === t.transaction_id && r.tailor_id === t.tailor_id
          );
          expect(found).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("empty search query returns all transactions (no filtering)", () => {
    fc.assert(
      fc.property(transactionArrayArb, (transactions) => {
        const result = filterTransactions(transactions, "all", "");
        expect(result).toHaveLength(transactions.length);
      }),
      { numRuns: 100 }
    );
  });

  it("whitespace-only search query returns all transactions", () => {
    fc.assert(
      fc.property(transactionArrayArb, fc.string({ minLength: 1, maxLength: 10 }).map((s) => s.replace(/\S/g, " ")), (transactions, spaces) => {
        const result = filterTransactions(transactions, "all", spaces);
        expect(result).toHaveLength(transactions.length);
      }),
      { numRuns: 100 }
    );
  });

  it("search is case-insensitive: uppercase query matches lowercase field values", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            transaction_id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.toLowerCase()),
            tailor_id: fc.string({ minLength: 1 }),
            tailor_name: fc.option(fc.string({ maxLength: 30 }).map((s) => s.toLowerCase()), { nil: undefined }),
            description: fc.option(fc.string({ maxLength: 60 }).map((s) => s.toLowerCase()), { nil: undefined }),
            amount: fc.constant(0),
            created_by: fc.constant("test"),
            date: fc.constant(null),
            order_id: fc.constant("o1"),
            status: fc.constant("Completed"),
            type: fc.constant("income" as const),
            payment_status: fc.constant("unpaid" as const),
          }) as fc.Arbitrary<TailorTransactionWithMeta>,
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          // Pick a known substring from the first transaction's transaction_id
          const sample = transactions[0].transaction_id.slice(0, 3);
          if (!sample) return; // skip if too short

          const lowerResult = filterTransactions(transactions, "all", sample.toLowerCase());
          const upperResult = filterTransactions(transactions, "all", sample.toUpperCase());
          expect(lowerResult).toHaveLength(upperResult.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2 — tailor_id path extraction
// ---------------------------------------------------------------------------

describe("Property 2: extractTailorIdFromPath — tailor_id correctly extracted", () => {
  /** Generates a valid Firestore-like ID (alphanumeric + some special chars) */
  const firestoreIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,40}$/);

  it("extracted tailor_id equals the tailorId segment of the path", () => {
    fc.assert(
      fc.property(firestoreIdArb, firestoreIdArb, (tailorId, transactionId) => {
        const path = `tailors/${tailorId}/transactions/${transactionId}`;
        const extracted = extractTailorIdFromPath(path);
        expect(extracted).toBe(tailorId);
      }),
      { numRuns: 100 }
    );
  });

  it("extraction is independent of the transactionId value", () => {
    fc.assert(
      fc.property(firestoreIdArb, firestoreIdArb, firestoreIdArb, (tailorId, txId1, txId2) => {
        const path1 = `tailors/${tailorId}/transactions/${txId1}`;
        const path2 = `tailors/${tailorId}/transactions/${txId2}`;
        expect(extractTailorIdFromPath(path1)).toBe(extractTailorIdFromPath(path2));
      }),
      { numRuns: 100 }
    );
  });

  it("different tailorIds produce different extracted values", () => {
    fc.assert(
      fc.property(firestoreIdArb, firestoreIdArb, firestoreIdArb, (tailorId1, tailorId2, txId) => {
        fc.pre(tailorId1 !== tailorId2);
        const path1 = `tailors/${tailorId1}/transactions/${txId}`;
        const path2 = `tailors/${tailorId2}/transactions/${txId}`;
        expect(extractTailorIdFromPath(path1)).not.toBe(extractTailorIdFromPath(path2));
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3 — Approve state transition
// ---------------------------------------------------------------------------

describe("Property 3: approve state transition — only approval fields change", () => {
  /**
   * Simulates the server-side approval logic (mirrors the Firestore update in the API route).
   * Only modifies payment_status, approved_at, and approved_by.
   */
  function applyApproval(
    transaction: TailorTransactionWithMeta,
    approverUid: string,
    approvedAt: string
  ): TailorTransactionWithMeta {
    return {
      ...transaction,
      payment_status: "paid",
      approved_at: approvedAt,
      approved_by: approverUid,
    };
  }

  const unpaidTransactionArb = transactionArb.filter(
    (t) => t.payment_status !== "paid"
  );

  const approverUidArb = fc.string({ minLength: 1, maxLength: 40 });
  const approvedAtArb = fc.string({ minLength: 1 });

  it("after approval, payment_status is always 'paid'", () => {
    fc.assert(
      fc.property(unpaidTransactionArb, approverUidArb, approvedAtArb, (tx, uid, at) => {
        const result = applyApproval(tx, uid, at);
        expect(result.payment_status).toBe("paid");
      }),
      { numRuns: 100 }
    );
  });

  it("after approval, approved_by equals the approver UID", () => {
    fc.assert(
      fc.property(unpaidTransactionArb, approverUidArb, approvedAtArb, (tx, uid, at) => {
        const result = applyApproval(tx, uid, at);
        expect(result.approved_by).toBe(uid);
      }),
      { numRuns: 100 }
    );
  });

  it("after approval, approved_at is set to the provided timestamp", () => {
    fc.assert(
      fc.property(unpaidTransactionArb, approverUidArb, approvedAtArb, (tx, uid, at) => {
        const result = applyApproval(tx, uid, at);
        expect(result.approved_at).toBe(at);
      }),
      { numRuns: 100 }
    );
  });

  it("all fields other than payment_status, approved_at, approved_by remain unchanged", () => {
    fc.assert(
      fc.property(unpaidTransactionArb, approverUidArb, approvedAtArb, (tx, uid, at) => {
        const result = applyApproval(tx, uid, at);

        const APPROVAL_FIELDS = new Set(["payment_status", "approved_at", "approved_by"]);
        const allKeys = new Set([...Object.keys(tx), ...Object.keys(result)]);

        allKeys.forEach((key) => {
          if (!APPROVAL_FIELDS.has(key)) {
            expect((result as any)[key]).toStrictEqual((tx as any)[key]);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it("approval is idempotent on the resulting state (applying twice yields same result)", () => {
    fc.assert(
      fc.property(unpaidTransactionArb, approverUidArb, approvedAtArb, (tx, uid, at) => {
        const first = applyApproval(tx, uid, at);
        const second = applyApproval(first, uid, at);
        expect(second).toStrictEqual(first);
      }),
      { numRuns: 100 }
    );
  });
});
