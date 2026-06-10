"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PayoutRequest
{
    id: string;
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    provider: string;
    amount: number;
    currency: string;
    status: "pending" | "approved" | "rejected" | "payout_failed";
    adminNote?: string;
    createdAt: string | null;
    processedAt?: string | null;
    providerTransferId?: string | null;
    payoutError?: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
    paystack: "Paystack",
    stripe: "Stripe",
    flutterwave: "Flutterwave",
};

function fmt(amount: number, currency = "NGN")
{
    const symbol = currency === "NGN" ? "₦" : currency + " ";
    return symbol + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string })
{
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-800 border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    if (status === "approved") return <Badge className="bg-emerald-100 text-emerald-800 border-0"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === "payout_failed") return <Badge className="bg-orange-100 text-orange-800 border-0"><XCircle className="h-3 w-3 mr-1" />Payout Failed</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-0"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
}

export default function AdminPayoutRequestsPage()
{
    const router = useRouter();
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        request: PayoutRequest | null;
        action: "approve" | "reject" | null;
    }>({ open: false, request: null, action: null });
    const [adminNote, setAdminNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() =>
    {
        const role = localStorage.getItem("adminRole");
        if (role !== "superadmin" && role !== "admin")
        {
            router.replace("/");
        }
    }, [router]);

    const fetchRequests = async () =>
    {
        setLoading(true);
        try
        {
            const res = await fetch(`/api/admin/payout-requests?status=${statusFilter}`);
            const data = await res.json();
            if (res.ok) setRequests(data.requests || []);
            else toast.error(data.error || "Failed to load requests");
        } catch
        {
            toast.error("Failed to load payout requests");
        } finally
        {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [statusFilter]);

    const openAction = (request: PayoutRequest, action: "approve" | "reject") =>
    {
        setActionDialog({ open: true, request, action });
        setAdminNote("");
    };

    const handleAction = async () =>
    {
        if (!actionDialog.request || !actionDialog.action) return;
        setSubmitting(true);
        try
        {
            const res = await fetch("/api/admin/payout-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: actionDialog.request.id, action: actionDialog.action, adminNote }),
            });
            const data = await res.json();
            if (res.ok)
            {
                toast.success(`Request ${actionDialog.action === "approve" ? "approved and payout triggered" : "rejected"}.`);
                setActionDialog({ open: false, request: null, action: null });
                fetchRequests();
            } else
            {
                toast.error(data.error || "Action failed");
            }
        } catch
        {
            toast.error("Something went wrong");
        } finally
        {
            setSubmitting(false);
        }
    };

    return (
        <SidebarLayout
            pageTitle="Payout Requests"
            pageDescription="Review and approve vendor payout requests"
        >
            <div className="space-y-6">
                {/* Header controls */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="payout_failed">Payout Failed</SelectItem>
                                <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-500">
                            {requests.length} request{requests.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Requests list */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : requests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No {statusFilter !== "all" ? statusFilter : ""} payout requests.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {requests.map((req) => (
                                    <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900">{req.vendorName || req.vendorId}</span>
                                                <StatusBadge status={req.status} />
                                                <Badge variant="outline" className="capitalize">
                                                    {PROVIDER_LABELS[req.provider] || req.provider}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">{req.vendorEmail}</p>
                                            <p className="text-xs text-gray-400">
                                                {req.createdAt
                                                    ? new Date(req.createdAt).toLocaleString("en-US", {
                                                        month: "short", day: "numeric", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </p>
                                            {req.adminNote && (
                                                <p className="text-xs text-gray-500 italic">Note: {req.adminNote}</p>
                                            )}
                                            {req.providerTransferId && (
                                                <p className="text-xs text-emerald-600">Transfer: {req.providerTransferId}</p>
                                            )}
                                            {req.payoutError && (
                                                <p className="text-xs text-red-500">Error: {req.payoutError}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-lg font-bold text-gray-900">
                                                {fmt(req.amount, req.currency)}
                                            </span>
                                            {req.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => openAction(req, "approve")}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                                        onClick={() => openAction(req, "reject")}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Confirm dialog */}
            <Dialog open={actionDialog.open} onOpenChange={(o) => setActionDialog((p) => ({ ...p, open: o }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog.action === "approve" ? "Approve" : "Reject"} Payout Request
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog.request && (
                                <>
                                    {actionDialog.action === "approve" ? "Approve" : "Reject"} payout of{" "}
                                    <strong>{fmt(actionDialog.request.amount, actionDialog.request.currency)}</strong> via{" "}
                                    <strong className="capitalize">{actionDialog.request.provider}</strong> for{" "}
                                    <strong>{actionDialog.request.vendorName || actionDialog.request.vendorId}</strong>.
                                    {actionDialog.action === "approve" && (
                                        <span className="block mt-1 text-amber-600 text-sm">
                                            This will immediately trigger a transfer via {PROVIDER_LABELS[actionDialog.request.provider] || actionDialog.request.provider} and deduct the amount from the vendor&apos;s wallet.
                                        </span>
                                    )}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-3">
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Admin Note (optional)
                        </label>
                        <Input
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add a note for the vendor..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActionDialog({ open: false, request: null, action: null })}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={
                                actionDialog.action === "approve"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }
                            onClick={handleAction}
                            disabled={submitting}
                        >
                            {submitting
                                ? actionDialog.action === "approve" ? "Processing..." : "Rejecting..."
                                : actionDialog.action === "approve" ? "Approve & Trigger Payout" : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarLayout>
    );
}
