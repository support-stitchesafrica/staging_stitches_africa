/**
 * BDM (Business Development Manager) Dashboard Component
 * Manages vendor assignment, performance analytics, and vendor status tracking
 */

'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Building2,
    TrendingUp,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Eye,
    UserPlus,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Package,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Award,
    Zap,
    Calendar,
    Phone,
    Mail,
    Download
} from 'lucide-react';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import type { Tailor } from '@/admin-services/useTailors';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useUsersByRole } from '@/lib/marketing/useMarketingUsersOptimized';
import VendorAssignmentModal from '@/components/marketing/modals/VendorAssignmentModal';
import BulkAssignModal from '@/components/marketing/modals/BulkAssignModal';

interface VendorAssignment
{
    id: string;
    vendorId: string;
    assignedToUserId: string;
    assignedByUserId: string;
    assignmentDate: Date;
    status: 'active' | 'inactive' | 'transferred';
    notes: string[];
    lastEngagementDate?: Date;
}

interface TeamMember
{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    assignedVendorsCount: number;
    teamId?: string;
    lastLoginAt?: Date;
    performanceScore?: number;
    totalInteractions?: number;
    lastAssignmentDate?: Date;
}

interface VendorPerformanceMetrics
{
    vendorId: string;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    growthRate: number;
    lastOrderDate?: Date;
    performanceScore: number;
    productsUploaded?: number;
    lastInteractionDate?: Date;
    followUpRequired?: boolean;
}

interface TeamPerformance
{
    teamId: string;
    teamName: string;
    memberCount: number;
    totalVendors: number;
    avgPerformance: number;
    totalRevenue: number;
}

export default function BDMDashboard()
{
    const { tailors, loading: tailorsLoading, error: tailorsError } = useTailorsOptimized({
        initialLimit: 30,
        autoLoad: true
    });
    const { marketingUser, refreshUser } = useMarketingAuth();
    
    // Use optimized hook for team members
    const { users: teamMembersData, loading: teamMembersLoading } = useUsersByRole('team_member');
    
    const [vendors, setVendors] = useState<Tailor[]>([]);
    const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [performanceMetrics, setPerformanceMetrics] = useState<VendorPerformanceMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'assignments' | 'analytics'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Tailor | null>(null);

    useEffect(() =>
    {
        loadDashboardData();
    }, [tailors]);

    const loadDashboardData = async () =>
    {
        try
        {
            setLoading(true);

            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            // Set vendors from tailors data
            if (tailors)
            {
                setVendors(tailors);

                // Calculate performance metrics from tailor data
                const metrics = tailors.map(tailor => {
                    const totalRevenue = tailor.wallet || 0;
                    const totalOrders = tailor.totalOrders || 0;
                    return {
                        vendorId: tailor.id,
                        totalOrders,
                        totalRevenue,
                        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                        growthRate: 0, // TODO: Calculate from historical data
                        performanceScore: Math.min(100, totalOrders * 5),
                        productsUploaded: tailor.totalProducts || 0,
                        lastInteractionDate: undefined, // TODO: Track from interaction logs
                        followUpRequired: false // TODO: Determine from actual engagement data
                    };
                });
                setPerformanceMetrics(metrics);
            }

            // Load vendor assignments
            let assignmentsResponse = await fetch('/api/marketing/vendors/assignments', {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (assignmentsResponse.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                assignmentsResponse = await fetch('/api/marketing/vendors/assignments', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            if (assignmentsResponse.ok)
            {
                const assignmentsResult = await assignmentsResponse.json();
                if (assignmentsResult.success)
                {
                    setAssignments(assignmentsResult.data);
                }
            }

            // Use team members from hook and enhance with assignment counts
            if (teamMembersData && teamMembersData.length > 0)
            {
                const membersWithCounts = teamMembersData.map((member: any) => ({
                    ...member,
                    assignedVendorsCount: assignments.filter(
                        (a: VendorAssignment) => a.assignedToUserId === member.id && a.status === 'active'
                    ).length || 0,
                    performanceScore: 0, // TODO: Calculate from actual performance metrics
                    totalInteractions: 0, // TODO: Calculate from interaction logs
                    lastAssignmentDate: member.lastAssignmentDate || null
                }));
                setTeamMembers(membersWithCounts);
            }

        } catch (error)
        {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally
        {
            setLoading(false);
        }
    };

    const handleVendorAssignment = async (vendorId: string, assignedToUserId: string, notes?: string) =>
    {
        try
        {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            const idToken = await currentUser.getIdToken();

            const response = await fetch('/api/marketing/vendors/assignments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    vendorId,
                    assignedToUserId,
                    assignedByUserId: marketingUser?.uid || 'current-user-id', // Get from auth context
                    notes: [
                        `Assigned by BDM on ${new Date().toLocaleDateString()}`,
                        ...(notes ? [notes] : [])
                    ]
                })
            });

            if (response.ok)
            {
                const result = await response.json();
                if (result.success)
                {
                    await loadDashboardData(); // Refresh data
                    setShowAssignmentModal(false);
                    setSelectedVendor(null);
                    
                    // Show success message
                    alert('Vendor assigned successfully!');
                } else
                {
                    throw new Error(result.error || 'Failed to assign vendor');
                }
            } else
            {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to assign vendor');
            }
        } catch (error)
        {
            console.error('Error assigning vendor:', error);
            setError(error instanceof Error ? error.message : 'Failed to assign vendor');
        }
    };

    const handleBulkAssignment = async (vendorIds: string[], assignedToUserId: string, notes?: string) =>
    {
        try
        {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            const idToken = await currentUser.getIdToken();

            // Assign each vendor
            const assignmentPromises = vendorIds.map(vendorId => {
                const vendor = vendors.find(v => v.id === vendorId);
                return fetch('/api/marketing/vendors/assignments', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        vendorId,
                        vendorName: vendor?.brand_name || vendor?.brandName || 'Unknown',
                        assignedToUserId,
                        assignedByUserId: marketingUser?.uid || 'current-user-id',
                        notes: notes || `Bulk assigned by BDM on ${new Date().toLocaleDateString()}`
                    })
                });
            });

            const results = await Promise.all(assignmentPromises);
            const successCount = results.filter(r => r.ok).length;
            
            await loadDashboardData(); // Refresh data
            
            // Show success message
            alert(`Successfully assigned ${successCount} of ${vendorIds.length} vendors`);
        } catch (error)
        {
            console.error('Error bulk assigning vendors:', error);
            setError(error instanceof Error ? error.message : 'Failed to bulk assign vendors');
        }
    };

    const filteredVendors = vendors.filter(vendor =>
    {
        const matchesSearch = vendor.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.brandName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;

        const isAssigned = assignments.some(a => a.vendorId === vendor.id && a.status === 'active');
        const matchesStatus = filterStatus === 'assigned' ? isAssigned : !isAssigned;

        return matchesSearch && matchesStatus;
    });

    const dashboardStats = {
        totalVendors: vendors.length,
        assignedVendors: assignments.filter(a => a.status === 'active').length,
        unassignedVendors: vendors.length - assignments.filter(a => a.status === 'active').length,
        totalTeamMembers: teamMembers.length,
        totalRevenue: performanceMetrics.reduce((sum, metric) => sum + metric.totalRevenue, 0),
        averagePerformance: performanceMetrics.length > 0
            ? performanceMetrics.reduce((sum, metric) => sum + metric.performanceScore, 0) / performanceMetrics.length
            : 0,
        vendorsNeedingFollowUp: performanceMetrics.filter(m => m.followUpRequired).length,
        totalProductsUploaded: performanceMetrics.reduce((sum, metric) => sum + (metric.productsUploaded || 0), 0)
    };

    if (loading || tailorsLoading)
    {
        return <DashboardSkeleton />;
    }

    if (error || tailorsError)
    {
        return <DashboardError error={error || tailorsError} onRetry={loadDashboardData} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">BDM Dashboard</h1>
                    <p className="text-gray-600">Manage vendor assignments and track performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAssignmentModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Assign Vendor
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'vendors', label: 'Vendor Management', icon: Building2 },
                        { id: 'assignments', label: 'Assignments', icon: Users },
                        { id: 'analytics', label: 'Performance Analytics', icon: Activity }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <OverviewTab
                    stats={dashboardStats}
                    vendors={vendors}
                    assignments={assignments}
                    teamMembers={teamMembers}
                    performanceMetrics={performanceMetrics}
                />
            )}

            {activeTab === 'vendors' && (
                <VendorManagementTab
                    vendors={filteredVendors}
                    assignments={assignments}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    onAssignVendor={(vendor) =>
                    {
                        setSelectedVendor(vendor);
                        setShowAssignmentModal(true);
                    }}
                    onRefresh={loadDashboardData}
                    teamMembers={teamMembers}
                />
            )}

            {activeTab === 'assignments' && (
                <AssignmentsTab
                    assignments={assignments}
                    vendors={vendors}
                    teamMembers={teamMembers}
                    onRefresh={loadDashboardData}
                />
            )}

            {activeTab === 'analytics' && (
                <AnalyticsTab
                    performanceMetrics={performanceMetrics}
                    vendors={vendors}
                    assignments={assignments}
                />
            )}

            {/* Assignment Modal */}
            {showAssignmentModal && (
                <VendorAssignmentModal
                    vendor={selectedVendor}
                    teamMembers={teamMembers}
                    onAssign={(vendorId, assignedToUserId, notes) => handleVendorAssignment(vendorId, assignedToUserId, notes)}
                    onClose={() =>
                    {
                        setShowAssignmentModal(false);
                        setSelectedVendor(null);
                    }}
                />
            )}
        </div>
    );
}// Overview Tab Component
function OverviewTab({
    stats,
    vendors,
    assignments,
    teamMembers,
    performanceMetrics
}: {
    stats: any;
    vendors: Tailor[];
    assignments: VendorAssignment[];
    teamMembers: TeamMember[];
    performanceMetrics: VendorPerformanceMetrics[];
})
{
    const topPerformers = performanceMetrics
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 5);

    const recentAssignments = assignments
        .sort((a, b) => new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime())
        .slice(0, 5);

    // Team performance data will be loaded from backend
    // TODO: Implement real team performance data from marketing_teams collection
    const teamPerformanceData: TeamPerformance[] = [];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Vendors"
                    value={stats.totalVendors}
                    subtitle={`${stats.assignedVendors} assigned`}
                    icon={Building2}
                    color="blue"
                />
                <StatCard
                    title="Unassigned Vendors"
                    value={stats.unassignedVendors}
                    subtitle="Need assignment"
                    icon={AlertTriangle}
                    color="orange"
                />
                <StatCard
                    title="Team Members"
                    value={stats.totalTeamMembers}
                    subtitle="Active members"
                    icon={Users}
                    color="green"
                />
                <StatCard
                    title="Avg Performance"
                    value={`${Math.round(stats.averagePerformance)}%`}
                    subtitle="Vendor performance"
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Team Performance and Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPerformanceChart teamPerformance={teamPerformanceData} />
                <VendorDistributionChart assignments={assignments} teamMembers={teamMembers} />
            </div>

            {/* Quick Actions and Team Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuickActionsCard />
                <TeamOverviewCard teamMembers={teamMembers} />
            </div>

            {/* Top Performing Vendors */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Vendors</h2>
                <div className="space-y-3">
                    {topPerformers.map((metric, index) =>
                    {
                        const vendor = vendors.find(v => v.id === metric.vendorId);
                        return (
                            <VendorPerformanceRow
                                key={metric.vendorId}
                                vendor={vendor}
                                metric={metric}
                                rank={index + 1}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Recent Assignments */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h2>
                <div className="space-y-3">
                    {recentAssignments.length > 0 ? (
                        recentAssignments.map((assignment) =>
                        {
                            const vendor = vendors.find(v => v.id === assignment.vendorId);
                            const member = teamMembers.find(m => m.id === assignment.assignedToUserId);
                            return (
                                <AssignmentRow
                                    key={assignment.id}
                                    assignment={assignment}
                                    vendor={vendor}
                                    member={member}
                                />
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-center py-4">No recent assignments</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Vendor Management Tab Component
function VendorManagementTab({
    vendors,
    assignments,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    onAssignVendor,
    onRefresh,
    teamMembers
}: {
    vendors: Tailor[];
    assignments: VendorAssignment[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: 'all' | 'assigned' | 'unassigned';
    setFilterStatus: (status: 'all' | 'assigned' | 'unassigned') => void;
    onAssignVendor: (vendor: Tailor) => void;
    onRefresh: () => void;
    teamMembers: TeamMember[];
})
{
    // Calculate vendor statistics
    const vendorStats = {
        total: vendors.length,
        assigned: assignments.filter(a => a.status === 'active').length,
        unassigned: vendors.length - assignments.filter(a => a.status === 'active').length,
        followUpRequired: 0 // TODO: Calculate from actual engagement tracking data
    };

    return (
        <div className="space-y-6">
            {/* Vendor Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard
                    title="Total Vendors"
                    value={vendorStats.total}
                    icon={Building2}
                    color="blue"
                />
                <StatCard
                    title="Assigned"
                    value={vendorStats.assigned}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="Unassigned"
                    value={vendorStats.unassigned}
                    icon={AlertTriangle}
                    color="orange"
                />
                <StatCard
                    title="Follow-up Needed"
                    value={vendorStats.followUpRequired}
                    icon={Clock}
                    color="red"
                />
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Vendors</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => alert('Export functionality to be implemented')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) =>
                {
                    const assignment = assignments.find(a => a.vendorId === vendor.id && a.status === 'active');
                    return (
                        <VendorManagementCard
                            key={vendor.id}
                            vendor={vendor}
                            assignment={assignment}
                            onAssign={() => onAssignVendor(vendor)}
                            teamMembers={teamMembers}
                        />
                    );
                })}
            </div>

            {vendors.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'Try adjusting your search criteria.' : 'No vendors available.'}
                    </p>
                </div>
            )}
        </div>
    );
}

// Assignments Tab Component
function AssignmentsTab({
    assignments,
    vendors,
    teamMembers,
    onRefresh
}: {
    assignments: VendorAssignment[];
    vendors: Tailor[];
    teamMembers: TeamMember[];
    onRefresh: () => void;
})
{
    const [filterMember, setFilterMember] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'transferred'>('all');
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

    const filteredAssignments = assignments.filter(assignment =>
    {
        if (filterMember !== 'all' && assignment.assignedToUserId !== filterMember) return false;
        if (filterStatus !== 'all' && assignment.status !== filterStatus) return false;
        return true;
    });

    // Calculate assignment statistics
    const assignmentStats = {
        total: assignments.length,
        active: assignments.filter(a => a.status === 'active').length,
        inactive: assignments.filter(a => a.status === 'inactive').length,
        transferred: assignments.filter(a => a.status === 'transferred').length
    };

    return (
        <div className="space-y-6">
            {/* Assignment Filters and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filterMember}
                        onChange={(e) => setFilterMember(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Team Members</option>
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="transferred">Transferred</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowBulkAssignModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Bulk Assign
                    </button>
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Assignment Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard
                    title="Total Assignments"
                    value={assignmentStats.total}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Active"
                    value={assignmentStats.active}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="Inactive"
                    value={assignmentStats.inactive}
                    icon={XCircle}
                    color="orange"
                />
                <StatCard
                    title="Transferred"
                    value={assignmentStats.transferred}
                    icon={ArrowUpRight}
                    color="purple"
                />
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Vendor Assignments ({filteredAssignments.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assigned To
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assignment Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Engagement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAssignments.map((assignment) =>
                            {
                                const vendor = vendors.find(v => v.id === assignment.vendorId);
                                const member = teamMembers.find(m => m.id === assignment.assignedToUserId);
                                return (
                                    <AssignmentTableRow
                                        key={assignment.id}
                                        assignment={assignment}
                                        vendor={vendor}
                                        member={member}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredAssignments.length === 0 && (
                <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Start assigning vendors to team members.
                    </p>
                </div>
            )}

            {/* Bulk Assign Modal */}
            {showBulkAssignModal && (
                <BulkAssignModal
                    vendors={vendors.filter(v => !assignments.some(a => a.vendorId === v.id && a.status === 'active'))}
                    teamMembers={teamMembers}
                    onClose={() => setShowBulkAssignModal(false)}
                    onAssign={handleBulkAssignment}
                />
            )}
        </div>
    );
}

// Analytics Tab Component
function AnalyticsTab({
    performanceMetrics,
    vendors,
    assignments
}: {
    performanceMetrics: VendorPerformanceMetrics[];
    vendors: Tailor[];
    assignments: VendorAssignment[];
})
{
    const totalRevenue = performanceMetrics.reduce((sum, metric) => sum + metric.totalRevenue, 0);
    const averagePerformance = performanceMetrics.length > 0
        ? performanceMetrics.reduce((sum, metric) => sum + metric.performanceScore, 0) / performanceMetrics.length
        : 0;

    // Calculate performance trends
    const performanceTrends = [
        { period: 'This Week', value: 85, change: 5 },
        { period: 'Last Week', value: 80, change: -2 },
        { period: 'This Month', value: 78, change: 8 },
        { period: 'Last Month', value: 70, change: 3 }
    ];

    return (
        <div className="space-y-6">
            {/* Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`$${(totalRevenue / 1000).toFixed(1)}K`}
                    subtitle="All vendors"
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title="Avg Performance"
                    value={`${Math.round(averagePerformance)}%`}
                    subtitle="Performance score"
                    icon={Target}
                    color="blue"
                />
                <StatCard
                    title="Active Assignments"
                    value={assignments.filter(a => a.status === 'active').length}
                    subtitle="Current assignments"
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title="Top Performer"
                    value={performanceMetrics.length > 0 ? `${Math.round(Math.max(...performanceMetrics.map(m => m.performanceScore)))}%` : '0%'}
                    subtitle="Best performance"
                    icon={Award}
                    color="orange"
                />
            </div>

            {/* Performance Trends */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {performanceTrends.map((trend, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">{trend.period}</p>
                            <p className="text-2xl font-bold text-gray-900">{trend.value}%</p>
                            <div className="flex items-center mt-1">
                                {trend.change >= 0 ? (
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`text-sm ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Math.abs(trend.change)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VendorPerformanceChart performanceMetrics={performanceMetrics} vendors={vendors} />
                <RevenueBreakdownChart performanceMetrics={performanceMetrics} vendors={vendors} />
            </div>

            {/* Detailed Performance Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Vendor Performance Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Orders
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Growth
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {performanceMetrics
                                .sort((a, b) => b.performanceScore - a.performanceScore)
                                .map((metric) =>
                                {
                                    const vendor = vendors.find(v => v.id === metric.vendorId);
                                    return (
                                        <PerformanceTableRow
                                            key={metric.vendorId}
                                            vendor={vendor}
                                            metric={metric}
                                        />
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Utility Components
function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
})
{
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600'
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function VendorManagementCard({
    vendor,
    assignment,
    onAssign,
    teamMembers
}: {
    vendor: Tailor;
    assignment?: VendorAssignment;
    onAssign: (vendor: Tailor) => void;
    teamMembers?: TeamMember[];
})
{
    const isAssigned = !!assignment;
    const needsFollowUp = false; // TODO: Determine from actual engagement tracking
    const performanceScore = Math.min(100, (vendor.totalOrders || 0) * 5);
    
    // Get assigned team member name
    const assignedMember = teamMembers?.find(m => m.id === assignment?.assignedToUserId);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {vendor.brand_name || vendor.brandName || 'Unknown Brand'}
                    </h3>
                    <p className="text-sm text-gray-500">{vendor.wear_specialization || 'Fashion'}</p>
                </div>
                <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isAssigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {isAssigned ? 'Assigned' : 'Unassigned'}
                    </span>
                    {needsFollowUp && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Follow-up
                        </span>
                    )}
                </div>
            </div>

            {/* Assignment Status */}
            {isAssigned && assignedMember && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium mb-1">Assigned To</p>
                    <p className="text-sm font-semibold text-blue-900">{assignedMember.name}</p>
                    <p className="text-xs text-blue-600">{assignedMember.email}</p>
                    {assignment?.assignedAt && (
                        <p className="text-xs text-blue-500 mt-1">
                            Since {new Date(assignment.assignedAt.seconds * 1000).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    {vendor.totalProducts || 0} Products
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {vendor.totalOrders || 0} Orders
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Activity className="w-4 h-4 mr-2" />
                    {vendor.identity_verification?.status === 'verified' ? 'Verified' : 'Pending'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Last contact: {new Date().toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Target className="w-4 h-4 mr-2" />
                    Performance: {performanceScore}%
                </div>
            </div>

            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Performance</span>
                    <span>{performanceScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${performanceScore}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View
                </button>
                <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact
                </button>
                {!isAssigned ? (
                    <button
                        onClick={() => onAssign(vendor)}
                        className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Assign
                    </button>
                ) : (
                    <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Assigned
                    </button>
                )}
            </div>
        </div>
    );
}

function VendorPerformanceRow({
    vendor,
    metric,
    rank
}: {
    vendor?: Tailor;
    metric: VendorPerformanceMetrics;
    rank: number;
})
{
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {rank}
                </div>
                <div>
                    <p className="font-medium text-gray-900">
                        {vendor?.brand_name || vendor?.brandName || 'Unknown Brand'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {vendor?.wear_specialization || 'Fashion'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-900">{metric.performanceScore}%</p>
                <p className="text-sm text-gray-500">{metric.totalOrders} orders</p>
            </div>
        </div>
    );
}

function AssignmentRow({
    assignment,
    vendor,
    member
}: {
    assignment: VendorAssignment;
    vendor?: Tailor;
    member?: TeamMember;
})
{
    return (
        <div className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {vendor?.brand_name?.charAt(0) || 'V'}
                </div>
                <div>
                    <p className="font-medium text-gray-900">
                        {vendor?.brand_name || vendor?.brandName || 'Unknown Vendor'}
                    </p>
                    <p className="text-sm text-gray-500">
                        Assigned to {member?.name || 'Unknown Member'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-900">{new Date(assignment.assignmentDate).toLocaleDateString()}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {assignment.status}
                </span>
            </div>
        </div>
    );
}

function AssignmentTableRow({
    assignment,
    vendor,
    member
}: {
    assignment: VendorAssignment;
    vendor?: Tailor;
    member?: TeamMember;
})
{
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                            {vendor?.brand_name?.charAt(0) || 'V'}
                        </span>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {vendor?.brand_name || vendor?.brandName || 'Unknown Vendor'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {vendor?.wear_specialization || 'Fashion'}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{member?.name || 'Unknown Member'}</div>
                <div className="text-sm text-gray-500">{member?.email}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(assignment.assignmentDate).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {assignment.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {assignment.lastEngagementDate
                    ? new Date(assignment.lastEngagementDate).toLocaleDateString()
                    : 'Never'
                }
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-primary hover:text-primary/80">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}

function PerformanceTableRow({
    vendor,
    metric
}: {
    vendor?: Tailor;
    metric: VendorPerformanceMetrics;
})
{
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {vendor?.brand_name || vendor?.brandName || 'Unknown Vendor'}
                </div>
                <div className="text-sm text-gray-500">
                    {vendor?.wear_specialization || 'Fashion'}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {metric.totalOrders}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${metric.totalRevenue.toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${metric.performanceScore}%` }}
                        ></div>
                    </div>
                    <span className="text-sm text-gray-900">{metric.performanceScore}%</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    {metric.growthRate >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${metric.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(metric.growthRate).toFixed(1)}%
                    </span>
                </div>
            </td>
        </tr>
    );
}

function QuickActionsCard()
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="font-medium text-gray-900">Assign Vendor</p>
                        <p className="text-sm text-gray-500">Assign vendor to team member</p>
                    </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Plus className="w-5 h-5 text-green-600" />
                    <div>
                        <p className="font-medium text-gray-900">Add Vendor</p>
                        <p className="text-sm text-gray-500">Register new vendor</p>
                    </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div>
                        <p className="font-medium text-gray-900">View Analytics</p>
                        <p className="text-sm text-gray-500">Check performance metrics</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

function TeamPerformanceChart({ teamPerformance }: { teamPerformance: TeamPerformance[] })
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
            <div className="space-y-4">
                {teamPerformance.map((team) => (
                    <div key={team.teamId} className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{team.teamName}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${team.avgPerformance}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="ml-4 text-sm font-medium text-gray-900">
                            {team.avgPerformance}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VendorDistributionChart({ assignments, teamMembers }: { assignments: VendorAssignment[]; teamMembers: TeamMember[] })
{
    // Calculate vendor distribution by team member
    const distribution = teamMembers.map(member => ({
        memberId: member.id,
        memberName: member.name,
        vendorCount: assignments.filter(a => a.assignedToUserId === member.id && a.status === 'active').length
    }));

    const totalVendors = distribution.reduce((sum, item) => sum + item.vendorCount, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Distribution</h3>
            <div className="space-y-4">
                {distribution.map((item) => (
                    <div key={item.memberId} className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.memberName}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${totalVendors > 0 ? (item.vendorCount / totalVendors) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="ml-4 text-sm font-medium text-gray-900">
                            {item.vendorCount}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TeamOverviewCard({ teamMembers }: { teamMembers: TeamMember[] })
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h3>
            <div className="space-y-3">
                {teamMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{member.assignedVendorsCount} vendors</p>
                            <p className="text-xs text-gray-500">{member.performanceScore}% performance</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                    View all team members →
                </button>
            </div>
        </div>
    );
}

function VendorPerformanceChart({
    performanceMetrics,
    vendors
}: {
    performanceMetrics: VendorPerformanceMetrics[];
    vendors: Tailor[];
})
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Performance</h3>
            <div className="space-y-4">
                {performanceMetrics
                    .sort((a, b) => b.performanceScore - a.performanceScore)
                    .slice(0, 5)
                    .map((metric) =>
                    {
                        const vendor = vendors.find(v => v.id === metric.vendorId);
                        return (
                            <div key={metric.vendorId} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {vendor?.brand_name || vendor?.brandName || 'Unknown'}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-primary h-2 rounded-full"
                                            style={{ width: `${metric.performanceScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="ml-4 text-sm font-medium text-gray-900">
                                    {metric.performanceScore}%
                                </span>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

function RevenueBreakdownChart({
    performanceMetrics,
    vendors
}: {
    performanceMetrics: VendorPerformanceMetrics[];
    vendors: Tailor[];
})
{
    const totalRevenue = performanceMetrics.reduce((sum, metric) => sum + metric.totalRevenue, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
                {performanceMetrics
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((metric) =>
                    {
                        const vendor = vendors.find(v => v.id === metric.vendorId);
                        const percentage = totalRevenue > 0 ? (metric.totalRevenue / totalRevenue) * 100 : 0;
                        return (
                            <div key={metric.vendorId} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {vendor?.brand_name || vendor?.brandName || 'Unknown'}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="ml-4 text-sm font-medium text-gray-900">
                                    ${(metric.totalRevenue / 1000).toFixed(1)}K
                                </span>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

// VendorAssignmentModal is imported from components/marketing/modals/VendorAssignmentModal

function DashboardSkeleton()
{
    return (
        <div className="space-y-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DashboardError({ error, onRetry }: { error: string | null; onRetry: () => void })
{
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <button
                        onClick={onRetry}
                        className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}

// BulkAssignModal is imported from components/marketing/modals/BulkAssignModal