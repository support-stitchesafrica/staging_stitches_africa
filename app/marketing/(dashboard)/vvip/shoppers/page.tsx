'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter,
  Crown,
  Mail,
  MapPin,
  Calendar,
  Eye,
  UserX,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { VvipShopper, VvipFilters } from '@/types/vvip';
import { toast } from 'sonner';

/**
 * VVIP Shoppers List Page
 * 
 * Displays all VVIP shoppers with filtering and search capabilities.
 * Shows role-appropriate action buttons based on user permissions.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 10.3
 */

export default function VvipShoppersPage() {
  const router = useRouter();
  const { marketingUser } = useMarketingAuth();
  
  // Data state
  const [shoppers, setShoppers] = useState<VvipShopper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<VvipFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCreator, setSelectedCreator] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [userPermissions, setUserPermissions] = useState({
    canView: false,
    canEdit: false,
    canRevoke: false,
  });
  
  // Available filter options
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCreators, setAvailableCreators] = useState<Array<{ id: string; name: string }>>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load shoppers and permissions
  const loadData = async (showLoader = true) => {
    if (!marketingUser?.uid) return;

    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      // Load permissions
      const permissionsResponse = await fetch('/api/marketing/vvip/permissions');
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setUserPermissions({
          canView: permissionsData.canView,
          canEdit: permissionsData.canEdit,
          canRevoke: permissionsData.canRevoke,
        });
      }

      // Load shoppers if user has permission
      if (userPermissions.canView || permissionsResponse.ok) {
        const shoppersResponse = await fetch('/api/marketing/vvip/shoppers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });

        if (shoppersResponse.ok) {
          const shoppersData = await shoppersResponse.json();
          setShoppers(shoppersData.shoppers || []);
          
          // Extract unique countries and creators for filters
          const countries = [...new Set(shoppersData.shoppers.map((s: VvipShopper) => s.country).filter(Boolean))];
          const creators = [...new Set(shoppersData.shoppers.map((s: VvipShopper) => ({
            id: s.vvip_created_by,
            name: s.createdByName || s.vvip_created_by
          })))];
          
          setAvailableCountries(countries as any);
          setAvailableCreators(creators as any);
        }
      }
    } catch (error) {
      console.error('Error loading VVIP shoppers:', error);
      toast.error('Failed to load VVIP shoppers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const newFilters: VvipFilters = {};
    
    if (searchQuery.trim()) {
      newFilters.searchQuery = searchQuery.trim();
    }
    
    if (selectedCountry && selectedCountry !== 'all') {
      newFilters.country = selectedCountry;
    }
    
    if (selectedCreator && selectedCreator !== 'all') {
      newFilters.createdBy = selectedCreator;
    }
    
    if (dateRange.start && dateRange.end) {
      newFilters.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      };
    }
    
    setFilters(newFilters);
    loadData(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedCreator('all');
    setDateRange({ start: '', end: '' });
    loadData(false);
  };

  // Handle actions
  const handleViewProfile = (userId: string) => {
    // Navigate to user profile or show modal
    toast.info('Profile view functionality will be implemented');
  };

  const handleRevokeVvip = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke VVIP status for ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/marketing/vvip/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('VVIP status revoked successfully');
        loadData(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke VVIP status');
      }
    } catch (error) {
      console.error('Error revoking VVIP:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke VVIP status');
    }
  };

  // Filter shoppers based on search query
  const filteredShoppers = shoppers.filter(shopper => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      shopper.email.toLowerCase().includes(query) ||
      shopper.firstName?.toLowerCase().includes(query) ||
      shopper.lastName?.toLowerCase().includes(query) ||
      shopper.userId.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VVIP Shoppers</h1>
            <p className="text-gray-600 mt-2">Manage exclusive shoppers</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // No permissions state
  if (!userPermissions.canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600 max-w-md">
          You don't have permission to view VVIP shoppers. Please contact your administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VVIP Shoppers</h1>
            <p className="text-gray-600 mt-2">
              {filteredShoppers.length} exclusive shopper{filteredShoppers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* Country Filter */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {availableCountries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Creator Filter */}
              <div className="space-y-2">
                <Label>Created By</Label>
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger>
                    <SelectValue placeholder="All creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All creators</SelectItem>
                    {availableCreators.map(creator => (
                      <SelectItem key={creator.id} value={creator.id}>{creator.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="md:col-span-3 flex gap-2">
                <Button onClick={applyFilters} className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shoppers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            VVIP Shoppers
          </CardTitle>
          <CardDescription>
            {filteredShoppers.length} shopper{filteredShoppers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredShoppers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No VVIP shoppers found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredShoppers.map((shopper) => (
                <div
                  key={shopper.userId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 rounded-full p-2">
                      <Crown className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {shopper.firstName && shopper.lastName 
                          ? `${shopper.firstName} ${shopper.lastName}`
                          : 'Name not available'
                        }
                        <Badge variant="secondary" className="text-xs">
                          VVIP
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {shopper.email}
                        </span>
                        {shopper.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shopper.country}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {shopper.vvip_created_at.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created by: {shopper.createdByName || shopper.vvip_created_by}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {(userPermissions.canEdit || userPermissions.canRevoke) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(shopper.userId)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </Button>
                    )}
                    
                    {userPermissions.canRevoke && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeVvip(
                          shopper.userId, 
                          shopper.firstName && shopper.lastName 
                            ? `${shopper.firstName} ${shopper.lastName}`
                            : shopper.email
                        )}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <UserX className="w-4 h-4" />
                        Revoke VVIP
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}