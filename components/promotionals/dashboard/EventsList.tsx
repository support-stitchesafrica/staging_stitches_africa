'use client';

import { useState, useMemo } from 'react';
import { PromotionalEvent, PromotionalEventStatus } from '@/types/promotionals';
import { EventCard } from './EventCard';
import { EmptyState } from './EmptyState';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsListProps
{
    events: PromotionalEvent[];
}

type FilterOption = 'all' | PromotionalEventStatus;

export function EventsList({ events }: EventsListProps)
{
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterOption>('all');

    // Filter events based on search and status
    const filteredEvents = useMemo(() =>
    {
        let filtered = events;

        // Apply search filter
        if (searchQuery.trim())
        {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.name.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all')
        {
            filtered = filtered.filter(event => event.status === statusFilter);
        }

        return filtered;
    }, [events, searchQuery, statusFilter]);

    // Count events by status
    const statusCounts = useMemo(() =>
    {
        return {
            all: events.length,
            draft: events.filter(e => e.status === 'draft').length,
            scheduled: events.filter(e => e.status === 'scheduled').length,
            active: events.filter(e => e.status === 'active').length,
            expired: events.filter(e => e.status === 'expired').length,
        };
    }, [events]);

    const filterOptions: { value: FilterOption; label: string }[] = [
        { value: 'all', label: `All (${statusCounts.all})` },
        { value: 'active', label: `Active (${statusCounts.active})` },
        { value: 'scheduled', label: `Scheduled (${statusCounts.scheduled})` },
        { value: 'draft', label: `Draft (${statusCounts.draft})` },
        { value: 'expired', label: `Expired (${statusCounts.expired})` },
    ];

    // Show empty state if no events at all
    if (events.length === 0)
    {
        return <EmptyState />;
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex gap-2">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setStatusFilter(option.value)}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                                    statusFilter === option.value
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600">
                        No events found matching your filters.
                    </p>
                    <button
                        onClick={() =>
                        {
                            setSearchQuery('');
                            setStatusFilter('all');
                        }}
                        className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </div>
    );
}
