"use client";

import { useState, useEffect } from "react";
import { 
  getPaginatedFreeGiftClaims, 
  getFilterOptions,
  type PaginatedClaimsResult,
  type ClaimsFilters 
} from "@/services/freeGiftAnalytics";
import { FreeGiftClaim } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Download,
  Calendar,
  Users,
  Package,
  TrendingUp
} from "lucide-react";
import { formatDate } from "date-fns";
import { useRouter } from "next/navigation";
import { DocumentSnapshot } from "firebase/firestore";

export default function ClaimsPage() {
  const router = useRouter();
  const [paginatedResult, setPaginatedResult] = useState<PaginatedClaimsResult>({
    claims: [],
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ClaimsFilters>({});
  const [filterOptions, setFilterOptions] = useState({
    countries: [] as string[],
    states: [] as string[],
    cities: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [firstDoc, setFirstDoc] = useState<DocumentSnapshot | undefined>();

  const fetchClaims = async (page: number = 1, direction: 'next' | 'prev' = 'next') => {
    setLoading(true);
    try {
      const result = await getPaginatedFreeGiftClaims(
        page, 
        pageSize, 
        filters,
        direction === 'next' ? lastDoc : undefined,
        direction === 'prev' ? firstDoc : undefined,
        direction
      );
      setPaginatedResult(result);
      setLastDoc(result.lastDoc);
      setFirstDoc(result.firstDoc);
    } catch (error) {
      console.error("Failed to load claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    
    // Parse URL parameters for initial filters
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: ClaimsFilters = {};
    
    if (urlParams.get('country')) {
      initialFilters.country = urlParams.get('country')!;
    }
    if (urlParams.get('state')) {
      initialFilters.state = urlParams.get('state')!;
    }
    if (urlParams.get('city')) {
      initialFilters.city = urlParams.get('city')!;
    }
    if (urlParams.get('status')) {
      initialFilters.status = urlParams.get('status') as 'requested' | 'shipped';
    }
    
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
      setShowFilters(true); // Show filters if we have URL parameters
    }
  }, []);

  useEffect(() => {
    fetchClaims(1);
  }, [filters, pageSize]);

  const handleFilterChange = (key: keyof ClaimsFilters, value: string | Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "" || value === "all" ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportData = () => {
    // Create CSV export
    const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Country', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...paginatedResult.claims.map(claim => [
        `"${claim.firstName} ${claim.lastName}"`,
        claim.email,
        claim.phoneNumber || '',
        `"${claim.address}"`,
        claim.city,
        claim.state,
        claim.country,
        formatDate(new Date(claim.createdAt), 'yyyy-MM-dd'),
        claim.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `free-gift-claims-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'requested':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 page-transition mb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Free Gift Claims</h1>
            <p className="text-gray-500">
              Manage and track all free gift requests with regional insights
              {Object.keys(filters).length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {Object.keys(filters).length} filter(s) applied
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${Object.keys(filters).length > 0 ? 'border-blue-500 text-blue-600' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold">{paginatedResult.totalCount}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Page</p>
                <p className="text-2xl font-bold">{paginatedResult.currentPage}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold">{paginatedResult.totalPages}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Page Size</p>
                <p className="text-2xl font-bold">{pageSize}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={filters.country || "all"}
                  onValueChange={(value) => handleFilterChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {filterOptions.countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={filters.state || "all"}
                  onValueChange={(value) => handleFilterChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {filterOptions.states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Select
                  value={filters.city || "all"}
                  onValueChange={(value) => handleFilterChange('city', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {filterOptions.cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange('status', value as 'requested' | 'shipped')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="shipped">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pageSize">Page Size</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <Badge 
                      key={key} 
                      variant="secondary" 
                      className="bg-blue-100 text-blue-700 flex items-center gap-1"
                    >
                      {key}: {value}
                      <button
                        onClick={() => handleFilterChange(key as keyof ClaimsFilters, undefined)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      Loading claims...
                    </TableCell>
                  </TableRow>
                ) : paginatedResult.claims.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      No claims found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedResult.claims.map((claim) => (
                    <TableRow key={claim.id || Math.random()}>
                      <TableCell className="font-medium">
                        {claim.firstName} {claim.lastName}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {claim.email}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {claim.phoneNumber || "Not Provided"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {claim.city}, {claim.state}, {claim.country}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {claim.createdAt
                          ? formatDate(
                              new Date(claim.createdAt),
                              "MMM d, yyyy h:mm a"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(claim.status)}
                        >
                          {claim.status === "shipped" ? "Delivered" : "Requested"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {((paginatedResult.currentPage - 1) * pageSize) + 1} to{' '}
          {Math.min(paginatedResult.currentPage * pageSize, paginatedResult.totalCount)} of{' '}
          {paginatedResult.totalCount} results
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClaims(paginatedResult.currentPage - 1, 'prev')}
            disabled={!paginatedResult.hasPrevPage || loading}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">Page</span>
            <span className="text-sm font-medium">
              {paginatedResult.currentPage} of {paginatedResult.totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClaims(paginatedResult.currentPage + 1, 'next')}
            disabled={!paginatedResult.hasNextPage || loading}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
