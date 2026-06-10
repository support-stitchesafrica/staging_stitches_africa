'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import
    {
        Search, RefreshCw, AlertCircle, ToggleLeft, ToggleRight,
        Package, Truck, MapPin, Clock, Shield, Zap, Globe,
        ChevronRight, ArrowRight, CheckCircle2, XCircle, Info,
    } from 'lucide-react';
import { SanitisedResponse, SearchMode } from '@/types/track-order';
import { OrderSummaryCard } from './OrderSummaryCard';
import { ShipmentTimeline } from './ShipmentTimeline';
import { ProgressIndicator } from './ProgressIndicator';

interface TrackOrderPageProps
{
    initialOrderId?: string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ResultSkeleton()
{
    return (
        <div className="space-y-4 animate-pulse">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-2 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Feature pills shown before any search ─────────────────────────────────────
const FEATURES = [
    { icon: Zap, label: 'Real-time updates', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Shield, label: 'Secure & private', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Globe, label: 'DHL worldwide', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Clock, label: 'Live notifications', color: 'text-purple-600', bg: 'bg-purple-50' },
];

// ── How it works steps ────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
    { icon: Package, title: 'Enter Order ID', desc: 'Type your Stitches Africa order number' },
    { icon: Search, title: 'We fetch live data', desc: 'We query DHL in real time for you' },
    { icon: MapPin, title: 'See your shipment', desc: 'Full timeline, location & ETA' },
];

// ── Main component ─────────────────────────────────────────────────────────────
export function TrackOrderPage({ initialOrderId }: TrackOrderPageProps)
{
    const [inputValue, setInputValue] = useState(initialOrderId ?? '');
    const [searchMode, setSearchMode] = useState<SearchMode>('orderId');
    const [result, setResult] = useState<SanitisedResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const unsubscribeRef = useRef<(() => void) | null>(null);

    const clearSnapshot = useCallback(() =>
    {
        if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
    }, []);

    const subscribeToDoc = useCallback(async (docPath: string) =>
    {
        clearSnapshot();
        try
        {
            const { getFirebaseDb } = await import('@/lib/firebase');
            const db = await getFirebaseDb();
            const { doc, onSnapshot } = await import('firebase/firestore');
            const unsub = onSnapshot(doc(db, docPath), (snap) =>
            {
                if (!snap.exists()) return;
                const d = snap.data();
                setResult((prev) => prev ? {
                    ...prev,
                    status: d.order_status ?? prev.status,
                    events: (d.timeline ?? []).map((t: any) => ({
                        occurredAt: t.occurredAt ?? '',
                        typeCode: t.typeCode ?? null,
                        status: t.status ?? 'unknown',
                        description: t.description ?? '',
                        location: t.location ?? '',
                    })),
                    estimatedDelivery: d.delivery_date ?? prev.estimatedDelivery,
                    lastUpdated: d.last_update?.toDate?.()?.toISOString() ?? prev.lastUpdated,
                } : prev);
            });
            unsubscribeRef.current = unsub;
        } catch { /* non-fatal */ }
    }, [clearSnapshot]);

    const doSearch = useCallback(async (value: string, mode: SearchMode) =>
    {
        const trimmed = value.trim();
        if (!trimmed)
        {
            setValidationMsg(mode === 'orderId' ? 'Please enter an Order ID.' : 'Please enter a Tracking Number.');
            return;
        }
        setValidationMsg(null);
        setError(null);
        setResult(null);
        clearSnapshot();
        setLoading(true);
        setHasSearched(true);

        try
        {
            const param = mode === 'orderId' ? 'orderId' : 'trackingNumber';
            const res = await fetch(`/api/track-order?${param}=${encodeURIComponent(trimmed)}`);
            const json = await res.json();

            if (res.status === 404) { setError('Order not found. Please check your Order ID and try again.'); return; }
            if (res.status === 429) { setError('Too many requests. Please wait a moment and try again.'); return; }
            if (!res.ok) { setError('Something went wrong. Please try again.'); return; }

            setResult(json);
            if (json._docPath) subscribeToDoc(json._docPath);
        } catch
        {
            setError('Something went wrong. Please try again.');
        } finally
        {
            setLoading(false);
        }
    }, [clearSnapshot, subscribeToDoc]);

    const handleRefresh = useCallback(async () =>
    {
        if (!inputValue.trim() || refreshing) return;
        setRefreshing(true);
        setError(null);
        try
        {
            const param = searchMode === 'orderId' ? 'orderId' : 'trackingNumber';
            const res = await fetch(`/api/track-order?${param}=${encodeURIComponent(inputValue.trim())}`);
            const json = await res.json();
            if (res.ok) { setResult(json); if (json._docPath) subscribeToDoc(json._docPath); }
        } catch { /* silent */ } finally { setRefreshing(false); }
    }, [inputValue, searchMode, refreshing, subscribeToDoc]);

    useEffect(() =>
    {
        if (initialOrderId?.trim()) doSearch(initialOrderId.trim(), 'orderId');
        return () => clearSnapshot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleSubmit(e: React.FormEvent) { e.preventDefault(); doSearch(inputValue, searchMode); }

    function handleModeToggle()
    {
        const next: SearchMode = searchMode === 'orderId' ? 'trackingNumber' : 'orderId';
        setSearchMode(next); setInputValue(''); setResult(null);
        setError(null); setValidationMsg(null); clearSnapshot(); setHasSearched(false);
    }

    const placeholder = searchMode === 'orderId' ? 'e.g. STITCH-2026-001' : 'e.g. JD014600006281234567';
    const inputLabel = searchMode === 'orderId' ? 'Order ID' : 'DHL Tracking Number';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">

            {/* ── Hero banner ─────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-black">
                {/* decorative circles */}
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-4 py-14 text-center">
                    {/* badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-white/80 tracking-wide">Live Shipment Tracking</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
                        Track Your Order
                    </h1>
                    <p className="text-base text-white/60 mb-8 max-w-md mx-auto">
                        Get real-time updates on your Stitches Africa shipment — from our studio to your door.
                    </p>

                    {/* ── Search form ─────────────────────────────────────────────────── */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-3">
                        <div className="relative">
                            <label htmlFor="track-input" className="sr-only">{inputLabel}</label>
                            <div className={`flex items-center gap-2 bg-white rounded-2xl px-4 py-3.5 shadow-xl transition-all ${validationMsg ? 'ring-2 ring-red-400' : 'ring-0'}`}>
                                <Search size={18} className="text-gray-400 flex-shrink-0" />
                                <input
                                    id="track-input"
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => { setInputValue(e.target.value); if (validationMsg) setValidationMsg(null); }}
                                    placeholder={placeholder}
                                    aria-label={inputLabel}
                                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
                                >
                                    {loading ? (
                                        <><RefreshCw size={14} className="animate-spin" /> Searching…</>
                                    ) : (
                                        <><span>Track</span><ArrowRight size={14} /></>
                                    )}
                                </button>
                            </div>
                            {validationMsg && (
                                <p role="alert" className="mt-2 text-xs text-red-300 flex items-center gap-1 justify-center">
                                    <AlertCircle size={12} /> {validationMsg}
                                </p>
                            )}
                        </div>

                        {/* mode toggle */}
                        <button
                            type="button"
                            onClick={handleModeToggle}
                            className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors mx-auto"
                            aria-pressed={searchMode === 'trackingNumber'}
                        >
                            {searchMode === 'orderId'
                                ? <ToggleLeft size={16} />
                                : <ToggleRight size={16} className="text-emerald-400" />}
                            {searchMode === 'orderId'
                                ? 'Switch to DHL Tracking Number search'
                                : 'Switch to Order ID search'}
                        </button>
                    </form>

                    {/* feature pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                        {FEATURES.map(({ icon: Icon, label, color, bg }) => (
                            <div key={label} className={`flex items-center gap-1.5 ${bg} rounded-full px-3 py-1.5`}>
                                <Icon size={12} className={color} />
                                <span className={`text-[11px] font-medium ${color}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content area ────────────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

                {/* Loading skeleton */}
                {loading && <ResultSkeleton />}

                {/* Error state */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5 flex items-start gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <XCircle size={20} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 mb-0.5">Tracking failed</p>
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                onClick={() => doSearch(inputValue, searchMode)}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <RefreshCw size={12} /> Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                {!loading && result && (
                    <div className="space-y-5">
                        {/* Live indicator bar */}
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-medium text-gray-600">Live tracking active</span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                                {refreshing ? 'Refreshing…' : 'Refresh'}
                            </button>
                        </div>

                        {/* Progress indicator */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-5 overflow-x-auto">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 px-1">
                                Shipment Progress
                            </p>
                            <ProgressIndicator status={result.status} events={result.events} />
                        </div>

                        {/* Order summary card */}
                        <OrderSummaryCard data={result} />

                        {/* Timeline */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5">
                            <ShipmentTimeline events={result.events} loading={false} />
                        </div>

                        {/* Info footer */}
                        <div className="flex items-start gap-2 text-xs text-gray-400 px-1">
                            <Info size={13} className="flex-shrink-0 mt-0.5" />
                            <span>Tracking data is sourced directly from DHL and updates automatically. Last refreshed just now.</span>
                        </div>
                    </div>
                )}

                {/* ── How it works — shown only before first search ─────────────────── */}
                {!hasSearched && !loading && (
                    <div className="space-y-6">
                        {/* How it works */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 text-center">
                                How it works
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
                                    <div key={title} className="relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow">
                                            {i + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                                            <Icon size={20} className="text-gray-700" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick tips */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={15} className="text-blue-500" />
                                <p className="text-sm font-semibold text-blue-800">Quick tips</p>
                            </div>
                            <ul className="space-y-2">
                                {[
                                    'Your Order ID looks like STITCH-2026-001 — find it in your confirmation email.',
                                    'DHL tracking numbers are 10–39 digits, e.g. JD014600006281234567.',
                                    'Use the toggle below the search bar to switch between Order ID and DHL number.',
                                    'The page updates automatically — no need to keep refreshing.',
                                ].map((tip) => (
                                    <li key={tip} className="flex items-start gap-2 text-xs text-blue-700">
                                        <ChevronRight size={12} className="flex-shrink-0 mt-0.5 text-blue-400" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Trust badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { icon: Shield, label: 'No login required', sub: 'Fully public' },
                                { icon: Zap, label: 'Instant results', sub: 'Under 2 seconds' },
                                { icon: CheckCircle2, label: 'DHL certified', sub: 'Official data' },
                                { icon: Globe, label: 'Worldwide tracking', sub: '220+ countries' },
                            ].map(({ icon: Icon, label, sub }) => (
                                <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
                                    <Icon size={20} className="text-gray-500 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-gray-800">{label}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
