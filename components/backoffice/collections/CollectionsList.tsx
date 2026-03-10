/**
 * Collections List Component
 * 
 * Displays all collections in the backoffice with Bumpa-style design.
 * Supports filtering, searching, and permission-based actions.
 * 
 * Requirements: 11.4, 12.3, 12.4, 13.1, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { collectionRepository } from '@/lib/firestore';
import { ProductCollection } from '@/types/collections';
import DashboardCard from '@/components/backoffice/DashboardCard';
import StatsCard from '@/components/backoffice/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { toast } from 'sonner';

interface CollectionsListProps {
  /** Optional filter to show only user's collections */
  showUserCollectionsOnly?: boolean;
  /** Optional callback when collection is selected */
  onCollectionSelect?: (collection: ProductCollection) => void;
  /** Optional callback when create new is clicked */
  onCreateNew?: () => void;
}

export default function CollectionsList({
  showUserCollectionsOnly = false,
  onCollectionSelect,
  onCreateNew,
}: CollectionsListProps) {
  const { user, hasPermission } = useBackOfficeAuth();
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ProductCollection | null>(null);

  // Permission checks
  const canCreate = hasPermission('collections', 'write');
  const canEdit = hasPermission('collections', 'write');
  const canDelete = hasPermission('collections', 'delete');
  const canView = hasPermission('collections', 'read');

  // Fetch collections
  const fetchCollections = async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let collectionsData: ProductCollection[];

      if (showUserCollectionsOnly && user) {
        collectionsData = await collectionRepository.getByUserId(user.uid);
      } else {
        collectionsData = await collectionRepository.getAll();
      }

      setCollections(collectionsData);
      setFilteredCollections(collectionsData);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user, showUserCollectionsOnly, canView]);

  // Filter collections based on search and status
  useEffect(() => {
    let filtered = collections;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(collection => {
        if (statusFilter === 'published') return collection.published;
        if (statusFilter === 'draft') return !collection.published;
        return true;
      });
    }

    setFilteredCollections(filtered);
  }, [collections, searchTerm, statusFilter]);

  // Handle delete collection
  const handleDelete = async (collection: ProductCollection) => {
    if (!canDelete) {
      toast.error('Permission denied', {
        description: 'You do not have permission to delete collections.',
      });
      return;
    }

    try {
      await collectionRepository.delete(collection.id);
      setCollections(prev => prev.filter(c => c.id !== collection.id));
      toast.success('Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  // Handle publish/unpublish
  const handleTogglePublish = async (collection: ProductCollection) => {
    if (!canEdit) {
      toast.error('Permission denied', {
        description: 'You do not have permission to modify collections.',
      });
      return;
    }

    try {
      if (collection.published) {
        await collectionRepository.unpublish(collection.id);
        toast.success('Collection unpublished');
      } else {
        await collectionRepository.publish(collection.id);
        toast.success('Collection published');
      }
      
      // Refresh collections
      await fetchCollections();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update collection status');
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
    total: collections.length,
    published: collections.filter(c => c.published).length,
    draft: collections.filter(c => !c.published).length,
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">You don't have permission to view collections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          value={stats.total}
          label="Total Collections"
          icon={Package}
          variant="primary"
        />
        <StatsCard
          value={stats.published}
          label="Published"
          icon={Eye}
          variant="success"
        />
        <StatsCard
          value={stats.draft}
          label="Drafts"
          icon={EyeOff}
          variant="secondary"
        />
      </div>

      {/* Header and Controls */}
      <DashboardCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
            <p className="text-gray-600">Manage product collections and promotional designs</p>
          </div>
          
          {canCreate && onCreateNew && (
            <Button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
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

        {/* Collections Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Loading collections...</p>
            </div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No collections found' : 'No collections yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first collection to get started.'}
            </p>
            {canCreate && onCreateNew && !searchTerm && statusFilter === 'all' && (
              <Button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Collection
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div
                  className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
                  onClick={() => onCollectionSelect?.(collection)}
                >
                  {collection.thumbnail ? (
                    <Image
                      src={collection.thumbnail}
                      alt={collection.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={collection.published ? 'default' : 'secondary'}
                      className={collection.published ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {collection.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors truncate"
                    onClick={() => onCollectionSelect?.(collection)}
                  >
                    {collection.name}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>
                        {collection.productIds.length}{' '}
                        {collection.productIds.length === 1 ? 'product' : 'products'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(collection.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="truncate">By {collection.createdBy}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <TooltipProvider>
                      {/* Edit Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onCollectionSelect?.(collection)}
                            disabled={!canEdit}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TooltipTrigger>
                        {!canEdit && (
                          <TooltipContent>
                            <p>You don't have permission to edit collections</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Publish/Unpublish Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={collection.published ? "outline" : "default"}
                            onClick={() => handleTogglePublish(collection)}
                            disabled={!canEdit}
                            className={!collection.published ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                          >
                            {collection.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {!canEdit
                              ? "You don't have permission to modify collections"
                              : collection.published
                              ? 'Unpublish collection'
                              : 'Publish collection'}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={!canDelete}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        {!canDelete && (
                          <TooltipContent>
                            <p>You don't have permission to delete collections</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedCollection?.name}&quot;? This action
              cannot be undone.
              {selectedCollection?.published && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Warning: This collection is currently published.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCollection) {
                  handleDelete(selectedCollection);
                }
                setDeleteDialogOpen(false);
                setSelectedCollection(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}