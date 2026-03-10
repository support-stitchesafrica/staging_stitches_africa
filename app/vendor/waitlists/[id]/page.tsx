"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Send,
  Archive,
  Trash2,
  Users,
  Calendar,
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { CollectionWaitlist, ProductReference } from "@/types/vendor-waitlist";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

interface CollectionDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionDetailsPage({ params }: CollectionDetailsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [collection, setCollection] = useState<CollectionWaitlist | null>(null);
  const [products, setProducts] = useState<ProductReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("tailorToken");
    const uid = localStorage.getItem("tailorUID");

    if (!token || !uid) {
      router.push("/vendor");
      return;
    }

    setUser({ uid });
    setAuthLoading(false);
  }, [router]);

  useEffect(() => {
    if (!authLoading && user) {
      loadCollection();
    }
  }, [user, authLoading, id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/waitlists/${id}?vendorId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data);
        
        // Load product details
        if (data.pairedProducts && data.pairedProducts.length > 0) {
          await loadProducts(data.pairedProducts);
        }
      } else {
        throw new Error('Failed to load collection');
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      toast.error('Failed to load collection');
      router.push('/vendor/waitlists');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (pairedProducts: any[]) => {
    try {
      const productIds = pairedProducts.flatMap(pair => [
        pair.primaryProductId,
        pair.secondaryProductId
      ]);
      
      // For now, we'll use a simple approach to get product details
      // In a real implementation, you'd have a dedicated API for this
      const response = await fetch(`/api/vendor/products?vendorId=${user?.uid}`);
      if (response.ok) {
        const allProducts = await response.json();
        const relevantProducts = allProducts.filter((product: ProductReference) =>
          productIds.includes(product.id)
        );
        setProducts(relevantProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handlePublish = async () => {
    if (!collection || collection.status !== 'draft') return;

    try {
      setActionLoading('publish');
      const response = await fetch(`/api/vendor/waitlists/${collection.id}/publish?vendorId=${user?.uid}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Collection published successfully');
        loadCollection();
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

  const handleArchive = async () => {
    if (!collection || (collection.status !== 'published' && collection.status !== 'completed')) return;

    try {
      setActionLoading('archive');
      const response = await fetch(`/api/vendor/waitlists/${collection.id}/archive?vendorId=${user?.uid}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Collection archived successfully');
        loadCollection();
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      published: { label: "Published", className: "bg-green-100 text-green-800" },
      completed: { label: "Completed", className: "bg-blue-100 text-blue-800" },
      archived: { label: "Archived", className: "bg-yellow-100 text-yellow-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
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

  const getProductById = (id: string): ProductReference | undefined => {
    return products.find(p => p.id === id);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Collection Not Found</h1>
            <Button onClick={() => router.push('/vendor/waitlists')}>
              Back to Collections
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/vendor/waitlists')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collections
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(collection.status)}
                <span className="text-sm text-gray-500">
                  Created {formatDate(collection.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {collection.status === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={actionLoading === 'publish'}
              >
                {actionLoading === 'publish' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            )}

            {(collection.status === 'published' || collection.status === 'completed') && (
              <Button
                variant="outline"
                onClick={handleArchive}
                disabled={actionLoading === 'archive'}
              >
                {actionLoading === 'archive' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4 mr-2" />
                )}
                Archive
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/vendor/waitlists/${collection.id}/edit`)}
              disabled={collection.status === 'completed'}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Collection Image */}
            {collection.imageUrl && (
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{collection.description}</p>
              </CardContent>
            </Card>

            {/* Product Pairs */}
            <Card>
              <CardHeader>
                <CardTitle>Product Pairs ({collection.pairedProducts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {collection.pairedProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="font-medium">No product pairs added yet</p>
                    <p className="text-sm">Edit this collection to add product pairs</p>
                  </div>
                ) : (
                  collection.pairedProducts.map((pair, index) => {
                    const primaryProduct = getProductById(pair.primaryProductId);
                    const secondaryProduct = getProductById(pair.secondaryProductId);
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Product Pair {index + 1}</h4>
                          <Badge variant="outline">
                            {pair.relationship.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {primaryProduct && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                              {primaryProduct.images[0] && (
                                <img
                                  src={primaryProduct.images[0]}
                                  alt={primaryProduct.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{primaryProduct.name}</p>
                                <p className="text-sm text-gray-500">${primaryProduct.price}</p>
                              </div>
                            </div>
                          )}
                          
                          {secondaryProduct && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                              {secondaryProduct.images[0] && (
                                <img
                                  src={secondaryProduct.images[0]}
                                  alt={secondaryProduct.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{secondaryProduct.name}</p>
                                <p className="text-sm text-gray-500">${secondaryProduct.price}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Subscriber Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {collection.currentSubscribers}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {collection.minSubscribers} subscribers
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${getProgressPercentage(collection.currentSubscribers, collection.minSubscribers)}%`
                    }}
                  />
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  {getProgressPercentage(collection.currentSubscribers, collection.minSubscribers).toFixed(1)}% complete
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Product Pairs</span>
                  </div>
                  <span className="font-medium">{collection.pairedProducts.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Created</span>
                  </div>
                  <span className="font-medium">{formatDate(collection.createdAt)}</span>
                </div>
                
                {collection.publishedAt && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Published</span>
                    </div>
                    <span className="font-medium">{formatDate(collection.publishedAt)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                  </div>
                  <span className="font-medium">
                    {collection.currentSubscribers > 0 ? '0%' : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Public Link Card */}
            {collection.status === 'published' && (
              <Card>
                <CardHeader>
                  <CardTitle>Public Waitlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Share this link with customers to let them join your waitlist
                  </p>
                  <div className="p-2 bg-gray-50 rounded text-sm font-mono break-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/collection-waitlists/${collection.slug}`}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/collection-waitlists/${collection.slug}`);
                        toast.success('Link copied to clipboard');
                      }
                    }}
                  >
                    Copy Link
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}