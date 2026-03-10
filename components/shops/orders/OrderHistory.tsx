'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { orderRepository } from '@/lib/firestore';
import { UserOrder } from '@/types';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTrackingModal } from './OrderTrackingModal';
import { OrderDataValidator } from '@/lib/utils/order-utils';

export function OrderHistory()
{
  const { user } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() =>
  {
    if (user?.uid)
    {
      loadOrders();
    }
  }, [user]);

  useEffect(() =>
  {
    filterOrders();
  }, [orders, selectedStatus, searchTerm]);

  const loadOrders = async () =>
  {
    if (!user?.uid)
    {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try
    {
      setLoading(true);
      setError(null);

      const rawOrders = await orderRepository.getByUserId(user.uid);

      // Validate and sanitize order data
      const validatedOrders = OrderDataValidator.validateOrders(rawOrders);

      if (validatedOrders.length !== rawOrders.length)
      {
        console.warn(`Filtered out ${rawOrders.length - validatedOrders.length} invalid orders`);
      }

      setOrders(validatedOrders);
    } catch (err)
    {
      console.error('Error loading orders:', err);
      const errorMessage = err instanceof Error
        ? `Failed to load orders: ${err.message}`
        : 'Failed to load orders. Please try again.';
      setError(errorMessage);
    } finally
    {
      setLoading(false);
    }
  };

  const filterOrders = () =>
  {
    try
    {
      let filtered = [...orders];

      // Filter by status
      if (selectedStatus !== 'all')
      {
        filtered = filtered.filter(order =>
        {
          const status = OrderDataValidator.getOrderStatus(order);
          return status === selectedStatus;
        });
      }

      // Filter by search term
      if (searchTerm)
      {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(order =>
        {
          const title = order.title?.toLowerCase() || '';
          const orderId = order.order_id?.toLowerCase() || '';
          const tailorName = order.tailor_name?.toLowerCase() || '';

          return title.includes(term) ||
            orderId.includes(term) ||
            tailorName.includes(term);
        });
      }

      setFilteredOrders(filtered);
    } catch (err)
    {
      console.error('Error filtering orders:', err);
      // Fallback to showing all orders if filtering fails
      setFilteredOrders(orders);
    }
  };

  const getOrderStats = () =>
  {
    try
    {
      const stats = {
        total: orders.length,
        pending: orders.filter(o => OrderDataValidator.getOrderStatus(o) === 'pending').length,
        processing: orders.filter(o => OrderDataValidator.getOrderStatus(o) === 'processing').length,
        shipped: orders.filter(o => OrderDataValidator.getOrderStatus(o) === 'shipped').length,
        delivered: orders.filter(o => OrderDataValidator.getOrderStatus(o) === 'delivered').length,
        cancelled: orders.filter(o => OrderDataValidator.getOrderStatus(o) === 'cancelled').length,
      };
      return stats;
    } catch (err)
    {
      console.error('Error calculating order stats:', err);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error)
  {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadOrders}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      {/* Order Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        orderCount={filteredOrders.length}
      />

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-6">
            {selectedStatus === 'all'
              ? "You haven't placed any orders yet."
              : `No orders with status "${selectedStatus}" found.`}
          </p>
          <button
            onClick={() =>
            {
              setSelectedStatus('all');
              setSearchTerm('');
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id || order.order_id} order={order} onTrackOrder={handleTrackOrder} />
          ))}
        </div>
      )}

      {/* Order Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <OrderTrackingModal
          order={selectedOrder}
          onClose={handleCloseTracking}
        />
      )}
    </div>
  );
}