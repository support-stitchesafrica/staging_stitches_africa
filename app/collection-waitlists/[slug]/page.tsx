"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  Package,
  CheckCircle,
  Loader2,
  Mail,
  User,
  Phone,
} from "lucide-react";
import { CollectionWaitlist, ProductReference } from "@/types/vendor-waitlist";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CollectionWaitlistPageProps {
  params: Promise<{ slug: string }>;
}

interface SubscriptionForm {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export default function CollectionWaitlistPage({ params }: CollectionWaitlistPageProps) {
  const { slug } = use(params);
  const [collection, setCollection] = useState<CollectionWaitlist | null>(null);
  const [products, setProducts] = useState<ProductReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [formData, setFormData] = useState<SubscriptionForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    loadCollection();
  }, [slug]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collection-waitlists/${slug}`);
      
      if (response.status === 404) {
        notFound();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load collection');
      }

      const data = await response.json();
      setCollection(data.collection);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading collection:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collection) return;

    // Basic validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/collection-waitlists/${slug}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join waitlist');
      }

      setSubscribed(true);
      toast.success('Successfully joined the waitlist!');
      
      // Reload collection to get updated subscriber count
      loadCollection();
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }
      
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!collection) {
    notFound();
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {collection.name}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {collection.description}
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(collection.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{collection.pairedProducts.length + (collection.featuredProducts?.length || 0)} Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            {/* Featured Products */}
            {collection.featuredProducts && collection.featuredProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Featured Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products
                      .filter(product => collection.featuredProducts?.includes(product.id))
                      .map((product) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            {product.images[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{product.name}</h4>
                              <p className="text-sm text-gray-500">${product.price}</p>
                              <p className="text-xs text-gray-400">{product.vendorName}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Pairs */}
            {collection.pairedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Combinations</CardTitle>
                  <p className="text-sm text-gray-600">
                    These products work perfectly together in this collection
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {collection.pairedProducts.map((pair, index) => {
                    const primaryProduct = products.find(p => p.id === pair.primaryProductId);
                    const secondaryProduct = products.find(p => p.id === pair.secondaryProductId);
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Combination {index + 1}</h4>
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
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Waitlist Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {collection.currentSubscribers}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {collection.minSubscribers} needed
                  </div>
                </div>
                
                <Progress 
                  value={getProgressPercentage(collection.currentSubscribers, collection.minSubscribers)} 
                  className="h-3"
                />
                
                <div className="text-center text-sm text-gray-600">
                  {getProgressPercentage(collection.currentSubscribers, collection.minSubscribers).toFixed(1)}% complete
                </div>

                {collection.currentSubscribers >= collection.minSubscribers && (
                  <div className="text-center">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Target Reached!
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signup Form */}
            {!subscribed ? (
              <Card>
                <CardHeader>
                  <CardTitle>Join the Waitlist</CardTitle>
                  <p className="text-sm text-gray-600">
                    Be the first to know when this collection launches
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Waitlist'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    You're on the list!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We'll notify you as soon as this collection is available.
                  </p>
                  <Badge className="bg-green-100 text-green-800">
                    Subscriber #{collection.currentSubscribers}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}