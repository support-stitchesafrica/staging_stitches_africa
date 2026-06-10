'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { UserOrder } from '@/types';
import
{
  X, Package, Truck, MapPin, Clock, CheckCircle2, AlertCircle,
  RefreshCw, ExternalLink, ChevronDown, ChevronUp, Navigation
} from 'lucide-react';
import { formatDate } from '@/lib/utils/order-utils';

interface OrderTrackingModalProps
{
  order: UserOrder;
  onClose: () => void;
  /** Called after a successful live DHL refresh so the parent can update its order list */
  onEventsRefreshed?: (orderId: string, events: any[]) => void;
}

// DHL type code → human label + color + icon
const DHL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: 'check' | 'truck' | 'package' | 'alert' | 'clock' | 'location' }> = {
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

function getStatusConfig(typeCode?: string)
{
  if (!typeCode) return { label: 'In Transit', color: 'text-gray-600', bg: 'bg-gray-400', icon: 'clock' as const };
  return DHL_STATUS_CONFIG[typeCode] ?? { label: typeCode, color: 'text-gray-600', bg: 'bg-gray-400', icon: 'clock' as const };
}

function StatusIcon({ type, size = 16 }: { type: string; size?: number })
{
  const props = { size, className: 'text-white' };
  switch (type)
  {
    case 'check': return <CheckCircle2 {...props} />;
    case 'truck': return <Truck {...props} />;
    case 'package': return <Package {...props} />;
    case 'alert': return <AlertCircle {...props} />;
    case 'location': return <Navigation {...props} />;
    default: return <Clock {...props} />;
  }
}

function formatEventDateTime(date?: string, time?: string): string
{
  if (!date) return '';
  try
  {
    const dt = time ? new Date(`${date}T${time}`) : new Date(date);
    return dt.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return date; }
}

function extractLocation(event: any): string
{
  if (!event) return '';
  if (Array.isArray(event.serviceArea) && event.serviceArea.length > 0)
  {
    return event.serviceArea.map((s: any) => s.description || s.code || '').filter(Boolean).join(', ');
  }
  if (event.location) return event.location;
  return '';
}

function sortEventsNewestFirst(events: any[]): any[]
{
  return [...events].sort((a, b) =>
  {
    const aKey = `${a?.date ?? ''}T${a?.time ?? ''}`;
    const bKey = `${b?.date ?? ''}T${b?.time ?? ''}`;
    return bKey.localeCompare(aKey);
  });
}

// High-level journey steps for the progress bar
const JOURNEY_STEPS = [
  { key: 'ordered', label: 'Order Placed', codes: [] as string[] },
  { key: 'accepted', label: 'Accepted', codes: ['SA', 'PU'] },
  { key: 'transit', label: 'In Transit', codes: ['PL', 'AF', 'DF', 'AR', 'RT', 'IC'] },
  { key: 'delivery', label: 'Out for Delivery', codes: ['WC'] },
  { key: 'delivered', label: 'Delivered', codes: ['OK'] },
];

function getJourneyStep(events: any[]): number
{
  if (!events.length) return 0;
  const codes = new Set(events.map((e: any) => e.typeCode));
  for (let i = JOURNEY_STEPS.length - 1; i >= 0; i--)
  {
    if (JOURNEY_STEPS[i].codes.some(c => codes.has(c))) return i;
  }
  return 0;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose, onEventsRefreshed }) =>
{
  const [liveEvents, setLiveEvents] = useState<any[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  // Use live events if refreshed, otherwise fall back to Firestore snapshot
  const rawEvents: any[] = liveEvents ?? order.dhl_events_snapshot ?? [];
  const events = sortEventsNewestFirst(rawEvents);
  const latestEvent = events[0];
  const packages = order.packages ?? (order as any).shipping?.packages ?? [];
  // shipmentTrackingNumber = the shipment-level ID (used in the URL path)
  const shipmentTrackingNumber = (order as any).shipping?.shipmentTrackingNumber
    ?? (order as any).dhl_shipment?.shipmentTrackingNumber;
  // pieceTrackingNumber = the package-level barcode (JD...) — what DHL events are tied to
  const pieceTrackingNumber = packages[0]?.trackingNumber;
  // Use piece tracking number as the primary display; fall back to shipment number
  const trackingNumber = shipmentTrackingNumber ?? pieceTrackingNumber;
  const currentStep = getJourneyStep(events);
  const isDelivered = latestEvent?.typeCode === 'OK';
  const shouldHideLocation = latestEvent?.deliveryType === 'custom';

  console.log('order debug', order);
  console.log('latestEvent debug', latestEvent);


  const handleRefresh = useCallback(async () =>
  {
    if (!trackingNumber) return;
    setRefreshing(true);
    setRefreshError(null);
    try
    {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();

      // Pass Firestore doc ID + userId so the route saves back to the DB
      const qs = new URLSearchParams();
      if (order.id) qs.set('orderId', order.id);
      if (order.user_id) qs.set('userId', order.user_id);
      // Pass piece tracking number so the backend can query per-package events
      if (pieceTrackingNumber) qs.set('pieceTrackingNumber', pieceTrackingNumber);

      const res = await fetch(`/api/shops/track-order/${trackingNumber}?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // notReady means DHL hasn't scanned the package yet
      if (data.notReady)
      {
        setRefreshError(data.error ?? 'Tracking not available yet. Check back after pickup.');
        return;
      }
      // Route returns { events, latestEvent, saved }
      const shipmentEvents = data?.events ?? [];
      if (shipmentEvents.length > 0)
      {
        setLiveEvents(shipmentEvents);
        // Notify parent so the orders list reflects the fresh snapshot
        if (order.id) onEventsRefreshed?.(order.id, shipmentEvents);
      }
      else setRefreshError('No tracking events yet. DHL will update once the package is collected.');
    } catch (e: any)
    {
      setRefreshError(e.message ?? 'Failed to refresh tracking.');
    } finally
    {
      setRefreshing(false);
    }
  }, [trackingNumber, order.id, order.user_id]);

  // Auto-fetch on open when there's a tracking number — always fetch live so customers see the latest DHL events
  useEffect(() =>
  {
    if (trackingNumber)
    {
      handleRefresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleEvents = showAll ? events : events.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Track Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">#{order.order_id} · {order.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {trackingNumber && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50"
                title="Refresh tracking"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Journey Progress Bar */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between relative">
              {/* connecting line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-black z-0 transition-all duration-700"
                style={{ width: `${(currentStep / (JOURNEY_STEPS.length - 1)) * (100 - 8)}%` }}
              />
              {JOURNEY_STEPS.map((step, i) =>
              {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center z-10 gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done
                      ? active
                        ? 'bg-black border-black shadow-lg scale-110'
                        : 'bg-black border-black'
                      : 'bg-white border-gray-300'
                      }`}>
                      {done
                        ? <CheckCircle2 size={14} className="text-white" />
                        : <div className="w-2 h-2 rounded-full bg-gray-300" />
                      }
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight max-w-[52px] ${done ? 'text-gray-900' : 'text-gray-400'
                      }`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status Banner */}
          {latestEvent ? (
            <div className={`mx-5 mb-4 rounded-xl p-4 ${isDelivered ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusConfig(latestEvent.typeCode).bg}`}>
                  <StatusIcon type={getStatusConfig(latestEvent.typeCode).icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${getStatusConfig(latestEvent.typeCode).color}`}>
                    {getStatusConfig(latestEvent.typeCode).label}
                  </p>
                  <p className="text-gray-700 text-sm mt-0.5 leading-snug">{latestEvent.description}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                    {!shouldHideLocation && extractLocation(latestEvent) && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} /> {extractLocation(latestEvent)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} /> {formatEventDateTime(latestEvent.date, latestEvent.time)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-5 mb-4 space-y-3">
              {/* Order status */}
              <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-amber-800 capitalize">{order.order_status || 'Pending'}</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {order.order_status === 'pending'
                        ? 'Your order has been placed and is awaiting processing by the vendor.'
                        : order.order_status === 'processing'
                          ? 'Your order is being prepared by the vendor.'
                          : 'DHL tracking will appear here once your order is shipped.'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Delivery date if available */}
              {order.delivery_date && (
                <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-600">
                    Expected delivery: <span className="font-medium text-gray-900">{formatDate(order.delivery_date)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tracking Number + DHL Link */}
          {/* {trackingNumber && (
            <div className="mx-5 mb-4 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <div>
                <p className="text-xs text-gray-500 font-medium">DHL Tracking Number</p>
                <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{trackingNumber}</p>              </div>
              <a
                href={packages[0]?.trackingUrl ?? (order as any).shipping?.trackingUrl ?? `https://www.dhl.com/ng-en/home/tracking/tracking-express.html?submit=1&tracking-id=${pieceTrackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-black bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                DHL Site <ExternalLink size={12} />
              </a>
            </div>
          )} */}

          {/* Refresh error */}
          {refreshError && (
            <p className="mx-5 mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {refreshError}
            </p>
          )}

          {/* Timeline */}
          {events.length > 0 && (
            <div className="px-5 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tracking History</p>
              <div className="space-y-0">
                {visibleEvents.map((event, idx) =>
                {
                  const cfg = getStatusConfig(event.typeCode);
                  const isFirst = idx === 0;
                  const isLast = idx === visibleEvents.length - 1;
                  const location = extractLocation(event);
                  return (
                    <div key={idx} className="flex gap-3">
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isFirst ? cfg.bg : 'bg-gray-200'
                          }`}>
                          <StatusIcon type={isFirst ? cfg.icon : 'clock'} size={14} />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[20px]" />}
                      </div>

                      {/* Event content */}
                      <div className={`flex-1 pb-4 ${isLast ? 'pb-2' : ''}`}>
                        <div className={`rounded-xl p-3 border transition-all ${isFirst
                          ? 'bg-gray-50 border-gray-200 shadow-sm'
                          : 'bg-white border-gray-100'
                          }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-snug ${isFirst ? 'text-gray-900' : 'text-gray-700'}`}>
                                {event.description}
                              </p>
                              {!shouldHideLocation && location && (
                                <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <MapPin size={10} className="flex-shrink-0" /> {location}
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
                            {formatEventDateTime(event.date, event.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {events.length > 5 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 py-2.5 hover:text-gray-900 transition-colors"
                >
                  {showAll ? (
                    <><ChevronUp size={14} /> Show less</>
                  ) : (
                    <><ChevronDown size={14} /> Show {events.length - 5} more events</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Delivery Address */}
          <div className="mx-5 mb-5 mt-2 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <MapPin size={12} /> Delivery Address
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {order.user_address.first_name} {order.user_address.last_name}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">{order.user_address.street_address}</p>
            <p className="text-sm text-gray-600">
              {order.user_address.city}, {order.user_address.state}
              {order.user_address.post_code ? ` ${order.user_address.post_code}` : ''}
            </p>
            <p className="text-sm text-gray-600">{order.user_address.country}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {liveEvents ? 'Live data' : 'Last synced automatically'}
            {trackingNumber && ' · Updates every 2 hours'}
          </p>
          <div className="flex items-center gap-2">
            {trackingNumber && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
