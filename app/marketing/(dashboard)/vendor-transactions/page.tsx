"use client";

import { useEffect, useState, useCallback } from "react";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import MarketingAuthGuard from "@/components/marketing/MarketingAuthGuard";
import { getAllVendorOrders, VendorOrderWithMeta } from "@/vendor-services/getAllVendorOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle, RefreshCw, CheckCircle, Inbox, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const APPROVE_ROLES = ["team_lead", "bdm", "super_admin"];
const ORDER_STATUS_OPTIONS = [
    "pending",
    "processing",
    "payment_failed",
    "shipped",
    "delivered",
    "cancelled",
] as const;

type FilterType = "all" | "paid" | "unpaid";

const formatDate = (ts: any) =>
{
    if (!ts) return "—";
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    if (typeof ts === "string") return new Date(ts).toLocaleDateString();
    return "—";
};

const formatAmount = (o: VendorOrderWithMeta) =>
{
    const hasNGNPrice = typeof o.source_original_price === "number" && o.source_original_price > 0;
    const isNGN = o.source_currency === "NGN" || o.currency === "NGN" || hasNGNPrice;
    const raw = isNGN
        ? (hasNGNPrice ? o.source_original_price! : (o.source_price ?? o.price ?? 0))
        : (o.price ?? 0);
    const total = raw * (o.quantity || 1);
    const sym = isNGN ? "₦" : "$";
    return `${sym}${Number(total).toLocaleString(isNGN ? "en-NG" : undefined, { maximumFractionDigits: 2 })}`;
};

function filterOrders(orders: VendorOrderWithMeta[], filter: FilterType, search: string)
{
    let result = orders;

    if (filter !== "all")
    {
        result = result.filter((o) => (o.payment_status ?? "unpaid") === filter);
    }

    if (search.trim())
    {
        const q = search.toLowerCase();
        result = result.filter(
            (o) =>
                (o.order_id ?? "").toLowerCase().includes(q) ||
                (o.tailor_name ?? "").toLowerCase().includes(q) ||
                (o.title ?? "").toLowerCase().includes(q) ||
                `${o.user_address?.first_name ?? ""} ${o.user_address?.last_name ?? ""}`.toLowerCase().includes(q)
        );
    }

    return result;
}

/** Newest first (marketing CSV/API timestamps vary between ISO strings and Firestore-like `{ seconds }`). */
function orderTimestampMs(o: VendorOrderWithMeta): number
{
    const ts = o.timestamp as unknown;
    if (ts && typeof ts === "object" && ts !== null && "seconds" in ts &&
        typeof (ts as { seconds: unknown }).seconds === "number")
    {
        const sec = (ts as { seconds: number; nanoseconds?: number }).seconds;
        const ns = (ts as { nanoseconds?: number }).nanoseconds ?? 0;
        return sec * 1000 + Math.floor(ns / 1e6);
    }
    if (typeof ts === "string" && ts.trim() !== "")
    {
        const ms = Date.parse(ts);
        return Number.isFinite(ms) ? ms : 0;
    }
    return 0;
}

function sortOrdersNewestFirst(rows: VendorOrderWithMeta[]): VendorOrderWithMeta[]
{
    return [...rows].sort((a, b) => orderTimestampMs(b) - orderTimestampMs(a));
}

function getOrderStatusBadgeClass(status?: string)
{
    const s = (status || "").toLowerCase();
    if (s.includes("deliver") || s.includes("complet")) return "bg-green-100 text-green-800";
    if (s.includes("ship")) return "bg-blue-100 text-blue-800";
    if (s.includes("process")) return "bg-purple-100 text-purple-800";
    if (s.includes("payment_failed") || s.includes("cancel")) return "bg-red-100 text-red-800";
    if (s.includes("pend")) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-700";
}

function VendorTransactionsContent()
{
    const { marketingUser, firebaseUser } = useMarketingAuth();
    const [orders, setOrders] = useState<VendorOrderWithMeta[]>([]);
    console.log('orders debug', orders);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [updatingOrderStatusIds, setUpdatingOrderStatusIds] = useState<Set<string>>(new Set());
    const [openOrderStatusFor, setOpenOrderStatusFor] = useState<string | null>(null);
    const [approveErrors, setApproveErrors] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const canApprove = marketingUser ? APPROVE_ROLES.includes(marketingUser.role) : false;

    const loadOrders = useCallback(async () =>
    {
        setLoading(true);
        setFetchError(false);
        try
        {
            const data = await getAllVendorOrders();
            setOrders(data);
        } catch
        {
            setFetchError(true);
        } finally
        {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const filtered = sortOrdersNewestFirst(filterOrders(orders, filter, search));

    // Reset to page 1 whenever filter or search changes
    useEffect(() => { setPage(1); }, [filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleStatusChange = async (o: VendorOrderWithMeta, action: "paid" | "unpaid") =>
    {
        const key = `${o.user_id}:${o.doc_id ?? o.order_id}`;
        setApprovingIds((prev) => new Set(prev).add(key));
        setApproveErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

        try
        {
            const idToken = await firebaseUser?.getIdToken();
            const res = await fetch("/api/marketing/vendor-transactions/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ userId: o.user_id, orderId: o.doc_id ?? o.order_id, action }),
            });

            if (res.ok)
            {
                setOrders((prev) =>
                    prev.map((item) =>
                        (item.doc_id ?? item.order_id) === (o.doc_id ?? o.order_id) && item.user_id === o.user_id
                            ? { ...item, payment_status: action }
                            : item
                    )
                );
                toast.success(action === "paid" ? "Order marked as paid." : "Order marked as unpaid.");
            } else
            {
                const body = await res.json().catch(() => ({}));
                const msg = body.error ?? `Error ${res.status}`;
                setApproveErrors((prev) => ({ ...prev, [key]: msg }));
                toast.error(msg);
            }
        } catch
        {
            const msg = "Network error. Please try again.";
            setApproveErrors((prev) => ({ ...prev, [key]: msg }));
            toast.error(msg);
        } finally
        {
            setApprovingIds((prev) => { const n = new Set(prev); n.delete(key); return n; });
        }
    };

    const handleOrderStatusUpdate = async (
        o: VendorOrderWithMeta,
        nextStatus: (typeof ORDER_STATUS_OPTIONS)[number],
    ) =>
    {
        const key = `${o.user_id}:${o.doc_id ?? o.order_id}`;
        let loadingToastId: string | number | undefined;
        setUpdatingOrderStatusIds((prev) => new Set(prev).add(key));
        setApproveErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

        try
        {
            const idToken = await firebaseUser?.getIdToken();
            loadingToastId = toast.loading(`Updating order status to ${nextStatus}...`);
            const res = await fetch("/api/marketing/vendor-transactions/order-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    userId: o.user_id,
                    orderId: o.doc_id ?? o.order_id,
                    orderStatus: nextStatus,
                }),
            });

            if (!res.ok)
            {
                const body = await res.json().catch(() => ({}));
                const msg = body.error ?? `Error ${res.status}`;
                setApproveErrors((prev) => ({ ...prev, [key]: msg }));
                toast.error(msg);
                return;
            }

            const body = await res.json();
            const updatedEvents = body?.data?.dhl_events_snapshot ?? o.dhl_events_snapshot ?? [];
            const lastEvent = body?.data?.last_dhl_event ?? o.last_dhl_event;
            const notifications = body?.data?.notifications;

            setOrders((prev) =>
                prev.map((item) =>
                    (item.doc_id ?? item.order_id) === (o.doc_id ?? o.order_id) && item.user_id === o.user_id
                        ? {
                            ...item,
                            order_status: nextStatus,
                            dhl_events_snapshot: updatedEvents,
                            last_dhl_event: lastEvent,
                        }
                        : item,
                ),
            );

            setOpenOrderStatusFor(null);
            toast.success(`Order status updated to ${nextStatus}.`);
            if (notifications)
            {
                console.log("[VendorTransactions] Status update notifications:", notifications);
                if (notifications?.customer?.error || notifications?.vendor?.error)
                {
                    console.error("[VendorTransactions] Notification errors:", {
                        customer: notifications?.customer,
                        vendor: notifications?.vendor,
                    });
                }
                const customerSent = notifications?.customer?.sent;
                const vendorSent = notifications?.vendor?.sent;
                if (!customerSent || !vendorSent)
                {
                    toast.warning("Status updated, but one or more notification emails were not sent.");
                }
            }
        } catch
        {
            const msg = "Network error. Please try again.";
            setApproveErrors((prev) => ({ ...prev, [key]: msg }));
            toast.error(msg);
        } finally
        {
            if (loadingToastId !== undefined) toast.dismiss(loadingToastId);
            setUpdatingOrderStatusIds((prev) => { const n = new Set(prev); n.delete(key); return n; });
        }
    };

    if (!loading && fetchError)
    {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <p className="text-lg font-semibold text-gray-800">Failed to load orders</p>
                <p className="text-sm text-gray-500">Something went wrong while fetching vendor orders.</p>
                <Button onClick={loadOrders} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendor Transactions</h1>
                <p className="text-sm text-gray-500 mt-1">View and manage payment status for all vendor orders.</p>
            </div>

            {/* Filters + Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by order ID, vendor, product, or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !fetchError && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <Inbox className="h-12 w-12 text-gray-300" />
                    <p className="text-base font-medium text-gray-600">No orders found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
                </div>
            )}

            {/* Table */}
            {!loading && !fetchError && filtered.length > 0 && (
                <div className="space-y-3 relative">
                    {updatingOrderStatusIds.size > 0 && (
                        <div className="absolute -top-2 right-0 z-30">
                            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Updating order status...
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Order ID", "Vendor", "Product", "Customer", "Amount", "Date", "Order Status", "Payment", canApprove ? "Action" : null]
                                        .filter(Boolean)
                                        .map((col) => (
                                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginated.map((o) =>
                                {
                                    const key = `${o.user_id}:${o.doc_id ?? o.order_id}`;
                                    const isPaid = o.payment_status === "paid";
                                    const isApproving = approvingIds.has(key);
                                    const isUpdatingOrderStatus = updatingOrderStatusIds.has(key);
                                    const isOpenOrderStatus = openOrderStatusFor === key;
                                    const approveError = approveErrors[key];
                                    const customerName = `${o.user_address?.first_name ?? ""} ${o.user_address?.last_name ?? ""}`.trim() || "—";

                                    return (
                                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{o.order_id}</td>
                                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{o.tailor_name || o.tailor_id || "—"}</td>
                                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{o.title ?? "—"}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{customerName}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                {formatAmount(o)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(o.timestamp)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-start gap-2">
                                                    {canApprove && (
                                                        <button
                                                            type="button"
                                                            disabled={isUpdatingOrderStatus}
                                                            onClick={() =>
                                                                setOpenOrderStatusFor((prev) => prev === key ? null : key)
                                                            }
                                                            className="mt-0.5 text-gray-500 hover:text-gray-800 disabled:opacity-50"
                                                            aria-label="Toggle status options"
                                                        >
                                                            {isOpenOrderStatus ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <div className="flex flex-col gap-2">
                                                        <Badge className={`capitalize ${getOrderStatusBadgeClass(o.order_status)}`}>
                                                            {isUpdatingOrderStatus ? "Updating..." : (o.order_status ?? "—")}
                                                        </Badge>
                                                        {isOpenOrderStatus && canApprove && (
                                                            <div className="w-44 flex flex-col gap-2 z-20 bg-white rounded-md border bg-white absolute p-2 shadow-sm space-y-1">
                                                                {ORDER_STATUS_OPTIONS.map((statusOption) => (
                                                                    <button
                                                                        key={statusOption}
                                                                        type="button"
                                                                        disabled={isUpdatingOrderStatus || statusOption === o.order_status}
                                                                        onClick={() => handleOrderStatusUpdate(o, statusOption)}
                                                                        className="w-full rounded px-2 py-1.5 text-left text-xs capitalize hover:bg-gray-100 disabled:opacity-50"
                                                                    >
                                                                        {statusOption.replace("_", " ")}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {isPaid ? (
                                                    <Badge className="bg-green-100 text-green-800 gap-1">
                                                        <CheckCircle className="h-3 w-3" /> Paid
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-600">Unpaid</Badge>
                                                )}
                                            </td>
                                            {canApprove && (
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        {!isPaid ? (
                                                            <Button
                                                                size="sm"
                                                                disabled={isApproving}
                                                                onClick={() => handleStatusChange(o, "paid")}
                                                                className="text-xs"
                                                            >
                                                                {isApproving ? "Updating..." : "Approve as Paid"}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isApproving}
                                                                onClick={() => handleStatusChange(o, "unpaid")}
                                                                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                            >
                                                                {isApproving ? "Updating..." : "Mark as Unpaid"}
                                                            </Button>
                                                        )}
                                                        {approveError && (
                                                            <p className="text-xs text-red-500">{approveError}</p>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
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
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(1)}
                                    className="text-xs px-2"
                                >
                                    «
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="text-xs"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs text-gray-600 px-2">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="text-xs"
                                >
                                    Next
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(totalPages)}
                                    className="text-xs px-2"
                                >
                                    »
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function VendorTransactionsPage()
{
    return (
        <MarketingAuthGuard>
            <VendorTransactionsContent />
        </MarketingAuthGuard>
    );
}
