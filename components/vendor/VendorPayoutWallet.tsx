"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ProviderBalance
{
    paystack: { total: number; available: number; pending: number };
    stripe: { total: number; available: number; pending: number };
    flutterwave: { total: number; available: number; pending: number };
    unattributed?: number;
}

interface PayoutRequest
{
    id: string;
    provider: string;
    amount: number;
    currency: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string | null;
}

interface Props
{
    vendorId: string;
    vendorName?: string;
    vendorEmail?: string;
    /** Pre-fetched total wallet balance from parent — avoids a duplicate fetch */
    prefetchedTotal?: number;
    prefetchedTotalLoading?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
    paystack: "Paystack",
    stripe: "Stripe",
    flutterwave: "Flutterwave",
};

const PROVIDER_COLORS: Record<string, string> = {
    paystack: "bg-cyan-50 border-cyan-200",
    stripe: "bg-indigo-50 border-indigo-200",
    flutterwave: "bg-orange-50 border-orange-200",
};

const PROVIDER_BADGE_COLORS: Record<string, string> = {
    paystack: "bg-cyan-100 text-cyan-800",
    stripe: "bg-indigo-100 text-indigo-800",
    flutterwave: "bg-orange-100 text-orange-800",
};

function ProviderIcon({ provider }: { provider: string })
{
    if (provider === "paystack")
    {
        return (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#00C3F7" />
                <path d="M6 9h8a3 3 0 010 6H6V9z" fill="white" />
                <path d="M6 13h6a1 1 0 010 2H6v-2z" fill="#00C3F7" />
            </svg>
        );
    }
    if (provider === "stripe")
    {
        return (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635BFF" />
            </svg>
        );
    }
    // Flutterwave
    return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#F5A623" />
            <path d="M7 8c1-2 3-3 5-3s4 1 5 3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M7 12c1-2 3-3 5-3s4 1 5 3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M7 16c1-2 3-3 5-3s4 1 5 3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
    );
}

function fmt(amount: number, currency = "NGN")
{
    const symbol = currency === "NGN" ? "₦" : currency + " ";
    return symbol + amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function VendorPayoutWallet({ vendorId, vendorName, vendorEmail, prefetchedTotal, prefetchedTotalLoading }: Props)
{
    const [total, setTotal] = useState(prefetchedTotal ?? 0);
    const [providers, setProviders] = useState<ProviderBalance>({
        paystack: { total: 0, available: 0, pending: 0 },
        stripe: { total: 0, available: 0, pending: 0 },
        flutterwave: { total: 0, available: 0, pending: 0 },
        unattributed: 0,
    });
    const [currency, setCurrency] = useState("NGN");
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const fetchBalance = async () =>
    {
        setLoadingBalance(true);
        try
        {
            const res = await fetch(`/api/vendor/wallet-balance?vendorId=${vendorId}`);
            const data = await res.json();
            if (res.ok)
            {
                setTotal(prefetchedTotal !== undefined ? prefetchedTotal : (data.total || 0));
                setProviders({
                    paystack: data.providers?.paystack ?? { total: 0, available: 0, pending: 0 },
                    stripe: data.providers?.stripe ?? { total: 0, available: 0, pending: 0 },
                    flutterwave: data.providers?.flutterwave ?? { total: 0, available: 0, pending: 0 },
                    unattributed: data.unattributed || 0,
                });
                setCurrency(data.currency || "NGN");
            }
        } catch (e)
        {
            console.error("Failed to load wallet balance", e);
        } finally
        {
            setLoadingBalance(false);
        }
    };

    const fetchRequests = async () =>
    {
        setLoadingRequests(true);
        try
        {
            const res = await fetch(`/api/vendor/payout-request?vendorId=${vendorId}`);
            const data = await res.json();
            if (res.ok) setRequests(data.requests || []);
        } catch (e)
        {
            console.error("Failed to load payout requests", e);
        } finally
        {
            setLoadingRequests(false);
        }
    };

    useEffect(() =>
    {
        if (!vendorId) return;
        fetchBalance();
        fetchRequests();
    }, [vendorId]);

    // Keep total in sync if parent re-fetches
    useEffect(() =>
    {
        if (prefetchedTotal !== undefined) setTotal(prefetchedTotal);
    }, [prefetchedTotal]);

    const hasPendingRequest = (provider: string) =>
        requests.some((r) => r.provider === provider && r.status === "pending");

    const openRequestDialog = (provider: string) =>
    {
        setSelectedProvider(provider);
        setDialogOpen(true);
    };

    const handleSubmitRequest = async () =>
    {
        if (!selectedProvider) return;
        const providerData = providers[selectedProvider as keyof Omit<ProviderBalance, "unattributed">];
        const available = typeof providerData === "object" ? providerData.available : 0;
        if (available <= 0)
        {
            toast.error("No delivered orders available for payout yet.");
            return;
        }

        setSubmitting(true);
        try
        {
            const res = await fetch("/api/vendor/payout-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vendorId,
                    vendorName: vendorName || "",
                    vendorEmail: vendorEmail || "",
                    provider: selectedProvider,
                    amount: available,
                    currency,
                }),
            });

            const data = await res.json();
            if (res.ok)
            {
                toast.success(`Payout request submitted for ${PROVIDER_LABELS[selectedProvider]}. Finance team has been notified.`);
                setDialogOpen(false);
                fetchRequests();
            } else
            {
                toast.error(data.error || "Failed to submit payout request.");
            }
        } catch (e)
        {
            toast.error("Something went wrong. Please try again.");
        } finally
        {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) =>
    {
        if (status === "pending") return <Clock className="h-4 w-4 text-amber-500" />;
        if (status === "approved") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
        return <XCircle className="h-4 w-4 text-red-500" />;
    };

    const getStatusBadge = (status: string) =>
    {
        if (status === "pending") return <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>;
        if (status === "approved") return <Badge className="bg-emerald-100 text-emerald-800 border-0">Approved</Badge>;
        return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Total Wallet Balance */}
            <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-emerald-600" />
                            <span>Wallet Balance</span>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </CardTitle>
                    <CardDescription>Total earnings across all payment providers</CardDescription>
                </CardHeader>
                <CardContent>
                    {(prefetchedTotalLoading || loadingBalance) ? (
                        <div className="h-12 bg-gray-100 animate-pulse rounded-lg" />
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{fmt(total, currency)}</span>
                            <span className="text-sm text-gray-500">{currency}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Per-Provider Balances */}
            <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Balance by Provider</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["paystack", "stripe", "flutterwave"] as const).map((provider) =>
                    {
                        const providerData = providers[provider];
                        const available = providerData.available;
                        const pendingAmount = providerData.pending;
                        const total = providerData.total;
                        const pending = hasPendingRequest(provider);

                        return (
                            <Card key={provider} className={`border-2 ${PROVIDER_COLORS[provider]}`}>
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <ProviderIcon provider={provider} />
                                            <span className="font-semibold text-gray-800">{PROVIDER_LABELS[provider]}</span>
                                        </div>
                                        {pending && (
                                            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Pending
                                            </Badge>
                                        )}
                                    </div>

                                    {loadingBalance ? (
                                        <div className="space-y-1 mb-3">
                                            <div className="h-8 bg-gray-100 animate-pulse rounded" />
                                            <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                                        </div>
                                    ) : (
                                        <div className="mb-3">
                                            <p className="text-2xl font-bold text-gray-900">{fmt(available, currency)}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Available to withdraw</p>
                                            {pendingAmount > 0 && (
                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {fmt(pendingAmount, currency)} pending delivery
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        size="sm"
                                        className="w-full"
                                        disabled={loadingBalance || available <= 0 || pending}
                                        variant={pending ? "outline" : "default"}
                                        onClick={() => openRequestDialog(provider)}
                                    >
                                        {pending ? "Request Pending" : available <= 0 ? (total > 0 ? "Awaiting Delivery" : "No Balance") : "Request Payout"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Unattributed balance note */}
            {!loadingBalance && (providers.unattributed || 0) > 0 && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                        <strong>{fmt(providers.unattributed || 0, currency)}</strong> of your balance is from orders where the payment provider hasn&apos;t been confirmed yet. This will be attributed once payment is verified.
                    </span>
                </div>
            )}

            {/* Payout Request History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Payout Request History</CardTitle>
                    <CardDescription>Your recent payout requests and their status</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingRequests ? (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">No payout requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(req.status)}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {PROVIDER_LABELS[req.provider] || req.provider}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-gray-900">{fmt(req.amount, req.currency)}</span>
                                        {getStatusBadge(req.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Payout Request Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Request Payout via {PROVIDER_LABELS[selectedProvider]}</DialogTitle>
                        <DialogDescription>
                            This will notify the finance team to process your payout. You'll receive an email once approved.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Provider</span>
                                <span className="font-medium capitalize">{selectedProvider}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-bold text-emerald-600 text-base">
                                    {fmt(
                                        (typeof providers[selectedProvider as keyof Omit<ProviderBalance, "unattributed">] === "object"
                                            ? (providers[selectedProvider as keyof Omit<ProviderBalance, "unattributed">] as { available: number }).available
                                            : 0) || 0,
                                        currency
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                                Payout requests require admin approval. Once approved, funds will be transferred to your {PROVIDER_LABELS[selectedProvider]} account.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-black hover:bg-black/90 text-white"
                            onClick={handleSubmitRequest}
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
