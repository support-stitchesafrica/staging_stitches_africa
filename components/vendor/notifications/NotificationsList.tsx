'use client';

import { useState } from 'react';
import { VendorNotification } from '@/types/vendor-analytics';
import { AlertCard } from './AlertCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  BellOff,
  Package,
  DollarSign,
  TrendingDown,
  Star,
  Trophy,
  CheckCheck,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationsListProps {
  notifications: VendorNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  loading?: boolean;
}

export function NotificationsList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  loading = false
}: NotificationsListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | string>('all');

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    return notification.category === activeTab;
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Count by category
  const categoryCounts = {
    stock: notifications.filter(n => n.category === 'stock').length,
    payout: notifications.filter(n => n.category === 'payout').length,
    performance: notifications.filter(n => n.category === 'performance').length,
    ranking: notifications.filter(n => n.category === 'ranking').length,
    milestone: notifications.filter(n => n.category === 'milestone').length
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stock':
        return <Package className="h-4 w-4" />;
      case 'payout':
        return <DollarSign className="h-4 w-4" />;
      case 'performance':
        return <TrendingDown className="h-4 w-4" />;
      case 'ranking':
        return <Star className="h-4 w-4" />;
      case 'milestone':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-32 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
          </div>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-sm"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            <Filter className="h-4 w-4 mr-2" />
            All
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
              {notifications.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="unread"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            <BellOff className="h-4 w-4 mr-2" />
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="stock"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            {getCategoryIcon('stock')}
            <span className="ml-2">Stock</span>
            {categoryCounts.stock > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {categoryCounts.stock}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="payout"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            {getCategoryIcon('payout')}
            <span className="ml-2">Payouts</span>
            {categoryCounts.payout > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {categoryCounts.payout}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            {getCategoryIcon('performance')}
            <span className="ml-2">Performance</span>
            {categoryCounts.performance > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {categoryCounts.performance}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="ranking"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            {getCategoryIcon('ranking')}
            <span className="ml-2">Rankings</span>
            {categoryCounts.ranking > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {categoryCounts.ranking}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="milestone"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
          >
            {getCategoryIcon('milestone')}
            <span className="ml-2">Milestones</span>
            {categoryCounts.milestone > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {categoryCounts.milestone}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-600">
                {activeTab === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : activeTab === 'all'
                  ? "You don't have any notifications yet."
                  : `No ${activeTab} notifications at this time.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <AlertCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
