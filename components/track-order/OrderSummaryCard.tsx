'use client';

import React, { useState } from 'react';
import { Copy, Check, Package, Truck, Calendar, Tag } from 'lucide-react';
import { SanitisedResponse } from '@/types/track-order';

// Maps status string to a badge colour
function getStatusBadge(status: string): { bg: string; text: string; label: string }
{
    const s = (status ?? '').toLowerCase();
    if (s === 'delivered' || s === 'ok')
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Delivered' };
    if (s === 'failed' || s === 'failed_delivery' || s === 'nd' || s === 'nh')
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed Delivery' };
    if (s === 'returned' || s === 'rt')
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Returned' };
    if (s === 'processing')
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' };
    if (s === 'out_for_delivery' || s === 'out for delivery' || s === 'wc')
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Out for Delivery' };
    if (s === 'in_transit' || s === 'in transit' || s === 'pl' || s === 'af' || s === 'df' || s === 'ar')
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Transit' };
    if (s === 'picked_up' || s === 'picked up' || s === 'pu' || s === 'sa')
        return { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Picked Up' };
    // Default
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { bg: 'bg-gray-100', text: 'text-gray-700', label };
}

function formatDeliveryDate(iso: string | null): string
{
    if (!iso) return '';
    try
    {
        return new Date(iso).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    } catch
    {
        return iso;
    }
}

interface OrderSummaryCardProps
{
    data: SanitisedResponse;
}

export function OrderSummaryCard({ data }: OrderSummaryCardProps)
{
    const [copied, setCopied] = useState(false);
    const badge = getStatusBadge(data.status);

    async function handleCopy()
    {
        if (!data.trackingNumber) return;
        try
        {
            await navigator.clipboard.writeText(data.trackingNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch
        {
            // Fallback for browsers without clipboard API
            const el = document.createElement('textarea');
            el.value = data.trackingNumber;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Summary</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.label}
                </span>
            </div>

            <div className="px-5 py-4 space-y-3">
                {/* Order ID */}
                <div className="flex items-center gap-3">
                    <Tag size={14} className="text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Order ID</p>
                        <p className="text-sm font-semibold text-gray-900 font-mono">{data.orderId}</p>
                    </div>
                </div>

                {/* Carrier */}
                <div className="flex items-center gap-3">
                    <Truck size={14} className="text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Carrier</p>
                        <p className="text-sm font-semibold text-gray-900">{data.carrier || 'DHL'}</p>
                    </div>
                </div>

                {/* Tracking number with copy */}
                {data.trackingNumber && (
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 flex-shrink-0" /> {/* spacer to align with icons above */}
                        <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Tracking Number</p>
                                <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{data.trackingNumber}</p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={handleCopy}
                                    aria-label="Copy tracking number"
                                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
                                >
                                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                                </button>
                                {copied && (
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-gray-900 text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
                                        Copied!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Estimated delivery */}
                {data.estimatedDelivery && (
                    <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Estimated Delivery</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDeliveryDate(data.estimatedDelivery)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
