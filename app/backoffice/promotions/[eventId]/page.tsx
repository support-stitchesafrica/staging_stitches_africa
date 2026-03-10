/**
 * Promotional Event Detail Page
 * 
 * View detailed information about a specific promotional event.
 * Accessible to users with promotions read permissions.
 * 
 * Requirements: 11.3, 12.3, 12.4
 */

'use client';

import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PromotionalEvent } from '@/types/promotionals';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar, 
  Package,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

/**
 * Unauthorized Access Component
 * Shown when user doesn't have promotions access
 */
function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to view promotional events.</p>
        <Link href="/backoffice/promotions">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Promotions
          </button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Event Status Badge Component
 */
function EventStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    scheduled: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
    active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Active' },
    expired: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Expired' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
}

/**
 * Product Card Component
 */
function ProductCard({ product }: { product: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">Product ID: {product.productId}</h4>
          <p className="text-sm text-gray-600">
            Original: ${product.originalPrice?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-green-600">
            {product.discountPercentage}% OFF
          </p>
          <p className="text-sm font-medium text-gray-900">
            ${product.discountedPrice?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Added: {product.addedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
      </div>
    </div>
  );
}

/**
 * Event Detail Content
 * Main content for event detail page
 */
function EventDetailContent() {
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<PromotionalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check permissions
  const canEdit = hasPermission('promotions', 'write');
  const canDelete = hasPermission('promotions', 'delete');

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!eventId) {
          setError('Event ID is required');
          return;
        }

        const eventData = await PromotionalEventService.getEventById(eventId);
        
        if (!eventData) {
          setError('Event not found');
          return;
        }

        setEvent(eventData);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Handle publish/unpublish
  const handleTogglePublish = async () => {
    if (!event) return;

    try {
      setActionLoading('publish');
      
      if (event.isPublished) {
        await PromotionalEventService.unpublishEvent(event.id);
        setEvent(prev => prev ? { ...prev, isPublished: false } : null);
      } else {
        await PromotionalEventService.publishEvent(event.id);
        setEvent(prev => prev ? { ...prev, isPublished: true } : null);
      }
    } catch (err: any) {
      console.error('Error toggling publish status:', err);
      alert(err.message || 'Failed to update publish status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!event) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading('delete');
      await PromotionalEventService.deleteEvent(event.id);
      router.push('/backoffice/promotions');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(err.message || 'Failed to delete event');
      setActionLoading(null);
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested promotional event could not be found.'}</p>
          <Link href="/backoffice/promotions">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to Promotions
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/backoffice/promotions"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Promotions
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <EventStatusBadge status={event.status} />
              {event.isPublished && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Published
                </span>
              )}
            </div>
            <p className="text-gray-600">
              Created on {formatDate(event.createdAt)}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Live Link */}
            {event.isPublished && event.status === 'active' && (
              <a
                href={`/promotions/${event.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Live
              </a>
            )}

            {/* Publish/Unpublish Button */}
            {canEdit && (
              <button
                onClick={handleTogglePublish}
                disabled={actionLoading === 'publish'}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  event.isPublished
                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {actionLoading === 'publish' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                ) : event.isPublished ? (
                  <EyeOff className="w-4 h-4 mr-1" />
                ) : (
                  <Eye className="w-4 h-4 mr-1" />
                )}
                {event.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            )}

            {/* Edit Button */}
            {canEdit && (
              <Link href={`/backoffice/promotions/${event.id}/edit`}>
                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </Link>
            )}

            {/* Delete Button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                {actionLoading === 'delete' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Date Range */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Event Duration</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {formatDate(event.startDate).split(',')[0]}
              </p>
              <p className="text-sm text-gray-600">
                to {formatDate(event.endDate).split(',')[0]}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Products Count */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">{event.products?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Banner Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Banner</p>
              <p className="text-lg font-semibold text-gray-900">
                {event.banner ? 'Uploaded' : 'Not Set'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              event.banner ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <ImageIcon className={`w-6 h-6 ${
                event.banner ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      {event.banner && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Banner</h2>
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={event.banner.imageUrl}
              alt={event.banner.title || event.name}
              className="w-full h-full object-cover"
            />
          </div>
          {event.banner.title && (
            <h3 className="text-lg font-medium text-gray-900 mt-4">{event.banner.title}</h3>
          )}
          {event.banner.description && (
            <p className="text-gray-600 mt-2">{event.banner.description}</p>
          )}
        </div>
      )}

      {/* Products Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Products ({event.products?.length || 0})</h2>
          {canEdit && (
            <Link href={`/backoffice/promotions/${event.id}/edit`}>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Manage Products →
              </button>
            </Link>
          )}
        </div>

        {event.products && event.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.products.map((product, index) => (
              <ProductCard key={`${product.productId}-${index}`} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Added</h3>
            <p className="text-gray-600 mb-4">
              Add products to this promotional event to start offering discounts.
            </p>
            {canEdit && (
              <Link href={`/backoffice/promotions/${event.id}/edit`}>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Add Products
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Analytics Link */}
      <div className="mt-8 bg-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-1">Event Analytics</h3>
            <p className="text-purple-800">Track performance and engagement for this event</p>
          </div>
          <Link href="/backoffice/promotions/analytics">
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-white rounded-lg hover:bg-purple-50 transition-colors">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Promotional Event Detail Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function PromotionalEventDetailPage() {
  return (
    <PermissionGuard
      department="promotions"
      permission="read"
      fallback={<UnauthorizedAccess />}
    >
      <EventDetailContent />
    </PermissionGuard>
  );
}