"use client";

import React, { useState, useCallback } from 'react';
import { Search, User, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { UserSearchFormProps } from '@/types/vvip';

interface SearchResult {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVvip?: boolean;
}

/**
 * UserSearchForm Component
 * 
 * Form for searching users by email or user ID for VVIP creation.
 * Requirements: 1.2, 1.3
 */
export function UserSearchForm({ 
  onUserSelected, 
  searchType: initialSearchType = 'email' 
}: UserSearchFormProps) {
  const [searchType, setSearchType] = useState<'email' | 'userId'>(initialSearchType);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (query: string, type: 'email' | 'userId') => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Get Firebase ID token for authentication
      const { auth } = await import('@/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/marketing/vvip/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          query: query.trim(),
          searchType: type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.users || []);
        setHasSearched(true);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, searchType);
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    onUserSelected(userId);
  };

  // Validate search input
  const isValidInput = () => {
    if (!searchQuery.trim()) return false;
    
    if (searchType === 'email') {
      // Basic email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchQuery.trim());
    } else {
      // User ID should not be empty
      return searchQuery.trim().length > 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Search Users</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search Type Selection */}
        <div className="space-y-3">
          <Label>Search Method</Label>
          <RadioGroup
            value={searchType}
            onValueChange={(value) => setSearchType(value as 'email' | 'userId')}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="userId" id="userId" />
              <Label htmlFor="userId" className="flex items-center space-x-2 cursor-pointer">
                <User className="w-4 h-4" />
                <span>User ID</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchQuery">
              {searchType === 'email' ? 'Email Address' : 'User ID'}
            </Label>
            <div className="flex space-x-2">
              <Input
                id="searchQuery"
                type={searchType === 'email' ? 'email' : 'text'}
                placeholder={
                  searchType === 'email' 
                    ? 'Enter user email address...' 
                    : 'Enter user ID...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!isValidInput() || isSearching}
                className="px-6"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Search Results</Label>
              <span className="text-sm text-muted-foreground">
                {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No users found matching your search</p>
                <p className="text-sm">Try a different {searchType === 'email' ? 'email address' : 'user ID'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email
                            }
                          </p>
                          {user.isVvip && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Already VVIP
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.userId}</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleUserSelect(user.userId)}
                      disabled={user.isVvip}
                      variant={user.isVvip ? "outline" : "default"}
                      size="sm"
                    >
                      {user.isVvip ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Already VVIP
                        </>
                      ) : (
                        'Select User'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Instructions */}
        {!hasSearched && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Search className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Search Instructions</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use email search to find users by their registered email address</li>
                  <li>• Use user ID search to find users by their unique identifier</li>
                  <li>• Users who are already VVIP will be marked and cannot be selected again</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}