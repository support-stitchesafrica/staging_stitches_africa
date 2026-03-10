'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  MotherInfluencerDashboardData,
  Activity,
  ReferralCode,
  MiniInfluencerPerformance
} from '@/types/hierarchical-referral';
import { HierarchicalRealTimeDashboardService } from '@/lib/hierarchical-referral/services/real-time-dashboard-service';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity as ActivityIcon,
  Link,
  Eye,
  MousePointer,
  ShoppingCart,
  UserPlus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  Star,
  BarChart3,
  PieChart,
  LineChart,
  Copy,
  ExternalLink,
  Zap,
  Target,
  Award,
  TrendingDown,
  RefreshCw,
  Download,
  Share2,
  Settings,
  Bell,
  Filter,
  Search,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MotherInfluencerDashboardProps {
  influencerId: string;
  initialData?: MotherInfluencerDashboardData;
}

/**
 * Mother Influencer Dashboard Component
 * 
 * Implements Requirements:
 * - 3.1: Display total earnings from direct and indirect referrals
 * - 3.2: Separate revenue from own referrals and Mini_Influencer commissions
 * - 3.3: Display each Mini_Influencer's clicks, conversions, and revenue
 * - 3.4: Show all active and inactive Sub_Referral_Codes
 * - 3.5: Real-time dashboard updates (5-minute maximum latency)
 * - 9.1: Responsive design for desktop and mobile
 * - 9.2: Modern visualization components with charts and graphs
 * - 9.4: Progressive disclosure and filtering options
 * - 9.5: Consistent design language and branding
 */
export default function MotherInfluencerDashboard({ 
  influencerId, 
  initialData 
}: MotherInfluencerDashboardProps) {
  const [dashboardData, setDashboardData] = useState<Partial<MotherInfluencerDashboardData>>(
    initialData || {}
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'earnings' | 'activities' | 'conversion'>('earnings');

  // Real-time subscription management
  useEffect(() => {
    setConnectionStatus('connecting');
    
    const unsubscribe = HierarchicalRealTimeDashboardService.subscribeToMotherInfluencerDashboard(
      influencerId,
      (updates) => {
        setDashboardData(prev => ({ ...prev, ...updates }));
        setLastUpdateTime(new Date());
        setIsLoading(false);
        setConnectionStatus('connected');
      },
      (error) => {
        console.error('Dashboard subscription error:', error);
        setConnectionStatus('disconnected');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [influencerId]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  // Format number with K/M suffix
  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }, []);

  // Format date
  const formatDate = useCallback((date: Date | any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return <MousePointer className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'conversion': return <TrendingUp className="h-4 w-4" />;
      case 'signup': return <UserPlus className="h-4 w-4" />;
      case 'purchase': return <ShoppingCart className="h-4 w-4" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return { icon: <ArrowUpRight className="h-4 w-4 text-green-600" />, color: 'text-green-600', direction: 'up' };
    } else if (current < previous) {
      return { icon: <ArrowDownRight className="h-4 w-4 text-red-600" />, color: 'text-red-600', direction: 'down' };
    }
    return { icon: <TrendingUp className="h-4 w-4 text-gray-400" />, color: 'text-gray-400', direction: 'neutral' };
  };

  // Copy referral code to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const { influencer, metrics, networkMetrics, recentActivities, earningsHistory, referralCodes } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {influencer?.name || 'Mother Influencer'}
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage your referral network and track your earnings
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="text-sm capitalize">{connectionStatus}</span>
              </div>
              
              {/* Last Update */}
              <div className="flex items-center space-x-2 text-blue-100">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">
                  Updated {formatDate(lastUpdateTime)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Earnings</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(metrics?.totalEarnings || 0)}
                  </p>
                  <div className="flex items-center mt-2 text-green-100">
                    {getTrendIndicator(metrics?.totalEarnings || 0, metrics?.previousEarnings || 0).icon}
                    <span className="text-sm ml-1">
                      vs last period
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Network Size</p>
                  <p className="text-3xl font-bold mt-1">
                    {networkMetrics?.totalNetworkSize || 0}
                  </p>
                  <p className="text-blue-100 text-sm mt-2">
                    {metrics?.activeMiniInfluencers || 0} active members
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatPercentage(metrics?.conversionRate || 0)}
                  </p>
                  <p className="text-purple-100 text-sm mt-2">
                    CTR: {formatPercentage(metrics?.clickThroughRate || 0)}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Target className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Activities</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatNumber(metrics?.totalActivities || 0)}
                  </p>
                  <p className="text-orange-100 text-sm mt-2">
                    Last 30 days
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Zap className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>
        </div>

        {/* Enhanced Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 bg-white shadow-sm border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="network" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Network
              </TabsTrigger>
              <TabsTrigger value="codes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Link className="h-4 w-4 mr-2" />
                Codes
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Activities
              </TabsTrigger>
            </TabsList>

            {/* Time Range Selector */}
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <div className="flex items-center space-x-1 bg-white rounded-lg border p-1">
                {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                    className={selectedTimeRange === range ? "bg-blue-600 text-white" : ""}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Earnings Breakdown Chart */}
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5 text-blue-600" />
                        <span>Earnings Breakdown</span>
                      </CardTitle>
                      <CardDescription>Revenue distribution across sources</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Visual Progress Bars */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                          <span className="text-sm font-medium">Direct Referrals</span>
                        </div>
                        <span className="text-sm font-bold">
                          {formatCurrency(metrics?.directEarnings || 0)}
                        </span>
                      </div>
                      <Progress 
                        value={metrics?.totalEarnings ? (metrics.directEarnings / metrics.totalEarnings) * 100 : 0} 
                        className="h-3 bg-gray-100"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"></div>
                          <span className="text-sm font-medium">Mini Influencer Commissions</span>
                        </div>
                        <span className="text-sm font-bold">
                          {formatCurrency(metrics?.indirectEarnings || 0)}
                        </span>
                      </div>
                      <Progress 
                        value={metrics?.totalEarnings ? (metrics.indirectEarnings / metrics.totalEarnings) * 100 : 0} 
                        className="h-3 bg-gray-100"
                      />
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercentage(metrics?.conversionRate || 0)}
                        </p>
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {formatNumber(metrics?.totalActivities || 0)}
                        </p>
                        <p className="text-sm text-gray-600">Total Activities</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span>Top Performers</span>
                  </CardTitle>
                  <CardDescription>Your best Mini Influencers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {metrics?.topPerformingMiniInfluencers?.slice(0, 5).map((performer, index) => (
                        <div key={performer.influencer.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-bold">
                            #{index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={performer.influencer.profileImage} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {performer.influencer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{performer.influencer.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{performer.activities} activities</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>{performer.conversionRate.toFixed(1)}% CR</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(performer.earnings)}
                            </p>
                            {index === 0 && <Star className="h-4 w-4 text-yellow-500 mx-auto mt-1" />}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No Mini Influencers yet</p>
                          <p className="text-xs text-gray-400">Start recruiting to see performance data</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Generate New Code</h3>
                      <p className="text-blue-100 text-sm mb-4">Create a sub-referral code for new Mini Influencers</p>
                      <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Generate Code
                      </Button>
                    </div>
                    <Link className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Export Report</h3>
                      <p className="text-green-100 text-sm mb-4">Download detailed analytics and performance data</p>
                      <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Share Network</h3>
                      <p className="text-purple-100 text-sm mb-4">Invite others to join your referral network</p>
                      <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Link
                      </Button>
                    </div>
                    <Users className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          {/* Enhanced Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Mini Influencer Network</h3>
                <p className="text-gray-600">Detailed metrics for each Mini Influencer in your network</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search influencers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="earnings">Sort by Earnings</option>
                  <option value="activities">Sort by Activities</option>
                  <option value="conversion">Sort by Conversion</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metrics?.topPerformingMiniInfluencers?.map((performer) => (
                <Card key={performer.influencer.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={performer.influencer.profileImage} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {performer.influencer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{performer.influencer.name}</h4>
                          <p className="text-sm text-gray-500">{performer.influencer.email}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(performer.influencer.status)}>
                        {performer.influencer.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{performer.activities}</p>
                        <p className="text-xs text-gray-600">Activities</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{performer.conversionRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">Conversion</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(performer.earnings)}</p>
                        <p className="text-xs text-gray-600">Earnings</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="col-span-2 text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Mini Influencers yet</h3>
                  <p className="text-gray-500 mb-6">Start building your network by generating referral codes</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate First Code
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Enhanced Referral Codes Tab */}
          <TabsContent value="codes" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Referral Codes</h3>
                <p className="text-gray-600">Manage your master and sub referral codes</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Generate New Code
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {referralCodes?.map((code) => (
                <Card key={code.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${
                          code.type === 'master' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          {code.type === 'master' ? (
                            <Crown className={`h-5 w-5 ${code.type === 'master' ? 'text-yellow-600' : 'text-blue-600'}`} />
                          ) : (
                            <Link className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-lg font-bold">{code.code}</p>
                          <p className="text-sm text-gray-500">
                            {code.type === 'master' ? 'Master Code' : 'Sub Code'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(code.status)}>
                          {code.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xl font-bold text-gray-900">{code.usageCount}</p>
                        <p className="text-xs text-gray-600">Uses</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xl font-bold text-gray-900">{code.maxUsage || '∞'}</p>
                        <p className="text-xs text-gray-600">Max Uses</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-900">
                          {code.assignedTo ? 'Assigned' : 'Available'}
                        </p>
                        <p className="text-xs text-gray-600">Status</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-500">
                      <span>Created {formatDate(code.createdAt)}</span>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="col-span-2 text-center py-12">
                  <Link className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No referral codes yet</h3>
                  <p className="text-gray-500 mb-6">Generate your first referral code to start building your network</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate Master Code
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Enhanced Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Recent Activities</h3>
                <p className="text-gray-600">Latest activities from your network</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="p-6 space-y-4">
                    {recentActivities?.slice(0, 20).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-full ${
                          activity.type === 'conversion' ? 'bg-green-100' :
                          activity.type === 'click' ? 'bg-blue-100' :
                          activity.type === 'view' ? 'bg-gray-100' : 'bg-purple-100'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-semibold capitalize">
                              {activity.type}
                            </p>
                            <Badge 
                              variant={activity.processed ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {activity.processed ? 'Processed' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Code: <span className="font-mono">{activity.referralCode}</span>
                            {activity.metadata.amount && (
                              <span className="ml-2 font-semibold text-green-600">
                                {formatCurrency(activity.metadata.amount)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            {formatDate(activity.timestamp)}
                          </p>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-12">
                        <ActivityIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                        <p className="text-gray-500">Activities will appear here as your network grows</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}