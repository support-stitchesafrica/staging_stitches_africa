/**
 * Featured Collections Component
 * 
 * Displays and manages featured/published collections in the backoffice.
 * Includes promotion controls and analytics with Bumpa-style design.
 * 
 * Requirements: 11.4, 12.3, 12.4, 13.1, 13.5, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { collectionRepository } from '@/lib/firestore';
import { ProductCollection } from '@/types/collections';
import DashboardCard from '@/components/backoffice/DashboardCard';
import StatsCard from '@/components/backoffice/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Star,
  Eye,
  EyeOff,
  TrendingUp,
  Calendar,
  Package,
  Users,
  BarChart3,
  Loader2,
  RefreshCw,
  Crown,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { toast } from 'sonner';

interface FeaturedCollectionsProps {
  /** Optional callback when collection is selected */
  onCollectionSelect?: (collection: ProductCollection) => void;
  /** Show analytics section */
  showAnalytics?: boolean;
}

export default function FeaturedCollections({
  onCollectionSelect,
  showAnalytics = true,
}: FeaturedCollectionsProps) {
  const { hasPermission } = useBackOfficeAuth();
  const [publishedCollections, setPublishedCollections] = useState<ProductCollection[]>([]);
  const [allCollections, setAllCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'publishedAt' | 'name' | 'products'>('publishedAt');
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ProductCollection | null>(null);

  // Permission checks
  const canView = hasPermission('collections', 'read');
  const canEdit = hasPermission('collections', 'write');
  const canManage = hasPermission('collections', 'delete');

  // Fetch collections
  const fetchCollections = async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all collections and published collections
      const [allData, publishedData] = await Promise.all([
        collectionRepository.getAll(),
        collectionRepository.getPublishedCollections(),
      ]);

      setAllCollections(allData);
      setPublishedCollections(publishedData);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [canView]);

  // Sort published collections
  const sortedPublishedCollections = [...publishedCollections].sort((a, b) => {
    switch (sortBy) {
      case 'publishedAt':
        const aDate = a.publishedAt instanceof Date ? a.publishedAt : 
                      a.publishedAt && typeof a.publishedAt === 'object' && 'toDate' in a.publishedAt ? 
                      (a.publishedAt as any).toDate() : new Date(0);
        const bDate = b.publishedAt instanceof Date ? b.publishedAt : 
                      b.publishedAt && typeof b.publishedAt === 'object' && 'toDate' in b.publishedAt ? 
                      (b.publishedAt as any).toDate() : new Date(0);
        return bDate.getTime() - aDate.getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'products':
        return b.productIds.length - a.productIds.length;
      default:
        return 0;
    }
  });

  // Handle unpublish collection
  const handleUnpublish = async (collection: ProductCollection) => {
    if (!canEdit) {
      toast.error('Permission denied', {
        description: 'You do not have permission to modify collections.',
      });
      return;
    }

    try {
      setActionLoading(collection.id);
      await collectionRepository.unpublish(collection.id);
      
      // Update local state
      setPublishedCollections(prev => prev.filter(c => c.id !== collection.id));
      setAllCollections(prev => 
        prev.map(c => 
          c.id === collection.id 
            ? { ...c, published: false, publishedAt: null }
            : c
        )
      );

      toast.success('Collection unpublished successfully');
    } catch (error) {
      console.error('Error unpublishing collection:', error);
      toast.error('Failed to unpublish collection');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle promote collection (publish a draft)
  const handlePromote = async (collection: ProductCollection) => {
    if (!canEdit) {
      toast.error('Permission denied', {
        description: 'You do not have permission to modify collections.',
      });
      return;
    }

    try {
      setActionLoading(collection.id);
      await collectionRepository.publish(collection.id);
      
      // Refresh collections to get updated state
      await fetchCollections();

      toast.success('Collection promoted to featured successfully');
    } catch (error) {
      console.error('Error promoting collection:', error);
      toast.error('Failed to promote collection');
    } finally {
      setActionLoading(null);
    }
  };

  // Format date helper
  const formatDate = (date: Date | any) => {
    try {
      if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), 'MMM d, yyyy');
      }
      if (date instanceof Date) {
        return format(date, 'MMM d, yyyy');
      }
      if (typeof date === 'string') {
        return format(new Date(date), 'MMM d, yyyy');
      }
      return 'Unknown date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate stats
  const stats = {
    totalCollections: allCollections.length,
    publishedCollections: publishedCollections.length,
    draftCollections: allCollections.length - publishedCollections.length,
    totalProducts: publishedCollections.reduce((sum, c) => sum + c.productIds.length, 0),
  };

  // Get draft collections that can be promoted
  const draftCollections = allCollections.filter(c => !c.published);

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">You don't have permission to view featured collections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            value={stats.totalCollections}
            label="Total Collections"
            icon={Package}
            variant="primary"
          />
          <StatsCard
            value={stats.publishedCollections}
            label="Featured Collections"
            icon={Star}
            variant="success"
          />
          <StatsCard
            value={stats.draftCollections}
            label="Draft Collections"
            icon={EyeOff}
            variant="secondary"
          />
          <StatsCard
            value={stats.totalProducts}
            label="Featured Products"
            icon={TrendingUp}
            variant="purple"
          />
        </div>
      )}

      {/* Featured Collections */}
      <DashboardCard
        title="Featured Collections"
        description="Collections currently published and visible to customers"
        icon={Star}
      >
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publishedAt">Recently Published</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="products">Product Count</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={fetchCollections}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Badge variant="secondary" className="text-sm">
              {publishedCollections.length} featured
            </Badge>
          </div>

          {/* Featured Collections List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">Loading featured collections...</p>
              </div>
            </div>
          ) : sortedPublishedCollections.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Collections</h3>
              <p className="text-gray-500 mb-6">
                No collections are currently featured. Promote collections to make them visible to customers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPublishedCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {collection.thumbnail ? (
                        <Image
                          src={collection.thumbnail}
                          alt={collection.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      <div className="absolute -top-1 -right-1">
                        <Crown className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                            onClick={() => onCollectionSelect?.(collection)}
                          >
                            {collection.name}
                          </h3>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{collection.productIds.length} products</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Published {formatDate(collection.publishedAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <TooltipProvider>
                            {/* View/Edit Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onCollectionSelect?.(collection)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View collection details</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* Unpublish Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCollection(collection);
                                    setUnpublishDialogOpen(true);
                                  }}
                                  disabled={!canEdit || actionLoading === collection.id}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  {actionLoading === collection.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {!canEdit
                                    ? "You don't have permission to modify collections"
                                    : 'Remove from featured'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Promote Collections */}
      {canEdit && draftCollections.length > 0 && (
        <DashboardCard
          title="Promote to Featured"
          description="Select collections to feature and make visible to customers"
          icon={TrendingUp}
        >
          <div className="space-y-4">
            {draftCollections.slice(0, 5).map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    {collection.thumbnail ? (
                      <Image
                        src={collection.thumbnail}
                        alt={collection.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">{collection.name}</h4>
                    <p className="text-sm text-gray-500">
                      {collection.productIds.length} products • Created {formatDate(collection.createdAt)}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handlePromote(collection)}
                  disabled={actionLoading === collection.id}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {actionLoading === collection.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Promoting...
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Promote
                    </>
                  )}
                </Button>
              </div>
            ))}

            {draftCollections.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                And {draftCollections.length - 5} more draft collections...
              </p>
            )}
          </div>
        </DashboardCard>
      )}

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Featured</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{selectedCollection?.name}&quot; from featured collections?
              This will make it no longer visible to customers on the landing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCollection) {
                  handleUnpublish(selectedCollection);
                }
                setUnpublishDialogOpen(false);
                setSelectedCollection(null);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Remove from Featured
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}