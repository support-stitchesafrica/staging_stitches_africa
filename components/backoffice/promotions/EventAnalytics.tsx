/**
 * Event Analytics Component
 * 
 * Displays analytics and performance metrics for promotional events.
 * Shows event statistics, product performance, and engagement metrics.
 * 
 * Requirements: 11.3, 12.3, 12.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  ShoppingCart,
  Eye,
  Clock,
  Target,
  DollarSign,
  Package,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { PromotionalEvent } from '@/types/promotionals';
import DashboardCard from '@/components/backoffice/DashboardCard';
import StatsCard from '@/components/backoffice/StatsCard';

/**
 * Analytics data interface
 */
interface EventAnalyticsData {
  totalEvents: number;
  activeEvents: number;
  scheduledEvents: number;
  expiredEvents: number;
  totalProducts: number;
  averageDiscount: number;
  publishedEvents: number;
  draftEvents: number;
}

/**
 * Event performance metrics
 */
interface EventPerformance {
  eventId: string;
  eventName: string;
  status: string;
  productsCount: number;
  averageDiscount: number;
  isPublished: boolean;
  daysRemaining: number;
  startDate: Date;
  endDate: Date;
}

export default function EventAnalytics() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();

  // State
  const [events, setEvents] = useState<PromotionalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Permissions
  const canRead = hasPermission('promotions', 'read');

  /**
   * Load events data
   */
  const loadEvents = useCallback(async () => {
    if (!backOfficeUser || !canRead) return;

    try {
      setLoading(true);
      
      // Load user events (or all events for admin/superadmin)
      const eventsList = await PromotionalEventService.getUserEvents(backOfficeUser.uid);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events for analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [backOfficeUser, canRead]);

  /**
   * Refresh analytics data
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  }, [loadEvents]);

  /**
   * Calculate analytics data
   */
  const analyticsData = useMemo((): EventAnalyticsData => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'active').length;
    const scheduledEvents = events.filter(e => e.status === 'scheduled').length;
    const expiredEvents = events.filter(e => e.status === 'expired').length;
    const publishedEvents = events.filter(e => e.isPublished).length;
    const draftEvents = events.filter(e => e.status === 'draft').length;

    const totalProducts = events.reduce((sum, event) => sum + (event.products?.length || 0), 0);
    
    const totalDiscounts = events.reduce((sum, event) => {
      const eventDiscounts = event.products?.reduce((eventSum, product) => 
        eventSum + product.discountPercentage, 0) || 0;
      return sum + eventDiscounts;
    }, 0);
    
    const averageDiscount = totalProducts > 0 ? totalDiscounts / totalProducts : 0;

    return {
      totalEvents,
      activeEvents,
      scheduledEvents,
      expiredEvents,
      totalProducts,
      averageDiscount,
      publishedEvents,
      draftEvents,
    };
  }, [events]);

  /**
   * Calculate event performance metrics
   */
  const eventPerformance = useMemo((): EventPerformance[] => {
    return events.map(event => {
      const startDate = event.startDate.toDate ? event.startDate.toDate() : new Date(event.startDate);
      const endDate = event.endDate.toDate ? event.endDate.toDate() : new Date(event.endDate);
      const now = new Date();
      
      let daysRemaining = 0;
      if (event.status === 'scheduled') {
        daysRemaining = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else if (event.status === 'active') {
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      const productsCount = event.products?.length || 0;
      const averageDiscount = productsCount > 0 
        ? event.products!.reduce((sum, p) => sum + p.discountPercentage, 0) / productsCount 
        : 0;

      return {
        eventId: event.id,
        eventName: event.name,
        status: event.status,
        productsCount,
        averageDiscount,
        isPublished: event.isPublished,
        daysRemaining,
        startDate,
        endDate,
      };
    }).sort((a, b) => {
      // Sort by status priority: active > scheduled > draft > expired
      const statusPriority = { active: 4, scheduled: 3, draft: 2, expired: 1 };
      return (statusPriority[b.status as keyof typeof statusPriority] || 0) - 
             (statusPriority[a.status as keyof typeof statusPriority] || 0);
    });
  }, [events]);

  /**
   * Calculate trends (mock data for now - would need historical data)
   */
  const trends = useMemo(() => {
    // In a real implementation, you would compare with previous period
    return {
      eventsChange: 12.5, // +12.5% vs last month
      productsChange: 8.3, // +8.3% vs last month
      discountChange: -2.1, // -2.1% vs last month (lower is better for business)
      publishedChange: 15.7, // +15.7% vs last month
    };
  }, []);

  /**
   * Format date for display
   */
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, []);

  /**
   * Get status color
   */
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (!canRead) {
    return (
      <div className="space-y-6">
        <DashboardCard>
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              You do not have permission to view promotional analytics.
            </p>
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Promotional Analytics</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track performance and insights for your promotional events
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          value={analyticsData.totalEvents}
          label="Total Events"
          icon={Calendar}
          change={trends.eventsChange}
          changeLabel="vs last month"
          variant="primary"
        />
        <StatsCard
          value={analyticsData.activeEvents}
          label="Active Events"
          icon={Activity}
          variant="success"
        />
        <StatsCard
          value={analyticsData.totalProducts}
          label="Total Products"
          icon={Package}
          change={trends.productsChange}
          changeLabel="vs last month"
          variant="purple"
        />
        <StatsCard
          value={`${analyticsData.averageDiscount.toFixed(1)}%`}
          label="Avg. Discount"
          icon={Target}
          change={trends.discountChange}
          changeLabel="vs last month"
          variant="warning"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          value={analyticsData.publishedEvents}
          label="Published Events"
          icon={Eye}
          change={trends.publishedChange}
          changeLabel="vs last month"
          variant="success"
        />
        <StatsCard
          value={analyticsData.scheduledEvents}
          label="Scheduled Events"
          icon={Clock}
          variant="secondary"
        />
        <StatsCard
          value={analyticsData.draftEvents}
          label="Draft Events"
          icon={Calendar}
          variant="secondary"
        />
        <StatsCard
          value={analyticsData.expiredEvents}
          label="Expired Events"
          icon={Calendar}
          variant="secondary"
        />
      </div>

      {/* Event Performance Table */}
      <DashboardCard
        title="Event Performance"
        description="Detailed breakdown of all promotional events"
        icon={BarChart3}
      >
        {eventPerformance.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600">
              Create your first promotional event to see analytics data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Event Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Products</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avg. Discount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Published</th>
                </tr>
              </thead>
              <tbody>
                {eventPerformance.map((event) => (
                  <tr key={event.eventId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{event.eventName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{event.productsCount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span>{event.averageDiscount.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        {event.daysRemaining > 0 && (
                          <div className="text-xs text-blue-600">
                            {event.daysRemaining} days {event.status === 'scheduled' ? 'until start' : 'remaining'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {event.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">No</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Performance Insights"
          icon={TrendingUp}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Active Events
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {analyticsData.activeEvents}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Scheduled Events
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {analyticsData.scheduledEvents}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  Published Rate
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {analyticsData.totalEvents > 0 
                  ? Math.round((analyticsData.publishedEvents / analyticsData.totalEvents) * 100)
                  : 0
                }%
              </span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Quick Actions"
          icon={Activity}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Common tasks and recommendations based on your events.
            </p>

            {analyticsData.draftEvents > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Draft Events</span>
                </div>
                <p className="text-sm text-yellow-700">
                  You have {analyticsData.draftEvents} draft event{analyticsData.draftEvents !== 1 ? 's' : ''} that can be published.
                </p>
              </div>
            )}

            {analyticsData.scheduledEvents > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Upcoming Events</span>
                </div>
                <p className="text-sm text-blue-700">
                  {analyticsData.scheduledEvents} event{analyticsData.scheduledEvents !== 1 ? 's' : ''} scheduled to start soon.
                </p>
              </div>
            )}

            {analyticsData.totalEvents === 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-gray-800 mb-1">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Get Started</span>
                </div>
                <p className="text-sm text-gray-700">
                  Create your first promotional event to start tracking analytics.
                </p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
