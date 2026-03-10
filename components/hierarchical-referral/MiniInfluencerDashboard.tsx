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
import { 
  MiniInfluencerDashboardData,
  Activity
} from '@/types/hierarchical-referral';
import { HierarchicalRealTimeDashboardService } from '@/lib/hierarchical-referral/services/real-time-dashboard-service';
import { 
  TrendingUp, 
  DollarSign, 
  Activity as ActivityIcon,
  Eye,
  MousePointer,
  ShoppingCart,
  UserPlus,
  Trophy,
  User,
  Calendar,
  Star,
  Award,
  Target,
  Zap,
  TrendingDown,
  RefreshCw,
  Download,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Users,
  BarChart3,
  PieChart,
  LineChart,
  CheckCircle,
  Clock
} from 'lucide-react';

interface MiniInfluencerDashboardProps {
  influencerId: string;
  initialData?: MiniInfluencerDashboardData;
}

/**
 * Mini Influencer Dashboard Component
 * 
 * Implements Requirements:
 * - 2.3: Mini Influencer earning capabilities
 * - 2.5: Mini Influencer permission restrictions
 * - 3.5: Real-time dashboard updates
 * - 9.1: Responsive design for desktop and mobile
 * - 9.2: Modern visualization components with charts and graphs
 * - 9.5: Consistent design language and branding
 */
export default function MiniInfluencerDashboard({ 
  influencerId, 
  initialData 
}: MiniInfluencerDashboardProps) {
  const [dashboardData, setDashboardData] = useState<Partial<MiniInfluencerDashboardData>>(
    initialData || {}
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Real-time subscription management
  useEffect(() => {
    setConnectionStatus('connecting');
    
    const unsubscribe = HierarchicalRealTimeDashboardService.subscribeToMiniInfluencerDashboard(
      influencerId,
      (updates) => {
        setDashboardData(prev => ({ ...prev, ...updates }));
        setLastUpdateTime(new Date());
        setIsLoading(false);
        setConnectionStatus('connected');
      },
      (error) => {
        console.error('Mini Influencer dashboard subscription error:', error);
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

  // Get rank badge color
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank <= 3) return 'bg-gradient-to-r from-gray-400 to-gray-600';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    return 'bg-gradient-to-r from-purple-400 to-purple-600';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const { influencer, motherInfluencer, personalMetrics, recentActivities, earningsHistory } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome, {influencer?.name || 'Mini Influencer'}
                </h1>
                <p className="text-purple-100 mt-1">
                  Track your performance and earnings
                </p>
                {motherInfluencer && (
                  <p className="text-sm text-purple-200 mt-1 flex items-center">
                    <Crown className="h-4 w-4 mr-1" />
                    Part of {motherInfluencer.name}'s network
                  </p>
                )}
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
              <div className="flex items-center space-x-2 text-purple-100">
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
                    {formatCurrency(personalMetrics?.totalEarnings || 0)}
                  </p>
                  <p className="text-green-100 text-sm mt-2">
                    Pending: {formatCurrency(earningsHistory?.pendingEarnings || 0)}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Network Rank</p>
                  <p className="text-3xl font-bold mt-1">
                    #{personalMetrics?.rank || 'N/A'}
                  </p>
                  <p className="text-yellow-100 text-sm mt-2">
                    In your network
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Trophy className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatPercentage(personalMetrics?.conversionRate || 0)}
                  </p>
                  <p className="text-blue-100 text-sm mt-2">
                    Last 30 days
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Target className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Activities</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatNumber(personalMetrics?.totalActivities || 0)}
                  </p>
                  <p className="text-purple-100 text-sm mt-2">
                    All time
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
            <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-white shadow-sm border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="earnings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                Earnings
              </TabsTrigger>
            </TabsList>

            {/* Time Range Selector */}
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <div className="flex items-center space-x-1 bg-white rounded-lg border p-1">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                    className={selectedTimeRange === range ? "bg-purple-600 text-white" : ""}
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
              {/* Performance Summary */}
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span>Performance Summary</span>
                  </CardTitle>
                  <CardDescription>Your key metrics and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Rank Display */}
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold mb-3 ${getRankColor(personalMetrics?.rank || 0)}`}>
                        #{personalMetrics?.rank || '?'}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Your rank in the network</p>
                      {personalMetrics?.rank === 1 && (
                        <div className="flex items-center justify-center space-x-2 text-yellow-600">
                          <Trophy className="h-5 w-5" />
                          <span className="font-semibold">Top Performer!</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicators */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Conversion Rate</span>
                          <span className="font-bold">{formatPercentage(personalMetrics?.conversionRate || 0)}</span>
                        </div>
                        <Progress 
                          value={Math.min(personalMetrics?.conversionRate || 0, 100)} 
                          className="h-3 bg-gray-100"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Activity Level</span>
                          <span className="font-bold">{formatNumber(personalMetrics?.totalActivities || 0)} activities</span>
                        </div>
                        <Progress 
                          value={Math.min((personalMetrics?.totalActivities || 0) / 100 * 100, 100)} 
                          className="h-3 bg-gray-100"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Earnings Progress</span>
                          <span className="font-bold">{formatCurrency(personalMetrics?.totalEarnings || 0)}</span>
                        </div>
                        <Progress 
                          value={Math.min((personalMetrics?.totalEarnings || 0) / 1000 * 100, 100)} 
                          className="h-3 bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mother Influencer Info */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <span>Network Leader</span>
                  </CardTitle>
                  <CardDescription>Your Mother Influencer</CardDescription>
                </CardHeader>
                <CardContent>
                  {motherInfluencer ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={motherInfluencer.profileImage} />
                          <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xl">
                            {motherInfluencer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{motherInfluencer.name}</h4>
                          <p className="text-sm text-gray-500">{motherInfluencer.email}</p>
                          <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                            Mother Influencer
                          </Badge>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          You're part of a high-performing network focused on driving quality referrals and earning commissions together.
                        </p>
                        <Button variant="outline" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          View Network
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No network leader assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Breakdown */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <span>Activity Breakdown</span>
                </CardTitle>
                <CardDescription>Your recent activity types and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {['click', 'view', 'conversion', 'signup', 'purchase'].map((type) => {
                    const count = recentActivities?.filter(a => a.type === type).length || 0;
                    const percentage = recentActivities?.length ? (count / recentActivities.length) * 100 : 0;
                    return (
                      <div key={type} className="text-center p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg">
                        <div className="flex justify-center mb-3">
                          <div className={`p-3 rounded-full ${
                            type === 'conversion' ? 'bg-green-100' :
                            type === 'click' ? 'bg-blue-100' :
                            type === 'view' ? 'bg-gray-100' :
                            type === 'signup' ? 'bg-purple-100' : 'bg-orange-100'
                          }`}>
                            {getActivityIcon(type)}
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="text-xs text-gray-500 capitalize mb-2">{type}s</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ActivityIcon className="h-5 w-5 text-purple-600" />
                  <span>Recent Activities</span>
                </CardTitle>
                <CardDescription>
                  Your latest referral activities and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="p-6 space-y-4">
                    {recentActivities?.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-full ${
                          activity.type === 'conversion' ? 'bg-green-100' :
                          activity.type === 'click' ? 'bg-blue-100' :
                          activity.type === 'view' ? 'bg-gray-100' :
                          activity.type === 'signup' ? 'bg-purple-100' : 'bg-orange-100'
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
                        <p className="text-gray-500 mb-6">Start referring to see your activities here!</p>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Your Link
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(earningsHistory?.totalEarnings || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Paid Out</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(earningsHistory?.totalPaid || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-3">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {formatCurrency(earningsHistory?.pendingEarnings || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-purple-600" />
                  <span>Earnings History</span>
                </CardTitle>
                <CardDescription>
                  Your commission payments and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {earningsHistory?.entries?.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${
                            entry.status === 'paid' ? 'bg-green-100' :
                            entry.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            <DollarSign className={`h-5 w-5 ${
                              entry.status === 'paid' ? 'text-green-600' :
                              entry.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(entry.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {entry.source} • {formatDate(entry.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={
                              entry.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                              entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-12">
                        <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings yet</h3>
                        <p className="text-gray-500 mb-6">Start referring to earn commissions!</p>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Share2 className="h-4 w-4 mr-2" />
                          Start Referring
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Permission Notice */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-100 rounded-full flex-shrink-0">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-purple-900 mb-2">
                  Mini Influencer Account
                </h4>
                <p className="text-purple-700 mb-4">
                  As a Mini Influencer, you can track your performance and earnings, but cannot create additional referral codes. 
                  Contact your Mother Influencer for new referral opportunities and network growth strategies.
                </p>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    <User className="h-4 w-4 mr-2" />
                    Contact Network Leader
                  </Button>
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Performance
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}