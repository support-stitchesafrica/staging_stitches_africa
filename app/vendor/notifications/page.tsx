'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { NotificationsList } from '@/components/vendor/notifications/NotificationsList';
import { NotificationPreferences } from '@/components/vendor/notifications/NotificationPreferences';
import {
  Bell,
  Settings,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { NotificationService } from '@/lib/vendor/notification-service';
import { VendorNotification, NotificationPreferences as NotificationPreferencesType } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('tailorToken');
    const id = localStorage.getItem('tailorUID');
    
    if (!token) {
      router.push('/vendor');
      return;
    }
    
    setVendorId(id);
  }, [router]);

  // Fetch notifications and preferences
  useEffect(() => {
    if (!vendorId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const notificationService = new NotificationService();
        
        // Fetch notifications and preferences in parallel
        const [notificationsResponse, preferencesResponse] = await Promise.all([
          notificationService.getVendorNotifications(vendorId, { limit: 100 }),
          notificationService.getNotificationPreferences(vendorId)
        ]);

        if (notificationsResponse.success && notificationsResponse.data) {
          setNotifications(notificationsResponse.data);
        } else {
          toast.error(notificationsResponse.error?.message || 'Failed to load notifications');
        }

        if (preferencesResponse.success && preferencesResponse.data) {
          setPreferences(preferencesResponse.data);
        } else {
          toast.error(preferencesResponse.error?.message || 'Failed to load preferences');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendorId]);

  const handleRefresh = async () => {
    if (!vendorId) return;

    setRefreshing(true);
    try {
      const notificationService = new NotificationService();
      const response = await notificationService.getVendorNotifications(vendorId, { limit: 100 });
      
      if (response.success && response.data) {
        setNotifications(response.data);
        toast.success('Notifications refreshed');
      } else {
        toast.error('Failed to refresh notifications');
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      toast.error('Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!vendorId) return;

    try {
      const notificationService = new NotificationService();
      const response = await notificationService.markAsRead(notificationId, vendorId);
      
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        toast.success('Notification marked as read');
      } else {
        toast.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!vendorId) return;

    try {
      const notificationService = new NotificationService();
      const response = await notificationService.markAllAsRead(vendorId);
      
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        toast.success('All notifications marked as read');
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleSavePreferences = async (
    newPreferences: Partial<Omit<NotificationPreferencesType, 'vendorId' | 'updatedAt'>>
  ) => {
    if (!vendorId) return;

    try {
      const notificationService = new NotificationService();
      const response = await notificationService.updateNotificationPreferences(
        vendorId,
        newPreferences
      );
      
      if (response.success && response.data) {
        setPreferences(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationsSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/vendor/analytics')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg">
                Stay updated with alerts, insights, and important updates
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'notifications' | 'preferences')}>
          <TabsList className="mb-6">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationsList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          </TabsContent>

          <TabsContent value="preferences">
            {preferences ? (
              <NotificationPreferences
                preferences={preferences}
                onSave={handleSavePreferences}
              />
            ) : (
              <Card className="border-gray-200">
                <CardContent className="p-12 text-center">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Unable to load preferences
                  </h3>
                  <p className="text-gray-600 mb-4">
                    There was an error loading your notification preferences
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Skeleton loading component
function NotificationsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div>
        <Skeleton className="h-10 w-64 mb-6" />
        
        {/* Notifications List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
