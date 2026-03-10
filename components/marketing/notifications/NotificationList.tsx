'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, Info, UserPlus, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { NotificationService } from '@/lib/marketing/notification-service';
import type { Notification } from '@/lib/marketing/types';

interface NotificationListProps
{
    userId: string;
    onNotificationRead?: () => void;
}

export function NotificationList({ userId, onNotificationRead }: NotificationListProps)
{
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        loadNotifications();
    }, [userId]);

    const loadNotifications = async () =>
    {
        try
        {
            setLoading(true);
            const data = await NotificationService.getUserNotifications(userId, 50);
            setNotifications(data);
        } catch (error)
        {
            console.error('Error loading notifications:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) =>
    {
        try
        {
            // Mark as read
            if (!notification.read)
            {
                await NotificationService.markAsRead(notification.id);
                onNotificationRead?.();

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

    if (loading)
    {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground">
                Loading notifications...
            </div>
        );
    }

    if (notifications.length === 0)
    {
        return (
            <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="divide-y">
                {notifications.map((notification) => (
                    <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''
                            }`}
                    >
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                    </p>
                                    {!notification.read && (
                                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                                </p>
                                {notification.actionText && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 mt-2 text-xs"
                                    >
                                        {notification.actionText} →
                                    </Button>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}
