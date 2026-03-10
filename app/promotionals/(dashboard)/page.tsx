'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { PromotionalEvent } from '@/types/promotionals';
import { EventsList } from '@/components/promotionals/dashboard/EventsList';
import { Tag, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PromotionalsDashboardPage()
{
    const router = useRouter();
    const { promotionalUser, loading: authLoading } = usePromotionalsAuth();
    const [events, setEvents] = useState<PromotionalEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user's promotional events
    useEffect(() =>
    {
        const fetchEvents = async () =>
        {
            if (!promotionalUser?.uid)
            {
                return;
            }

            try
            {
                setLoading(true);
                setError(null);

                const userEvents = await PromotionalEventService.getUserEvents(promotionalUser.uid);
                setEvents(userEvents);
            } catch (err: any)
            {
                console.error('Error fetching promotional events:', err);
                const errorMessage = err?.message || 'Failed to load promotional events';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally
            {
                setLoading(false);
            }
        };

        if (!authLoading && promotionalUser)
        {
            fetchEvents();
        }
    }, [promotionalUser, authLoading]);

    // Show loading state
    if (authLoading || loading)
    {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading promotional events...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error)
    {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <Tag className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Failed to load events
                    </h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Promotional Events
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage your promotional campaigns and discounts
                        </p>
                    </div>
                    <Link
                        href="/promotionals/create"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Create Event
                    </Link>
                </div>

                {/* Stats */}
                {events.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Total Events</div>
                            <div className="text-2xl font-bold text-gray-900">{events.length}</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Active</div>
                            <div className="text-2xl font-bold text-green-600">
                                {events.filter(e => e.status === 'active').length}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Scheduled</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {events.filter(e => e.status === 'scheduled').length}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Published</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {events.filter(e => e.isPublished).length}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Events List */}
            <EventsList events={events} />
        </div>
    );
}
