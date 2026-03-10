'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  TrendingUp,
  Plus,
  ArrowLeft,
  BarChart3,
  Activity,
  Star,
  CreditCard,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { VvipStatistics } from '@/types/vvip';
import { toast } from 'sonner';

// Import components for different tabs
import VvipCreateForm from '@/components/marketing/vvip/VvipCreateForm';
import VvipShoppersList from '@/components/marketing/vvip/VvipShoppersList';
import dynamic from 'next/dynamic';

// Dynamic import for VvipOrdersList
const VvipOrdersList = dynamic(() => import('@/components/marketing/vvip/VvipOrdersList'), {
  loading: () => <div className="animate-pulse bg-gray-100 h-64 rounded-lg"></div>
});

/**
 * Modern VVIP Program Dashboard
 * 
 * A sleek, contemporary interface for managing VVIP shoppers and orders
 * with real-time statistics and analytics from Firebase.
 */
export default function VvipModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { marketingUser, firebaseUser } = useMarketingAuth();
  const [statistics, setStatistics] = useState<VvipStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState({
    canCreateVvip: false,
    canRevokeVvip: false,
    canApprovePayment: false,
    canViewVvipOrders: false,
    userRole: 'none' as string,
  });

  // Get active tab from URL params or default to overview
  const activeTab = searchParams.get('tab') || 'overview';

  // Load VVIP statistics and user permissions
  useEffect(() => {
    const loadData = async () => {
      // Wait for both marketing user and firebase user to be available
      if (!marketingUser?.uid || !firebaseUser) {
        console.log('Waiting for authentication...', { 
          marketingUser: !!marketingUser, 
          firebaseUser: !!firebaseUser 
        });
        return;
      }

      try {
        setLoading(true);
        console.log('Loading VVIP data for user:', marketingUser.email);

        // Get Firebase ID token for authentication with force refresh
        const idToken = await firebaseUser.getIdToken(true);
        console.log('Got ID token, length:', idToken.length);

        // Load user permissions
        console.log('Fetching VVIP permissions...');
        const permissionsResponse = await fetch('/api/marketing/vvip/permissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        });

        console.log('Permissions response status:', permissionsResponse.status);

        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          console.log('Permissions loaded:', permissionsData);
          setUserPermissions(permissionsData);
        } else {
          const errorText = await permissionsResponse.text();
          console.error('Failed to load permissions:', permissionsResponse.status, errorText);
          toast.error(`Failed to load user permissions: ${permissionsResponse.status}`);
          
          // If unauthorized, redirect to login
          if (permissionsResponse.status === 401) {
            console.log('Unauthorized - redirecting to login');
            router.push('/marketing/auth/login');
            return;
          }
        }

        // Load statistics
        try {
          console.log('Fetching VVIP statistics...');
          const statsResponse = await fetch('/api/marketing/vvip/statistics', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
          });

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('Statistics loaded:', statsData.statistics);
            setStatistics(statsData.statistics);
          } else {
            console.log('Statistics not available:', statsResponse.status);
          }
        } catch (error) {
          console.log('Statistics endpoint error:', error);
        }
      } catch (error) {
        console.error('Error loading VVIP data:', error);
        toast.error('Failed to load VVIP dashboard data');
        
        // If it's an auth error, redirect to login
        if (error instanceof Error && error.message.includes('auth')) {
          router.push('/marketing/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure auth context is fully loaded
    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, [marketingUser?.uid, firebaseUser, router]);

  // Tab change handler
  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    router.push(url.pathname + url.search);
  };

  // Back to marketing dashboard
  const handleBackToDashboard = () => {
    router.push('/marketing');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={handleBackToDashboard} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VVIP Shopper Program
              </h1>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 mb-6">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Authentication Required</h2>
            <p className="text-gray-600 max-w-md mb-6">
              Please log in to access VVIP features and manage exclusive shoppers.
            </p>
            <Button 
              onClick={() => router.push('/marketing/auth/login')} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No permissions state
  if (!userPermissions.canViewVvipOrders && userPermissions.userRole === 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={handleBackToDashboard} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VVIP Shopper Program
              </h1>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-full p-6 mb-6">
              <Users className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Access Restricted</h2>
            <p className="text-gray-600 max-w-md">
              You don't have permission to access VVIP features. Please contact your administrator if you need access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Modern Overview Content Renderer
  const renderModernOverview = () => {
    return (
      <>
        {/* Hero Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total VVIP Shoppers */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total VVIP Shoppers</p>
                  <p className="text-3xl font-bold mt-2">{statistics?.totalVvipShoppers?.toLocaleString() || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-blue-200" />
                    <span className="text-blue-200 text-sm">
                      {statistics?.activeVvipShoppers || 0} active this month
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Orders</p>
                  <p className="text-3xl font-bold mt-2">{statistics?.totalVvipOrders?.toLocaleString() || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="w-4 h-4 text-purple-200" />
                    <span className="text-purple-200 text-sm">
                      {statistics?.ordersThisMonth || 0} this month
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <ShoppingCart className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">${statistics?.totalRevenue?.toLocaleString() || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <DollarSign className="w-4 h-4 text-green-200" />
                    <span className="text-green-200 text-sm">
                      ${statistics?.revenueThisMonth?.toLocaleString() || 0} this month
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Payments</p>
                  <p className="text-3xl font-bold mt-2">{statistics?.pendingPayments?.toLocaleString() || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-orange-200" />
                    <span className="text-orange-200 text-sm">
                      Awaiting verification
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Clock className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversion Rate */}
          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Conversion Rate</h3>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {statistics?.conversionRate?.toFixed(1) || 0}%
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    +{statistics?.orderGrowth?.toFixed(1) || 0}%
                  </Badge>
                </div>
                <Progress 
                  value={statistics?.conversionRate || 0} 
                  className="h-2"
                />
                <p className="text-sm text-gray-600">
                  Payment approval rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Avg Order Value</h3>
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    ${statistics?.averageOrderValue?.toFixed(2) || '0.00'}
                  </span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    +{statistics?.revenueGrowth?.toFixed(1) || 0}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((statistics?.averageOrderValue || 0) / 5, 100)} 
                  className="h-2"
                />
                <p className="text-sm text-gray-600">
                  Per transaction
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Satisfaction */}
          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Satisfaction</h3>
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {statistics?.customerSatisfaction?.toFixed(1) || 0}%
                  </span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Excellent
                  </Badge>
                </div>
                <Progress 
                  value={statistics?.customerSatisfaction || 0} 
                  className="h-2"
                />
                <p className="text-sm text-gray-600">
                  Customer rating
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Approved Payments</h3>
                  <p className="text-sm text-gray-600">Successfully verified</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {statistics?.approvedPayments?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={statistics?.totalVvipOrders ? (statistics.approvedPayments / statistics.totalVvipOrders) * 100 : 0} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-gray-600">
                  {statistics?.totalVvipOrders ? ((statistics.approvedPayments / statistics.totalVvipOrders) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 rounded-full p-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pending Review</h3>
                  <p className="text-sm text-gray-600">Awaiting verification</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {statistics?.pendingPayments?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={statistics?.totalVvipOrders ? (statistics.pendingPayments / statistics.totalVvipOrders) * 100 : 0} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-gray-600">
                  {statistics?.totalVvipOrders ? ((statistics.pendingPayments / statistics.totalVvipOrders) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 rounded-full p-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Rejected Payments</h3>
                  <p className="text-sm text-gray-600">Failed verification</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {statistics?.rejectedPayments?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={statistics?.totalVvipOrders ? (statistics.rejectedPayments / statistics.totalVvipOrders) * 100 : 0} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-gray-600">
                  {statistics?.totalVvipOrders ? ((statistics.rejectedPayments / statistics.totalVvipOrders) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage your VVIP program efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Create VVIP Shopper */}
              {userPermissions.canCreateVvip && (
                <Button 
                  onClick={() => handleTabChange('create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-auto p-4 flex-col gap-2"
                >
                  <Plus className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Create VVIP Shopper</div>
                    <div className="text-xs opacity-90">Grant exclusive access</div>
                  </div>
                </Button>
              )}

              {/* View Orders */}
              <Button 
                onClick={() => handleTabChange('orders')}
                variant="outline"
                className="h-auto p-4 flex-col gap-2 border-2 hover:bg-purple-50"
              >
                <ShoppingCart className="w-6 h-6 text-purple-600" />
                <div className="text-center">
                  <div className="font-medium">Review Orders</div>
                  <div className="text-xs text-gray-600">Approve payments</div>
                </div>
              </Button>

              {/* Manage Shoppers */}
              <Button 
                onClick={() => handleTabChange('shoppers')}
                variant="outline"
                className="h-auto p-4 flex-col gap-2 border-2 hover:bg-green-50"
              >
                <Users className="w-6 h-6 text-green-600" />
                <div className="text-center">
                  <div className="font-medium">Manage Shoppers</div>
                  <div className="text-xs text-gray-600">View all VVIP users</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Modern Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToDashboard} 
              className="flex items-center gap-2 hover:bg-white/50 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VVIP Shopper Program
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage exclusive shoppers and premium experiences</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/50 text-gray-700 px-3 py-1">
              {userPermissions.userRole?.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="relative mb-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 text-white" />
                  </div>
                  <span>Overview</span>
                </div>
              </TabsTrigger>
              
              {userPermissions.canCreateVvip && (
                <TabsTrigger 
                  value="create" 
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-white" />
                    </div>
                    <span>Create VVIP</span>
                  </div>
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="shoppers" 
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <span>Shoppers</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="orders" 
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <ShoppingCart className="w-3 h-3 text-white" />
                  </div>
                  <span>Orders</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - Modern Statistics Dashboard */}
            <TabsContent value="overview" className="space-y-8">
              {renderModernOverview()}
            </TabsContent>

          {/* Create VVIP Tab */}
          {userPermissions.canCreateVvip && (
            <TabsContent value="create">
              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  <VvipCreateForm />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Shoppers Tab */}
          <TabsContent value="shoppers">
            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <VvipShoppersList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <VvipOrdersList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </div>
  );
}