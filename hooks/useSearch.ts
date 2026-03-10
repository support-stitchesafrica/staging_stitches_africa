'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchService, SearchResult, SearchHistory, SearchFilters } from '@/lib/search-service';

export interface UseSearchOptions {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  autoSearch?: boolean;
}

export interface UseSearchReturn {
  // State
  query: string;
  results: SearchResult[];
  history: SearchHistory[];
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  performSearch: (searchQuery?: string) => Promise<void>;
  clearResults: () => void;
  clearHistory: () => void;
  removeFromHistory: (searchId: string) => void;
  
  // Helpers
  getSuggestions: (query: string) => Promise<string[]>;
  getPopularSearches: () => string[];
  isValidQuery: (query: string) => boolean;
}

/**
 * Hook for managing search functionality
 */
export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    initialQuery = '',
    initialFilters = {},
    autoSearch = false
  } = options;

  // State
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  // Load search history on mount
  useEffect(() => {
    setHistory(SearchService.getSearchHistory());
  }, []);

  // Auto-search when query or filters change
  useEffect(() => {
    if (autoSearch && query.trim()) {
      performSearch(query);
    }
  }, [query, filters, autoSearch]);

  // Update suggestions when query changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length >= 2) {
        const newSuggestions = await SearchService.getSearchSuggestions(query);
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
      }
    };
    
    getSuggestions();
  }, [query]);

  // Perform search
  const performSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    
    if (!SearchService.isValidQuery(queryToSearch)) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await SearchService.searchProducts(queryToSearch, filters);
      setResults(searchResults);
      
      // Update history
      setHistory(SearchService.getSearchHistory());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    SearchService.clearSearchHistory();
    setHistory([]);
  }, []);

  // Remove from history
  const removeFromHistory = useCallback((searchId: string) => {
    SearchService.removeSearchFromHistory(searchId);
    setHistory(SearchService.getSearchHistory());
  }, []);

  // Get suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    return await SearchService.getSearchSuggestions(searchQuery);
  }, []);

  // Get popular searches
  const getPopularSearches = useCallback(() => {
    return SearchService.getPopularSearches();
  }, []);

  // Check if query is valid
  const isValidQuery = useCallback((searchQuery: string) => {
    return SearchService.isValidQuery(searchQuery);
  }, []);

  return {
    // State
    query,
    results,
    history,
    suggestions,
    isLoading,
    error,
    filters,
    
    // Actions
    setQuery,
    setFilters,
    performSearch,
    clearResults,
    clearHistory,
    removeFromHistory,
    
    // Helpers
    getSuggestions,
    getPopularSearches,
    isValidQuery,
  };
};