"use client";

import { useState, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Bank { code: string; name: string; }
interface PaystackSubaccount
{
    id: number;
    subaccount_code: string;
    business_name: string;
    account_number: string;
    bank_name?: string;
    percentage_charge: number;
}

interface Props { tailorUID: string; email?: string; businessName?: string; }

export function PaystackSubaccountManager({ tailorUID, email, businessName }: Props)
{
    const [existing, setExisting] = useState<PaystackSubaccount | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const verifyTimeout = useRef<NodeJS.Timeout | null>(null);

    const [form, setForm] = useState({
        business_name: businessName || "",
        bank_code: "",
        account_number: "",
    });

    // Load existing subaccount from Firestore
    useEffect(() =>
    {
        if (!tailorUID) { setLoading(false); return; }
        const load = async () =>
        {
            try
            {
                const snap = await getDoc(doc(db, "tailors", tailorUID));
                if (snap.exists() && snap.data().paystackSubaccount)
                {
                    setExisting(snap.data().paystackSubaccount as PaystackSubaccount);
                }
            } catch (e)
            {
                console.error("Error loading Paystack subaccount:", e);
            } finally
            {
                setLoading(false);
            }
        };
        load();
    }, [tailorUID]);

    // Fetch Nigerian banks from Paystack
    useEffect(() =>
    {
        if (!showForm || banks.length) return;
        setLoadingBanks(true);
        fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", {
            headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY}` },
        })
            .then((r) => r.json())
            .then((d) => { if (d.status) setBanks(d.data as Bank[]); })
            .catch(() => toast.error("Failed to load banks"))
            .finally(() => setLoadingBanks(false));
    }, [showForm]);

    // Auto-verify account number when bank + 10-digit number entered
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
    }, [form.bank_code, form.account_number]);

    const verifyAccount = async () =>
    {
        setVerifying(true);
        setVerifiedName(null);
        try
        {
            const res = await fetch(
                `/api/vendors/verify-bank-account?account_number=${form.account_number}&bank_code=${form.bank_code}&provider=paystack`
            );
            const data = await res.json();
            if (data.account_name)
            {
                setVerifiedName(data.account_name);
            } else if (res.status === 503)
            {
                // PAYSTACK_SECRET_KEY not set — allow manual proceed
                setVerifiedName("(verification unavailable)");
            } else
            {
                toast.error("Could not verify account. Check the details.");
            }
        } catch
        {
            toast.error("Account verification failed");
        } finally
        {
            setVerifying(false);
        }
    };

    const handleCreate = async () =>
    {
        if (!form.business_name || !form.bank_code || !form.account_number)
        {
            toast.error("Please fill in all fields");
            return;
        }
        if (!verifiedName)
        {
            toast.error("Please wait for account verification");
            return;
        }
        setCreating(true);
        try
        {
            const res = await fetch("/api/vendors/create-paystack-subaccount", {
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
            const data = await res.json();
            if (data.success)
            {
                setExisting(data.data as PaystackSubaccount);
                setShowForm(false);
                toast.success("Paystack subaccount created successfully!");
            } else
            {
                toast.error(data.message || "Failed to create subaccount");
            }
        } catch
        {
            toast.error("Something went wrong");
        } finally
        {
            setCreating(false);
        }
    };

    if (loading)
    {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (existing)
    {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        Paystack Subaccount Active
                    </CardTitle>
                    <CardDescription className="text-green-700">
                        Your Paystack payout account is set up and ready to receive payments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-xs text-gray-500 mb-1">Business Name</p>
                            <p className="font-medium text-sm">{existing.business_name}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-xs text-gray-500 mb-1">Subaccount Code</p>
                            <p className="font-mono text-sm">{existing.subaccount_code}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-xs text-gray-500 mb-1">Account Number</p>
                            <p className="font-medium text-sm">{existing.account_number}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                            <p className="text-xs text-gray-500 mb-1">Your Share</p>
                            <Badge className="bg-green-600 text-white">
                                {100 - (existing.percentage_charge ?? 20)}%
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!showForm)
    {
        return (
            <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Building2 className="h-10 w-10 text-gray-300 mb-3" />
                    <h3 className="font-semibold text-gray-700 mb-1">No Paystack Account</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Add a Paystack subaccount to receive NGN payouts directly to your Nigerian bank.
                    </p>
                    <Button onClick={() => setShowForm(true)} className="bg-[#00C3F7] hover:bg-[#00aad9] text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Paystack Account
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Paystack Subaccount</CardTitle>
                <CardDescription>
                    Enter your Nigerian bank details. You&apos;ll receive 80% of each sale directly.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                        value={form.business_name}
                        onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
                        placeholder="Your brand or business name"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Bank</Label>
                    {loadingBanks ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading banks...
                        </div>
                    ) : (
                        <Select value={form.bank_code} onValueChange={(v) => setForm((p) => ({ ...p, bank_code: v, account_number: "" }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your bank" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {banks.map((b, i) => (
                                    <SelectItem key={`${b.code}-${i}`} value={b.code}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                        value={form.account_number}
                        onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        placeholder="10-digit account number"
                        maxLength={10}
                    />
                    {verifying && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Verifying account...
                        </p>
                    )}
                    {verifiedName && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> {verifiedName}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={creating || !verifiedName}
                        className="flex-1 bg-[#00C3F7] hover:bg-[#00aad9] text-white"
                    >
                        {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Subaccount"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
