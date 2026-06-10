import { TailorTransactionWithMeta } from "./getAllTailorTransactions";

export type FilterType = "all" | "paid" | "unpaid";

/**
 * Filters transactions by payment status and an optional search query.
 * Pure function — no side effects.
 */
export function filterTransactions(
  transactions: TailorTransactionWithMeta[],
  filter: FilterType,
  searchQuery: string
): TailorTransactionWithMeta[] {
  return transactions.filter((t) => {
    const statusMatch =
      filter === "all" ||
      (filter === "paid"
        ? t.payment_status === "paid"
        : (t.payment_status ?? "unpaid") === "unpaid");

    if (!statusMatch) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.transaction_id ?? "").toLowerCase().includes(q) ||
      (t.tailor_name ?? "").toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    );
  });
}

/**
 * Extracts tailor_id from a Firestore document reference path.
 * Path format: tailors/{tailorId}/transactions/{transactionId}
 */
export function extractTailorIdFromPath(refPath: string): string {
  return refPath.split("/")[1];
}
