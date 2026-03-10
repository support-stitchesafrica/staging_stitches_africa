/**
 * Team Lead Dashboard Component
 * Manages team members, performance analytics, and vendor reassignment within team
 */

'use client';

import { useState, useEffect } from 'react';
import
{
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
    Shuffle,
    UserCheck,
    UserX,
    Settings,
    BarChart3,
    Folder,
    X
} from 'lucide-react';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import type { Tailor } from '@/admin-services/useTailors';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useUsersByRole } from '@/lib/marketing/useMarketingUsersOptimized';
import VendorReassignmentModal from '@/components/marketing/modals/VendorReassignmentModal';

interface TeamMember
{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    assignedVendorsCount: number;
    totalInteractions: number;
    performanceScore: number;
    joinedAt: Date;
}

interface VendorAssignment
{
    id: string;
    vendorId: string;
    assignedToUserId: string;
    assignedByUserId: string;
    assignmentDate: Date;
    status: 'active' | 'inactive';
    notes: string[];
    lastEngagementDate?: Date;
}

interface TeamPerformanceMetrics
{
    totalVendors: number;
    totalRevenue: number;
    averagePerformance: number;
    topPerformer: TeamMember | null;
    vendorGrowthRate: number;
    teamEfficiency: number;
}

// Add this interface for team sections
interface TeamSection {
    id: string;
    name: string;
    description?: string;
    memberIds: string[];
    createdAt: Date;
    createdBy: string;
}

// Add this interface for section assignments
interface SectionAssignment {
    id: string;
    sectionId: string;
    memberId: string;
    assignedAt: Date;
    assignedBy: string;
}

export default function TeamLeadDashboard()
{
    const { tailors, loading: tailorsLoading, error: tailorsError } = useTailorsOptimized({
        initialLimit: 20,
        autoLoad: true
    });
    const { marketingUser, refreshUser } = useMarketingAuth();
    
    // Use optimized hook for available team members
    const { users: availableTeamMembers, loading: availableUsersLoading } = useUsersByRole('team_member');
    
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
    const [teamVendors, setTeamVendors] = useState<Tailor[]>([]);
    const [performanceMetrics, setPerformanceMetrics] = useState<TeamPerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'vendors' | 'performance' | 'sections'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<VendorAssignment | null>(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    
    // Add state for sections
    const [sections, setSections] = useState<TeamSection[]>([]);
    const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
    const [showAssignSectionModal, setShowAssignSectionModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState<TeamSection | null>(null);

    useEffect(() =>
    {
        loadDashboardData();
        loadSections();
    }, [tailors]);

    // Calculate performance metrics when data changes
    useEffect(() =>
    {
        if (teamMembers.length > 0 && teamVendors.length > 0)
        {
            // Calculate total revenue from vendor wallets
            const totalRevenue = teamVendors.reduce((sum, vendor) => sum + (vendor.wallet || 0), 0);
            const averagePerformance = teamMembers.reduce((sum, member) => sum + member.performanceScore, 0) / teamMembers.length;
            const topPerformer = teamMembers.reduce((top, member) =>
                member.performanceScore > (top?.performanceScore || 0) ? member : top, teamMembers[0]);

            setPerformanceMetrics({
                totalVendors: teamVendors.length,
                totalRevenue,
                averagePerformance,
                topPerformer,
                vendorGrowthRate: 0, // TODO: Calculate from historical vendor data
                teamEfficiency: Math.min(100, averagePerformance)
            });
        }
    }, [teamMembers, teamVendors]);

    const loadDashboardData = async () =>
    {
        try
        {
            setLoading(true);

            // Get current user's team ID from auth context
            const currentTeamId = marketingUser?.teamId;
            
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }
            
            const idToken = await currentUser.getIdToken();

            // Load team members
            // Super admins don't need a team assignment
            if (!currentTeamId && marketingUser?.role !== 'super_admin') {
                setError('No team assigned. Please contact your administrator to be assigned to a team.');
                setLoading(false);
                return;
            }
            
            // If super admin without team, show empty state instead of error
            if (!currentTeamId && marketingUser?.role === 'super_admin') {
                setTeamMembers([]);
                setLoading(false);
                return;
            }
            
            const teamResponse = await fetch(`/api/marketing/teams/${currentTeamId}/members`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            if (teamResponse.ok)
            {
                const teamResult = await teamResponse.json();
                if (teamResult.success)
                {
                    // Get vendor assignments for each member to calculate metrics
                    const membersWithMetrics = await Promise.all(
                        teamResult.data.map(async (member: any) =>
                        {
                            const assignmentsResponse = await fetch(`/api/marketing/vendors/assignments?userId=${member.id}`, {
                                headers: {
                                    'Authorization': `Bearer ${idToken}`
                                }
                            });
                            let assignedVendorsCount = 0;
                            let totalInteractions = 0;

                            if (assignmentsResponse.ok)
                            {
                                const assignmentsResult = await assignmentsResponse.json();
                                if (assignmentsResult.success)
                                {
                                    assignedVendorsCount = assignmentsResult.data.length;
                                    // TODO: Calculate interactions from actual interaction logs
                                    totalInteractions = 0;
                                }
                            }

                            return {
                                ...member,
                                assignedVendorsCount,
                                totalInteractions,
                                performanceScore: 0, // TODO: Calculate from actual performance metrics
                                joinedAt: new Date(member.createdAt?.seconds ? member.createdAt.seconds * 1000 : member.createdAt)
                            };
                        })
                    );
                    setTeamMembers(membersWithMetrics);
                }
            }

            // Load vendor assignments for the team
            const assignmentsResponse = await fetch(`/api/marketing/vendors/assignments?teamId=${currentTeamId}`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            if (assignmentsResponse.ok)
            {
                const assignmentsResult = await assignmentsResponse.json();
                if (assignmentsResult.success)
                {
                    setAssignments(assignmentsResult.data);

                    // Filter tailors to show only team-assigned ones
                    const teamVendorIds = assignmentsResult.data.map((a: VendorAssignment) => a.vendorId);
                    const filteredVendors = tailors?.filter(tailor => teamVendorIds.includes(tailor.id)) || [];
                    setTeamVendors(filteredVendors);
                }
            }

        } catch (error)
        {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data. Please try again or contact support.');
        } finally
        {
            setLoading(false);
        }
    };

    // Add function to load sections
    const loadSections = async () => {
        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                console.error('No authenticated user');
                return;
            }
            
            let idToken = await currentUser.getIdToken();
            
            let response = await fetch('/api/marketing/sections', {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch('/api/marketing/sections', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setSections(result.data.map((section: any) => ({
                        ...section,
                        createdAt: new Date(section.createdAt?.seconds ? section.createdAt.seconds * 1000 : section.createdAt)
                    })));
                }
            }
        } catch (error) {
            console.error('Error loading sections:', error);
            setError('Failed to load team sections. Please try again.');
        }
    };

    // Add function to create a section
    const handleCreateSection = async (sectionData: { name: string; description?: string }) => {
        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                return { success: false, error: 'Not authenticated' };
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch('/api/marketing/sections', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(sectionData)
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch('/api/marketing/sections', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify(sectionData)
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    loadSections();
                    setShowCreateSectionModal(false);
                    return { success: true };
                } else {
                    throw new Error(result.error || 'Failed to create section');
                }
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to create section');
            }
        } catch (error) {
            console.error('Error creating section:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create section' };
        }
    };

    // Add function to assign member to section
    const handleAssignMemberToSection = async (sectionId: string, memberId: string) => {
        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                return { success: false, error: 'Not authenticated' };
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/sections/${sectionId}/members`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ memberId })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/sections/${sectionId}/members`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ memberId })
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    loadSections();
                    setShowAssignSectionModal(false);
                    return { success: true };
                } else {
                    throw new Error(result.error || 'Failed to assign member to section');
                }
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to assign member to section');
            }
        } catch (error) {
            console.error('Error assigning member to section:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to assign member to section' };
        }
    };

    // Add function to remove member from section
    const handleRemoveMemberFromSection = async (sectionId: string, memberId: string) => {
        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                return { success: false, error: 'Not authenticated' };
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/sections/${sectionId}/members/${memberId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/sections/${sectionId}/members/${memberId}`, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    loadSections();
                    return { success: true };
                } else {
                    throw new Error(result.error || 'Failed to remove member from section');
                }
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to remove member from section');
            }
        } catch (error) {
            console.error('Error removing member from section:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to remove member from section' };
        }
    };

    const handleVendorReassignment = async (assignmentId: string, newAssigneeId: string) =>
    {
        try
        {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch('/api/marketing/vendors/assignments', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    assignmentId,
                    assignedToUserId: newAssigneeId,
                    notes: `Reassigned by team lead on ${new Date().toISOString()}`
                })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch('/api/marketing/vendors/assignments', {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        assignmentId,
                        assignedToUserId: newAssigneeId,
                        notes: `Reassigned by team lead on ${new Date().toISOString()}`
                    })
                });
            }

            if (response.ok)
            {
                const result = await response.json();
                if (result.success)
                {
                    await loadDashboardData(); // Refresh data
                    setShowReassignModal(false);
                    setSelectedAssignment(null);
                } else
                {
                    throw new Error(result.error || 'Failed to reassign vendor');
                }
            } else
            {
                const result = await response.json();
                throw new Error(result.error || 'Failed to reassign vendor');
            }
        } catch (error)
        {
            console.error('Error reassigning vendor:', error);
            setError(error instanceof Error ? error.message : 'Failed to reassign vendor');
        }
    };

    const handleAddTeamMember = async (userId: string) =>
    {
        try
        {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            // Get current user's team ID from auth context
            const currentTeamId = marketingUser?.teamId;
            
            // Super admins don't need a team assignment
            if (!currentTeamId && marketingUser?.role !== 'super_admin') {
                setError('No team assigned');
                return;
            }
            
            // If super admin without team, they need to create a team first
            if (!currentTeamId && marketingUser?.role === 'super_admin') {
                setError('Please create a team first from the Admin Panel');
                return;
            }

            let response = await fetch(`/api/marketing/teams/${currentTeamId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ userId })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/teams/${currentTeamId}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ userId })
                });
            }

            if (response.ok)
            {
                const result = await response.json();
                if (result.success)
                {
                    await loadDashboardData(); // Refresh data
                    return { success: true };
                } else
                {
                    throw new Error(result.error || 'Failed to add team member');
                }
            } else
            {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to add team member');
            }
        } catch (error)
        {
            console.error('Error adding team member:', error);
            setError(error instanceof Error ? error.message : 'Failed to add team member');
        }
    };

    const loadAvailableUsers = async () =>
    {
        try
        {
            // Use available team members from hook and filter out current team members
            if (availableTeamMembers && availableTeamMembers.length > 0)
            {
                const currentMemberIds = teamMembers.map(m => m.id);
                const available = availableTeamMembers.filter((user: any) =>
                    !currentMemberIds.includes(user.id) && !user.teamId
                );
                setAvailableUsers(available);
            }
        } catch (error)
        {
            console.error('Error loading available users:', error);
        }
    };

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dashboardStats = {
        totalMembers: teamMembers.length,
        activeMembers: teamMembers.filter(m => m.isActive).length,
        totalVendors: teamVendors.length,
        totalRevenue: performanceMetrics?.totalRevenue || 0,
        averagePerformance: performanceMetrics?.averagePerformance || 0,
        teamEfficiency: performanceMetrics?.teamEfficiency || 0
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
                    <h1 className="text-2xl font-bold text-gray-900">Team Lead Dashboard</h1>
                    <p className="text-gray-600">Manage your team and track performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() =>
                        {
                            loadAvailableUsers();
                            setShowAddMemberModal(true);
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Member
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Team Settings
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'team', label: 'Team Management', icon: Users },
                        { id: 'vendors', label: 'Vendor Assignments', icon: Building2 },
                        { id: 'performance', label: 'Performance Analytics', icon: TrendingUp },
                        { id: 'sections', label: 'Team Sections', icon: Folder }
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
                    teamMembers={teamMembers}
                    teamVendors={teamVendors}
                    assignments={assignments}
                    performanceMetrics={performanceMetrics}
                />
            )}

            {activeTab === 'team' && (
                <TeamManagementTab
                    teamMembers={filteredMembers}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onRefresh={loadDashboardData}
                    onAddMember={() =>
                    {
                        loadAvailableUsers();
                        setShowAddMemberModal(true);
                    }}
                />
            )}

            {activeTab === 'vendors' && (
                <VendorAssignmentsTab
                    assignments={assignments}
                    teamVendors={teamVendors}
                    teamMembers={teamMembers}
                    onReassign={(assignment) =>
                    {
                        setSelectedAssignment(assignment);
                        setShowReassignModal(true);
                    }}
                    onRefresh={loadDashboardData}
                />
            )}

            {activeTab === 'performance' && (
                <PerformanceAnalyticsTab
                    teamMembers={teamMembers}
                    teamVendors={teamVendors}
                    assignments={assignments}
                    performanceMetrics={performanceMetrics}
                />
            )}

            {activeTab === 'sections' && (
                <SectionsManagementTab
                    sections={sections}
                    teamMembers={teamMembers}
                    onCreateSection={() => setShowCreateSectionModal(true)}
                    onAssignMember={(section) => {
                        setSelectedSection(section);
                        setShowAssignSectionModal(true);
                    }}
                    onRemoveMember={handleRemoveMemberFromSection}
                    onRefresh={loadSections}
                />
            )}

            {/* Reassignment Modal */}
            {showReassignModal && selectedAssignment && (
                <VendorReassignmentModal
                    assignment={selectedAssignment}
                    teamMembers={teamMembers}
                    teamVendors={teamVendors}
                    onReassign={handleVendorReassignment}
                    onClose={() =>
                    {
                        setShowReassignModal(false);
                        setSelectedAssignment(null);
                    }}
                />
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <AddTeamMemberModal
                    availableUsers={availableUsers}
                    onAddMember={handleAddTeamMember}
                    onClose={() => setShowAddMemberModal(false)}
                />
            )}

            {/* Create Section Modal */}
            {showCreateSectionModal && (
                <CreateSectionModal
                    onCreate={handleCreateSection}
                    onClose={() => setShowCreateSectionModal(false)}
                />
            )}

            {/* Assign Section Modal */}
            {showAssignSectionModal && selectedSection && (
                <AssignSectionModal
                    section={selectedSection}
                    teamMembers={teamMembers}
                    sections={sections}
                    onAssign={handleAssignMemberToSection}
                    onClose={() => {
                        setShowAssignSectionModal(false);
                        setSelectedSection(null);
                    }}
                />
            )}
        </div>
    );
}

// Overview Tab Component
function OverviewTab({
    stats,
    teamMembers,
    teamVendors,
    assignments,
    performanceMetrics
}: {
    stats: any;
    teamMembers: TeamMember[];
    teamVendors: Tailor[];
    assignments: VendorAssignment[];
    performanceMetrics: TeamPerformanceMetrics | null;
})
{
    const topPerformers = teamMembers
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 5);

    const recentAssignments = assignments
        .sort((a, b) => new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Team Members"
                    value={stats.totalMembers}
                    subtitle={`${stats.activeMembers} active`}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Assigned Vendors"
                    value={stats.totalVendors}
                    subtitle="Under management"
                    icon={Building2}
                    color="green"
                />
                <StatCard
                    title="Team Performance"
                    value={`${Math.round(stats.averagePerformance)}%`}
                    subtitle="Average score"
                    icon={Target}
                    color="purple"
                />
                <StatCard
                    title="Team Efficiency"
                    value={`${Math.round(stats.teamEfficiency)}%`}
                    subtitle="Overall efficiency"
                    icon={Activity}
                    color="orange"
                />
            </div>

            {/* Team Overview and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamOverviewCard teamMembers={teamMembers} />
                <QuickActionsCard />
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Team Members</h2>
                <div className="space-y-3">
                    {topPerformers.map((member, index) => (
                        <TeamMemberPerformanceRow
                            key={member.id}
                            member={member}
                            rank={index + 1}
                        />
                    ))}
                </div>
            </div>

            {/* Vendor Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Distribution</h2>
                <div className="space-y-3">
                    {teamMembers.map((member) => (
                        <VendorDistributionRow
                            key={member.id}
                            member={member}
                            totalVendors={stats.totalVendors}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
// Team Management Tab Component
function TeamManagementTab({
    teamMembers,
    searchTerm,
    setSearchTerm,
    onRefresh,
    onAddMember
}: {
    teamMembers: TeamMember[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onRefresh: () => void;
    onAddMember: () => void;
})
{
    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search team members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={onAddMember}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                    <TeamMemberCard key={member.id} member={member} />
                ))}
            </div>

            {teamMembers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'Try adjusting your search criteria.' : 'Start building your team.'}
                    </p>
                </div>
            )}
        </div>
    );
}

// Vendor Assignments Tab Component
function VendorAssignmentsTab({
    assignments,
    teamVendors,
    teamMembers,
    onReassign,
    onRefresh
}: {
    assignments: VendorAssignment[];
    teamVendors: Tailor[];
    teamMembers: TeamMember[];
    onReassign: (assignment: VendorAssignment) => void;
    onRefresh: () => void;
})
{
    const [filterMember, setFilterMember] = useState<string>('all');

    const filteredAssignments = assignments.filter(assignment =>
    {
        if (filterMember === 'all') return true;
        return assignment.assignedToUserId === filterMember;
    });

    // Calculate assignment distribution
    const assignmentDistribution = teamMembers.map(member => ({
        memberId: member.id,
        memberName: member.name,
        assignmentCount: assignments.filter(a => a.assignedToUserId === member.id && a.status === 'active').length
    }));

    const totalAssignments = assignmentDistribution.reduce((sum, item) => sum + item.assignmentCount, 0);

    return (
        <div className="space-y-6">
            {/* Assignment Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Distribution</h3>
                <div className="space-y-4">
                    {assignmentDistribution.map((item) => {
                        const percentage = totalAssignments > 0 ? (item.assignmentCount / totalAssignments) * 100 : 0;
                        return (
                            <div key={item.memberId} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-900">{item.memberName}</p>
                                        <span className="text-sm text-gray-600">{item.assignmentCount} vendors</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {assignmentDistribution.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No team members found</p>
                    )}
                </div>
            </div>

            {/* Assignment Filters */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
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
                </div>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Refresh
                </button>
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
                                    Performance
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
                                const vendor = teamVendors.find(v => v.id === assignment.vendorId);
                                const member = teamMembers.find(m => m.id === assignment.assignedToUserId);
                                return (
                                    <VendorAssignmentTableRow
                                        key={assignment.id}
                                        assignment={assignment}
                                        vendor={vendor}
                                        member={member}
                                        onReassign={() => onReassign(assignment)}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredAssignments.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No vendor assignments match the current filter.
                    </p>
                </div>
            )}
        </div>
    );
}

// Performance Analytics Tab Component
function PerformanceAnalyticsTab({
    teamMembers,
    teamVendors,
    assignments,
    performanceMetrics
}: {
    teamMembers: TeamMember[];
    teamVendors: Tailor[];
    assignments: VendorAssignment[];
    performanceMetrics: TeamPerformanceMetrics | null;
})
{
    return (
        <div className="space-y-6">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Team Revenue"
                    value={`$${((performanceMetrics?.totalRevenue || 0) / 1000).toFixed(1)}K`}
                    subtitle="Total generated"
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title="Avg Performance"
                    value={`${Math.round(performanceMetrics?.averagePerformance || 0)}%`}
                    subtitle="Team average"
                    icon={Target}
                    color="blue"
                />
                <StatCard
                    title="Top Performer"
                    value={performanceMetrics?.topPerformer?.name || 'N/A'}
                    subtitle={`${Math.round(performanceMetrics?.topPerformer?.performanceScore || 0)}% score`}
                    icon={Award}
                    color="purple"
                />
                <StatCard
                    title="Growth Rate"
                    value={`${(performanceMetrics?.vendorGrowthRate || 0).toFixed(1)}%`}
                    subtitle="Vendor growth"
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPerformanceChart teamMembers={teamMembers} />
                <VendorPerformanceChart teamVendors={teamVendors} />
            </div>

            {/* Detailed Performance Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Team Member Performance Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Member
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendors
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interactions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teamMembers
                                .sort((a, b) => b.performanceScore - a.performanceScore)
                                .map((member) => (
                                    <MemberPerformanceTableRow
                                        key={member.id}
                                        member={member}
                                    />
                                ))}
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

function TeamMemberCard({ member }: { member: TeamMember })
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Assigned Vendors</span>
                    <span className="font-medium">{member.assignedVendorsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Interactions</span>
                    <span className="font-medium">{member.totalInteractions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Performance</span>
                    <span className="font-medium">{member.performanceScore}%</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Manage
                </button>
            </div>
        </div>
    );
}

function TeamMemberPerformanceRow({ member, rank }: { member: TeamMember; rank: number })
{
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {rank}
                </div>
                <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.assignedVendorsCount} vendors</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-900">{member.performanceScore}%</p>
                <p className="text-sm text-gray-500">{member.totalInteractions} interactions</p>
            </div>
        </div>
    );
}

function VendorDistributionRow({ member, totalVendors }: { member: TeamMember; totalVendors: number })
{
    const percentage = totalVendors > 0 ? (member.assignedVendorsCount / totalVendors) * 100 : 0;

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
            <span className="ml-4 text-sm font-medium text-gray-900">
                {member.assignedVendorsCount} ({percentage.toFixed(1)}%)
            </span>
        </div>
    );
}

function VendorAssignmentTableRow({
    assignment,
    vendor,
    member,
    onReassign
}: {
    assignment: VendorAssignment;
    vendor?: Tailor;
    member?: TeamMember;
    onReassign: () => void;
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
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${member?.performanceScore || 0}%` }}
                        ></div>
                    </div>
                    <span className="text-sm text-gray-900">{member?.performanceScore || 0}%</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {assignment.lastEngagementDate
                    ? new Date(assignment.lastEngagementDate).toLocaleDateString()
                    : 'Never'
                }
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                    onClick={onReassign}
                    className="text-primary hover:text-primary/80 flex items-center gap-1"
                >
                    <Shuffle className="w-4 h-4" />
                    Reassign
                </button>
            </td>
        </tr>
    );
}

function MemberPerformanceTableRow({ member }: { member: TeamMember })
{
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                            {member.name.charAt(0)}
                        </span>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.assignedVendorsCount}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.totalInteractions}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${member.performanceScore}%` }}
                        ></div>
                    </div>
                    <span className="text-sm text-gray-900">{member.performanceScore}%</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
        </tr>
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
                                <p className="text-sm text-gray-500">{member.performanceScore}% performance</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{member.assignedVendorsCount}</p>
                            <p className="text-xs text-gray-500">vendors</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
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
                        <p className="font-medium text-gray-900">Add Team Member</p>
                        <p className="text-sm text-gray-500">Invite new team member</p>
                    </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Shuffle className="w-5 h-5 text-green-600" />
                    <div>
                        <p className="font-medium text-gray-900">Reassign Vendors</p>
                        <p className="text-sm text-gray-500">Redistribute vendor assignments</p>
                    </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <div>
                        <p className="font-medium text-gray-900">View Analytics</p>
                        <p className="text-sm text-gray-500">Check team performance</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

function TeamPerformanceChart({ teamMembers }: { teamMembers: TeamMember[] })
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
            <div className="space-y-4">
                {teamMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${member.performanceScore}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="ml-4 text-sm font-medium text-gray-900">
                            {member.performanceScore}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VendorPerformanceChart({ teamVendors }: { teamVendors: Tailor[] })
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Performance</h3>
            <div className="space-y-4">
                {teamVendors
                    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
                    .slice(0, 5)
                    .map((vendor) =>
                    {
                        const performance = Math.min(100, (vendor.totalOrders || 0) * 5);
                        return (
                            <div key={vendor.id} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {vendor.brand_name || vendor.brandName || 'Unknown'}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${performance}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="ml-4 text-sm font-medium text-gray-900">
                                    {vendor.totalOrders || 0} orders
                                </span>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

// VendorReassignmentModal is imported from components/marketing/modals/VendorReassignmentModal

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

function AddTeamMemberModal({
    availableUsers,
    onAddMember,
    onClose
}: {
    availableUsers: any[];
    onAddMember: (userId: string) => void;
    onClose: () => void;
})
{
    const [selectedUser, setSelectedUser] = useState<string>('');

    const handleAddMember = () =>
    {
        if (selectedUser)
        {
            onAddMember(selectedUser);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a team member to add:
                    </label>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="">Select a user</option>
                        {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                    {availableUsers.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                            No available team members to add. All eligible users are already assigned to teams.
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddMember}
                        disabled={!selectedUser}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Member
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add new components for section management

// Sections Management Tab Component
function SectionsManagementTab({
    sections,
    teamMembers,
    onCreateSection,
    onAssignMember,
    onRemoveMember,
    onRefresh
}: {
    sections: TeamSection[];
    teamMembers: TeamMember[];
    onCreateSection: () => void;
    onAssignMember: (section: TeamSection) => void;
    onRemoveMember: (sectionId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
    onRefresh: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Team Sections</h2>
                    <p className="text-sm text-gray-600">Organize your team into sections for better management</p>
                </div>
                <button
                    onClick={onCreateSection}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Section
                </button>
            </div>

            {/* Sections Grid */}
            {sections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => {
                        const sectionMembers = teamMembers.filter(member => 
                            section.memberIds.includes(member.id)
                        );
                        
                        return (
                            <div key={section.id} className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                                        {section.description && (
                                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onAssignMember(section)}
                                        className="text-primary hover:text-primary/80"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                        <span>Members</span>
                                        <span>{sectionMembers.length}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-primary h-2 rounded-full" 
                                            style={{ width: `${Math.min(100, (sectionMembers.length / teamMembers.length) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {sectionMembers.slice(0, 3).map((member) => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onRemoveMember(section.id, member.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {sectionMembers.length > 3 && (
                                        <p className="text-xs text-gray-500 text-center">
                                            +{sectionMembers.length - 3} more members
                                        </p>
                                    )}
                                    {sectionMembers.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center">
                                            No members assigned
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No sections created</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new section for your team.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={onCreateSection}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            Create Section
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Create Section Modal Component
function CreateSectionModal({
    onCreate,
    onClose
}: {
    onCreate: (sectionData: { name: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
    onClose: () => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Section name is required');
            return;
        }

        setLoading(true);
        setError(null);
        
        const result = await onCreate({ name, description });
        if (result.success) {
            setName('');
            setDescription('');
            onClose();
        } else {
            setError(result.error || 'Failed to create section');
        }
        
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Create New Section</h3>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                        
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Section Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="e.g., Sales Team, Support Team"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Describe the purpose of this section"
                            />
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Section'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Assign Section Modal Component
function AssignSectionModal({
    section,
    teamMembers,
    sections,
    onAssign,
    onClose
}: {
    section: TeamSection;
    teamMembers: TeamMember[];
    sections: TeamSection[];
    onAssign: (sectionId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
    onClose: () => void;
}) {
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter out members already assigned to this section
    const availableMembers = teamMembers.filter(member => 
        !section.memberIds.includes(member.id)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId) {
            setError('Please select a team member');
            return;
        }

        setLoading(true);
        setError(null);
        
        const result = await onAssign(section.id, selectedMemberId);
        if (result.success) {
            setSelectedMemberId('');
            onClose();
        } else {
            setError(result.error || 'Failed to assign member to section');
        }
        
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Assign Member to Section</h3>
                    <p className="text-sm text-gray-500 mt-1">Assign a team member to "{section.name}"</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                        
                        <div>
                            <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                                Select Team Member
                            </label>
                            <select
                                id="member"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            >
                                <option value="">Choose a team member</option>
                                {availableMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} ({member.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedMemberId}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            {loading ? 'Assigning...' : 'Assign Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
