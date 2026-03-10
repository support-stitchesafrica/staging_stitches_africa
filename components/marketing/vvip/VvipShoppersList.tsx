'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Filter, Calendar, MapPin, User, UserCheck, Eye, UserX, Mail, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface VvipShopper {
  userId: string;
  user_email: string;
  user_name: string;
  country: string;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  notes?: string;
}

/**
 * Modern VVIP Shoppers List Component
 * 
 * Displays and manages all VVIP shoppers with modern design and filtering capabilities.
 */
export default function VvipShoppersList() {
  const { firebaseUser } = useMarketingAuth();
  const [shoppers, setShoppers] = useState<VvipShopper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [userPermissions, setUserPermissions] = useState({
    canRevokeVvip: false,
    userRole: 'none' as string,
  });

  // Load shoppers and permissions
  useEffect(() => {
    if (firebaseUser) {
      loadShoppers();
      loadPermissions();
    }
  }, [firebaseUser, searchQuery, countryFilter, statusFilter, dateRangeFilter]);

  const loadPermissions = async () => {
    if (!firebaseUser) return;
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/marketing/vvip/permissions', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadShoppers = async () => {
    if (!firebaseUser) return;
    
    setLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (countryFilter && countryFilter !== 'all') params.append('country', countryFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (dateRangeFilter && dateRangeFilter !== 'all') params.append('dateRange', dateRangeFilter);

      console.log('Loading VVIP shoppers with params:', params.toString());
      const response = await fetch(`/api/marketing/vvip/shoppers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shoppers loaded:', data.shoppers?.length || 0);
        setShoppers(data.shoppers || []);
      } else {
        console.error('Failed to load shoppers:', response.status);
        if (response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else {
          toast.error('Failed to load VVIP shoppers');
        }
      }
    } catch (error) {
      console.error('Error loading shoppers:', error);
      toast.error('Failed to load VVIP shoppers');
    } finally {
      setLoading(false);
    }
  };

  // Handle revoke VVIP status
  const handleRevokeVvip = async (userId: string) => {
    if (!firebaseUser) return;
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/marketing/vvip/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('VVIP status revoked successfully');
        loadShoppers(); // Reload the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to revoke VVIP status');
      }
    } catch (error) {
      console.error('Error revoking VVIP:', error);
      toast.error('Failed to revoke VVIP status');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get country flag emoji
  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Nigeria': '��',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Spain': '��',
      'France': '�🇷',
      'Germany': '🇩🇪',
      'South Africa': '🇿�',
      'Ghana': '🇬🇭',
      'Kenya': '🇰🇪',
    };
    return flags[country] || '🌍';
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get unique countries for filter
  const uniqueCountries = [...new Set(shoppers.map(s => s.country))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VVIP Shoppers
          </h2>
          <p className="text-gray-600 mt-2 text-lg">Manage and view all exclusive shoppers</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
            {shoppers.length} Total Shoppers
          </Badge>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Modern Filters */}
      <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Find and filter VVIP shoppers by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>
                      {getCountryFlag(country)} {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shoppers List */}
      <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            VVIP Shoppers ({shoppers.length})
          </CardTitle>
          <CardDescription>
            Exclusive customers with premium access and manual payment options. Admin users are automatically filtered out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4 p-6 border rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : shoppers.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No VVIP Shoppers Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || countryFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No regular customer VVIP shoppers have been created yet. Admin users are automatically filtered out from this view.'}
              </p>
              {(searchQuery || countryFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setCountryFilter('all');
                    setStatusFilter('all');
                    setDateRangeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {shoppers.map((shopper) => (
                <div key={shopper.userId} className="border rounded-xl p-6 hover:bg-gray-50/50 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {shopper.user_name?.charAt(0)?.toUpperCase() || shopper.user_email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      
                      {/* Shopper Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {shopper.user_name || 'Unknown Name'}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(shopper.status)} className="capitalize">
                            {shopper.status}
                          </Badge>
                          {shopper.status === 'active' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Shield className="w-3 h-3 mr-1" />
                              VVIP
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{shopper.user_email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{getCountryFlag(shopper.country)} {shopper.country}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Joined {formatDate(shopper.created_at)}</span>
                          </div>
                        </div>

                        {shopper.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Notes:</strong> {shopper.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* View Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {shopper.user_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              VVIP Shopper Details
                            </DialogTitle>
                            <DialogDescription>
                              Complete information for {shopper.user_name || shopper.user_email}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Basic Information */}
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Basic Information
                              </h4>
                              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                                  <p className="text-gray-900">{shopper.user_name || 'Not provided'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                                  <p className="text-gray-900">{shopper.user_email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Country</label>
                                  <p className="text-gray-900">{getCountryFlag(shopper.country)} {shopper.country}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Status</label>
                                  <Badge variant={getStatusBadgeVariant(shopper.status)} className="capitalize">
                                    {shopper.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* VVIP Information */}
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                VVIP Information
                              </h4>
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-blue-700">Created Date</label>
                                    <p className="text-blue-900">{formatDate(shopper.created_at)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-blue-700">User ID</label>
                                    <p className="text-blue-900 font-mono text-xs">{shopper.userId}</p>
                                  </div>
                                </div>
                                {shopper.notes && (
                                  <div className="mt-3">
                                    <label className="text-sm font-medium text-blue-700">Notes</label>
                                    <p className="text-blue-900">{shopper.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Privileges */}
                            <div>
                              <h4 className="font-semibold mb-3">VVIP Privileges</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                  <span className="text-green-800 text-sm">Manual Payment Access</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <Shield className="w-4 h-4 text-green-600" />
                                  <span className="text-green-800 text-sm">Priority Support</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-green-800 text-sm">Exclusive Products</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <span className="text-green-800 text-sm">Custom Orders</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Revoke VVIP (if permitted) */}
                      {userPermissions.canRevokeVvip && shopper.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeVvip(shopper.userId)}
                          className="flex items-center gap-1"
                        >
                          <UserX className="w-4 h-4" />
                          Revoke VVIP
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{shoppers.length}</div>
            <div className="text-blue-100 text-sm">Total Shoppers</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {shoppers.filter(s => s.status === 'active').length}
            </div>
            <div className="text-green-100 text-sm">Active Shoppers</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{uniqueCountries.length}</div>
            <div className="text-purple-100 text-sm">Countries</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {shoppers.filter(s => {
                const createdDate = new Date(s.created_at);
                const thisMonth = new Date();
                thisMonth.setDate(1);
                return createdDate >= thisMonth;
              }).length}
            </div>
            <div className="text-orange-100 text-sm">This Month</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}