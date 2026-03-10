'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StandardProtectedRoute } from '@/components/shops/auth/RouteProtectionComponents';
import { OrderList } from '@/components/shops/orders/OrderList';
import { OrderTrackingModal } from '@/components/shops/orders/OrderTrackingModal';
import { UserOrder } from '@/types';
import { userOrderRepository } from '@/lib/firestore';
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
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  const handleCloseTracking = () =>
  {
    setSelectedOrder(null);
    setShowTrackingModal(false);
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
          />
        )}
      </div>
    </div>
  );
}