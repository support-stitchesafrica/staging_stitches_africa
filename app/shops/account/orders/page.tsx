'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StandardProtectedRoute } from '@/components/shops/auth/RouteProtectionComponents';
import { OrderList } from '@/components/shops/orders/OrderList';
import { OrderTrackingModal } from '@/components/shops/orders/OrderTrackingModal';
import { UserOrder } from '@/types';
import { userOrderRepository } from '@/lib/firestore';
import { serverCacheManager, cacheKeys } from '@/lib/utils/server-cache-utils';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';
import { ArrowLeft } from 'lucide-react';

export default function OrdersPage()
{
  return (
    <StandardProtectedRoute>
      <OrdersContent />
    </StandardProtectedRoute>
  );
}

function OrdersContent()
{
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() =>
  {
    if (user?.uid)
    {
      loadOrders();
    }
  }, [user?.uid]);

  const loadOrders = async () =>
  {
    try
    {
      setLoading(true);
      setError(null);

      // Fetch user orders from Firestore
      const userOrders = await userOrderRepository.getUserOrders(user!.uid);

      // Sort orders by creation date (newest first)
      const sortedOrders = userOrders.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(sortedOrders);
    } catch (err)
    {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally
    {
      setLoading(false);
    }
  };

  const handleTrackOrder = (order: UserOrder) =>
  {
    // Some order items in the same order_id may hold DHL fields while others don't.
    // Merge tracking fields from sibling items so modal has initial snapshot data.
    const siblingItems = orders.filter((o) => o.order_id === order.order_id);
    const trackingSource = siblingItems.find(
      (o) =>
        (Array.isArray(o.dhl_events_snapshot) && o.dhl_events_snapshot.length > 0) ||
        !!o.last_dhl_event ||
        !!(o as any).shipping?.shipmentTrackingNumber ||
        (Array.isArray(o.packages) && o.packages.length > 0),
    );

    if (trackingSource)
    {
      setSelectedOrder({
        ...order,
        dhl_events_snapshot: trackingSource.dhl_events_snapshot || order.dhl_events_snapshot,
        last_dhl_event: trackingSource.last_dhl_event || order.last_dhl_event,
        shipping: trackingSource.shipping || order.shipping,
        packages: trackingSource.packages || order.packages,
      });
    } else
    {
      setSelectedOrder(order);
    }
    setShowTrackingModal(true);
  };

  const handleCloseTracking = () =>
  {
    setSelectedOrder(null);
    setShowTrackingModal(false);
  };

  /**
   * Called by the tracking modal after a successful live DHL refresh.
   * Patch the local orders list so the next "Track Order" click opens
   * with the freshly-fetched events, and bust the repo cache so the next
   * full page load also picks up the new data.
   */
  const handleEventsRefreshed = (docId: string, freshEvents: any[]) =>
  {
    // Invalidate the 30-second in-memory cache so the next loadOrders call hits Firestore
    if (user?.uid) serverCacheManager.delete(cacheKeys.orders(user.uid));

    // Patch the local orders array in-place
    setOrders((prev) =>
      prev.map((o) =>
        o.id === docId ? { ...o, dhl_events_snapshot: freshEvents } : o,
      ),
    );

    // Also update the currently-selected order so the modal's snapshot prop reflects the refresh
    setSelectedOrder((prev) =>
      prev?.id === docId ? { ...prev, dhl_events_snapshot: freshEvents } : prev,
    );
  };

  if (loading)
  {
    return (
      <div className="min-h-screen bg-white py-6 sm:py-8">
        <div className="container-responsive">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          <LoadingSkeleton variant="page" />
        </div>
      </div>
    );
  }

  if (error)
  {
    return (
      <div className="min-h-screen bg-white py-6 sm:py-8">
        <div className="container-responsive">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadOrders}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 sm:py-8">
      <div className="container-responsive">
        <div className="mb-8">
          <span
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">When you place orders, they'll appear here</p>
            <a
              href="/shops/products"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg  transition-colors"
            >
              Start Shopping
            </a>
          </div>
        ) : (
          <OrderList orders={orders} onTrackOrder={handleTrackOrder} />
        )}

        {/* Order Tracking Modal */}
        {showTrackingModal && selectedOrder && (
          <OrderTrackingModal
            order={selectedOrder}
            onClose={handleCloseTracking}
            onEventsRefreshed={handleEventsRefreshed}
          />
        )}
      </div>
    </div>
  );
}