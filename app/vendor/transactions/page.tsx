"use client";

import { useEffect, useState, useCallback } from "react";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { getDbInstance } from "@/firebase";
import
{
  Search,
  CheckCircle,
  Clock,
  Inbox,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

interface OrderRecord
{
  order_id: string;
  doc_id: string;
  user_id: string;
  payment_status: "paid" | "unpaid";
  approved_at?: any;
  approved_by?: string;
  title?: string;
  price?: number;
  quantity?: number;
  source_original_price?: number;
  source_currency?: string;
  currency?: string;
  timestamp?: string;
  order_status?: string;
}

type FilterType = "all" | "paid" | "unpaid";

const formatDate = (ts: any) =>
{
  if (!ts) return "—";
  if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
  if (typeof ts === "string") return new Date(ts).toLocaleDateString();
  return "—";
};

const formatAmount = (o: OrderRecord) =>
{
  const hasNGNPrice = typeof o.source_original_price === "number" && o.source_original_price > 0;
  const isNGN = o.source_currency === "NGN" || o.currency === "NGN" || hasNGNPrice;
  const raw = isNGN
    ? (hasNGNPrice ? o.source_original_price! : (o.price ?? 0))
    : (o.price ?? 0);
  const total = raw * (o.quantity || 1);
  const sym = isNGN ? "₦" : "$";
  return `${sym}${Number(total).toLocaleString(isNGN ? "en-NG" : undefined, { maximumFractionDigits: 2 })}`;
};

async function fetchVendorOrders(tailorId: string): Promise<OrderRecord[]>
{
  try
  {
    const db = getDbInstance();
    const q = query(collectionGroup(db, "user_orders"), where("tailor_id", "==", tailorId));
    const snap = await getDocs(q);
    return snap.docs.map((doc) =>
    {
      const data = doc.data();
      return {
        order_id: data.order_id || doc.id,
        doc_id: doc.id,
        user_id: doc.ref.parent.parent?.id ?? data.user_id ?? "",
        payment_status: data.payment_status ?? "unpaid",
        approved_at: data.approved_at,
        approved_by: data.approved_by,
        title: data.title,
        price: data.price,
        quantity: data.quantity,
        source_original_price: data.source_original_price,
        source_currency: data.source_currency,
        currency: data.currency,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
        order_status: data.order_status,
      } as OrderRecord;
    });
  } catch (err)
  {
    console.error("[vendor/transactions] fetchVendorOrders failed:", err);
    return [];
  }
}

export default function VendorTransactionsPage()
{
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadOrders = useCallback(async (uid: string) =>
  {
    setLoading(true);
    setFetchError(false);
    try
    {
      const data = await fetchVendorOrders(uid);
      setOrders(data);
    } catch
    {
      setFetchError(true);
    } finally
    {
      setLoading(false);
    }
  }, []);

  useEffect(() =>
  {
    const unsub = onAuthStateChanged(auth, (user) =>
    {
      if (user) loadOrders(user.uid);
    });
    return () => unsub();
  }, [loadOrders]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = orders
    .filter((o) => filter === "all" || (o.payment_status ?? "unpaid") === filter)
    .filter((o) =>
    {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (o.order_id ?? "").toLowerCase().includes(q) ||
        (o.title ?? "").toLowerCase().includes(q)
      );
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const paidCount = orders.filter((o) => o.payment_status === "paid").length;
  const unpaidCount = orders.filter((o) => (o.payment_status ?? "unpaid") === "unpaid").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500 mt-1">Track payment status for all your orders</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <ArrowUpRight className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Awaiting Payment</p>
              <p className="text-2xl font-bold text-yellow-600">{unpaidCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
          <div className="flex gap-2">
            {(["all", "paid", "unpaid"] as FilterType[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order ID or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Error */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-gray-700 font-medium">Failed to load transactions</p>
            <Button variant="outline" onClick={() =>
            {
              const user = auth.currentUser;
              if (user) loadOrders(user.uid);
            }} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !fetchError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Inbox className="h-12 w-12 text-gray-300" />
            <p className="text-gray-600 font-medium">No transactions found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Order ID", "Product", "Amount", "Date", "Order Status", "Payment Status"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((o) =>
                  {
                    const isPaid = o.payment_status === "paid";
                    return (
                      <tr key={`${o.user_id}:${o.doc_id}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{o.order_id}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{o.title ?? "—"}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatAmount(o)}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(o.timestamp)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={
                            o.order_status?.toLowerCase().includes("deliver") || o.order_status?.toLowerCase().includes("complet")
                              ? "bg-green-100 text-green-800"
                              : o.order_status?.toLowerCase().includes("pend")
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-700"
                          }>
                            {o.order_status ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <Clock className="h-3 w-3" /> Awaiting Payment
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)} className="text-xs px-2">«</Button>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-xs">Previous</Button>
                  <span className="text-xs text-gray-600 px-2">Page {page} of {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs">Next</Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)} className="text-xs px-2">»</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
