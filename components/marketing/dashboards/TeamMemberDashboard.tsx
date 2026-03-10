/**
 * Team Member Dashboard Component
 * Shows assigned vendors, performance tracking, and task management
 */

'use client';

import { useState, useEffect } from 'react';
import {
    Building2,
    TrendingUp,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Eye,
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
    Download,
    Bell,
    MessageSquare,
    User,
    Save,
    RefreshCw
} from 'lucide-react';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import type { Tailor } from '@/admin-services/useTailors';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

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

interface Task
{
    id: string;
    vendorId: string;
    title: string;
    description: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
}

interface VendorInteraction
{
    id: string;
    vendorId: string;
    type: 'call' | 'email' | 'meeting' | 'note';
    description: string;
    date: Date;
    outcome?: string;
    followUpRequired?: boolean;
    followUpDate?: Date;
}

export default function TeamMemberDashboard()
{
    const { tailors, loading: tailorsLoading, error: tailorsError } = useTailorsOptimized({
        initialLimit: 20,
        autoLoad: true
    });
    const { marketingUser, refreshUser } = useMarketingAuth();
    const [assignedVendors, setAssignedVendors] = useState<Tailor[]>([]);
    const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [interactions, setInteractions] = useState<VendorInteraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'tasks' | 'interactions'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    
    // State for follow-up notes
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [followUpRequired, setFollowUpRequired] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    
    // State for task creation
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium' as 'low' | 'medium' | 'high'
    });

    useEffect(() =>
    {
        loadDashboardData();
    }, [tailors]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Get current user ID from auth context
            const currentUserId = marketingUser?.uid || 'current-user-id';
            
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            // Load vendor assignments for current user
            let assignmentsResponse = await fetch(`/api/marketing/vendors/assignments?userId=${currentUserId}`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (assignmentsResponse.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                assignmentsResponse = await fetch(`/api/marketing/vendors/assignments?userId=${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            if (assignmentsResponse.ok) {
                const assignmentsResult = await assignmentsResponse.json();
                if (assignmentsResult.success) {
                    setAssignments(assignmentsResult.data);

                    // Filter tailors to show only assigned ones
                    const assignedVendorIds = assignmentsResult.data.map((a: VendorAssignment) => a.vendorId);
                    const filteredVendors = tailors?.filter(tailor => assignedVendorIds.includes(tailor.id)) || [];
                    setAssignedVendors(filteredVendors);
                }
            }

            // Load tasks for assigned vendors
            let tasksResponse = await fetch(`/api/marketing/tasks?userId=${currentUserId}`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (tasksResponse.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                tasksResponse = await fetch(`/api/marketing/tasks?userId=${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            if (tasksResponse.ok) {
                const tasksResult = await tasksResponse.json();
                if (tasksResult.success) {
                    setTasks(tasksResult.data);
                }
            }

            // Load interactions for assigned vendors
            let interactionsResponse = await fetch(`/api/marketing/interactions?userId=${currentUserId}`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (interactionsResponse.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                interactionsResponse = await fetch(`/api/marketing/interactions?userId=${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            if (interactionsResponse.ok) {
                const interactionsResult = await interactionsResponse.json();
                if (interactionsResult.success) {
                    setInteractions(interactionsResult.data);
                }
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data. Please try refreshing the page.');
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = assignedVendors.filter(vendor =>
    {
        const matchesSearch = vendor.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.brandName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;

        const assignment = assignments.find(a => a.vendorId === vendor.id);
        const matchesStatus = assignment?.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Handle opening the note modal
    const handleOpenNoteModal = (vendorId: string) => {
        setSelectedVendorId(vendorId);
        setNoteContent('');
        setFollowUpRequired(false);
        setFollowUpDate('');
        setShowNoteModal(true);
    };

    // Handle saving a follow-up note
    const handleSaveNote = async () => {
        try {
            // Get current user ID from auth context
            const currentUserId = marketingUser?.uid || 'current-user-id';
            
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            // Save interaction
            let response = await fetch('/api/marketing/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    vendorId: selectedVendorId,
                    type: 'note',
                    description: noteContent,
                    followUpRequired,
                    followUpDate: followUpDate || null
                })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch('/api/marketing/interactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        vendorId: selectedVendorId,
                        type: 'note',
                        description: noteContent,
                        followUpRequired,
                        followUpDate: followUpDate || null
                    })
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Reload dashboard data
                    await loadDashboardData();
                    setShowNoteModal(false);
                    setSelectedVendorId(null);
                    setNoteContent('');
                    setFollowUpRequired(false);
                    setFollowUpDate('');
                } else {
                    setError(result.error || 'Failed to save note');
                }
            } else {
                const errorResult = await response.json();
                setError(errorResult.error || 'Failed to save note');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            setError('Failed to save note');
        }
    };

    // Handle opening the task modal
    const handleOpenTaskModal = () => {
        setNewTask({
            title: '',
            description: '',
            dueDate: '',
            priority: 'medium'
        });
        setShowTaskModal(true);
    };

    // Handle creating a new task
    const handleCreateTask = async () => {
        try {
            // Get current user ID from auth context
            const currentUserId = marketingUser?.uid || 'current-user-id';
            
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            // Create task
            let response = await fetch('/api/marketing/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    ...newTask,
                    userId: currentUserId,
                    vendorId: selectedVendorId // Associate with selected vendor if available
                })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch('/api/marketing/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        ...newTask,
                        userId: currentUserId,
                        vendorId: selectedVendorId // Associate with selected vendor if available
                    })
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Reload dashboard data
                    await loadDashboardData();
                    setShowTaskModal(false);
                    setNewTask({
                        title: '',
                        description: '',
                        dueDate: '',
                        priority: 'medium'
                    });
                } else {
                    setError(result.error || 'Failed to create task');
                }
            } else {
                const errorResult = await response.json();
                setError(errorResult.error || 'Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task');
        }
    };

    // Handle updating task status
    const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setError('Not authenticated');
                return;
            }
            
            let idToken = await currentUser.getIdToken();

            // Update task status
            let response = await fetch(`/api/marketing/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ status })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ status })
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Reload dashboard data
                    await loadDashboardData();
                } else {
                    setError(result.error || 'Failed to update task');
                }
            } else {
                const errorResult = await response.json();
                setError(errorResult.error || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task');
        }
    };

    // Calculate dashboard statistics
    const stats = {
        assignedVendors: assignedVendors.length,
        activeTasks: tasks.filter(t => t.status !== 'completed').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        recentInteractions: interactions.length
    };

    if (loading || tailorsLoading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex items-center justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 text-center mb-6">{error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Team Member Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your assigned vendors and track performance
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    activeTab === 'overview'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('vendors')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    activeTab === 'vendors'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Vendors
                            </button>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    activeTab === 'tasks'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Tasks
                            </button>
                            <button
                                onClick={() => setActiveTab('interactions')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    activeTab === 'interactions'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Interactions
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Stats Overview */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Assigned Vendors
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {stats.assignedVendors}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                        <Clock className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Active Tasks
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {stats.activeTasks}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Completed Tasks
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {stats.completedTasks}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                        <Activity className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Interactions
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {stats.recentInteractions}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assignment History - Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Assignment History
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Recent vendor assignments
                            </p>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <div className="space-y-4">
                                {assignments.slice(0, 5).map((assignment) => {
                                    const vendor = assignedVendors.find(v => v.id === assignment.vendorId);
                                    return (
                                        <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Building2 className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {vendor?.brand_name || vendor?.brandName || 'Unknown Vendor'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Assigned on {new Date(assignment.assignmentDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    assignment.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {assignment.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {assignments.length === 0 && (
                                    <div className="text-center py-8">
                                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">No assignments yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendors Tab */}
                {activeTab === 'vendors' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Assigned Vendors
                                </h3>
                                <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Search vendors..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendor
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Orders
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Revenue
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredVendors.map((vendor) => {
                                        const assignment = assignments.find(a => a.vendorId === vendor.id);
                                        
                                        return (
                                            <tr key={vendor.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <Building2 className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {vendor.brand_name || vendor.brandName || 'Unknown Vendor'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {vendor.tailor_registered_info?.email || 'No email'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        assignment?.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {assignment?.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {assignment?.assignmentDate 
                                                        ? new Date(assignment.assignmentDate).toLocaleDateString()
                                                        : 'N/A'
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {vendor.totalOrders || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    ${(vendor.totalOrders || 0) * 150}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleOpenNoteModal(vendor.id)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        Add Note
                                                    </button>
                                                    <button
                                                        onClick={handleOpenTaskModal}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Add Task
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                My Tasks
                            </h3>
                            <button
                                onClick={handleOpenTaskModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Task
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Task
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Due Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tasks.map((task) => (
                                        <tr key={task.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                                <div className="text-sm text-gray-500">{task.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    task.priority === 'high' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : task.priority === 'medium' 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    task.status === 'completed' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : task.status === 'in_progress' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {task.status !== 'completed' && (
                                                    <>
                                                        {task.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                            >
                                                                Start
                                                            </button>
                                                        )}
                                                        {task.status === 'in_progress' && (
                                                            <button
                                                                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                                                className="text-green-600 hover:text-green-900 mr-3"
                                                            >
                                                                Complete
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Interactions Tab */}
                {activeTab === 'interactions' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Recent Interactions
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendor
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Follow-up
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {interactions.map((interaction) => {
                                        const vendor = assignedVendors.find(v => v.id === interaction.vendorId);
                                        
                                        return (
                                            <tr key={interaction.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {vendor?.brand_name || vendor?.brandName || 'Unknown Vendor'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {interaction.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                                    {interaction.description}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(interaction.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {interaction.followUpRequired ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Required
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            None
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Add Follow-up Note
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Note
                                    </label>
                                    <textarea
                                        rows={4}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="Enter your follow-up note..."
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <input
                                        id="followUpRequired"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={followUpRequired}
                                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                                    />
                                    <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                                        Follow-up required
                                    </label>
                                </div>
                                
                                {followUpRequired && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Follow-up Date
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowNoteModal(false);
                                        setSelectedVendorId(null);
                                        setNoteContent('');
                                        setFollowUpRequired(false);
                                        setFollowUpDate('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Create New Task
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                        placeholder="Task title"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                        placeholder="Task description"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowTaskModal(false);
                                        setNewTask({
                                            title: '',
                                            description: '',
                                            dueDate: '',
                                            priority: 'medium'
                                        });
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}