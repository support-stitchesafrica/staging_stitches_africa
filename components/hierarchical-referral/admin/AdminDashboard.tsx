'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Activity,
  DollarSign,
  Network,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AdminDashboardData,
  ReferralTree,
  Influencer,
  InfluencerRanking,
  Activity as HierarchicalActivity
} from '@/types/hierarchical-referral';

interface AdminDashboardProps {
  className?: string;
}

/**
 * Admin Dashboard Component for Hierarchical Referral Program
 * Requirements: 6.1, 6.3 - Display all Mother Influencers and referral trees, show system-wide performance metrics, add top performer analytics
 */
export default function HierarchicalReferralAdminDashboard({ className }: AdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [referralTrees, setReferralTrees] = useState<ReferralTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be API calls
      const response = await fetch('/api/hierarchical-referral/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.dashboardData);
      setReferralTrees(data.referralTrees);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/hierarchical-referral/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv' })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hierarchical-referral-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  const filteredReferralTrees = referralTrees.filter(tree =>
    tree.motherInfluencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tree.motherInfluencer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tree.motherInfluencer.masterReferralCode && 
     tree.motherInfluencer.masterReferralCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadDashboardData}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return null;
  }

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hierarchical Referral Admin</h1>
          <p className="text-gray-600 mt-1">
            System-wide visibility and performance analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={loadDashboardData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mother Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.systemMetrics.totalMotherInfluencers)}</div>
            <p className="text-xs text-muted-foreground">
              Primary network leaders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mini Influencers</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.systemMetrics.totalMiniInfluencers)}</div>
            <p className="text-xs text-muted-foreground">
              Network participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.systemMetrics.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              System-wide revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.systemMetrics.totalActivities)}</div>
            <p className="text-xs text-muted-foreground">
              All user interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Network Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.systemMetrics.averageNetworkSize.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Mini per Mother
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="networks">Referral Networks</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Highest earning influencers across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={performer.influencer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{performer.influencer.name}</p>
                          <p className="text-sm text-gray-500">
                            {performer.influencer.type === 'mother' ? 'Mother' : 'Mini'} Influencer
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(performer.metrics.totalEarnings)}</p>
                        <p className="text-sm text-gray-500">{performer.metrics.totalActivities} activities</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payout Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Payout Queue
                </CardTitle>
                <CardDescription>
                  Pending and failed payouts requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.payoutQueue.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No pending payouts</p>
                    </div>
                  ) : (
                    dashboardData.payoutQueue.slice(0, 5).map((payout) => (
                      <div key={payout.influencerId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{payout.influencerId}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(payout.processedAt as any).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(payout.amount)}</p>
                          <Badge variant={payout.status === 'failed' ? 'destructive' : 'secondary'}>
                            {payout.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="networks" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Referral Trees */}
          <div className="grid grid-cols-1 gap-6">
            {filteredReferralTrees.map((tree) => (
              <Card key={tree.motherInfluencer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        {tree.motherInfluencer.name}
                      </CardTitle>
                      <CardDescription>
                        {tree.motherInfluencer.email} • {tree.motherInfluencer.masterReferralCode}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={tree.motherInfluencer.status === 'active' ? 'default' : 'secondary'}>
                        {tree.motherInfluencer.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{tree.miniInfluencers.length}</p>
                      <p className="text-sm text-gray-500">Mini Influencers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(tree.totalNetworkEarnings)}</p>
                      <p className="text-sm text-gray-500">Network Earnings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{tree.totalNetworkActivities}</p>
                      <p className="text-sm text-gray-500">Total Activities</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {tree.miniInfluencers.length > 0 
                          ? (tree.totalNetworkEarnings / tree.miniInfluencers.length).toFixed(0)
                          : '0'
                        }
                      </p>
                      <p className="text-sm text-gray-500">Avg per Mini</p>
                    </div>
                  </div>

                  {/* Mini Influencers Preview */}
                  {tree.miniInfluencers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Top Mini Influencers</h4>
                      <div className="space-y-2">
                        {tree.miniInfluencers.slice(0, 3).map((mini) => (
                          <div key={mini.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{mini.name}</p>
                              <p className="text-xs text-gray-500">{mini.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{formatCurrency(mini.totalEarnings || 0)}</p>
                              <Badge variant="outline" className="text-xs">
                                {mini.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {tree.miniInfluencers.length > 3 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            +{tree.miniInfluencers.length - 3} more mini influencers
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers Leaderboard</CardTitle>
              <CardDescription>
                Ranked by total earnings and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.topPerformers.map((performer, index) => (
                  <div key={performer.influencer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{performer.influencer.name}</h3>
                        <p className="text-sm text-gray-500">{performer.influencer.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={performer.influencer.type === 'mother' ? 'default' : 'secondary'}>
                            {performer.influencer.type === 'mother' ? 'Mother' : 'Mini'} Influencer
                          </Badge>
                          <Badge variant="outline">
                            {performer.influencer.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(performer.metrics.totalEarnings)}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{performer.metrics.totalActivities} activities</span>
                        <span>{performer.metrics.conversionRate.toFixed(1)}% conversion</span>
                        {performer.influencer.type === 'mother' && (
                          <span>{performer.metrics.totalMiniInfluencers} mini influencers</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activities</CardTitle>
              <CardDescription>
                Latest activities across all influencers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'purchase' ? 'bg-green-500' :
                        activity.type === 'conversion' ? 'bg-blue-500' :
                        activity.type === 'click' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium capitalize">{activity.type}</p>
                        <p className="text-sm text-gray-500">
                          Influencer: {activity.influencerId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.metadata?.amount && (
                        <p className="font-semibold">{formatCurrency(activity.metadata.amount)}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(activity.timestamp as any).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}