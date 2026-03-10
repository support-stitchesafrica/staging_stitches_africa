'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  Crown, 
  Shield, 
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Users,
  Gift,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  isVvip?: boolean;
  country?: string;
  totalOrders?: number;
  totalSpent?: number;
}

/**
 * Modern VVIP Create Form Component
 * 
 * Advanced form for searching and creating VVIP shoppers with beautiful UI,
 * animations, and enhanced user experience.
 */
export default function VvipCreateForm() {
  const { firebaseUser } = useMarketingAuth();
  const [searchType, setSearchType] = useState<'email' | 'userId'>('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!firebaseUser) {
      toast.error('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`/api/marketing/vvip/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers || []);
        if (data.customers?.length === 0) {
          toast.info('No users found matching your search');
        } else {
          setStep('select');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to search users');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setStep('confirm');
  };

  // Handle VVIP creation
  const handleCreateVvip = async () => {
    if (!selectedUser) {
      toast.error('Please select a user first');
      return;
    }

    if (selectedUser.isVvip) {
      toast.error('This user is already a VVIP shopper');
      return;
    }

    if (!firebaseUser) {
      toast.error('Authentication required');
      return;
    }

    setCreating(true);
    try {
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch('/api/marketing/vvip/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          notes: notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'VVIP shopper created successfully');
        
        // Reset form
        setSelectedUser(null);
        setSearchResults([]);
        setSearchQuery('');
        setNotes('');
        setStep('search');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create VVIP shopper');
      }
    } catch (error) {
      console.error('Create VVIP error:', error);
      toast.error('Failed to create VVIP shopper');
    } finally {
      setCreating(false);
    }
  };

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Reset to search step
  const resetToSearch = () => {
    setStep('search');
    setSelectedUser(null);
    setSearchResults([]);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create VVIP Shopper
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Grant exclusive access to premium customers with manual payment options and priority support
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[
          { key: 'search', label: 'Search Customer', icon: Search },
          { key: 'select', label: 'Select User', icon: Users },
          { key: 'confirm', label: 'Confirm & Create', icon: Crown }
        ].map((stepItem, index) => {
          const isActive = step === stepItem.key;
          const isCompleted = ['search', 'select'].includes(stepItem.key) && step === 'confirm';
          const Icon = stepItem.icon;
          
          return (
            <div key={stepItem.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {stepItem.label}
              </span>
              {index < 2 && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Search Section */}
      {step === 'search' && (
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Search className="w-6 h-6 text-purple-600" />
              Find Your Customer
            </CardTitle>
            <CardDescription className="text-lg">
              Search by email address or user ID to find the customer you want to elevate to VVIP status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-900">Search Method</Label>
              <RadioGroup
                value={searchType}
                onValueChange={(value) => setSearchType(value as 'email' | 'userId')}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  searchType === 'email' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <RadioGroupItem value="email" id="email" />
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <Label htmlFor="email" className="font-medium cursor-pointer">Email Address</Label>
                  </div>
                </div>
                <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  searchType === 'userId' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <RadioGroupItem value="userId" id="userId" />
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <Label htmlFor="userId" className="font-medium cursor-pointer">User ID</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Search Input */}
            <div className="space-y-3">
              <Label htmlFor="search" className="text-base font-semibold text-gray-900">
                {searchType === 'email' ? 'Customer Email' : 'User ID'}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {searchType === 'email' ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <Input
                  id="search"
                  type={searchType === 'email' ? 'email' : 'text'}
                  placeholder={
                    searchType === 'email' 
                      ? 'customer@example.com' 
                      : 'Enter user ID...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-12 text-lg border-2 focus:border-purple-500 rounded-xl"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch} 
              disabled={loading || !searchQuery.trim()}
              className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search Customer
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Search Results */}
      {step === 'select' && searchResults.length > 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-purple-600" />
              Search Results ({searchResults.length})
            </CardTitle>
            <CardDescription className="text-lg">
              Select the customer you want to grant VVIP status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-purple-300 hover:bg-purple-50/50"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {user.isVvip && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {user.name || 'Unknown Name'}
                          </h3>
                          {user.isVvip && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              VVIP
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{user.email}</span>
                          </div>
                          
                          {user.country && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{user.country}</span>
                            </div>
                          )}
                          
                          {user.createdAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {user.totalOrders && (
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-gray-400" />
                              <span>{user.totalOrders} orders</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="flex items-center gap-3">
                      {user.isVvip ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Already VVIP
                        </Badge>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back Button */}
            <div className="mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={resetToSearch}
                className="w-full"
              >
                ← Back to Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && selectedUser && (
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Crown className="w-6 h-6 text-purple-600" />
              Grant VVIP Status
            </CardTitle>
            <CardDescription className="text-lg">
              Confirm granting exclusive VVIP privileges to this customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected User Preview */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{selectedUser.name || 'Unknown Name'}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              {selectedUser.isVvip && (
                <div className="flex items-center gap-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    This customer already has VVIP status
                  </span>
                </div>
              )}
            </div>

            {/* VVIP Benefits Preview */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                VVIP Benefits & Privileges
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: 'Manual Payment Access', desc: 'Bank transfer and offline payment options' },
                  { icon: Star, title: 'Priority Support', desc: 'Dedicated customer service and faster response' },
                  { icon: Gift, title: 'Exclusive Products', desc: 'Access to limited edition and premium items' },
                  { icon: Zap, title: 'Custom Orders', desc: 'Personalized and bespoke product requests' }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-green-900">{benefit.title}</h5>
                      <p className="text-sm text-green-700">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold text-gray-900">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about why this customer is being granted VVIP status..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] border-2 focus:border-purple-500 rounded-xl"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCreateVvip}
                disabled={creating || selectedUser.isVvip}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating VVIP...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Grant VVIP Status
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="px-8 h-12 rounded-xl"
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div className="space-y-3">
              <h5 className="font-semibold">Search Process:</h5>
              <ul className="space-y-1 list-disc list-inside">
                <li>Search by email address or user ID</li>
                <li>Review customer details and history</li>
                <li>Select the appropriate customer</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="font-semibold">After Granting VVIP:</h5>
              <ul className="space-y-1 list-disc list-inside">
                <li>Customer receives email notification</li>
                <li>Manual payment options become available</li>
                <li>Priority support access is activated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}