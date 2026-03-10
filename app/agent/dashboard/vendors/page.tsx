'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { fetchTailors, disableTailorAccount } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  Eye,
  UserX,
  UserCheck,
  Filter,
  Grid3X3,
  List,
  Star,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';

export default function VendorsPage() {
  const { hasPermission } = useAgentAuth();
  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tailorToDisable, setTailorToDisable] = useState<any | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Error boundary handler
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Vendors page error caught:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the vendors page. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    );
  }

  // Check permissions
  const canViewTailors = hasPermission('view_tailors');
  const canManageTailors = hasPermission('manage_tailors');

  const loadTailors = async (page: number = currentPage) => {
    console.log('=== LOADING VENDORS ===');
    console.log('Page:', page);
    console.log('Search term:', searchTerm);
    console.log('Status filter:', statusFilter);
    
    if (!canViewTailors) {
      toast.error('You do not have permission to view vendors');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      console.log('Making request to:', `/api/agent/tailors?${params}`);
      const response = await fetch(`/api/agent/tailors?${params}`);
      console.log('Tailors API response status:', response.status);
      const result = await response.json();
      console.log('Tailors API result:', result);

      if (result.success) {
        setTailors(result.data);
        setTotalCount(result.pagination?.total || result.data.length);
        setTotalPages(result.pagination?.totalPages || Math.ceil((result.pagination?.total || result.data.length) / itemsPerPage));
        setCurrentPage(page);
      } else {
        toast.error(result.message || 'Failed to load vendors');
      }
    } catch (error) {
      console.error('Error loading tailors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!tailorToDisable || !canManageTailors) return;

    setDisabling(true);
    try {
      const response = await fetch(`/api/agent/tailors/${tailorToDisable.uid}/disable`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Vendor disabled successfully. ${result.data.productsUpdated} products disabled.`);
        setTailorToDisable(null);
        loadTailors();
      } else {
        toast.error('Failed to disable vendor account');
      }
    } catch (error) {
      console.error('Error disabling tailor:', error);
      toast.error('Failed to disable vendor account');
    } finally {
      setDisabling(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    loadTailors(1);
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [canViewTailors, searchTerm, statusFilter]);

  // Use tailors from API directly since filtering is handled server-side
  const filteredTailors = tailors;

  const getStatusBadge = (tailor: any) => {
    if (tailor.is_disabled || tailor.status === 'disabled') {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (tailor.verification_status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getRatingStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  }, []);



  if (!canViewTailors) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground text-center">
          You don't have permission to view vendors. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vendors
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage tailors and their business profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
            <Users className="h-4 w-4 mr-2" />
            {totalCount} total vendors
          </Badge>
          {totalPages > 1 && (
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Page {currentPage} of {totalPages}
            </Badge>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white via-gray-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-800">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Clear previous timeout
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  // Set new timeout
                  searchTimeoutRef.current = setTimeout(() => {
                    loadTailors();
                  }, 500); // 500ms debounce
                }}
                className="pl-12 h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 rounded-xl transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none h-12 px-4"
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none h-12 px-4"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                    <Skeleton className="h-3 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  </div>
                  <Skeleton className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-3 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <Skeleton className="h-3 w-2/3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 flex-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                    <Skeleton className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Vendors Display */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTailors.map((tailor) => (
                <Card key={tailor.uid} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={tailor.brand_logo} />
                          <AvatarFallback>
                            {tailor.first_name?.charAt(0) || tailor.brand_name?.charAt(0) || 'T'}
                            {tailor.last_name?.charAt(0) || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {tailor.brand_name || `${tailor.first_name || ''} ${tailor.last_name || ''}`.trim() || 'Unknown Vendor'}
                          </CardTitle>
                          <CardDescription>{tailor.email}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(tailor)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Rating */}
                      {tailor.ratings && (
                        <div className="flex items-center gap-2">
                          <div className="flex">{getRatingStars(Math.round(tailor.ratings))}</div>
                          <span className="text-sm text-muted-foreground">
                            ({tailor.ratings.toFixed(1)})
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {(tailor.city || tailor.state) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {[tailor.city, tailor.state].filter(Boolean).join(', ')}
                        </div>
                      )}

                      {/* Phone */}
                      {tailor.phone_number && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {tailor.phone_number}
                        </div>
                      )}

                      {/* Products Count */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="h-4 w-4 mr-2" />
                        {tailor.featured_works?.length || 0} products
                      </div>

                      {/* Join Date */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Joined {tailor.created_at
                          ? (() => {
                              try {
                                const date = new Date(tailor.created_at);
                                return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                              } catch (e) {
                                return 'Invalid date';
                              }
                            })()
                          : 'No date available'}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/agent/dashboard/vendors/${tailor.uid}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>

                        {canManageTailors && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/agent/dashboard/vendors/${tailor.uid}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {tailor.is_disabled || tailor.status === 'disabled' ? (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/agent/tailors/${tailor.uid}/enable`, {
                                        method: 'POST',
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success(`Vendor enabled. ${result.data.productsUpdated} products enabled.`);
                                        loadTailors();
                                      } else {
                                        toast.error('Failed to enable vendor');
                                      }
                                    } catch (error) {
                                      toast.error('Failed to enable vendor');
                                    }
                                  }}
                                  className="text-green-600"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Enable Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setTailorToDisable(tailor)}
                                  className="text-red-600"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Disable Account
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredTailors.map((tailor) => (
                    <div key={tailor.uid} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={tailor.brand_logo} />
                          <AvatarFallback>
                            {tailor.first_name?.charAt(0) || tailor.brand_name?.charAt(0) || 'T'}
                            {tailor.last_name?.charAt(0) || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {tailor.brand_name || `${tailor.first_name || ''} ${tailor.last_name || ''}`.trim() || 'Unknown Vendor'}
                              </h3>
                              <p className="text-muted-foreground">{tailor.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(tailor)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {(tailor.city || tailor.state) && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {[tailor.city, tailor.state].filter(Boolean).join(', ')}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Package className="h-3 w-3 mr-1" />
                              {tailor.featured_works?.length || 0} products
                            </span>
                            {tailor.ratings && (
                              <span className="flex items-center">
                                <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                                {tailor.ratings.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/agent/dashboard/vendors/${tailor.uid}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {canManageTailors && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/agent/dashboard/vendors/${tailor.uid}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {tailor.is_disabled || tailor.status === 'disabled' ? (
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/agent/tailors/${tailor.uid}/enable`, {
                                          method: 'POST',
                                        });
                                        const result = await response.json();
                                        if (result.success) {
                                          toast.success(`Vendor enabled. ${result.data.productsUpdated} products enabled.`);
                                          loadTailors();
                                        } else {
                                          toast.error('Failed to enable vendor');
                                        }
                                      } catch (error) {
                                        toast.error('Failed to enable vendor');
                                      }
                                    }}
                                    className="text-green-600"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Enable Account
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setTailorToDisable(tailor)}
                                    className="text-red-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Disable Account
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredTailors.length === 0 && !loading && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                    <Users className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">0</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                  No vendors found
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md leading-relaxed">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search terms or filters to find the vendors you\'re looking for'
                    : 'No vendors have been registered yet. They will appear here once they join the platform'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Waiting for new vendor registrations...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          {!loading && filteredTailors.length > 0 && totalPages > 1 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} vendors
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTailors(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => loadTailors(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTailors(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Disable Confirmation Modal */}
      <Dialog open={!!tailorToDisable} onOpenChange={() => setTailorToDisable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Vendor Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable the account for{' '}
              <strong>
                {tailorToDisable?.tailor_registered_info?.['first-name']} {tailorToDisable?.tailor_registered_info?.['last-name']}
              </strong>
              ? This will prevent them from accessing their account and managing their products.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTailorToDisable(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDisable}
              disabled={disabling}
              variant="destructive"
            >
              {disabling ? 'Disabling...' : 'Disable Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
