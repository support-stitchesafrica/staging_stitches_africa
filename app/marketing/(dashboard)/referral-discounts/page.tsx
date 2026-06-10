"use client";

import { useEffect, useState, useCallback } from "react";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import MarketingAuthGuard from "@/components/marketing/MarketingAuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle, RefreshCw, Inbox, X, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ReferralDiscountRow, ReferralPurchase } from "@/types/referral-discount";

const PAGE_SIZE = 20;
type StatusFilter = "all" | "active" | "disabled";
type SearchState = "idle" | "loading" | "found" | "not_found";

interface SearchResult
{
  userId: string;
  fullname: string;
  email: string;
  referralCode: string;
  existingDiscount?: { percentage: number; isActive: boolean } | null;
}

const fmt = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;

const fmtDate = (ts: unknown) =>
{
  if (!ts) return "—";
  if (typeof ts === "object" && ts !== null && "seconds" in ts)
    return new Date((ts as { seconds: number }).seconds * 1000).toLocaleDateString();
  if (typeof ts === "string") return new Date(ts).toLocaleDateString();
  return "—";
};

// ── Purchases Modal ────────────────────────────────────────────────────────────

function PurchasesModal({
  row,
  onClose,
  getToken,
}: {
  row: ReferralDiscountRow;
  onClose: () => void;
  getToken: () => Promise<string | undefined>;
})
{
  const [purchases, setPurchases] = useState<ReferralPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() =>
  {
    (async () =>
    {
      setLoading(true);
      setError(false);
      try
      {
        const token = await getToken();
        const res = await fetch(`/api/marketing/referral-discounts/${row.userId}/purchases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPurchases(data.purchases ?? []);
      } catch
      {
        setError(true);
      } finally
      {
        setLoading(false);
      }
    })();
  }, [row.userId, getToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="font-semibold text-gray-900">Purchase History</p>
            <p className="text-xs text-gray-500">{row.fullname} · {row.referralCode}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-auto flex-1 p-4">
          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-gray-600">Failed to load purchases.</p>
            </div>
          )}
          {!loading && !error && purchases.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <Inbox className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No purchases yet.</p>
            </div>
          )}
          {!loading && !error && purchases.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Order ID", "Date", "Original", "Discount %", "Discount Amt", "Final"].map((col) => (
                      <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {purchases.map((p) => (
                    <tr key={p.orderId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{p.orderId}</td>
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{fmt(p.originalAmount)}</td>
                      <td className="px-4 py-2 text-gray-800 whitespace-nowrap">{p.discountPercentage}%</td>
                      <td className="px-4 py-2 text-red-600 whitespace-nowrap">-{fmt(p.discountAmount)}</td>
                      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{fmt(p.finalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Content ───────────────────────────────────────────────────────────────

function ReferralDiscountsContent()
{
  const { firebaseUser } = useMarketingAuth();

  const getToken = useCallback(async () => firebaseUser?.getIdToken(), [firebaseUser]);

  const [searchInput, setSearchInput] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [assignPct, setAssignPct] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);

  const [discounts, setDiscounts] = useState<ReferralDiscountRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState<number | "">("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [purchasesRow, setPurchasesRow] = useState<ReferralDiscountRow | null>(null);

  const loadDiscounts = useCallback(async () =>
  {
    setTableLoading(true);
    setTableError(false);
    try
    {
      const token = await getToken();
      const res = await fetch("/api/marketing/referral-discounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDiscounts(data.discounts ?? []);
    } catch
    {
      setTableError(true);
    } finally
    {
      setTableLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadDiscounts(); }, [loadDiscounts]);

  const handleSearch = async () =>
  {
    const code = searchInput.trim().toUpperCase();
    if (!code) return;
    setSearchState("loading");
    setSearchResult(null);
    try
    {
      const token = await getToken();
      const res = await fetch("/api/marketing/referral-discounts/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralCode: code }),
      });
      const data = await res.json();
      if (data.found)
      {
        setSearchResult({
          userId: data.user.userId,
          fullname: data.user.fullname,
          email: data.user.email,
          referralCode: data.user.referralCode,
          existingDiscount: data.existingDiscount ?? null,
        });
        setAssignPct(data.existingDiscount?.percentage ?? "");
        setSearchState("found");
      } else
      {
        setSearchState("not_found");
      }
    } catch
    {
      toast.error("Search failed. Please try again.");
      setSearchState("idle");
    }
  };

  const handleAssign = async () =>
  {
    if (!searchResult || assignPct === "") return;
    const pct = Number(assignPct);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100)
    {
      toast.error("Percentage must be an integer between 1 and 100.");
      return;
    }
    setAssigning(true);
    try
    {
      const token = await getToken();
      const res = await fetch("/api/marketing/referral-discounts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: searchResult.userId, referralCode: searchResult.referralCode, percentage: pct }),
      });
      if (!res.ok) throw new Error();
      toast.success("Discount assigned successfully.");
      setSearchState("idle");
      setSearchResult(null);
      setSearchInput("");
      setAssignPct("");
      loadDiscounts();
    } catch
    {
      toast.error("Failed to assign discount.");
    } finally
    {
      setAssigning(false);
    }
  };

  const handleUpdatePct = async (userId: string) =>
  {
    const pct = Number(editPct);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100)
    {
      toast.error("Percentage must be an integer between 1 and 100.");
      return;
    }
    setUpdatingIds((prev) => new Set(prev).add(userId));
    try
    {
      const token = await getToken();
      const res = await fetch(`/api/marketing/referral-discounts/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ percentage: pct }),
      });
      if (!res.ok) throw new Error();
      toast.success("Percentage updated.");
      setEditingId(null);
      setDiscounts((prev) => prev.map((d) => d.userId === userId ? { ...d, percentage: pct } : d));
    } catch
    {
      toast.error("Failed to update percentage.");
    } finally
    {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const handleToggleActive = async (row: ReferralDiscountRow) =>
  {
    const next = !row.isActive;
    setUpdatingIds((prev) => new Set(prev).add(row.userId));
    try
    {
      const token = await getToken();
      const res = await fetch(`/api/marketing/referral-discounts/${row.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Discount enabled." : "Discount disabled.");
      setDiscounts((prev) => prev.map((d) => d.userId === row.userId ? { ...d, isActive: next } : d));
    } catch
    {
      toast.error("Failed to update status.");
    } finally
    {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(row.userId); return n; });
    }
  };

  const filtered = discounts.filter((d) =>
  {
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && d.isActive) ||
      (statusFilter === "disabled" && !d.isActive);
    const q = tableSearch.toLowerCase();
    const matchSearch =
      !q ||
      d.fullname.toLowerCase().includes(q) ||
      d.referralCode.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  useEffect(() => { setPage(1); }, [tableSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Discounts</h1>
        <p className="text-sm text-gray-500 mt-1">Assign and manage per-user referral discount percentages.</p>
      </div>

      {/* Search Panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <p className="font-semibold text-gray-800">Find User by Referral Code</p>
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="e.g. CHINEDU2026"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={searchState === "loading"}>
            {searchState === "loading" ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchState === "not_found" && (
          <p className="text-sm text-red-500">No user found with that referral code.</p>
        )}

        {searchState === "found" && searchResult && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4 max-w-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900">{searchResult.fullname}</p>
                <p className="text-sm text-gray-500">{searchResult.email}</p>
                <p className="text-xs font-mono text-gray-600 mt-1">Code: {searchResult.referralCode}</p>
              </div>
              {searchResult.existingDiscount && (
                <Badge className={searchResult.existingDiscount.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                  {searchResult.existingDiscount.isActive ? "Active" : "Disabled"} · {searchResult.existingDiscount.percentage}%
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {searchResult.existingDiscount ? "Update Discount" : "Assign Discount"}
              </p>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15].map((pct) => (
                  <Button key={pct} size="sm" variant={assignPct === pct ? "default" : "outline"} onClick={() => setAssignPct(pct)}>
                    {pct}%
                  </Button>
                ))}
                <Input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Custom %"
                  value={assignPct}
                  onChange={(e) => setAssignPct(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-28"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleAssign} disabled={assigning || assignPct === ""}>
                  {assigning ? "Saving..." : "Save Discount"}
                </Button>
                <Button variant="outline" onClick={() => { setSearchState("idle"); setSearchResult(null); setSearchInput(""); setAssignPct(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Management Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <p className="font-semibold text-gray-800">All Referral Discounts</p>
          <Button size="sm" variant="outline" onClick={loadDiscounts} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-2">
            {(["all", "active", "disabled"] as StatusFilter[]).map((f) => (
              <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, email, or code..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {tableLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        )}

        {!tableLoading && tableError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-base font-semibold text-gray-800">Failed to load discounts</p>
            <Button onClick={loadDiscounts} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
          </div>
        )}

        {!tableLoading && !tableError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Inbox className="h-10 w-10 text-gray-300" />
            <p className="text-base font-medium text-gray-600">No referral discounts found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
          </div>
        )}

        {!tableLoading && !tableError && filtered.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Customer Name", "Referral Code", "Percentage", "Total Usage", "Total Sales", "Status", "Actions"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginated.map((row) =>
                  {
                    const isUpdating = updatingIds.has(row.userId);
                    const isEditing = editingId === row.userId;
                    return (
                      <tr key={row.userId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-gray-900">{row.fullname || "—"}</p>
                          <p className="text-xs text-gray-400">{row.email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{row.referralCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input type="number" min={1} max={100} value={editPct} onChange={(e) => setEditPct(e.target.value === "" ? "" : Number(e.target.value))} className="w-20 h-7 text-xs" autoFocus />
                              <Button size="sm" className="h-7 text-xs px-2" disabled={isUpdating} onClick={() => handleUpdatePct(row.userId)}>
                                {isUpdating ? "..." : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-1" onClick={() => setEditingId(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900">{row.percentage}%</span>
                              <button onClick={() => { setEditingId(row.userId); setEditPct(row.percentage); }} className="text-xs text-blue-600 hover:underline">
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.totalUsage}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(row.totalSales)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={row.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                            {row.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdating}
                              onClick={() => handleToggleActive(row)}
                              className={`text-xs ${row.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                            >
                              {isUpdating ? "..." : row.isActive ? "Disable" : "Enable"}
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setPurchasesRow(row)}>
                              <Eye className="h-3.5 w-3.5" /> Purchases
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
      </div>

      {purchasesRow && (
        <PurchasesModal row={purchasesRow} onClose={() => setPurchasesRow(null)} getToken={getToken} />
      )}
    </div>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────────

export default function ReferralDiscountsPage()
{
  return (
    <MarketingAuthGuard>
      <ReferralDiscountsContent />
    </MarketingAuthGuard>
  );
}
