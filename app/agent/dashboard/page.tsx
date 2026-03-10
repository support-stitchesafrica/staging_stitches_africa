'use client';

import { useEffect, useState } from 'react';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Plus,
  Eye,
  BarChart3,
  MessageSquare,
  DollarSign,
  Activity,
  CheckCircle,
  Zap,
  Target,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalTailors: number;
  totalProducts: number;
  totalOrders: number;
  pendingApprovals: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user?: string;
  }>;
  finance: {
    totalRevenue: number;
    walletBalance: number;
  };
  works: {
    total: number;
    verified: number;
    pending: number;
  };
  orders: {
    total: number;
    completed: number;
    processing: number;
    cancelled: number;
  };
}

export default function AgentDashboardPage() {
  const { agentData, hasPermission } = useAgentAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadStats = async () => {
      try {
        console.log('🔄 Loading dashboard stats...');
        
        // Set a timeout for the API call
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
        }, 15000); // 15 second timeout
        
        const response = await fetch('/api/agent/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        if (!mounted) return;
        
        if (result.success && result.data) {
          console.log('✅ Setting stats data');
          setStats(result.data);
          setError(null);
        } else {
          throw new Error(result.message || 'Failed to load stats');
        }
      } catch (err) {
        console.error('❌ Error loading stats:', err);
        if (mounted) {
          if (err instanceof Error && err.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        }
      } finally {
        if (mounted) {
          console.log('🏁 Setting loading to false');
          setLoading(false);
        }
      }
    };

    loadStats();
    
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const quickActions = [
    {
      title: 'Create Product',
      description: 'Add a new product to the catalog',
      href: '/agent/dashboard/products/create',
      icon: Plus,
      permission: 'create_products',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Products',
      description: 'Browse all products',
      href: '/agent/dashboard/products',
      icon: Eye,
      permission: 'view_products',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      href: '/agent/dashboard/analytics',
      icon: BarChart3,
      permission: 'view_analytics',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Chat Support',
      description: 'Handle customer inquiries',
      href: '/agent/dashboard/chat',
      icon: MessageSquare,
      permission: 'handle_chat',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const filteredQuickActions = quickActions.filter(action =>
    !action.permission || hasPermission(action.permission)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p><strong>🔄 Loading Dashboard...</strong></p>
              <p>Fetching data from Firebase collections...</p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={33} className="h-2" />
            <p className="text-xs text-blue-600 mt-1">This may take a few seconds...</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            If this takes longer than expected, please refresh the page
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error}
        </p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No Data Available
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unable to load dashboard statistics.
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back, {agentData?.name || 'Agent'}!
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Here's what's happening with your agent dashboard today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {agentData?.role || 'Agent'}
            </Badge>
            {agentData?.territory && (
              <Badge variant="outline" className="text-sm px-4 py-2">
                📍 {agentData.territory}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Vendors</CardTitle>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {stats.totalTailors}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Active tailors in system
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Verified</span>
                <span className="font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Products</CardTitle>
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {stats.totalProducts}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Products in catalog
            </p>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              <span className="font-medium">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Orders</CardTitle>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {stats.totalOrders}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Orders processed
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </span>
                <span className="font-medium">{stats.orders.completed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Processing
                </span>
                <span className="font-medium">{stats.orders.processing}</span>
              </div>
              {stats.orders.cancelled > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Cancelled
                  </span>
                  <span className="font-medium">{stats.orders.cancelled}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Pending Approvals</CardTitle>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {stats.pendingApprovals}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Awaiting review
            </p>
            {stats.pendingApprovals > 0 && (
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                Review Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview & Order Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Overview
            </CardTitle>
            <CardDescription>Revenue and wallet statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ₦{stats.finance.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Wallet Balance</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ₦{stats.finance.walletBalance.toLocaleString()}
                  </p>
                </div>
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
              Order Status Overview
            </CardTitle>
            <CardDescription>Order breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {stats.orders.completed}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Processing</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {stats.orders.processing}
                </span>
              </div>
              
              {stats.orders.cancelled > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Cancelled</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {stats.orders.cancelled}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Work Statistics
            </CardTitle>
            <CardDescription>Product verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verified Works</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.works.verified}
                </span>
              </div>
              <Progress value={(stats.works.verified / stats.works.total) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Works</span>
                <span className="text-lg font-bold text-orange-600">
                  {stats.works.pending}
                </span>
              </div>
              <Progress value={(stats.works.pending / stats.works.total) * 100} className="h-2" />
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Works</span>
                  <span className="text-lg font-bold">
                    {stats.works.total}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
            <Zap className="h-6 w-6 text-white" />
          </div>
          Quick Actions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredQuickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-6 rounded-2xl ${action.color} text-white group-hover:scale-110 transition-all duration-300 shadow-xl`}>
                      <action.icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest actions and updates in your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      index === 0 ? 'bg-green-500 animate-pulse' : 
                      index === 1 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.user && (
                        <Badge variant="outline" className="text-xs">
                          {activity.user}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No recent activity</p>
                <p className="text-sm">Activity will appear here as you use the system</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}