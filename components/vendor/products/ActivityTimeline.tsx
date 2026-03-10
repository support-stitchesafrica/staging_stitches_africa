/**
 * Activity Timeline Component
 * Displays chronological activity events for a product
 * 
 * Validates: Requirement 22.4
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  ShoppingCart, 
  ShoppingBag, 
  Trash2,
  Clock,
  Smartphone,
  Tablet,
  Monitor,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase';
  timestamp: string;
  userId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
  metadata?: {
    price?: number;
    quantity?: number;
  };
}

interface ActivityTimelineProps {
  activities: ActivityEvent[];
  maxHeight?: string;
}

export function ActivityTimeline({ activities, maxHeight = '500px' }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'add_to_cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'remove_from_cart':
        return <Trash2 className="h-4 w-4" />;
      case 'purchase':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'add_to_cart':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'remove_from_cart':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'purchase':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'Product Viewed';
      case 'add_to_cart':
        return 'Added to Cart';
      case 'remove_from_cart':
        return 'Removed from Cart';
      case 'purchase':
        return 'Purchased';
      default:
        return 'Activity';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'tablet':
        return <Tablet className="h-3 w-3" />;
      case 'desktop':
        return <Monitor className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
    }
  };

  const formatUserId = (userId: string) => {
    if (userId.startsWith('anon_')) {
      return 'Anonymous User';
    }
    return `User ${userId.substring(0, 8)}...`;
  };

  const formatLocation = (location?: { country: string; state?: string; city?: string }) => {
    if (!location) return null;
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(', ');
  };

  if (activities.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Recent customer interactions with this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Activity will appear here as customers interact with your product</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Activity Timeline
        </CardTitle>
        <CardDescription>
          Recent customer interactions with this product ({activities.length} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
              >
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full border ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-full bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Activity details */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {getActivityLabel(activity.type)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatUserId(activity.userId)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {/* Device */}
                    <div className="flex items-center gap-1">
                      {getDeviceIcon(activity.deviceType)}
                      <span className="capitalize">{activity.deviceType}</span>
                    </div>

                    {/* Location */}
                    {activity.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{formatLocation(activity.location)}</span>
                      </div>
                    )}

                    {/* Purchase details */}
                    {activity.type === 'purchase' && activity.metadata && (
                      <>
                        {activity.metadata.quantity && (
                          <Badge variant="outline" className="text-xs">
                            Qty: {activity.metadata.quantity}
                          </Badge>
                        )}
                        {activity.metadata.price && (
                          <Badge variant="outline" className="text-xs">
                            ${activity.metadata.price.toFixed(2)}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
