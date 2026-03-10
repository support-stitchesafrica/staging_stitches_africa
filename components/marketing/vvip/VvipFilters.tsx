"use client";

import React, { useState } from 'react';
import { Filter, X, Calendar, Globe, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { VvipFiltersProps } from '@/types/vvip';
import { format } from 'date-fns';

/**
 * VvipFilters Component
 * 
 * Filter controls for VVIP shopper and order lists.
 * Requirements: 2.7, 2.8, 2.9
 */
export function VvipFilters({ 
  filters, 
  onFiltersChange, 
  availableCountries = [], 
  availableCreators = [] 
}: VvipFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: filters.dateRange?.start,
    end: filters.dateRange?.end
  });

  // Handle search query change
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value || undefined
    });
  };

  // Handle country filter change
  const handleCountryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      country: value === 'all' ? undefined : value
    });
  };

  // Handle creator filter change
  const handleCreatorChange = (value: string) => {
    onFiltersChange({
      ...filters,
      createdBy: value === 'all' ? undefined : value
    });
  };

  // Handle date range application
  const handleDateRangeApply = () => {
    onFiltersChange({
      ...filters,
      dateRange: tempDateRange.start && tempDateRange.end ? {
        start: tempDateRange.start,
        end: tempDateRange.end
      } : undefined
    });
    setIsDatePickerOpen(false);
  };

  // Handle date range clear
  const handleDateRangeClear = () => {
    setTempDateRange({ start: undefined, end: undefined });
    onFiltersChange({
      ...filters,
      dateRange: undefined
    });
    setIsDatePickerOpen(false);
  };

  // Clear all filters
  const handleClearAll = () => {
    setTempDateRange({ start: undefined, end: undefined });
    onFiltersChange({
      country: undefined,
      dateRange: undefined,
      createdBy: undefined,
      searchQuery: undefined
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.country,
    filters.dateRange,
    filters.createdBy,
    filters.searchQuery
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="search"
              placeholder="Search by name or email..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Country Filter */}
        <div className="space-y-2">
          <Label>Country</Label>
          <Select
            value={filters.country || 'all'}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="All countries" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {availableCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Creator Filter */}
        {availableCreators.length > 0 && (
          <div className="space-y-2">
            <Label>Created By</Label>
            <Select
              value={filters.createdBy || 'all'}
              onValueChange={handleCreatorChange}
            >
              <SelectTrigger>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="All creators" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {availableCreators.map((creator) => (
                  <SelectItem key={creator.id} value={creator.id}>
                    {creator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                {filters.dateRange ? (
                  <span>
                    {format(filters.dateRange.start, 'MMM dd, yyyy')} -{' '}
                    {format(filters.dateRange.end, 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={tempDateRange.start}
                        onSelect={(date) => setTempDateRange(prev => ({ ...prev, start: date }))}
                        disabled={(date) => 
                          date > new Date() || 
                          (tempDateRange.end && date > tempDateRange.end)
                        }
                        initialFocus
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={tempDateRange.end}
                        onSelect={(date) => setTempDateRange(prev => ({ ...prev, end: date }))}
                        disabled={(date) => 
                          date > new Date() || 
                          (tempDateRange.start && date < tempDateRange.start)
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleDateRangeApply}
                    disabled={!tempDateRange.start || !tempDateRange.end}
                    size="sm"
                    className="flex-1"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDateRangeClear}
                    size="sm"
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="pt-4 border-t space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.searchQuery && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Search: {filters.searchQuery}</span>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.country && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Country: {filters.country}</span>
                  <button
                    onClick={() => handleCountryChange('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.createdBy && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>
                    Creator: {availableCreators.find(c => c.id === filters.createdBy)?.name || filters.createdBy}
                  </span>
                  <button
                    onClick={() => handleCreatorChange('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.dateRange && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>
                    {format(filters.dateRange.start, 'MMM dd')} - {format(filters.dateRange.end, 'MMM dd')}
                  </span>
                  <button
                    onClick={handleDateRangeClear}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}