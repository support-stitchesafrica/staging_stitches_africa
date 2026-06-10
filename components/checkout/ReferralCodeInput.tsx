"use client";

import { useState } from "react";
import { Tag, X, CheckCircle, Loader2 } from "lucide-react";

interface ReferralCodeInputProps
{
    onApplied: (code: string, referrerName: string, discountPercentage: number | null, referrerId: string | null) => void;
    onRemoved: () => void;
    appliedCode?: string;
    appliedReferrerName?: string;
    discountPercentage?: number | null;
    disabled?: boolean;
    ineligibilityMessage?: string | null;
    freeShippingGranted?: boolean;
}

export function ReferralCodeInput({
    onApplied,
    onRemoved,
    appliedCode,
    appliedReferrerName,
    discountPercentage,
    disabled,
    ineligibilityMessage,
    freeShippingGranted,
}: ReferralCodeInputProps)
{
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInput, setShowInput] = useState(false);

    const handleValidate = async () =>
    {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed)
        {
            setError("Please enter a referral code");
            return;
        }

        setLoading(true);
        setError(null);

        try
        {
            const res = await fetch("/api/referral/validate-discount", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: trimmed }),
            });

            const data = await res.json();

            if (data.valid)
            {
                onApplied(trimmed, data.referrer?.name || "", data.discountPercentage ?? null, data.referrerId ?? null);
                setShowInput(false);
                setCode("");
            } else
            {
                setError(data.error?.message || "Invalid referral code");
            }
        } catch
        {
            setError("Failed to validate code. Please try again.");
        } finally
        {
            setLoading(false);
        }
    };

    const handleRemove = () =>
    {
        onRemoved();
        setCode("");
        setError(null);
        setShowInput(false);
    };

    // Applied state
    if (appliedCode)
    {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">
                                Referral code applied: <span className="font-bold">{appliedCode}</span>
                            </p>
                            {appliedReferrerName && (
                                <p className="text-xs text-blue-700">Referred by {appliedReferrerName}</p>
                            )}
                            {discountPercentage != null && (
                                <p className="text-xs font-medium text-green-700 mt-0.5">
                                    {discountPercentage}% discount applied to your order
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleRemove}
                        disabled={disabled}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        aria-label="Remove referral code"
                    >
                        <X size={16} />
                    </button>
                </div>
                {freeShippingGranted && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-green-800">
                            Free shipping applied via referral code <span className="font-bold">{appliedCode}</span>
                        </p>
                    </div>
                )}
                {!freeShippingGranted && ineligibilityMessage && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">{ineligibilityMessage}</p>
                    </div>
                )}
            </div>
        );
    }

    // Collapsed state
    if (!showInput)
    {
        return (
            <button
                onClick={() => setShowInput(true)}
                disabled={disabled}
                className="flex items-center bg-transparent! border-0! text-black! gap-2 text-sm text-gray-600 outine-none! hover:text-gray-900 underline disabled:opacity-50"
            >
                <Tag size={14} />
                Have a referral code?
            </button>
        );
    }

    // Input state
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Referral Code
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                    {
                        setCode(e.target.value.toUpperCase());
                        setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                    placeholder="Enter referral code"
                    disabled={disabled || loading}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50"
                    maxLength={20}
                />
                <button
                    onClick={handleValidate}
                    disabled={disabled || loading || !code.trim()}
                    className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                </button>
                <button
                    onClick={() =>
                    {
                        setShowInput(false);
                        setCode("");
                        setError(null);
                    }}
                    disabled={loading}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
