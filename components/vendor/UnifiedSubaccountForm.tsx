"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import
    {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "@/components/ui/card";
import
    {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = "paystack" | "flutterwave";

interface Bank
{
    code: string;
    name: string;
}

interface ExistingAccount
{
    provider: Provider;
    business_name?: string;
    account_number?: string;
    bank_name?: string;
    subaccount_code?: string; // paystack
    subaccount_id?: string;   // flutterwave
    id?: number;
}

interface Props
{
    tailorUID: string;
    email?: string;
    businessName?: string;
    /** Called after a subaccount is successfully created */
    onCreated?: (provider: Provider) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<Provider, string> = {
    paystack: "Paystack (NGN — Nigerian banks)",
    flutterwave: "Flutterwave (NGN / GHS / USD)",
};

const PROVIDER_COLORS: Record<Provider, string> = {
    paystack: "border-sky-200 bg-sky-50 text-sky-900",
    flutterwave: "border-orange-200 bg-orange-50 text-orange-900",
};

function isHtmlErrorBody(raw: string): boolean
{
    const t = raw.trim().toLowerCase();
    return (
        t.startsWith("<!doctype") ||
        t.startsWith("<html") ||
        t.startsWith("<!") ||
        t.includes("<html")
    );
}

/** Prefer provider JSON `message` inside `details`, then top-level `message`. */
function extractSubaccountApiError(
    payload: Record<string, unknown>,
    httpStatus: number,
): string
{
    const tryParseJsonMessage = (raw: string): string | null =>
    {
        const t = raw?.trim();
        if (!t) return null;
        if (isHtmlErrorBody(t))
        {
            return `Server error (HTTP ${httpStatus}). Please try again in a moment.`;
        }
        try
        {
            const o = JSON.parse(t) as { message?: string };
            if (typeof o?.message === "string" && o.message.trim())
            {
                return o.message.trim();
            }
        } catch
        {
            /* not JSON */
        }
        return t.length > 500 ? `${t.slice(0, 500)}…` : t;
    };

    const details = typeof payload.details === "string" ? payload.details : "";
    if (details)
    {
        const fromDetails = tryParseJsonMessage(details);
        if (fromDetails) return fromDetails;
    }

    if (typeof payload.message === "string" && payload.message.trim())
    {
        return payload.message.trim();
    }

    if (typeof payload.error === "string" && payload.error.trim())
    {
        return payload.error.trim();
    }

    return `Request failed (${httpStatus}). Please try again.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UnifiedSubaccountForm({
    tailorUID,
    email = "",
    businessName = "",
    onCreated,
}: Props)
{
    const [provider, setProvider] = useState<Provider>("paystack");
    const [existing, setExisting] = useState<Record<Provider, ExistingAccount | null>>({
        paystack: null,
        flutterwave: null,
    });
    const [loadingExisting, setLoadingExisting] = useState(true);

    // Form fields
    const [form, setForm] = useState({
        business_name: businessName,
        bank_code: "",
        account_number: "",
        account_name: "",   // flutterwave needs this
        currency: "NGN",    // flutterwave
    });

    // Bank list
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

    // Account verification
    const [verifying, setVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const verifyTimeout = useRef<NodeJS.Timeout | null>(null);

    // Submission
    const [creating, setCreating] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ── Load existing accounts ─────────────────────────────────────────────────
    useEffect(() =>
    {
        if (!tailorUID) { setLoadingExisting(false); return; }
        const load = async () =>
        {
            try
            {
                const snap = await getDoc(doc(db, "tailors", tailorUID));
                if (!snap.exists()) return;
                const data = snap.data();

                const ps = data?.paystackSubaccount ?? null;
                const fw = data?.flutterwaveSubaccount
                    ?? (Array.isArray(data?.flutterwaveSubaccounts) ? data.flutterwaveSubaccounts[0] : null)
                    ?? null;

                setExisting({
                    paystack: ps ? { provider: "paystack", ...ps } : null,
                    flutterwave: fw ? { provider: "flutterwave", ...fw } : null,
                });

                // Default to a provider that doesn't have an account yet
                if (!ps) setProvider("paystack");
                else if (!fw) setProvider("flutterwave");
            } catch (e)
            {
                console.error("[UnifiedSubaccountForm] load error:", e);
            } finally
            {
                setLoadingExisting(false);
            }
        };
        load();
    }, [tailorUID]);

    const flutterwaveBanksCountry = useMemo(
        () =>
            form.currency === "GHS" ? "GH" : form.currency === "USD" ? "US" : "NG",
        [form.currency],
    );

    /**
     * Bank lists: Paystack is fetched with the public key (supported). Flutterwave
     * bank list must use the server route with FLW_SECRET_KEY — the public key
     * does not authorize /v3/banks and returns empty / errors from the browser.
     * Refetch when switching provider or when Flutterwave currency changes (country).
     */
    useEffect(() =>
    {
        let cancelled = false;
        setLoadingBanks(true);
        setBanks([]);
        setForm((p) => ({ ...p, bank_code: "", account_number: "" }));
        setVerifiedName(null);

        const load = async () =>
        {
            try
            {
                if (provider === "paystack")
                {
                    const res = await fetch(
                        "https://api.paystack.co/bank?country=nigeria&perPage=200",
                        {
                            headers: {
                                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY}`,
                            },
                        },
                    );
                    const d = await res.json();
                    if (cancelled) return;
                    const list: Bank[] = (d.data ?? []).map((b: any) => ({
                        code: String(b.code ?? ""),
                        name: String(b.name ?? ""),
                    })).filter((b: Bank) => b.code && b.name);
                    setBanks(list);
                } else
                {
                    const res = await fetch(
                        `/api/flutterwave/banks?country=${flutterwaveBanksCountry}`,
                    );
                    const d = await res.json();
                    if (cancelled) return;
                    if (!d.success || !Array.isArray(d.banks))
                    {
                        toast.error(d.message || "Failed to load banks");
                        setBanks([]);
                        return;
                    }
                    const list: Bank[] = d.banks
                        .map((b: any) => ({
                            code: String(b.code ?? ""),
                            name: String(b.name ?? ""),
                        }))
                        .filter((b: Bank) => b.code && b.name)
                        .sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));
                    setBanks(list);
                }
            } catch (e)
            {
                console.error("[UnifiedSubaccountForm] banks load:", e);
                if (!cancelled) toast.error("Failed to load banks.");
                setBanks([]);
            } finally
            {
                if (!cancelled) setLoadingBanks(false);
            }
        };
        void load();
        return () =>
        {
            cancelled = true;
        };
    }, [
        provider,
        provider === "flutterwave" ? flutterwaveBanksCountry : "_ps",
    ]);

    useEffect(() =>
    {
        setSubmitError(null);
    }, [provider]);

    useEffect(() =>
    {
        setSubmitError(null);
    }, [form.bank_code, form.account_number]);

    // ── Auto-verify account number ─────────────────────────────────────────────
    useEffect(() =>
    {
        if (verifyTimeout.current) clearTimeout(verifyTimeout.current);
        if (form.bank_code && form.account_number.length === 10)
        {
            verifyTimeout.current = setTimeout(verifyAccount, 800);
        } else
        {
            setVerifiedName(null);
        }
        return () => { if (verifyTimeout.current) clearTimeout(verifyTimeout.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.bank_code, form.account_number]);

    const verifyAccount = async () =>
    {
        setVerifying(true);
        setVerifiedName(null);
        try
        {
            const res = await fetch(
                `/api/vendors/verify-bank-account?account_number=${form.account_number}&bank_code=${form.bank_code}&provider=${provider}`
            );
            const data = await res.json();
            if (data.account_name)
            {
                setVerifiedName(data.account_name);
                setForm((p) => ({ ...p, account_name: data.account_name }));
            } else if (res.status === 503)
            {
                setVerifiedName("(verification unavailable — you may proceed)");
            } else
            {
                toast.error("Could not verify account. Please check the details.");
            }
        } catch
        {
            toast.error("Account verification failed");
        } finally
        {
            setVerifying(false);
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleCreate = async () =>
    {
        if (!form.business_name || !form.bank_code || !form.account_number)
        {
            toast.error("Please fill in all required fields");
            return;
        }
        if (!verifiedName)
        {
            toast.error("Please wait for account number verification");
            return;
        }

        setSubmitError(null);
        setCreating(true);
        try
        {
            let res: Response;

            if (provider === "paystack")
            {
                res = await fetch("/api/vendors/create-paystack-subaccount", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        business_name: form.business_name,
                        bank_code: form.bank_code,
                        account_number: form.account_number,
                        email,
                        tailorUID,
                        percentage_charge: 20,
                    }),
                });
            } else
            {
                res = await fetch("/api/vendors/create-subaccount", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        business_name: form.business_name,
                        bank_code: form.bank_code,
                        account_number: form.account_number,
                        account_name: verifiedName,
                        email,
                        tailorUID,
                        currency: form.currency,
                    }),
                });
            }

            const raw = await res.text();
            let data: Record<string, unknown> = {};
            if (isHtmlErrorBody(raw))
            {
                data = {
                    message: `Server error (HTTP ${res.status}). Please try again in a moment.`,
                };
            } else
            {
                try
                {
                    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
                } catch
                {
                    data = { message: raw || res.statusText };
                }
            }

            if (res.ok && data.success === true)
            {
                setSubmitError(null);
                setExisting((prev) => ({
                    ...prev,
                    [provider]: { provider, ...(data.data as object) },
                }));
                toast.success(
                    `${PROVIDER_LABELS[provider].split(" ")[0]} subaccount created! You'll receive 80% of each sale.`
                );
                onCreated?.(provider);
            } else
            {
                const msg = extractSubaccountApiError(data, res.status);
                setSubmitError(msg);
                toast.error(msg);
            }
        } catch (err)
        {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again.";
            setSubmitError(msg);
            toast.error(msg);
        } finally
        {
            setCreating(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    if (loadingExisting)
    {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    const currentExisting = existing[provider];
    const allDone = existing.paystack && existing.flutterwave;

    return (
        <div className="space-y-6">
            {/* Summary of existing accounts */}
            {(existing.paystack || existing.flutterwave) && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Connected accounts</p>
                    <div className="flex flex-wrap gap-2">
                        {(["paystack", "flutterwave"] as Provider[]).map((p) =>
                            existing[p] ? (
                                <Badge key={p} className={`${PROVIDER_COLORS[p]} border`}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {p.charAt(0).toUpperCase() + p.slice(1)} — {existing[p]!.account_number ?? existing[p]!.subaccount_code ?? existing[p]!.subaccount_id}
                                </Badge>
                            ) : null
                        )}
                    </div>
                </div>
            )}

            {allDone ? (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="flex items-center gap-3 py-5">
                        <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-green-800">All payout accounts connected</p>
                            <p className="text-sm text-green-700">
                                Both Paystack and Flutterwave subaccounts are active. You&apos;re ready to receive payouts.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Add Payout Subaccount
                        </CardTitle>
                        <CardDescription>
                            Connect your bank account to receive 80% of each sale automatically.
                            You can add both Paystack (NGN) and Flutterwave accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                        {/* Provider selector */}
                        <div className="space-y-2">
                            <Label>Payment Provider</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {(["paystack", "flutterwave"] as Provider[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setProvider(p)}
                                        disabled={!!existing[p]}
                                        className={`
                      relative rounded-lg border-2 p-3 text-left transition-all
                      ${provider === p && !existing[p]
                                                ? "border-black bg-gray-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                            }
                      ${existing[p] ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                                    >
                                        <p className="font-semibold text-sm capitalize">{p}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {p === "paystack" ? "NGN · Nigerian banks" : "NGN / GHS / USD"}
                                        </p>
                                        {existing[p] && (
                                            <span className="absolute top-2 right-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentExisting ? (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                {provider.charAt(0).toUpperCase() + provider.slice(1)} subaccount already connected.
                                Select the other provider to add another account.
                            </div>
                        ) : (
                            <>
                                {/* Currency (Flutterwave only) */}
                                {provider === "flutterwave" && (
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select
                                            value={form.currency}
                                            onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                                                <SelectItem value="GHS">GHS — Ghanaian Cedi</SelectItem>
                                                <SelectItem value="USD">USD — US Dollar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Business name */}
                                <div className="space-y-2">
                                    <Label>Business / Brand Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={form.business_name}
                                        onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
                                        placeholder="Your brand or business name"
                                    />
                                </div>

                                {/* Bank selector */}
                                <div className="space-y-2">
                                    <Label>Bank <span className="text-red-500">*</span></Label>
                                    {loadingBanks ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading banks…
                                        </div>
                                    ) : (
                                        <Select
                                            value={form.bank_code}
                                            onValueChange={(v) =>
                                                setForm((p) => ({ ...p, bank_code: v, account_number: "" }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your bank" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-64">
                                                {banks.map((b, i) => (
                                                    <SelectItem key={`${b.code}-${i}`} value={b.code}>
                                                        {b.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {!loadingBanks && banks.length === 0 && (
                                        <p className="text-xs text-amber-700">
                                            No banks loaded. Ensure{" "}
                                            <code className="text-[10px]">FLW_SECRET_KEY</code> is set
                                            on the server for Flutterwave, or try another payout currency.
                                        </p>
                                    )}
                                </div>

                                {/* Account number */}
                                <div className="space-y-2">
                                    <Label>Account Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={form.account_number}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                account_number: e.target.value.replace(/\D/g, "").slice(0, 10),
                                            }))
                                        }
                                        placeholder="10-digit account number"
                                        maxLength={10}
                                    />
                                    {verifying && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Verifying account…
                                        </p>
                                    )}
                                    {verifiedName && !verifying && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> {verifiedName}
                                        </p>
                                    )}
                                </div>

                                {/* Info banner */}
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>
                                        You will receive <strong>80%</strong> of each sale directly to this account.
                                        The platform retains 20% as a service fee.
                                    </span>
                                </div>

                                {submitError && (
                                    <div
                                        role="alert"
                                        className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900"
                                    >
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                                            <p className="flex-1 leading-snug whitespace-pre-wrap wrap-break-word">
                                                {submitError}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="self-end text-xs font-medium text-red-700 underline hover:text-red-900"
                                            onClick={() => setSubmitError(null)}
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <Button
                                        onClick={handleCreate}
                                        disabled={creating || !verifiedName || !form.business_name || !form.bank_code || !form.account_number}
                                        className="flex-1 bg-black hover:bg-black/90 text-white"
                                    >
                                        {creating ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                                        ) : (
                                            `Create ${provider.charAt(0).toUpperCase() + provider.slice(1)} Subaccount`
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
