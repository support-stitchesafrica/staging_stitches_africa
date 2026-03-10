'use client';

import { PromotionalEvent } from '@/types/promotionals';
import { Calendar, Package, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/utils/timestamp-helpers';

interface EventCardProps
{
    event: PromotionalEvent;
}

export function EventCard({ event }: EventCardProps)
{
    const startDate = toDate(event.startDate);
    const endDate = toDate(event.endDate);
    const productCount = event.products?.length || 0;

    // Get status badge styling
    const getStatusBadge = () =>
    {
        const statusConfig = {
            draft: {
                label: 'Draft',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
            },
            scheduled: {
                label: 'Scheduled',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
            },
            active: {
                label: 'Active',
                color: 'bg-green-100 text-green-700 border-green-200',
            },
            expired: {
                label: 'Expired',
                color: 'bg-red-100 text-red-700 border-red-200',
            },
        };

        return statusConfig[event.status];
    };

    const statusBadge = getStatusBadge();

    return (
        <Link href={`/promotionals/${event.id}`}>
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                            {event.name}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {/* Status Badge */}
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            statusBadge.color
                        )}>
                            {statusBadge.label}
                        </span>
                        {/* Published Badge */}
                        {event.isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                <Eye className="w-3 h-3" />
                                Published
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                <EyeOff className="w-3 h-3" />
                                Unpublished
                            </span>
                        )}
                    </div>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                        {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                    </span>
                </div>

                {/* Product Count */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>
                        {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                </div>

                {/* Banner Indicator */}
                {event.banner && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            ✓ Banner uploaded
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}
