/**
 * Marketing Dashboard - Performance Page
 * Shows performance metrics and analytics for marketing team members
 */

'use client';

import { useState, useEffect } from 'react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  Clock,
  DollarSign,
  Package,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

export default function PerformancePage() {
  return (
    <MarketingAuthGuard>
      <PerformanceContent />
    </MarketingAuthGuard>
  );
}

function PerformanceContent() {
  const { marketingUser, refreshUser } = useMarketingAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange, marketingUser]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token for authentication
      const { auth } = await import('@/firebase');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      let idToken = await currentUser.getIdToken();

      // Load performance data based on user role
      let response;
      switch (marketingUser?.role) {
        case 'super_admin':
          response = await fetch(`/api/marketing/analytics/organization?timeRange=${timeRange}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          break;
        case 'team_lead':
          // For team leads, we'll get team performance data
          response = await fetch(`/api/marketing/analytics/team/${marketingUser.teamId}?timeRange=${timeRange}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          break;
        case 'bdm':
          // For BDMs, we'll get their vendor performance data
          response = await fetch(`/api/marketing/vendors/assignments?userId=${marketingUser.uid}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          break;
        case 'team_member':
        default:
          // For team members, we'll get their individual performance data
          response = await fetch(`/api/marketing/analytics/team-member/${marketingUser?.uid}?timeRange=${timeRange}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
      }
      
      // If we get a 401, try refreshing the token
      if (response?.status === 401) {
        await refreshUser();
        idToken = await currentUser.getIdToken(true); // Force refresh
        
        // Retry the request with the refreshed token
        switch (marketingUser?.role) {
          case 'super_admin':
            response = await fetch(`/api/marketing/analytics/organization?timeRange=${timeRange}`, {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            break;
          case 'team_lead':
            response = await fetch(`/api/marketing/analytics/team/${marketingUser.teamId}?timeRange=${timeRange}`, {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            break;
          case 'bdm':
            response = await fetch(`/api/marketing/vendors/assignments?userId=${marketingUser.uid}`, {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            break;
          case 'team_member':
          default:
            response = await fetch(`/api/marketing/analytics/team-member/${marketingUser?.uid}?timeRange=${timeRange}`, {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
        }
      }

      if (response?.ok) {
        const result = await response.json();
        if (result.success) {
          setPerformanceData(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your performance metrics and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={loadPerformanceData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Performance Overview - Role Specific */}
      {marketingUser?.role === 'super_admin' && (
        <OrganizationPerformanceOverview data={performanceData} />
      )}
      
      {marketingUser?.role === 'team_lead' && (
        <TeamLeadPerformanceOverview data={performanceData} />
      )}
      
      {marketingUser?.role === 'bdm' && (
        <BDMPerformanceOverview data={performanceData} />
      )}
      
      {marketingUser?.role === 'team_member' && (
        <TeamMemberPerformanceOverview data={performanceData} />
      )}

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceTrendChart data={performanceData} />
        <TopPerformersList data={performanceData} userRole={marketingUser?.role} />
      </div>
    </div>
  );
}

// Organization Performance Overview (Super Admin)
function OrganizationPerformanceOverview({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value={`$${(data.totalRevenue || 0).toLocaleString()}`}
        subtitle={`${(data.revenueGrowthRate || 0).toFixed(1)}% from last period`}
        icon={DollarSign}
        color="green"
      />
      <StatCard
        title="Active Vendors"
        value={data.totalVendors || 0}
        subtitle={`${(data.vendorGrowthRate || 0).toFixed(1)}% growth`}
        icon={Building2}
        color="blue"
      />
      <StatCard
        title="Team Members"
        value={data.totalTeamMembers || 0}
        subtitle={`${data.activeTeams || 0} active teams`}
        icon={Users}
        color="purple"
      />
      <StatCard
        title="Avg Performance"
        value={`${(data.averagePerformanceScore || 0).toFixed(1)}%`}
        subtitle="Organization average"
        icon={Target}
        color="orange"
      />
    </div>
  );
}

// Team Lead Performance Overview
function TeamLeadPerformanceOverview({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Team Revenue"
        value={`$${(data.totalRevenue || 0).toLocaleString()}`}
        subtitle={`${(data.monthlyGrowthRate || 0).toFixed(1)}% this month`}
        icon={DollarSign}
        color="green"
      />
      <StatCard
        title="Team Members"
        value={data.totalMembers || 0}
        subtitle={`${data.activeMembers || 0} active`}
        icon={Users}
        color="blue"
      />
      <StatCard
        title="Total Vendors"
        value={data.totalVendors || 0}
        subtitle={`${(data.averageVendorsPerMember || 0).toFixed(1)} per member`}
        icon={Building2}
        color="purple"
      />
      <StatCard
        title="Team Performance"
        value={`${(data.teamPerformanceScore || 0).toFixed(1)}%`}
        subtitle="Average score"
        icon={Target}
        color="orange"
      />
    </div>
  );
}

// BDM Performance Overview
function BDMPerformanceOverview({ data }: { data: any }) {
  if (!data) return null;

  // Calculate BDM metrics from assignments
  const totalVendors = data?.length || 0;
  const activeAssignments = data?.filter((a: any) => a.status === 'active').length || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Assigned Vendors"
        value={totalVendors}
        subtitle={`${activeAssignments} active`}
        icon={Building2}
        color="blue"
      />
      <StatCard
        title="Conversion Rate"
        value="N/A"
        subtitle="BDM conversion metrics"
        icon={TrendingUp}
        color="green"
      />
      <StatCard
        title="Avg Performance"
        value="N/A"
        subtitle="Vendor performance"
        icon={Target}
        color="purple"
      />
      <StatCard
        title="Tasks Completed"
        value="N/A"
        subtitle="This period"
        icon={Award}
        color="orange"
      />
    </div>
  );
}

// Team Member Performance Overview
function TeamMemberPerformanceOverview({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Assigned Vendors"
        value={data.assignedVendors || 0}
        subtitle="Currently active"
        icon={Building2}
        color="blue"
      />
      <StatCard
        title="Revenue Generated"
        value={`$${(data.totalRevenue || 0).toLocaleString()}`}
        subtitle="This period"
        icon={DollarSign}
        color="green"
      />
      <StatCard
        title="Performance Score"
        value={`${(data.performanceScore || 0).toFixed(1)}%`}
        subtitle="Personal rating"
        icon={Target}
        color="purple"
      />
      <StatCard
        title="Tasks Completed"
        value={data.completedTasks || 0}
        subtitle="This period"
        icon={Award}
        color="orange"
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Performance Trend Chart
function PerformanceTrendChart({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
          <p>Performance trend visualization</p>
          <p className="text-sm mt-1">Detailed charts coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Top Performers List
function TopPerformersList({ data, userRole }: { data: any; userRole?: string }) {
  // For now, we'll show a generic message
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {userRole === 'super_admin' ? 'Top Performing Teams' : 'Top Performers'}
        </h3>
        <Award className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {data ? (
          <div className="text-center text-gray-500 py-8">
            <Target className="w-12 h-12 mx-auto mb-2" />
            <p>Performance rankings</p>
            <p className="text-sm mt-1">Detailed performance analytics coming soon</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p>No performance data available</p>
            <p className="text-sm mt-1">Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  );
}