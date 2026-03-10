'use client';

import { VendorNotification } from '@/types/vendor-analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Info,
  AlertTriangle,
  PartyPopper,
  Package,
  DollarSign,
  TrendingDown,
  Star,
  Trophy,
  ChevronRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  notification: VendorNotification;
  onMarkAsRead?: (notificationId: string) => void;
  onClick?: (notification: VendorNotification) => void;
}

export function AlertCard({ notification, onMarkAsRead, onClick }: AlertCardProps) {
  const getIcon = () => {
    // Icon based on category
    switch (notification.category) {
      case 'stock':
        return <Package className="h-5 w-5" />;
      case 'payout':
        return <DollarSign className="h-5 w-5" />;
      case 'performance':
        return <TrendingDown className="h-5 w-5" />;
      case 'ranking':
        return <Star className="h-5 w-5" />;
      case 'milestone':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getTypeIcon = () => {
    // Icon based on type
    switch (notification.type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'celebration':
        return <PartyPopper className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'alert':
        return {
          border: 'border-red-200',
          bg: notification.isRead ? 'bg-white' : 'bg-red-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          dotColor: 'bg-red-500'
        };
      case 'warning':
        return {
          border: 'border-amber-200',
          bg: notification.isRead ? 'bg-white' : 'bg-amber-50',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          dotColor: 'bg-amber-500'
        };
      case 'celebration':
        return {
          border: 'border-emerald-200',
          bg: notification.isRead ? 'bg-white' : 'bg-emerald-50',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          titleColor: 'text-emerald-900',
          dotColor: 'bg-emerald-500'
        };
      case 'info':
      default:
        return {
          border: 'border-blue-200',
          bg: notification.isRead ? 'bg-white' : 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          dotColor: 'bg-blue-500'
        };
    }
  };

  const styles = getStyles();

  const handleCardClick = () => {
    if (onClick) {
      onClick(notification);
    } else if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer',
        styles.border,
        styles.bg,
        !notification.isRead && 'ring-2 ring-offset-2',
        notification.type === 'alert' && !notification.isRead && 'ring-red-200',
        notification.type === 'warning' && !notification.isRead && 'ring-amber-200',
        notification.type === 'celebration' && !notification.isRead && 'ring-emerald-200',
        notification.type === 'info' && !notification.isRead && 'ring-blue-200'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn('p-3 rounded-xl shrink-0', styles.iconBg)}>
            <div className={styles.iconColor}>
              {getIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <div className={cn('h-2 w-2 rounded-full shrink-0', styles.dotColor)} />
                )}
                <h3 className={cn('font-semibold text-base', styles.titleColor)}>
                  {notification.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <div className={cn('p-1.5 rounded-lg', styles.iconBg)}>
                  <div className={cn('h-4 w-4', styles.iconColor)}>
                    {getTypeIcon()}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {notification.message}
            </p>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </span>

              <div className="flex items-center gap-2">
                {!notification.isRead && onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsRead}
                    className="h-8 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark as read
                  </Button>
                )}
                
                {notification.actionUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-8 text-xs', styles.iconColor)}
                  >
                    View details
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
