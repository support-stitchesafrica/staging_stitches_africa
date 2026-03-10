"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { CouponFilters as CouponFiltersType, CouponStatus } from '@/types/coupon';

interface CouponFiltersProps {
  filters: CouponFiltersType;
  onFiltersChange: (filters: CouponFiltersType) => void;
}

export function CouponFilters({ filters, onFiltersChange }: CouponFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CouponFiltersType>(filters);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      status: value === 'all' ? undefined : (value as CouponStatus)
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleEmailChange = (value: string) => {
    const newFilters = { ...localFilters, email: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStartDateChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      startDate: value ? new Date(value) : undefined
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleEndDateChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      endDate: value ? new Date(value) : undefined
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: CouponFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Status Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by coupon code or email..."
                value={localFilters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={localFilters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="USED">Used</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle Advanced Filters */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              {/* Email Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email
                </label>
                <Input
                  placeholder="Filter by email..."
                  value={localFilters.email || ''}
                  onChange={(e) => handleEmailChange(e.target.value)}
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Created From
                </label>
                <Input
                  type="date"
                  value={
                    localFilters.startDate
                      ? localFilters.startDate.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Created To
                </label>
                <Input
                  type="date"
                  value={
                    localFilters.endDate
                      ? localFilters.endDate.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
