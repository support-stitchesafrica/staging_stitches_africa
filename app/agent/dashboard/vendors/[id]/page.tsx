'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAgentAuth } from "@/contexts/AgentAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Shield,
  Package,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  UserX,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Tailor {
  id: string;
  uid: string;
  email: string;
  brand_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  city: string;
  state: string;
  country: string;
  wallet: number;
  ratings: number;
  is_disabled: boolean;
  status: string;
  verification_status: string;
  company_verification: string;
  address_verification: string;
  created_at: string;
  updated_at: string;
  featured_works: any[] | undefined;
  type: string[] | string | null;
  brand_logo: string;
  'identity-verification'?: {
    status: string;
    verificationType: string;
    fullName: string;
    idNumber: string;
  };
  'company-verification'?: {
    status: string;
    companyName: string;
    registrationNumber: string;
  };
  'company-address-verification'?: {
    status: string;
    streetAddress: string;
    city: string;
    state: string;
  };
  transactions?: any[];
  tailor_works?: any[];
  products?: any[];
  orders?: any[];
  totalProducts?: number;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAgentAuth();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const tailorId = params.id as string;

  // Check permissions
  const canViewTailors = hasPermission('view_tailors');
  const canManageTailors = hasPermission('manage_tailors');

  const loadTailor = async () => {
    if (!canViewTailors) {
      toast.error('You do not have permission to view vendor details');
      router.push('/agent/dashboard/vendors');
      return;
    }

    setLoading(true);
    try {
      console.log('=== LOADING VENDOR DETAILS ===');
      console.log('Vendor ID:', tailorId);
      
      const response = await fetch(`/api/agent/tailors/${tailorId}`);
      console.log('API Response status:', response.status);
      
      const result = await response.json();
      console.log('API Result:', result);
      
      if (result.success) {
        console.log('Vendor data:', result.data);
        console.log('Products:', result.data.products);
        console.log('Total products:', result.data.totalProducts);
        console.log('Is disabled:', result.data.is_disabled);
        console.log('Can manage tailors:', canManageTailors);
        setTailor(result.data);
      } else {
        toast.error(result.message || 'Failed to load vendor details');
        router.push('/agent/dashboard/vendors');
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor details');
      router.push('/agent/dashboard/vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tailorId) {
      loadTailor();
    }
  }, [tailorId, canViewTailors]);

  const handleDisable = async () => {
    if (!canManageTailors || !tailor) return;

    setActionLoading(true);
    try {
      const endpoint = tailor.is_disabled 
        ? `/api/agent/tailors/${tailorId}/enable`
        : `/api/agent/tailors/${tailorId}/disable`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        const action = tailor.is_disabled ? 'enabled' : 'disabled';
        toast.success(`Vendor ${action} successfully. ${result.data.productsUpdated} products ${action}.`);
        setDisableDialogOpen(false);
        loadTailor();
      } else {
        toast.error(result.message || 'Failed to update vendor status');
      }
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canManageTailors || !tailor) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/agent/tailors/${tailorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Vendor account deleted successfully');
        setDeleteDialogOpen(false);
        router.push('/agent/dashboard/vendors');
      } else {
        toast.error(result.message || 'Failed to delete vendor account');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor account');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!canViewTailors) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground text-center">
          You don't have permission to view vendor details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tailor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Vendor Not Found</h3>
        <p className="text-muted-foreground text-center mb-4">
          The vendor you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/agent/dashboard/vendors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agent/dashboard/vendors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={tailor.brand_logo} />
              <AvatarFallback className="text-lg">
                {tailor.first_name?.charAt(0) || tailor.brand_name?.charAt(0) || 'V'}
                {tailor.last_name?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">
                {tailor.brand_name || `${tailor.first_name} ${tailor.last_name}` || 'Unknown Vendor'}
              </h1>
              <p className="text-muted-foreground">{tailor.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {tailor.is_disabled || tailor.status === 'disabled' ? (
                  <Badge variant="destructive">Inactive</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                )}
                {tailor.ratings > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{tailor.ratings.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Always show for debugging */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={tailor.is_disabled ? "default" : "outline"}
            size="sm"
            onClick={() => {
              console.log('Button clicked, canManageTailors:', canManageTailors);
              if (!canManageTailors) {
                toast.error('You do not have permission to manage vendors');
                return;
              }
              setDisableDialogOpen(true);
            }}
            className={tailor.is_disabled 
              ? "bg-green-600! hover:bg-green-700! text-white" 
              : "text-yellow-600 hover:text-yellow-700 border-yellow-600"
            }
          >
            {tailor.is_disabled ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enable Vendor
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Disable Vendor
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!canManageTailors) {
                toast.error('You do not have permission to manage vendors');
                return;
              }
              setDeleteDialogOpen(true);
            }}
            className="text-red-600 hover:text-red-700 border-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          {!canManageTailors && (
            <Badge variant="secondary" className="ml-2">
              View Only
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="works" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Works
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic vendor details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="font-medium">{tailor.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="font-medium">{tailor.last_name || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                  <p className="font-medium">{tailor.brand_name || 'Not provided'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tailor.email}</span>
                </div>
                {tailor.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tailor.phone_number}</span>
                  </div>
                )}
                {(tailor.city || tailor.state || tailor.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{[tailor.city, tailor.state, tailor.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(tailor.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Financial and business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Wallet Balance</label>
                  <p className="text-2xl font-bold text-green-600">₦{tailor.wallet.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                  <div className="flex gap-2 mt-1">
                    {(() => {
                      if (!tailor.type) {
                        return <span className="text-muted-foreground">Not specified</span>;
                      }
                      
                      if (Array.isArray(tailor.type)) {
                        return tailor.type.length > 0 ? (
                          tailor.type.map((type, index) => (
                            <Badge key={index} variant="outline">{type}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        );
                      }
                      
                      if (typeof tailor.type === 'string') {
                        return <Badge variant="outline">{tailor.type}</Badge>;
                      }
                      
                      return <span className="text-muted-foreground">Not specified</span>;
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Featured Works</label>
                  <p className="font-medium">
                    {Array.isArray(tailor.featured_works) ? tailor.featured_works.length : 0} products
                  </p>
                </div>
                {tailor.ratings > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rating</label>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(tailor.ratings) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{tailor.ratings.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(tailor['identity-verification']?.status || 'pending')}
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Type</span>
                  <p>{tailor['identity-verification']?.verificationType || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                  <p>{tailor['identity-verification']?.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">ID Number</span>
                  <p>{tailor['identity-verification']?.idNumber || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Company Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(tailor['company-verification']?.status || 'pending')}
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Company Name</span>
                  <p>{tailor['company-verification']?.companyName || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Registration Number</span>
                  <p>{tailor['company-verification']?.registrationNumber || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(tailor['company-address-verification']?.status || 'pending')}
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Address</span>
                  <p>{tailor['company-address-verification']?.streetAddress || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">City, State</span>
                  <p>
                    {[
                      tailor['company-address-verification']?.city,
                      tailor['company-address-verification']?.state
                    ].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Products ({tailor.totalProducts || 0})</CardTitle>
              <CardDescription>Products created by this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(tailor.products) && tailor.products.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tailor.products.map((product: any) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gray-100 relative">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          {product.is_disabled && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="destructive">Disabled</Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold truncate">{product.name || 'Unnamed Product'}</h4>
                          <p className="text-sm text-muted-foreground truncate line-clamp-2">
                            {product.description || 'No description'}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-green-600">
                              ₦{product.price?.base || product.price ? Number(product.price?.base || product.price).toLocaleString() : '0'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {product.category || 'Uncategorized'}
                            </Badge>
                          </div>
                          {product.stock !== undefined && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Stock: {product.stock} units
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm">This vendor hasn't created any products yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Recent orders for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(tailor.orders) && tailor.orders.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This vendor has {tailor.orders.length} recent orders.
                  </p>
                  <div className="space-y-3">
                    {tailor.orders.slice(0, 10).map((order: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Order #{order.id || order.orderId || `ORD-${index + 1}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName || order.customer_name || 'Unknown Customer'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown Date'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              ₦{order.total ? Number(order.total).toLocaleString() : '0'}
                            </p>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {tailor.orders.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing 10 of {tailor.orders.length} orders
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders found for this vendor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="works" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tailor Works</CardTitle>
              <CardDescription>Products created by this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(tailor.featured_works) && tailor.featured_works.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This vendor has {tailor.featured_works.length} featured works.
                  </p>
                  {/* Here you would fetch and display the actual works */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Work details would be loaded here</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No works found for this vendor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Financial transactions and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(tailor.transactions) && tailor.transactions.length > 0 ? (
                <div className="space-y-4">
                  {/* Transaction table would go here */}
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Transaction details would be loaded here</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found for this vendor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disable/Enable Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tailor.is_disabled ? 'Enable' : 'Disable'} Vendor Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to {tailor.is_disabled ? 'enable' : 'disable'} the account for{' '}
              <strong>{tailor.brand_name || `${tailor.first_name} ${tailor.last_name}`}</strong>?
              {tailor.is_disabled ? (
                <span className="block mt-2 text-green-600">
                  This will restore their access and enable all their products ({tailor.totalProducts || 0} products).
                </span>
              ) : (
                <span className="block mt-2 text-yellow-600">
                  This will prevent them from accessing their account and disable all their products ({tailor.totalProducts || 0} products).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDisable}
              disabled={actionLoading}
              variant={tailor.is_disabled ? "default" : "destructive"}
            >
              {actionLoading ? (tailor.is_disabled ? 'Enabling...' : 'Disabling...') : (tailor.is_disabled ? 'Enable Account' : 'Disable Account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the account for{' '}
              <strong>{tailor.brand_name || `${tailor.first_name} ${tailor.last_name}`}</strong>?
              This action cannot be undone and will remove all their data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}