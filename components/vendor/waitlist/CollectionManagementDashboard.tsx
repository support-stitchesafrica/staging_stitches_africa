"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  TrendingUp,
  Archive,
  Send,
  Loader2,
  Filter,
} from "lucide-react";
import { CollectionWaitlist, CollectionWaitlistStatus } from "@/types/vendor-waitlist";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CollectionManagementDashboardProps {
  vendorId: string;
}

export function CollectionManagementDashboard({ vendorId }: CollectionManagementDashboardProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionWaitlist[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionWaitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CollectionWaitlistStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionWaitlist | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, [vendorId]);

  useEffect(() => {
    filterCollections();
  }, [collections, searchQuery, statusFilter]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/vendor/waitlists?vendorId=${vendorId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      } else {
        throw new Error('Failed to load collections');
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const filterCollections = () => {
    let filtered = collections;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(collection => collection.status === statusFilter);
    }

    setFilteredCollections(filtered);
  };

  const handlePublishCollection = async (collection: CollectionWaitlist) => {
    if (collection.status !== 'draft') {
      toast.error('Only draft collections can be published');
      return;
    }

    try {
      setActionLoading(collection.id);
      const response = await fetch(`/api/vendor/waitlists/${collection.id}/publish?vendorId=${vendorId}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Collection published successfully');
        loadCollections();
      } else {
        throw new Error('Failed to publish collection');
      }
    } catch (error) {
      console.error('Error publishing collection:', error);
      toast.error('Failed to publish collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveCollection = async (collection: CollectionWaitlist) => {
    try {
      setActionLoading(collection.id);
      const response = await fetch(`/api/vendor/waitlists/${collection.id}/archive?vendorId=${vendorId}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Collection archived successfully');
        loadCollections();
      } else {
        throw new Error('Failed to archive collection');
      }
    } catch (error) {
      console.error('Error archiving collection:', error);
      toast.error('Failed to archive collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      setActionLoading(collectionToDelete.id);
      const response = await fetch(`/api/vendor/waitlists/${collectionToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Collection deleted successfully');
        loadCollections();
      } else {
        throw new Error('Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const getStatusBadge = (status: CollectionWaitlistStatus) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      published: { label: "Published", className: "bg-green-100 text-green-800" },
      completed: { label: "Completed", className: "bg-blue-100 text-blue-800" },
      archived: { label: "Archived", className: "bg-yellow-100 text-yellow-800" },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        // Firestore Timestamp-like object
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // String or number timestamp
        date = new Date(timestamp);
      } else {
        // Unknown format
        return 'N/A';
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Waitlists</h1>
          <p className="text-gray-600 mt-1">
            Manage your collection waitlists and track subscriber interest
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/vendor/waitlists/analytics')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          <Button onClick={() => router.push('/vendor/waitlists/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Collections</p>
                <p className="text-2xl font-bold text-gray-900">{collections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {collections.filter(c => c.status === 'published').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {collections.reduce((sum, c) => sum + c.currentSubscribers, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {collections.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("published")}>
              Published
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("archived")}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {collections.length === 0 ? "No collections yet" : "No collections match your filters"}
              </h3>
              <p className="text-gray-500 mb-6">
                {collections.length === 0 
                  ? "Create your first collection waitlist to start gathering customer interest"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {collections.length === 0 && (
                <Button onClick={() => router.push('/vendor/waitlists/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Collection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate mb-2">
                      {collection.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(collection.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(collection.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {actionLoading === collection.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/vendor/waitlists/${collection.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => router.push(`/vendor/waitlists/${collection.id}/analytics`)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => router.push(`/vendor/waitlists/${collection.id}/edit`)}
                        disabled={collection.status === 'completed'}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      
                      {collection.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={() => handlePublishCollection(collection)}
                          disabled={actionLoading === collection.id}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      
                      {(collection.status === 'published' || collection.status === 'completed') && (
                        <DropdownMenuItem
                          onClick={() => handleArchiveCollection(collection)}
                          disabled={actionLoading === collection.id}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setCollectionToDelete(collection);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                        disabled={collection.status === 'published'}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Collection Image */}
                {collection.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {collection.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subscribers</span>
                    <span className="font-medium">
                      {collection.currentSubscribers} / {collection.minSubscribers}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${getProgressPercentage(collection.currentSubscribers, collection.minSubscribers)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {getProgressPercentage(collection.currentSubscribers, collection.minSubscribers).toFixed(1)}% of target reached
                  </p>
                </div>

                {/* Product Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Product Pairs</span>
                  <span className="font-medium">{collection.pairedProducts.length}</span>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/vendor/waitlists/${collection.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collectionToDelete?.name}"? This action cannot be undone.
              All subscriber data for this collection will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading === collectionToDelete?.id}
            >
              {actionLoading === collectionToDelete?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Collection'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}