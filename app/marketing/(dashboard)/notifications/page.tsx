'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, Info, UserPlus, Users, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import
    {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { NotificationServiceClient } from '@/lib/marketing/notification-service-client';
import type { Notification } from '@/lib/marketing/types';

export default function NotificationsPage()
{
    const router = useRouter();
    const { marketingUser } = useMarketingAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() =>
    {
        if (marketingUser?.id)
        {
            loadNotifications();
        }
    }, [marketingUser?.id]);

    useEffect(() =>
    {
        applyFilters();
    }, [notifications, filter, typeFilter]);

    const loadNotifications = async () =>
    {
        if (!marketingUser?.id) return;

        try
        {
            setLoading(true);
            const data = await NotificationServiceClient.getUserNotifications(marketingUser.id, 100);
            setNotifications(data);
        } catch (error)
        {
            console.error('Error loading notifications:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const applyFilters = () =>
    {
        let filtered = [...notifications];

        // Apply read/unread filter
        if (filter === 'unread')
        {
            filtered = filtered.filter(n => !n.read);
        } else if (filter === 'read')
        {
            filtered = filtered.filter(n => n.read);
        }

        // Apply type filter
        if (typeFilter !== 'all')
        {
            filtered = filtered.filter(n => n.type === typeFilter);
        }

        setFilteredNotifications(filtered);
    };

    const handleNotificationClick = async (notification: Notification) =>
    {
        try
        {
            // Mark as read
            if (!notification.read)
            {
                await NotificationServiceClient.markAsRead(notification.id);

                // Update local state
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                );
            }

            // Navigate to action link if available
            if (notification.actionLink)
            {
                router.push(notification.actionLink);
            }
        } catch (error)
        {
            console.error('Error handling notification click:', error);
        }
    };

    const handleMarkAllAsRead = async () =>
    {
        if (!marketingUser?.id) return;

        try
        {
            await NotificationServiceClient.markAllAsRead(marketingUser.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error)
        {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: Notification['type']) =>
    {
        switch (type)
        {
            case 'invitation':
                return <UserPlus className="h-5 w-5 text-blue-500" />;
            case 'vendor_assignment':
            case 'vendor_reassignment':
                return <Bell className="h-5 w-5 text-green-500" />;
            case 'system_alert':
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            case 'role_change':
                return <CheckCircle className="h-5 w-5 text-purple-500" />;
            case 'team_assignment':
                return <Users className="h-5 w-5 text-indigo-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: Notification['type']) =>
    {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!marketingUser)
    {
        return null;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                <p className="text-muted-foreground">
                    View and manage all your notifications
                </p>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                All Notifications
                                {unreadCount > 0 && (
                                    <Badge variant="destructive">{unreadCount} unread</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="unread">Unread</SelectItem>
                                <SelectItem value="read">Read</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="invitation">Invitations</SelectItem>
                                <SelectItem value="vendor_assignment">Vendor Assignments</SelectItem>
                                <SelectItem value="vendor_reassignment">Vendor Reassignments</SelectItem>
                                <SelectItem value="system_alert">System Alerts</SelectItem>
                                <SelectItem value="role_change">Role Changes</SelectItem>
                                <SelectItem value="team_assignment">Team Assignments</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading notifications...
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No notifications found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredNotifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 rounded-lg border text-left hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/50 border-blue-200' : 'border-border'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getTypeLabel(notification.type)}
                                                    </Badge>
                                                </div>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                                                </p>
                                                {notification.actionText && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                    >
                                                        {notification.actionText} →
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}