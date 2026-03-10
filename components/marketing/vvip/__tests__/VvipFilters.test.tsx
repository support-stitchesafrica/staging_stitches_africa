import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VvipFilters } from '../VvipFilters';
import { VvipFilters as VvipFiltersType } from '@/types/vvip';

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, yyyy') return 'Jan 01, 2024';
    if (formatStr === 'MMM dd') return 'Jan 01';
    return 'Jan 01, 2024';
  }),
}));

describe('VvipFilters', () => {
  const mockOnFiltersChange = vi.fn();
  
  const defaultFilters: VvipFiltersType = {
    country: undefined,
    dateRange: undefined,
    createdBy: undefined,
    searchQuery: undefined,
  };

  const availableCountries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa'];
  const availableCreators = [
    { id: 'admin-1', name: 'John Admin' },
    { id: 'admin-2', name: 'Jane Manager' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render filters component with all filter options', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
      expect(screen.getByText('All Countries')).toBeInTheDocument();
      expect(screen.getByText('All Creators')).toBeInTheDocument();
      expect(screen.getByText('Select date range')).toBeInTheDocument();
    });

    it('should show active filter count when filters are applied', () => {
      const filtersWithValues: VvipFiltersType = {
        country: 'Nigeria',
        searchQuery: 'test',
        dateRange: undefined,
        createdBy: undefined,
      };

      render(
        <VvipFilters
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      expect(screen.getByText('2 active')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should not show creator filter when no creators are available', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={[]}
        />
      );

      expect(screen.queryByText('Created By')).not.toBeInTheDocument();
    });
  });

  describe('Search Filter', () => {
    it('should update search query when input changes', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        searchQuery: 'test search',
      });
    });

    it('should clear search query when empty string is entered', () => {
      const filtersWithSearch: VvipFiltersType = {
        ...defaultFilters,
        searchQuery: 'existing search',
      };

      render(
        <VvipFilters
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      const searchInput = screen.getByDisplayValue('existing search');
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithSearch,
        searchQuery: undefined,
      });
    });
  });

  describe('Country Filter', () => {
    it('should update country filter when selection changes', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      // Open the select dropdown
      fireEvent.click(screen.getAllByText('All Countries')[0]);
      
      // Select Nigeria
      fireEvent.click(screen.getByText('Nigeria'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        country: 'Nigeria',
      });
    });

    it('should clear country filter when "All Countries" is selected', () => {
      const filtersWithCountry: VvipFiltersType = {
        ...defaultFilters,
        country: 'Nigeria',
      };

      render(
        <VvipFilters
          filters={filtersWithCountry}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      // Open the select dropdown
      fireEvent.click(screen.getByText('Nigeria'));
      
      // Select All Countries
      fireEvent.click(screen.getAllByText('All Countries')[0]);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithCountry,
        country: undefined,
      });
    });
  });

  describe('Creator Filter', () => {
    it('should update creator filter when selection changes', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      // Open the select dropdown
      fireEvent.click(screen.getAllByText('All Creators')[0]);
      
      // Select John Admin
      fireEvent.click(screen.getByText('John Admin'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        createdBy: 'admin-1',
      });
    });

    it('should clear creator filter when "All Creators" is selected', () => {
      const filtersWithCreator: VvipFiltersType = {
        ...defaultFilters,
        createdBy: 'admin-1',
      };

      render(
        <VvipFilters
          filters={filtersWithCreator}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      // Open the select dropdown
      fireEvent.click(screen.getByText('John Admin'));
      
      // Select All Creators
      fireEvent.click(screen.getAllByText('All Creators')[0]);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithCreator,
        createdBy: undefined,
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should open date picker when date range button is clicked', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      fireEvent.click(screen.getByText('Select date range'));
      
      expect(screen.getByText('Select Date Range')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
    });

    it('should show formatted date range when dates are selected', () => {
      const filtersWithDateRange: VvipFiltersType = {
        ...defaultFilters,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      render(
        <VvipFilters
          filters={filtersWithDateRange}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      expect(screen.getByText('Jan 01, 2024 - Jan 01, 2024')).toBeInTheDocument();
    });

    it('should clear date range when Clear button is clicked', () => {
      const filtersWithDateRange: VvipFiltersType = {
        ...defaultFilters,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      render(
        <VvipFilters
          filters={filtersWithDateRange}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      // Open date picker
      fireEvent.click(screen.getByText('Jan 01, 2024 - Jan 01, 2024'));
      
      // Click Clear button
      fireEvent.click(screen.getByText('Clear'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithDateRange,
        dateRange: undefined,
      });
    });
  });

  describe('Active Filters Summary', () => {
    it('should show active filters with remove buttons', () => {
      const filtersWithMultipleValues: VvipFiltersType = {
        country: 'Nigeria',
        searchQuery: 'test search',
        createdBy: 'admin-1',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      render(
        <VvipFilters
          filters={filtersWithMultipleValues}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      expect(screen.getByText('Active Filters')).toBeInTheDocument();
      expect(screen.getByText('Search: test search')).toBeInTheDocument();
      expect(screen.getByText('Country: Nigeria')).toBeInTheDocument();
      expect(screen.getByText('Creator: John Admin')).toBeInTheDocument();
      expect(screen.getByText('Jan 01 - Jan 01')).toBeInTheDocument();
    });

    it('should remove individual filters when X button is clicked', () => {
      const filtersWithSearch: VvipFiltersType = {
        ...defaultFilters,
        searchQuery: 'test search',
      };

      render(
        <VvipFilters
          filters={filtersWithSearch}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      // Find and click the X button next to the search filter
      const searchBadge = screen.getByText('Search: test search').closest('div');
      const removeButton = searchBadge?.querySelector('button');
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithSearch,
        searchQuery: undefined,
      });
    });
  });

  describe('Clear All Functionality', () => {
    it('should clear all filters when Clear All button is clicked', () => {
      const filtersWithMultipleValues: VvipFiltersType = {
        country: 'Nigeria',
        searchQuery: 'test search',
        createdBy: 'admin-1',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      };

      render(
        <VvipFilters
          filters={filtersWithMultipleValues}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      fireEvent.click(screen.getByText('Clear All'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        country: undefined,
        dateRange: undefined,
        createdBy: undefined,
        searchQuery: undefined,
      });
    });

    it('should not show Clear All button when no filters are active', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={availableCreators}
        />
      );

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty available countries array', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={[]}
          availableCreators={availableCreators}
        />
      );

      fireEvent.click(screen.getAllByText('All Countries')[0]);
      
      // Should only show "All Countries" option
      expect(screen.getAllByText('All Countries').length).toBeGreaterThan(0);
      expect(screen.queryByText('Nigeria')).not.toBeInTheDocument();
    });

    it('should handle missing creator name gracefully', () => {
      const creatorsWithMissingName = [
        { id: 'admin-1', name: 'John Admin' },
        { id: 'admin-2', name: '' },
      ];

      const filtersWithUnknownCreator: VvipFiltersType = {
        ...defaultFilters,
        createdBy: 'admin-2',
      };

      render(
        <VvipFilters
          filters={filtersWithUnknownCreator}
          onFiltersChange={mockOnFiltersChange}
          availableCountries={availableCountries}
          availableCreators={creatorsWithMissingName}
        />
      );

      // Should fall back to showing the ID when name is not found
      expect(screen.getByText('Creator: admin-2')).toBeInTheDocument();
    });

    it('should handle undefined availableCountries and availableCreators', () => {
      render(
        <VvipFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getAllByText('All Countries')[0]).toBeInTheDocument();
      expect(screen.queryByText('Created By')).not.toBeInTheDocument();
    });
  });
});