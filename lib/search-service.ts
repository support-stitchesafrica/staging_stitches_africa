/**
 * Search service for handling product searches with history
 */

import { productRepository } from './firestore';
import { Product } from '@/types';

export interface SearchResult {
  enableMultiplePricing: any;
  individualItems: any;
  id: string;
  title: string;
  brandName?: string;
  productType: string;
  price: number | { base: number; currency?: string };
  images: string[];
  description?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  tailor?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultsCount: number;
}

export interface SearchFilters {
  brandName?: string;
  productType?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class SearchService {
  private static readonly SEARCH_HISTORY_KEY = 'stitches_search_history';
  private static readonly MAX_HISTORY_ITEMS = 20;

  /**
   * Search products by query with filters
   */
  static async searchProducts(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    try {
      // Get all products from the tailor_works collection
      const products = await productRepository.getAll();
      console.log('Products fetched for search:', products.length);
      
      // Convert products to search results and filter
      const searchResults: SearchResult[] = products
        .filter(product => {
          // Only include verified and in-stock products
          if (product.status !== 'verified') return false;
          if (product.availability) {
            const availability = product.availability.toLowerCase();
            if (availability === 'out_of_stock' || availability === 'out of stock') return false;
          }
          
          const searchQuery = query.toLowerCase().trim();
          
          // If no search query, return all products (for browsing)
          if (!searchQuery) return true;
          
          // Comprehensive search across multiple fields
          const queryMatch = 
            // Product title/name
            product.title?.toLowerCase().includes(searchQuery) ||
            // Product description - search for keywords within description
            product.description?.toLowerCase().includes(searchQuery) ||
            // Product category
            product.category?.toLowerCase().includes(searchQuery) ||
            // Product tags
            (product.tags && Array.isArray(product.tags) && 
             product.tags.some(tag => tag.toLowerCase().includes(searchQuery))) ||
            // Product keywords
            (product.keywords && Array.isArray(product.keywords) && 
             product.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))) ||
            // Tailor/brand name
            product.tailor?.toLowerCase().includes(searchQuery) ||
            // Product type
            product.type?.toLowerCase().includes(searchQuery) ||
            // Wear category
            product.wear_category?.toLowerCase().includes(searchQuery) ||
            // RTW options (fabric, season, etc.)
            (product.rtwOptions?.fabric?.toLowerCase().includes(searchQuery)) ||
            (product.rtwOptions?.season?.toLowerCase().includes(searchQuery)) ||
            // Bespoke options
            (product.bespokeOptions?.customization?.fabricChoices?.some((fabric: string) => 
              fabric.toLowerCase().includes(searchQuery))) ||
            (product.bespokeOptions?.customization?.styleOptions?.some((style: string) => 
              style.toLowerCase().includes(searchQuery)));

          // Filter by brand name
          const brandMatch = !filters.brandName || 
            product.tailor?.toLowerCase().includes(filters.brandName.toLowerCase());

          // Filter by product type
          const typeMatch = !filters.productType || 
            product.type === filters.productType;

          // Filter by category
          const categoryMatch = !filters.category || 
            product.category?.toLowerCase() === filters.category.toLowerCase();

          // Filter by price range
          const productPrice = typeof product.price === 'number' ? product.price : 
                              (product.price && typeof product.price === 'object' && product.price.base) ? 
                              product.price.base : 0;
          const priceMatch = (!filters.minPrice || productPrice >= filters.minPrice) &&
            (!filters.maxPrice || productPrice <= filters.maxPrice);

          return queryMatch && brandMatch && typeMatch && categoryMatch && priceMatch;
        })
        .map(product => {
          // Preserve price object with currency if available
          let priceValue: number | { base: number; currency?: string };
          if (typeof product.price === 'number') {
            priceValue = product.price;
          } else if (product.price && typeof product.price === 'object') {
            priceValue = {
              base: product.price.base || 0,
              currency: product.price.currency || 'USD'
            };
          } else {
            priceValue = 0;
          }

          return {
            id: product.product_id,
            title: product.title || 'Untitled Product',
            brandName: product.tailor || 'Unknown Brand',
            productType: product.type || 'unknown',
            price: priceValue,
            images: product.images || [],
            description: product.description || '',
            category: product.category || '',
            tags: product.tags || [],
            keywords: product.keywords || [],
            tailor: product.tailor || ''
          };
        })
        .sort((a, b) => {
          // Sort by relevance - exact title matches first, then by price
          const aExactMatch = a.title.toLowerCase() === query.toLowerCase();
          const bExactMatch = b.title.toLowerCase() === query.toLowerCase();
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          // Then sort by price (ascending)
          const aPrice = typeof a.price === 'number' ? a.price : a.price.base;
          const bPrice = typeof b.price === 'number' ? b.price : b.price.base;
          return aPrice - bPrice;
        });

      // Save search to history if query is not empty
      if (query.trim()) {
        this.saveSearchToHistory(query, searchResults.length);
      }

      return searchResults;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get search suggestions based on query
   */
  static async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      // Get products to build suggestions from real data
      const products = await productRepository.getAll();
      
      const suggestions = new Set<string>();
      const searchQuery = query.toLowerCase();

      products.forEach(product => {
        // Add matching titles
        if (product.title?.toLowerCase().includes(searchQuery)) {
          suggestions.add(product.title);
        }
        
        // Add matching brand names
        if (product.tailor?.toLowerCase().includes(searchQuery)) {
          suggestions.add(product.tailor);
        }
        
        // Add matching categories
        if (product.category?.toLowerCase().includes(searchQuery)) {
          suggestions.add(product.category);
        }
        
        // Add matching tags
        if (product.tags && Array.isArray(product.tags)) {
          product.tags.forEach(tag => {
            if (tag.toLowerCase().includes(searchQuery)) {
              suggestions.add(tag);
            }
          });
        }
        
        // Add matching keywords
        if (product.keywords && Array.isArray(product.keywords)) {
          product.keywords.forEach(keyword => {
            if (keyword.toLowerCase().includes(searchQuery)) {
              suggestions.add(keyword);
            }
          });
        }
      });

      return Array.from(suggestions).slice(0, 8);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      
      // Fallback to static suggestions
      const fallbackSuggestions = [
        'Ankara dress',
        'Agbada',
        'Kente cloth',
        'Dashiki',
        'Traditional wear',
        'Ready to wear',
        'Bespoke tailoring',
        'Wedding dress'
      ];

      return fallbackSuggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8);
    }
  }

  /**
   * Save search query to history
   */
  static saveSearchToHistory(query: string, resultsCount: number): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      
      // Remove existing entry with same query
      const filteredHistory = history.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new entry at the beginning
      const newEntry: SearchHistory = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
        resultsCount
      };

      const updatedHistory = [newEntry, ...filteredHistory]
        .slice(0, this.MAX_HISTORY_ITEMS);

      localStorage.setItem(
        this.SEARCH_HISTORY_KEY, 
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  /**
   * Get search history
   */
  static getSearchHistory(): SearchHistory[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  static clearSearchHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  /**
   * Remove specific search from history
   */
  static removeSearchFromHistory(searchId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getSearchHistory();
      const updatedHistory = history.filter(item => item.id !== searchId);
      
      localStorage.setItem(
        this.SEARCH_HISTORY_KEY, 
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error('Error removing search from history:', error);
    }
  }

  /**
   * Get popular searches (mock data)
   */
  static getPopularSearches(): string[] {
    return [
      'Ankara dress',
      'Traditional wear',
      'Wedding attire',
      'Casual African wear',
      'Bespoke suits',
      'Kente accessories',
      'Modern African fashion',
      'Ready to wear'
    ];
  }

  /**
   * Get search categories
   */
  static getSearchCategories(): Array<{ id: string; name: string; count?: number }> {
    return [
      { id: 'dresses', name: 'Dresses', count: 45 },
      { id: 'traditional', name: 'Traditional Wear', count: 32 },
      { id: 'casual', name: 'Casual Wear', count: 28 },
      { id: 'formal', name: 'Formal Wear', count: 19 },
      { id: 'accessories', name: 'Accessories', count: 15 },
      { id: 'footwear', name: 'Footwear', count: 12 }
    ];
  }

  /**
   * Format search query for display
   */
  static formatSearchQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ');
  }

  /**
   * Check if query is valid
   */
  static isValidQuery(query: string): boolean {
    return query.trim().length >= 2;
  }
}