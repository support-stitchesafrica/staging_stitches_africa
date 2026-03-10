"use client";

import { useEffect, useState } from 'react';
import { Coupon, CouponFilters } from '@/types/coupon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye } from 'lucide-react';
import { CouponDetailsDialog } from './CouponDetailsDialog';
import { useCoupons } from '@/hooks/useCoupons';

interface CouponListTableProps {
  filters: CouponFilters;
  refreshTrigger: number;
  onCouponUpdated: () => void;
}

export function CouponListTable({
  filters,
  refreshTrigger,
  onCouponUpdated
}: CouponListTableProps) {
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Use the custom hook for fetching coupons
  const {
    coupons,
    loading,
    error,
    pagination,
    refetch,
    setPage
  } = useCoupons({
    filters,
    page: 1,
    limit: 20,
    autoFetch: true
  });

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Active' },
      USED: { variant: 'secondary', label: 'Used' },
      EXPIRED: { variant: 'destructive', label: 'Expired' },
      DISABLED: { variant: 'outline', label: 'Disabled' }
    };

    const config = variants[status] || variants.ACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}%`;
    }
    return `₦${coupon.discountValue.toLocaleString()}`;
  };

  const handleViewDetails = (couponId: string) => {
    setSelectedCouponId(couponId);
    setDetailsDialogOpen(true);
  };

  const handleRowClick = (couponId: string) => {
    handleViewDetails(couponId);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading coupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No coupons found</p>
        <p className="text-sm text-gray-500 mt-1">
          Try adjusting your filters or create a new coupon
        </p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow 
              key={coupon.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleRowClick(coupon.id!)}
            >
              <TableCell className="font-mono font-medium">
                {coupon.couponCode}
              </TableCell>
              <TableCell className="text-sm">{coupon.assignedEmail}</TableCell>
              <TableCell className="font-medium">
                {formatDiscount(coupon)}
              </TableCell>
              <TableCell>{getStatusBadge(coupon.status)}</TableCell>
              <TableCell>
                {coupon.timesUsed} / {coupon.usageLimit}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(coupon.expiryDate)}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(coupon.createdAt)}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(coupon.id!)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Coupon Details Dialog */}
      <CouponDetailsDialog
        couponId={selectedCouponId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onCouponUpdated={() => {
          refetch();
          onCouponUpdated();
        }}
      />
    </div>
  );
}
