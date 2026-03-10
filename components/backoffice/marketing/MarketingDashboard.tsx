/**
 * Marketing Dashboard Component
 * 
 * Main dashboard for the marketing department showing key metrics,
 * team performance, and quick access to vendors, tasks, and interactions.
 * 
 * Requirements: 6.4, 6.5, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CheckSquare,
  MessageSquare,
  TrendingUp,
  Calendar,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Plus,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import DashboardCard from '../DashboardCard';
import StatsCard from '../StatsCard';
import PermissionGuard from '../PermissionGuard';

interface MarketingStats {
  totalVendors: number;
  activeVendors: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalInteractions: number;
  thisMonthInteractions: number;
  teamMembers: number;
  activeTeamMembers: number;
  conversionRate: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'task' | 'interaction' | 'vendor';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  status?: string;
}

interface TopPerformer {
  id: string;
  name: string;
  role: string;
  vendorCount: number;
  completedTasks: number;
  interactions: number;
  score: number;
}

export default function MarketingDashboard() {
  const { backOfficeUser } = useBackOfficeAuth();
  const [stats, setStats] = useState<MarketingStats>({
    totalVendors: 0,
    activeVendors: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalInteractions: 0,
    thisMonthInteractions: 0,
    teamMembers: 0,
    activeTeamMembers: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load marketing analytics data
      // This would typically come from your marketing analytics API
      // For now, we'll use mock data that matches the expected structure
      
      const mockStats: MarketingStats = {
        totalVendors: 156,
        activeVendors: 142,
        totalTasks: 89,
        completedTasks: 67,
        pendingTasks: 18,
        overdueTasks: 4,
        totalInteractions: 234,
        thisMonthInteractions: 45,
        teamMembers: 12,
        activeTeamMembers: 11,
        conversionRate: 78.5,
        monthlyGrowth: 12.3,
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'task',
          title: 'Follow up with Vendor ABC',
          description: 'Completed initial outreach call',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: 'John Doe',
          status: 'completed',
        },
        {
          id: '2',
          type: 'interaction',
          title: 'Meeting with Fashion House XYZ',
          description: 'Discussed partnership opportunities',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: 'Jane Smith',
          status: 'meeting',
        },
        {
          id: '3',
          type: 'vendor',
          title: 'New vendor onboarded',
          description: 'Artisan Crafts Ltd joined the platform',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: 'Mike Johnson',
          status: 'new',
        },
      ];

      const mockTopPerformers: TopPerformer[] = [
        {
          id: '1',
          name: 'Sarah Wilson',
          role: 'BDM',
          vendorCount: 25,
          completedTasks: 18,
          interactions: 42,
          score: 95.2,
        },
        {
          id: '2',
          name: 'David Chen',
          role: 'Team Member',
          vendorCount: 18,
          completedTasks: 15,
          interactions: 38,
          score: 89.7,
        },
        {
          id: '3',
          name: 'Lisa Rodriguez',
          role: 'Team Member',
          vendorCount: 22,
          completedTasks: 16,
          interactions: 35,
          score: 87.3,
        },
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      setTopPerformers(mockTopPerformers);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return CheckSquare;
      case 'interaction':
        return MessageSquare;
      case 'vendor':
        return Building2;
      default:
        return Calendar;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
          <p className="text-gray-600">
            {backOfficeUser?.role === 'marketing_manager' 
              ? 'Manage your team and track performance'
              : 'Track your tasks and vendor interactions'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <PermissionGuard department="marketing" permission="write">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Quick Action
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value={stats.activeVendors}
          label="Active Vendors"
          icon={Building2}
          change={stats.monthlyGrowth}
          changeLabel="this month"
          variant="primary"
        />
        <StatsCard
          value={stats.completedTasks}
          label="Completed Tasks"
          icon={CheckSquare}
          change={((stats.completedTasks / stats.totalTasks) * 100) - 75}
          changeLabel="completion rate"
          variant="success"
        />
        <StatsCard
          value={stats.thisMonthInteractions}
          label="This Month Interactions"
          icon={MessageSquare}
          change={15.2}
          changeLabel="vs last month"
          variant="purple"
        />
        <StatsCard
          value={`${stats.conversionRate}%`}
          label="Conversion Rate"
          icon={Target}
          change={2.1}
          changeLabel="improvement"
          variant="pink"
        />
      </div>

      {/* Task Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Task Overview"
          description="Current task status"
          icon={CheckSquare}
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <span className="font-semibold">{stats.totalTasks}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Completed</span>
                <span>{stats.completedTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600">Pending</span>
                <span>{stats.pendingTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(stats.pendingTasks / stats.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            {stats.overdueTasks > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Overdue</span>
                  <span>{stats.overdueTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(stats.overdueTasks / stats.totalTasks) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Recent Activity */}
        <DashboardCard
          title="Recent Activity"
          description="Latest team activities"
          icon={Clock}
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.status || 'default')}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      </div>

      {/* Top Performers */}
      <PermissionGuard department="marketing" permission="read">
        <DashboardCard
          title="Top Performers"
          description="Team members with highest performance scores"
          icon={Award}
        >
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{performer.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{performer.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{performer.score.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">
                    {performer.vendorCount} vendors • {performer.completedTasks} tasks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </PermissionGuard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Vendors"
          description="Manage vendor relationships"
          icon={Building2}
          hoverable
          onClick={() => window.location.href = '/backoffice/marketing/vendors'}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVendors}</p>
              <p className="text-sm text-gray-500">Total vendors</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Tasks"
          description="View and manage tasks"
          icon={CheckSquare}
          hoverable
          onClick={() => window.location.href = '/backoffice/marketing/tasks'}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
              <p className="text-sm text-gray-500">Pending tasks</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Interactions"
          description="Track vendor interactions"
          icon={MessageSquare}
          hoverable
          onClick={() => window.location.href = '/backoffice/marketing/interactions'}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonthInteractions}</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
