/**
 * Events List Component
 * 
 * Displays a list of promotional events with filtering, search, and management actions.
 * Integrates with promotional_events collection and applies Bumpa-style design.
 * 
 * Requirements: 11.3, 12.3, 12.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { PromotionalEvent, PromotionalEventStatus } from '@/types/promotionals';
import DashboardCard from '@/components/backoffice/DashboardCard';
import StatsCard from '@/components/backoffice/StatsCard';

/**
 * Status badge configuration
 */
const statusConfig = {
  draft: {
    label: 'Draft',
    icon: Edit,
    className: 'bg-gray-100 text-gray-800',
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800',
  },
  active: {
    label: 'Active',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800',
  },
  expired: {
    label: 'Expired',
    icon: XCircle,
    className: 'bg-red-100 text-red-800',
  },
};

/**
 * Filter options
 */
type FilterOption = 'all' | PromotionalEventStatus;

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
];

export default function EventsList() {
  const router = useRouter();
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();

  // State
  const [events, setEvents] = useState<PromotionalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Permissions
  const canWrite = hasPermission('promotions', 'write');
  const canDelete = hasPermission('promotions', 'delete');

  /**
   * Load events from Firestore
   */
  const loadEvents = useCallback(async () => {
    if (!backOfficeUser) return;

    try {
      setLoading(true);
      
      // For superadmin and admin, get all events
      // For others, get only their events
      let eventsList: PromotionalEvent[];
      
      if (backOfficeUser.role === 'superadmin' || backOfficeUser.role === 'admin') {
        // TODO: Implement getAllEvents method in PromotionalEventService
        eventsList = await PromotionalEventService.getUserEvents(backOfficeUser.uid);
      } else {
        eventsList = await PromotionalEventService.getUserEvents(backOfficeUser.uid);
      }

      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [backOfficeUser]);

  /**
   * Handle event deletion
   */
  const handleDeleteEvent = useCallback(async (eventId: string, eventName: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete events');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingEventId(eventId);
      await PromotionalEventService.deleteEvent(eventId);
      
      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  }, [canDelete]);

  /**
   * Handle event publishing toggle
   */
  const handleTogglePublish = useCallback(async (event: PromotionalEvent) => {
    if (!canWrite) {
      toast.error('You do not have permission to publish events');
      return;
    }

    try {
      if (event.isPublished) {
        await PromotionalEventService.unpublishEvent(event.id);
        toast.success('Event unpublished');
      } else {
        await PromotionalEventService.publishEvent(event.id);
        toast.success('Event published');
      }

      // Reload events to get updated data
      await loadEvents();
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      toast.error(error.message || 'Failed to update event');
    }
  }, [canWrite, loadEvents]);

  /**
   * Filter and search events
   */
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(term)
      );
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  }, [events, statusFilter, searchTerm]);

  /**
   * Calculate statistics
   */
  const stats = useMemo(() => {
    const total = events.length;
    const active = events.filter(e => e.status === 'active').length;
    const scheduled = events.filter(e => e.status === 'scheduled').length;
    const published = events.filter(e => e.isPublished).length;

    return { total, active, scheduled, published };
  }, [events]);

  /**
   * Format date for display
   */
  const formatDate = useCallback((timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, []);

  /**
   * Get days until event starts/ends
   */
  const getDaysUntil = useCallback((timestamp: any, isEndDate = false) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return isEndDate ? 'Ended' : 'Started';
    } else if (diffDays === 0) {
      return isEndDate ? 'Ends today' : 'Starts today';
    } else if (diffDays === 1) {
      return isEndDate ? 'Ends tomorrow' : 'Starts tomorrow';
    } else {
      return `${diffDays} days ${isEndDate ? 'left' : 'until start'}`;
    }
  }, []);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Promotional Events</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Events</h1>
          <p className="text-gray-600 mt-1">
            Manage promotional events and campaigns
          </p>
        </div>

        {canWrite && (
          <Link
            href="/backoffice/promotions/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          value={stats.total}
          label="Total Events"
          icon={Calendar}
          variant="primary"
        />
        <StatsCard
          value={stats.active}
          label="Active Events"
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          value={stats.scheduled}
          label="Scheduled Events"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          value={stats.published}
          label="Published Events"
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Filters and Search */}
      <DashboardCard>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterOption)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Events List */}
      <DashboardCard>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {events.length === 0 ? 'No events yet' : 'No events found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {events.length === 0 
                ? 'Create your first promotional event to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {canWrite && events.length === 0 && (
              <Link
                href="/backoffice/promotions/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const status = statusConfig[event.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {event.name}
                        </h3>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>

                        {/* Published Badge */}
                        {event.isPublished && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Eye className="w-3 h-3" />
                            Published
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(event.startDate)} - {formatDate(event.endDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.products?.length || 0} products</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {event.status === 'active' 
                              ? getDaysUntil(event.endDate, true)
                              : getDaysUntil(event.startDate)
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* View/Edit Button */}
                      <Link
                        href={`/backoffice/promotions/${event.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View event"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {canWrite && (
                        <Link
                          href={`/backoffice/promotions/${event.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit event"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {/* Publish/Unpublish Button */}
                      {canWrite && (
                        <button
                          onClick={() => handleTogglePublish(event)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            event.isPublished
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={event.isPublished ? 'Unpublish event' : 'Publish event'}
                        >
                          {event.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      )}

                      {/* Delete Button */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          disabled={deletingEventId === event.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
