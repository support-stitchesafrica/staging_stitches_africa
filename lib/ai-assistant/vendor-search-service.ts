/**
 * AI Assistant Vendor Search Service
 * 
 * Handles vendor/tailor search and filtering for the AI shopping assistant.
 * Queries Firestore tailors collection and applies AI-driven filters.
 * Optimized with caching for faster responses.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 13.3
 */

import { Tailor } from '@/types';
import { tailorRepository } from '@/lib/firestore';
import { cacheService, generateCacheKey } from './cache-service';
import { aiAssistantConfig } from './config';

/**
 * Vendor search filters that can be applied by the AI
 */
export interface VendorSearchFilters {
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  minRating?: number;
  type?: string[]; // e.g., ['Bespoke', 'Ready to Wear']
  featured?: boolean;
  minExperience?: number;
  status?: string;
  specialties?: string[];
}

/**
 * Formatted vendor result for AI responses
 */
export interface FormattedVendor {
  id: string;
  name: string;
  logo?: string;
  rating: number;
  location: string;
  city: string;
  state: string;
  country: string;
  specialties: string[];
  yearsOfExperience: number;
  status: string;
  shopUrl: string;
}

/**
 * Vendor Search Service for AI Assistant
 */
export class VendorSearchService {
  /**
   * Search vendors with optional filters (with caching)
   * 
   * @param query - Search query string (optional)
   * @param filters - Vendor filters (optional)
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of formatted vendors
   */
  static async searchVendors(
    query?: string,
    filters?: VendorSearchFilters,
    limit: number = 10
  ): Promise<FormattedVendor[]> {
    try {
      // Check cache if enabled
      if (aiAssistantConfig.features.caching) {
        const cacheKey = generateCacheKey('vendor_search', { query, filters, limit });
        const cached = cacheService.get<FormattedVendor[]>(cacheKey);
        
        if (cached) {
          return cached;
        }
      }

      // Get all vendors
      let vendors = await tailorRepository.getAll();

      // Filter out non-approved vendors by default
      vendors = vendors.filter(v => v.status === 'approved');

      // Apply text search if query provided
      if (query && query.trim().length > 0) {
        vendors = this.filterByQuery(vendors, query);
      }

      // Apply filters
      if (filters) {
        vendors = this.applyFilters(vendors, filters);
      }

      // Sort by relevance - featured first, then by rating
      vendors = this.sortByRelevance(vendors);

      // Limit results
      vendors = vendors.slice(0, limit);

      // Format vendors for AI response
      const formatted = vendors.map(vendor => this.formatVendor(vendor));

      // Cache results if enabled
      if (aiAssistantConfig.features.caching) {
        const cacheKey = generateCacheKey('vendor_search', { query, filters, limit });
        cacheService.set(cacheKey, formatted, aiAssistantConfig.cache.vendorSearchTTL);
      }

      return formatted;
    } catch (error) {
      console.error('Error searching vendors:', error);
      throw new Error('Failed to search vendors');
    }
  }

  /**
   * Get vendor by ID
   * 
   * @param vendorId - Vendor/tailor ID
   * @returns Formatted vendor or null
   */
  static async getById(vendorId: string): Promise<FormattedVendor | null> {
    try {
      const vendor = await tailorRepository.getById(vendorId);
      if (!vendor) return null;
      return this.formatVendor(vendor);
    } catch (error) {
      console.error('Error getting vendor by ID:', error);
      throw new Error('Failed to get vendor by ID');
    }
  }

  /**
   * Get multiple vendors by IDs
   * 
   * @param vendorIds - Array of vendor IDs
   * @returns Array of formatted vendors
   */
  static async getByIds(vendorIds: string[]): Promise<FormattedVendor[]> {
    try {
      if (!vendorIds || vendorIds.length === 0) {
        return [];
      }

      const vendors = await Promise.all(
        vendorIds.map(id => tailorRepository.getById(id))
      );

      return vendors
        .filter((vendor): vendor is Tailor => vendor !== null)
        .map(vendor => this.formatVendor(vendor));
    } catch (error) {
      console.error('Error getting vendors by IDs:', error);
      throw new Error('Failed to get vendors by IDs');
    }
  }

  /**
   * Get featured vendors
   * 
   * @param limit - Maximum number of results
   * @returns Array of formatted vendors
   */
  static async getFeaturedVendors(limit: number = 10): Promise<FormattedVendor[]> {
    try {
      const vendors = await tailorRepository.getFeaturedTailors();
      const limitedVendors = vendors.slice(0, limit);
      return limitedVendors.map(vendor => this.formatVendor(vendor));
    } catch (error) {
      console.error('Error getting featured vendors:', error);
      throw new Error('Failed to get featured vendors');
    }
  }

  /**
   * Get vendors by location
   * 
   * @param city - City name
   * @param state - State name (optional)
   * @param limit - Maximum number of results
   * @returns Array of formatted vendors
   */
  static async getByLocation(
    city?: string,
    state?: string,
    limit: number = 10
  ): Promise<FormattedVendor[]> {
    try {
      let vendors = await tailorRepository.getAll();
      
      // Filter by approved status
      vendors = vendors.filter(v => v.status === 'approved');

      // Filter by city
      if (city) {
        const cityLower = city.toLowerCase();
        vendors = vendors.filter(v => 
          v.city?.toLowerCase().includes(cityLower)
        );
      }

      // Filter by state
      if (state) {
        const stateLower = state.toLowerCase();
        vendors = vendors.filter(v => 
          v.state?.toLowerCase().includes(stateLower)
        );
      }

      // Sort by rating
      vendors = this.sortByRelevance(vendors);

      // Limit results
      vendors = vendors.slice(0, limit);

      return vendors.map(vendor => this.formatVendor(vendor));
    } catch (error) {
      console.error('Error getting vendors by location:', error);
      throw new Error('Failed to get vendors by location');
    }
  }

  /**
   * Get top-rated vendors
   * 
   * @param limit - Maximum number of results
   * @returns Array of formatted vendors
   */
  static async getTopRated(limit: number = 10): Promise<FormattedVendor[]> {
    try {
      let vendors = await tailorRepository.getAll();
      
      // Filter by approved status
      vendors = vendors.filter(v => v.status === 'approved');

      // Sort by rating (descending)
      vendors = vendors.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));

      // Limit results
      vendors = vendors.slice(0, limit);

      return vendors.map(vendor => this.formatVendor(vendor));
    } catch (error) {
      console.error('Error getting top-rated vendors:', error);
      throw new Error('Failed to get top-rated vendors');
    }
  }

  /**
   * Filter vendors by search query
   * 
   * @param vendors - Array of vendors
   * @param query - Search query
   * @returns Filtered vendors
   */
  private static filterByQuery(vendors: Tailor[], query: string): Tailor[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return vendors.filter(vendor => {
      const searchableText = [
        vendor.brandName,
        vendor.first_name,
        vendor.last_name,
        vendor.city,
        vendor.state,
        vendor.country,
        vendor.address,
        ...(vendor.type || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Check if any search term matches
      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  /**
   * Apply filters to vendors
   * 
   * @param vendors - Array of vendors
   * @param filters - Vendor filters
   * @returns Filtered vendors
   */
  private static applyFilters(vendors: Tailor[], filters: VendorSearchFilters): Tailor[] {
    let filtered = vendors;

    // Filter by location
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(v =>
        v.city?.toLowerCase().includes(locationLower) ||
        v.state?.toLowerCase().includes(locationLower) ||
        v.country?.toLowerCase().includes(locationLower) ||
        v.address?.toLowerCase().includes(locationLower)
      );
    }

    // Filter by city
    if (filters.city) {
      const cityLower = filters.city.toLowerCase();
      filtered = filtered.filter(v =>
        v.city?.toLowerCase().includes(cityLower)
      );
    }

    // Filter by state
    if (filters.state) {
      const stateLower = filters.state.toLowerCase();
      filtered = filtered.filter(v =>
        v.state?.toLowerCase().includes(stateLower)
      );
    }

    // Filter by country
    if (filters.country) {
      const countryLower = filters.country.toLowerCase();
      filtered = filtered.filter(v =>
        v.country?.toLowerCase().includes(countryLower)
      );
    }

    // Filter by minimum rating
    if (filters.minRating !== undefined) {
      filtered = filtered.filter(v => (v.ratings || 0) >= filters.minRating!);
    }

    // Filter by type
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(v =>
        filters.type!.some(filterType =>
          v.type?.some(vendorType => 
            vendorType.toLowerCase().includes(filterType.toLowerCase())
          )
        )
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(v => v.status === filters.status);
    }

    // Filter by minimum experience
    if (filters.minExperience !== undefined) {
      filtered = filtered.filter(v => 
        (v.yearsOfExperience || 0) >= filters.minExperience!
      );
    }

    // Filter by specialties
    if (filters.specialties && filters.specialties.length > 0) {
      filtered = filtered.filter(v =>
        filters.specialties!.some(specialty =>
          v.type?.some(vendorType => 
            vendorType.toLowerCase().includes(specialty.toLowerCase())
          )
        )
      );
    }

    return filtered;
  }

  /**
   * Sort vendors by relevance
   * 
   * @param vendors - Array of vendors
   * @returns Sorted vendors
   */
  private static sortByRelevance(vendors: Tailor[]): Tailor[] {
    return vendors.sort((a, b) => {
      // Approved vendors first
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      
      // Then by rating (descending)
      const aRating = a.ratings || 0;
      const bRating = b.ratings || 0;
      if (aRating !== bRating) return bRating - aRating;
      
      // Then by years of experience (descending)
      const aExperience = a.yearsOfExperience || 0;
      const bExperience = b.yearsOfExperience || 0;
      return bExperience - aExperience;
    });
  }

  /**
   * Format vendor for AI response
   * 
   * @param vendor - Raw vendor from database
   * @returns Formatted vendor
   */
  private static formatVendor(vendor: Tailor): FormattedVendor {
    return {
      id: vendor.id,
      name: vendor.brandName || `${vendor.first_name} ${vendor.last_name}`.trim(),
      logo: vendor.brand_logo,
      rating: vendor.ratings || 0,
      location: `${vendor.city}, ${vendor.state}`.trim(),
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || '',
      specialties: vendor.type || [],
      yearsOfExperience: vendor.yearsOfExperience || 0,
      status: vendor.status || 'pending',
      shopUrl: `/vendor/${vendor.id}`,
    };
  }

  /**
   * Get available vendor types/specialties
   * 
   * @returns Array of unique vendor types
   */
  static async getVendorTypes(): Promise<string[]> {
    try {
      const vendors = await tailorRepository.getAll();
      const types = new Set<string>();

      vendors.forEach(vendor => {
        if (vendor.type && Array.isArray(vendor.type)) {
          vendor.type.forEach(t => types.add(t));
        }
      });

      return Array.from(types).sort();
    } catch (error) {
      console.error('Error getting vendor types:', error);
      throw new Error('Failed to get vendor types');
    }
  }

  /**
   * Get available locations
   * 
   * @returns Object with arrays of unique cities and states
   */
  static async getLocations(): Promise<{ cities: string[]; states: string[] }> {
    try {
      const vendors = await tailorRepository.getAll();
      const cities = new Set<string>();
      const states = new Set<string>();

      vendors.forEach(vendor => {
        if (vendor.city) cities.add(vendor.city);
        if (vendor.state) states.add(vendor.state);
      });

      return {
        cities: Array.from(cities).sort(),
        states: Array.from(states).sort(),
      };
    } catch (error) {
      console.error('Error getting locations:', error);
      throw new Error('Failed to get locations');
    }
  }
}
