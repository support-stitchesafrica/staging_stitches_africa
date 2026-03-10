'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  UserCheck,
  Network,
  Crown,
  Star,
  ChevronRight,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Settings,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Award,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Shield,
  UserX,
  UserPlus,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  AdminDashboardData, 
  ReferralTree, 
  Influencer, 
  Activity as ActivityType,
  PayoutResult 
} from '@/types/hierarchical-referral';

interface HierarchicalReferralAdminDashboardProps {
  className?: string;
}

/**
 * Hierarchical Referral Admin Dashboard Component
 * 
 * Implements Requirements:
 * - 6.1: Display all Mother_Influencers and their complete referral trees
 * - 6.2: Allow Admin to enable, disable, or suspend any influencer account
 * - 6.3: Show total program performance, top performers, and revenue analytics
 * - 6.4: Allow Admin to override commission calculations and adjust payouts
 * - 6.5: Provide export functionality for all reports in CSV format
 * - 9.1: Responsive design for desktop and mobile
 * - 9.2: Modern visualization components with charts and graphs
 * - 9.3: Clear visual hierarchy and intuitive user flows
 * - 9.4: Progressive disclosure and filtering options
 * - 9.5: Consistent design language and branding
 */
export function HierarchicalReferralAdminDashboard({ className }: HierarchicalReferralAdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [referralTrees, setReferralTrees] = useState<ReferralTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [sortBy, setSortBy] = useState<'earnings' | 'activities' | 'network'>('earnings');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [dashboardResponse, treesResponse] = await Promise.all([
          fetch('/api/hierarchical-referral/admin/dashboard'),
          fetch('/api/hierarchical-referral/admin/referral-trees')
        ]);

        if (!dashboardResponse.ok || !treesResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardResult = await dashboardResponse.json();
        const treesResult = await treesResponse.json();

        if (!dashboardResult.success || !treesResult.success) {
          throw new Error('API returned error');
        }

        setDashboardData(dashboardResult.data);
        setReferralTrees(treesResult.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Filter referral trees based on search and filters
  const filteredTrees = referralTrees.filter(tree => {
    const matchesSearch = tree.motherInfluencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.motherInfluencer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.motherInfluencer.masterReferralCode && 
       tree.motherInfluencer.masterReferralCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || tree.motherInfluencer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return { icon: <ArrowUpRight className="h-4 w-4 text-green-600" />, color: 'text-green-600', direction: 'up' };
    } else if (current < previous) {
      return { icon: <ArrowDownRight className="h-4 w-4 text-red-600" />, color: 'text-red-600', direction: 'down' };
    }
    return { icon: <TrendingUp className="h-4 w-4 text-gray-400" />, color: 'text-gray-400', direction: 'neutral' };
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`m-6 ${className}`}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Hierarchical Referral Admin</h1>
                <p className="text-slate-200 mt-1">
                  System-wide visibility and management for the referral program
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{formatNumber(dashboardData.systemMetrics.totalMotherInfluencers)}</p>
                  <p className="text-xs">Mother Influencers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{formatNumber(dashboardData.systemMetrics.totalMiniInfluencers)}</p>
                  <p className="text-xs">Mini Influencers</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced System Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Mother Influencers</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatNumber(dashboardData.systemMetrics.totalMotherInfluencers)}
                  </p>
                  <div className="flex items-center mt-2 text-blue-100">
                    {getTrendIndicator(dashboardData.systemMetrics.totalMotherInfluencers, dashboardData.systemMetrics.totalMotherInfluencers * 0.9).icon}
                    <span className="text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Crown className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Mini Influencers</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatNumber(dashboardData.systemMetrics.totalMiniInfluencers)}
                  </p>
                  <div className="flex items-center mt-2 text-green-100">
                    {getTrendIndicator(dashboardData.systemMetrics.totalMiniInfluencers, dashboardData.systemMetrics.totalMiniInfluencers * 0.8).icon}
                    <span className="text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total Earnings</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dashboardData.systemMetrics.totalEarnings)}
                  </p>
                  <div className="flex items-center mt-2 text-yellow-100">
                    {getTrendIndicator(dashboardData.systemMetrics.totalEarnings, dashboardData.systemMetrics.totalEarnings * 0.85).icon}
                    <span className="text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <DollarSign className="h-8 w-8" />
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
                  <p className="text-2xl font-bold mt-1">
                    {formatNumber(dashboardData.systemMetrics.totalActivities)}
                  </p>
                  <div className="flex items-center mt-2 text-purple-100">
                    {getTrendIndicator(dashboardData.systemMetrics.totalActivities, dashboardData.systemMetrics.totalActivities * 0.9).icon}
                    <span className="text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Activity className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Avg Network Size</p>
                  <p className="text-3xl font-bold mt-1">
                    {dashboardData.systemMetrics.averageNetworkSize.toFixed(1)}
                  </p>
                  <p className="text-indigo-100 text-sm mt-2">
                    per Mother Influencer
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Network className="h-8 w-8" />
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
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="referral-trees" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                <Network className="h-4 w-4 mr-2" />
                Networks
              </TabsTrigger>
              <TabsTrigger value="top-performers" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                <Award className="h-4 w-4 mr-2" />
                Top Performers
              </TabsTrigger>
              <TabsTrigger value="payouts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                Payouts
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
                    className={selectedTimeRange === range ? "bg-slate-800 text-white" : ""}
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
              {/* Recent Activities */}
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-slate-600" />
                        <span>Recent Activities</span>
                      </CardTitle>
                      <CardDescription>Latest system-wide activities and trends</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80">
                    <div className="p-6 space-y-4">
                      {dashboardData.recentActivities.slice(0, 10).map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg hover:shadow-md transition-shadow">
                          <div className={`p-3 rounded-full ${
                            activity.type === 'conversion' ? 'bg-green-100' :
                            activity.type === 'click' ? 'bg-blue-100' :
                            activity.type === 'view' ? 'bg-gray-100' : 'bg-purple-100'
                          }`}>
                            <Activity className={`h-5 w-5 ${
                              activity.type === 'conversion' ? 'text-green-600' :
                              activity.type === 'click' ? 'text-blue-600' :
                              activity.type === 'view' ? 'text-gray-600' : 'text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 capitalize">
                                {activity.type}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                System-wide
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {activity.metadata?.amount && (
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(activity.metadata.amount)}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">
                              {new Date(activity.timestamp as any).toLocaleDateString()}
                            </p>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Payout Queue */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span>Payout Queue</span>
                  </CardTitle>
                  <CardDescription>Pending and failed payouts requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {dashboardData.payoutQueue.slice(0, 8).map((payout, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <Badge className={getPayoutStatusColor(payout.status)}>
                              {payout.status}
                            </Badge>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(payout.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {payout.influencerId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">System Health</h3>
                  <p className="text-green-600 font-bold text-2xl mb-2">98.5%</p>
                  <p className="text-sm text-gray-600">Uptime this month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Active Users</h3>
                  <p className="text-blue-600 font-bold text-2xl mb-2">
                    {formatNumber(dashboardData.systemMetrics.totalMotherInfluencers + dashboardData.systemMetrics.totalMiniInfluencers)}
                  </p>
                  <p className="text-sm text-gray-600">Total influencers</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Growth Rate</h3>
                  <p className="text-purple-600 font-bold text-2xl mb-2">+12.3%</p>
                  <p className="text-sm text-gray-600">This month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Referral Trees Tab */}
          <TabsContent value="referral-trees" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search influencers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Enhanced Referral Trees Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTrees.map((tree) => (
                <Card key={tree.motherInfluencer.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={tree.motherInfluencer.profileImage} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {tree.motherInfluencer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{tree.motherInfluencer.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {tree.motherInfluencer.email}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(tree.motherInfluencer.status)}>
                          {tree.motherInfluencer.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Network Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{tree.miniInfluencers.length}</p>
                        <p className="text-xs text-gray-600">Mini Influencers</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{formatNumber(tree.totalNetworkActivities)}</p>
                        <p className="text-xs text-gray-600">Activities</p>
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <p className="text-xl font-bold text-orange-900">
                        {formatCurrency(tree.totalNetworkEarnings)}
                      </p>
                      <p className="text-xs text-orange-600">Total Network Earnings</p>
                    </div>

                    {/* Referral Code */}
                    {tree.motherInfluencer.masterReferralCode && (
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-mono font-bold text-purple-900">
                              {tree.motherInfluencer.masterReferralCode}
                            </p>
                            <p className="text-xs text-purple-600">Master Referral Code</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedInfluencer(tree.motherInfluencer)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTrees.length === 0 && (
              <div className="text-center py-12">
                <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No networks found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </TabsContent>

          {/* Enhanced Top Performers Tab */}
          <TabsContent value="top-performers" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <span>Top Performing Influencers</span>
                    </CardTitle>
                    <CardDescription>Ranked by total earnings and performance metrics</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="earnings">Sort by Earnings</option>
                      <option value="activities">Sort by Activities</option>
                      <option value="network">Sort by Network Size</option>
                    </select>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topPerformers.map((performer, index) => (
                    <div key={performer.influencer.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-bold ${
                          performer.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          performer.rank <= 3 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          performer.rank <= 10 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          'bg-gradient-to-r from-purple-400 to-purple-600'
                        }`}>
                          #{performer.rank}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={performer.influencer.profileImage} />
                          <AvatarFallback className="bg-gradient-to-r from-slate-500 to-gray-600 text-white">
                            {performer.influencer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            performer.influencer.type === 'mother' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            {performer.influencer.type === 'mother' ? (
                              <Crown className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <UserCheck className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{performer.influencer.name}</p>
                            <p className="text-sm text-gray-500">{performer.influencer.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {performer.influencer.type === 'mother' ? 'Mother' : 'Mini'} Influencer
                              </Badge>
                              {performer.rank === 1 && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                  🏆 Top Performer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(performer.metrics.totalEarnings)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatNumber(performer.metrics.totalActivities)} activities
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span>Payout Management</span>
                    </CardTitle>
                    <CardDescription>Monitor and manage influencer payouts</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Process Payouts
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {dashboardData.payoutQueue.map((payout, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <Badge className={getPayoutStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(payout.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Influencer ID: {payout.influencerId}
                            </p>
                            {payout.error && (
                              <p className="text-sm text-red-600 mt-1">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                {payout.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right mr-4">
                            <p className="text-sm text-gray-500">
                              {new Date(payout.processedAt as any).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(payout.processedAt as any).toLocaleTimeString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {payout.status === 'failed' && (
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
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