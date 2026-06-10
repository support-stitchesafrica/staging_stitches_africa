'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { getAllTailorOrders, TailorOrder } from '@/vendor-services/TailorOrderService';
import { Timestamp } from 'firebase/firestore';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: Timestamp | string): string
{
    if (typeof ts === 'string') return new Date(ts).toLocaleDateString();
    return ts.toDate().toLocaleDateString();
}

function getCustomerName(order: TailorOrder): string
{
    const { first_name, last_name } = order.user_address ?? {};
    if (first_name || last_name) return `${first_name ?? ''} ${last_name ?? ''}`.trim();
    return order.user_id;
}

// ─── Unauthorized fallback ───────────────────────────────────────────────────

function UnauthorizedAccess()
{
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center max-w-md mx-auto p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">You don&apos;t have permission to access vendor orders.</p>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastProps
{
    message: string;
    onClose: () => void;
}

function ErrorToast({ message, onClose }: ToastProps)
{
    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <span className="text-sm">{message}</span>
            <button onClick={onClose} className="ml-auto text-white hover:text-red-200 text-lg leading-none">&times;</button>
        </div>
    );
}

// ─── Main content ────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'unpaid' | 'paid';

function VendorOrdersContent()
{
    const { user, hasPermission } = useBackOfficeAuth();
    const canWrite = hasPermission('marketing', 'write');

    const [orders, setOrders] = useState<TailorOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const [filter, setFilter] = useState<FilterStatus>('all');
    const [search, setSearch] = useState('');

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [markingPaid, setMarkingPaid] = useState<string | null>(null); // orderId being processed

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchOrders = useCallback(async () =>
    {
        setLoading(true);
        setFetchError(false);
        try
        {
            const data = await getAllTailorOrders();
            setOrders(data);
        } catch
        {
            setFetchError(true);
        } finally
        {
            setLoading(false);
        }
    }, []);

    useEffect(() =>
    {
        fetchOrders();
    }, [fetchOrders]);

    // ── Filter + search (client-side) ──────────────────────────────────────────

    const visible = orders.filter((o) =>
    {
        if (filter !== 'all' && o.payment_status !== filter) return false;
        if (search.trim())
        {
            const q = search.trim().toLowerCase();
            if (!o.order_id.toLowerCase().includes(q) && !o.tailor_name.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    // ── Mark as paid ───────────────────────────────────────────────────────────

    const handleMarkPaid = async (order: TailorOrder) =>
    {
        if (!user) return;
        const key = `${order.tailor_id}__${order.order_id}`;
        setMarkingPaid(key);
        try
        {
            const token = await user.getIdToken();
            const res = await fetch(
                `/api/marketing/vendor-orders/${order.tailor_id}/${order.order_id}/mark-paid`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok)
            {
                // Optimistic update
                setOrders((prev) =>
                    prev.map((o) =>
                        o.order_id === order.order_id && o.tailor_id === order.tailor_id
                            ? { ...o, payment_status: 'paid' }
                            : o
                    )
                );
            } else
            {
                const body = await res.json().catch(() => ({}));
                setToastMessage(body?.error ?? `Failed to mark order as paid (${res.status})`);
            }
        } catch
        {
            setToastMessage('Network error — could not mark order as paid.');
        } finally
        {
            setMarkingPaid(null);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    if (loading)
    {
        return (
            <div className="p-6 flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (fetchError)
    {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
                <p className="text-gray-600">Failed to load vendor orders.</p>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Vendor Orders</h1>
                <p className="text-gray-600">All tailor orders across the platform</p>
            </div>

            {/* Filter bar + search */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                {/* Status filter */}
                <div className="flex gap-2">
                    {(['all', 'unpaid', 'paid'] as FilterStatus[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative md:ml-auto">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order ID or tailor name…"
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-72"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Order ID', 'Tailor', 'Product', 'Customer', 'Qty', 'Price', 'Payment', 'Date', ...(canWrite ? ['Action'] : [])].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={canWrite ? 9 : 8} className="px-4 py-10 text-center text-gray-500 text-sm">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            visible.map((order) =>
                            {
                                const rowKey = `${order.tailor_id}__${order.order_id}`;
                                const isPaid = order.payment_status === 'paid';
                                const isProcessing = markingPaid === rowKey;

                                return (
                                    <tr key={rowKey} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-mono whitespace-nowrap">{order.order_id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{order.tailor_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 max-w-[160px] truncate">{order.title}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{getCustomerName(order)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{order.quantity}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">${order.price.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${isPaid
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {order.timestamp ? formatDate(order.timestamp) : '—'}
                                        </td>
                                        {canWrite && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => handleMarkPaid(order)}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isProcessing ? 'Saving…' : 'Mark as Paid'}
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Toast */}
            {toastMessage && (
                <ErrorToast message={toastMessage} onClose={() => setToastMessage(null)} />
            )}
        </div>
    );
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function VendorOrdersPage()
{
    return (
        <PermissionGuard department="marketing" permission="read" fallback={<UnauthorizedAccess />}>
            <VendorOrdersContent />
        </PermissionGuard>
    );
}
