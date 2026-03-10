'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Crown,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { toast } from 'sonner';

/**
 * VVIP Creation Page
 * 
 * Allows authorized users to search for customers and grant them VVIP status.
 * Includes user search by email and ID, with confirmation dialog.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.9, 10.2
 */

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  isVvip?: boolean;
  registrationDate?: string;
}

export default function VvipCreatePage() {
  const router = useRouter();
  const { marketingUser } = useMarketingAuth();
  
  // Search state
  const [searchType, setSearchType] = useState<'email' | 'userId'>('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Selected user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreatingVvip, setIsCreatingVvip] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/marketing/vvip/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          searchType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }

      if (data.users && data.users.length > 0) {
        setSearchResults(data.users);
      } else {
        setSearchError('No users found matching your search criteria');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (user: User) => {
    if (user.isVvip) {
      toast.error('This user is already a VVIP shopper');
      return;
    }
    
    setSelectedUser(user);
    setShowConfirmation(true);
  };

  // Handle VVIP creation
  const handleCreateVvip = async () => {
    if (!selectedUser) return;

    setIsCreatingVvip(true);

    try {
      const response = await fetch('/api/marketing/vvip/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create VVIP shopper');
      }

      toast.success('VVIP shopper created successfully!');
      
      // Reset form
      setSelectedUser(null);
      setShowConfirmation(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Redirect to shoppers list
      router.push('/marketing/vvip/shoppers');
    } catch (error) {
      console.error('VVIP creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create VVIP shopper');
    } finally {
      setIsCreatingVvip(false);
    }
  };

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create VVIP Shopper</h1>
          <p className="text-gray-600 mt-2">Search for a customer and grant them VVIP status</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Customer
          </CardTitle>
          <CardDescription>
            Find a customer by email address or user ID to grant VVIP status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Selection */}
          <div className="space-y-3">
            <Label>Search by</Label>
            <RadioGroup
              value={searchType}
              onValueChange={(value) => setSearchType(value as 'email' | 'userId')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email">Email Address</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="userId" id="userId" />
                <Label htmlFor="userId">User ID</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">
              {searchType === 'email' ? 'Email Address' : 'User ID'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                type={searchType === 'email' ? 'email' : 'text'}
                placeholder={
                  searchType === 'email' 
                    ? 'Enter customer email address...' 
                    : 'Enter user ID...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Search Error */}
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 rounded-full p-2">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : 'Name not available'
                        }
                        {user.isVvip && (
                          <Crown className="w-4 h-4 text-yellow-500 inline ml-2" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {user.country}
                          </span>
                        )}
                        {user.registrationDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.registrationDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isVvip ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Crown className="w-4 h-4" />
                        <span className="text-sm font-medium">Already VVIP</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleSelectUser(user)}
                        className="flex items-center gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        Grant VVIP
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && selectedUser && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Crown className="w-5 h-5" />
              Confirm VVIP Status
            </CardTitle>
            <CardDescription className="text-blue-700">
              You are about to grant VVIP status to this customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Details */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-lg">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : 'Name not available'
                    }
                  </div>
                  <div className="text-gray-600 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </span>
                    {selectedUser.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedUser.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* VVIP Benefits Info */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This customer will gain access to manual payment options and priority handling.
                They will receive an email notification about their new VVIP status.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreateVvip}
                disabled={isCreatingVvip}
                className="flex items-center gap-2"
              >
                {isCreatingVvip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {isCreatingVvip ? 'Creating...' : 'Confirm & Create VVIP'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedUser(null);
                }}
                disabled={isCreatingVvip}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}