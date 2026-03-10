'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = ''
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const {
    query,
    setQuery,
    history,
    suggestions,
    clearHistory,
    removeFromHistory,
    getPopularSearches,
    isValidQuery
  } = useSearch({ initialQuery });

  const popularSearches = getPopularSearches();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    if (isValidQuery(searchQuery)) {
      router.push(`/shops/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Handle history click
  const handleHistoryClick = (historyItem: { query: string }) => {
    setQuery(historyItem.query);
    handleSearch(historyItem.query);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by brand, product type, or title..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </form>
          
          <button
            onClick={onClose}
            className="ml-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Search Button */}
          {query.trim() && isValidQuery(query) && (
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => handleSearch(query)}
                className="w-full flex items-center justify-between p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Search size={20} />
                  <span className="font-medium">Search for "{query}"</span>
                </div>
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Search size={16} className="mr-2" />
                Suggestions
              </h3>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>{suggestion}</span>
                    <ArrowRight size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {history.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock size={16} className="mr-2" />
                  Recent Searches
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {history.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center group">
                    <button
                      onClick={() => handleHistoryClick(item)}
                      className="flex-1 text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{item.query}</span>
                        <div className="flex items-center space-x-2 text-gray-500">
                          <span className="text-xs">{item.resultsCount} results</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => removeFromHistory(item.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all ml-2"
                    >
                      <X size={16} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {(!query || query.length < 2) && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingUp size={16} className="mr-2" />
                Popular Searches
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!query && history.length === 0 && (
            <div className="p-8 text-center">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Search Products
              </h3>
              <p className="text-gray-600 mb-6">
                Find products by brand name, product type, or title
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Try searching for:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches.slice(0, 4).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm hover:bg-primary-200 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Search across all products, brands, and categories
          </p>
        </div>
      </div>
    </>
  );
};