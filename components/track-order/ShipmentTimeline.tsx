'use client';

import React from 'react';
import { MapPin, Clock, CheckCircle2, Truck, Package, AlertCircle, Navigation } from 'lucide-react';
import { TrackingEvent } from '@/types/track-order';

// DHL type code → label + colour + icon (mirrors OrderTrackingModal)
const DHL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    OK: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-500', icon: 'check' },
    PU: { label: 'Picked Up', color: 'text-blue-700', bg: 'bg-blue-500', icon: 'package' },
    PL: { label: 'Processed at Facility', color: 'text-blue-600', bg: 'bg-blue-400', icon: 'package' },
    AF: { label: 'Arrived at Facility', color: 'text-indigo-700', bg: 'bg-indigo-500', icon: 'location' },
    AR: { label: 'Arrived for Delivery', color: 'text-violet-700', bg: 'bg-violet-500', icon: 'location' },
    DF: { label: 'Departed Facility', color: 'text-sky-700', bg: 'bg-sky-500', icon: 'truck' },
    WC: { label: 'With Delivery Courier', color: 'text-orange-700', bg: 'bg-orange-500', icon: 'truck' },
    SA: { label: 'Shipment Accepted', color: 'text-teal-700', bg: 'bg-teal-500', icon: 'package' },
    ND: { label: 'Not Delivered', color: 'text-red-700', bg: 'bg-red-500', icon: 'alert' },
    NH: { label: 'Not Home', color: 'text-amber-700', bg: 'bg-amber-500', icon: 'alert' },
    OH: { label: 'On Hold', color: 'text-yellow-700', bg: 'bg-yellow-500', icon: 'clock' },
    RT: { label: 'Transfer Recorded', color: 'text-purple-700', bg: 'bg-purple-500', icon: 'truck' },
    IC: { label: 'In Clearance', color: 'text-cyan-700', bg: 'bg-cyan-500', icon: 'clock' },
};

function getStatusConfig(typeCode?: string | null)
{
    if (!typeCode) return { label: 'In Transit', color: 'text-gray-600', bg: 'bg-gray-400', icon: 'clock' };
    return DHL_STATUS_CONFIG[typeCode] ?? { label: typeCode, color: 'text-gray-600', bg: 'bg-gray-400', icon: 'clock' };
}

function EventIcon({ type, size = 14 }: { type: string; size?: number })
{
    const cls = { size, className: 'text-white' };
    switch (type)
    {
        case 'check': return <CheckCircle2 {...cls} />;
        case 'truck': return <Truck {...cls} />;
        case 'package': return <Package {...cls} />;
        case 'alert': return <AlertCircle {...cls} />;
        case 'location': return <Navigation {...cls} />;
        default: return <Clock {...cls} />;
    }
}

// Sort events newest-first using the ISO occurredAt field
export function sortEventsNewestFirst(events: TrackingEvent[]): TrackingEvent[]
{
    return [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function formatOccurredAt(iso: string): string
{
    if (!iso) return '';
    try
    {
        return new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
        });
    } catch
    {
        return iso;
    }
}

interface ShipmentTimelineProps
{
    events: TrackingEvent[];
    loading: boolean;
}

export function ShipmentTimeline({ events, loading }: ShipmentTimelineProps)
{
    const sorted = sortEventsNewestFirst(events);

    if (loading)
    {
        return (
            <div className="space-y-3 px-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-2 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (sorted.length === 0)
    {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Package size={36} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Tracking information not available yet</p>
                <p className="text-xs text-gray-400 mt-1">Check back once your order has been shipped.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tracking History
            </p>
            <div className="space-y-0">
                {sorted.map((event, idx) =>
                {
                    const cfg = getStatusConfig(event.typeCode);
                    const isFirst = idx === 0;
                    const isLast = idx === sorted.length - 1;

                    return (
                        <div key={idx} className="flex gap-3">
                            {/* Timeline spine */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isFirst ? cfg.bg : 'bg-gray-200'}`}
                                >
                                    <EventIcon type={isFirst ? cfg.icon : 'clock'} size={14} />
                                </div>
                                {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[20px]" />}
                            </div>

                            {/* Event card */}
                            <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-4'}`}>
                                <div
                                    className={`rounded-xl p-3 border transition-all ${isFirst ? 'bg-gray-50 border-gray-200 shadow-sm' : 'bg-white border-gray-100'}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium leading-snug ${isFirst ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {event.description}
                                            </p>
                                            {event.location && (
                                                <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <MapPin size={10} className="flex-shrink-0" />
                                                    {event.location}
                                                </p>
                                            )}
                                        </div>
                                        {isFirst && (
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} text-white`}>
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        {formatOccurredAt(event.occurredAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
