/**
 * Collection Detail Page
 * 
 * View individual collection details and products.
 * Accessible to users with collections department permissions.
 * 
 * Requirements: 11.4, 12.3, 12.4, 13.1
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, Calendar, User, Package } from 'lucide-react';
import PermissionGuard from '@/components/backoffice/PermissionGuard';
import DashboardCard from '@/components/backoffice/DashboardCard';
import StatsCard from '@/components/backoffice/StatsCard';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { PermissionService } from '@/lib/backoffice/permission-service';
import { collectionRepository } from '@/lib/firestore';
import { ProductCollection } from '@/types/collections';

/**
 * Unauthorized Access Component
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
        <p className="text-gray-600 mb-4">You don't have permission to access this collection.</p>
        <Link href="/backoffice/collections">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Collections
          </button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Collection Detail Content Component
 */
function CollectionDetailContent() {
  const params = useParams();
  const { backOfficeUser } = useBackOfficeAuth();
  const [collection, setCollection] = useState<ProductCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collectionId = params?.collectionId as string;

  // Check if user can edit collections
  const canEdit = backOfficeUser && PermissionService.hasPermission(backOfficeUser, 'collections', 'write');

  useEffect(() => {
    async function fetchCollection() {
      if (!collectionId) {
        setError('Collection ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const collectionData = await collectionRepository.getById(collectionId);
        
        if (!collectionData) {
          setError('Collection not found');
        } else {
          setCollection(collectionData);
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    }

    fetchCollection();
  }, [collectionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Collection Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested collection could not be found.'}</p>
          <Link href="/backoffice/collections">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to Collections
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/backoffice/collections"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Collections
            </Link>
          </div>
          
          {canEdit && (
            <Link
              href={`/backoffice/collections/${collectionId}/edit`}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Collection
            </Link>
          )}
        </div>

        {/* Collection Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{collection.name}</h1>
          {collection.description && (
            <p className="text-gray-600 text-lg">{collection.description}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            value={collection.productIds?.length || 0}
            label="Products"
            icon={Package}
            variant="primary"
          />
          
          <StatsCard
            value={collection.published ? 'Published' : 'Draft'}
            label="Status"
            icon={Eye}
            variant={collection.published ? 'success' : 'warning'}
          />
          
          <StatsCard
            value={collection.createdAt ? new Date(collection.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
            label="Created"
            icon={Calendar}
            variant="secondary"
          />
        </div>

        {/* Collection Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <DashboardCard title="Collection Information" icon={Package}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{collection.name}</p>
              </div>
              
              {collection.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{collection.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <p className="text-gray-900">{collection.createdBy || 'Unknown'}</p>
              </div>
              
              {collection.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-gray-900">
                    {new Date(collection.updatedAt.toDate()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Publishing Information */}
          <DashboardCard title="Publishing Status" icon={Eye}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    collection.published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {collection.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              
              {collection.published && collection.publishedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Published At</label>
                  <p className="text-gray-900">
                    {new Date(collection.publishedAt.toDate()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <p className="text-gray-900">
                  {collection.published ? 'Public' : 'Private'}
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Products Section */}
        <div className="mt-8">
          <DashboardCard title="Products" icon={Package}>
            {collection.productIds && collection.productIds.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  This collection contains {collection.productIds.length} product{collection.productIds.length !== 1 ? 's' : ''}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collection.productIds.map((productId, index) => (
                    <div
                      key={productId}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          Product #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {productId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products</h3>
                <p className="text-gray-600">This collection doesn't contain any products yet.</p>
                {canEdit && (
                  <Link
                    href={`/backoffice/collections/${collectionId}/edit`}
                    className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Add Products
                  </Link>
                )}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

/**
 * Collection Detail Page
 * Protected by permission guard to ensure only authorized users can access
 */
export default function CollectionDetailPage() {
  return (
    <PermissionGuard
      department="collections"
      permission="read"
      fallback={<UnauthorizedAccess />}
    >
      <CollectionDetailContent />
    </PermissionGuard>
  );
}