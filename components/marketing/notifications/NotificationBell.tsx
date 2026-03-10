'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import
    {
        Popover,
        PopoverContent,
        PopoverTrigger,
    } from '@/components/ui/popover';
import { NotificationList } from './NotificationList';
import { NotificationService } from '@/lib/marketing/notification-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export function NotificationBell()
{
    const { marketingUser } = useMarketingAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() =>
    {
        if (!marketingUser) return;

        // Load initial unread count
        loadUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadUnreadCount, 30000);

        return () => clearInterval(interval);
    }, [marketingUser]);

    const loadUnreadCount = async () =>
    {
        if (!marketingUser) return;

        try
        {
            const count = await NotificationService.getUnreadCount(marketingUser.id);
            setUnreadCount(count);
        } catch (error)
        {
            console.error('Error loading unread count:', error);
        }
    };

    const handleMarkAllAsRead = async () =>
    {
        if (!marketingUser) return;

        try
        {
            await NotificationService.markAllAsRead(marketingUser.id);
            setUnreadCount(0);
        } catch (error)
        {
            console.error('Error marking all as read:', error);
        }
    };

    if (!marketingUser) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <NotificationList
                    userId={marketingUser.id}
                    onNotificationRead={loadUnreadCount}
                />
            </PopoverContent>
        </Popover>
    );
}
