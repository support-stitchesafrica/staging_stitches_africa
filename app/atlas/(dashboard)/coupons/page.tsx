"use client";

import { useState, useEffect } from 'react';
import { useAtlasAuth } from '@/contexts/AtlasAuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CouponListTable } from '@/components/atlas/coupons/CouponListTable';
import { CreateCouponDialog } from '@/components/atlas/coupons/CreateCouponDialog';
import { CouponStatsCards } from '@/components/atlas/coupons/CouponStatsCards';
import { CouponFilters } from '@/components/atlas/coupons/CouponFilters';
import { CouponFilters as CouponFiltersType } from '@/types/coupon';

export default function CouponsPage() {
  const { user, atlasUser, loading } = useAtlasAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<CouponFiltersType>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Check authentication and authorization
  if (!user || !atlasUser || !atlasUser.isAtlasUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleCouponCreated = () => {
    setCreateDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFiltersChange = (newFilters: CouponFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
              <p className="mt-2 text-gray-600">
                Create and manage email-tied discount coupons
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>

          {/* Stats Cards */}
          <CouponStatsCards refreshTrigger={refreshTrigger} />

          {/* Filters */}
          <div className="mb-6">
            <CouponFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-lg shadow">
            <CouponListTable
              filters={filters}
              refreshTrigger={refreshTrigger}
              onCouponUpdated={() => setRefreshTrigger(prev => prev + 1)}
            />
          </div>

          {/* Create Coupon Dialog */}
          <CreateCouponDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onCouponCreated={handleCouponCreated}
          />
        </div>
      </div>
    </div>
  );
}
