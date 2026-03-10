/**
 * Tasks List Component
 * 
 * Displays and manages marketing tasks with filtering for marketing_member role.
 * Marketing members only see their own tasks, while managers see all team tasks.
 * 
 * Requirements: 6.4, 6.5, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Building2,
  RefreshCw,
  Plus,
  Download,
} from 'lucide-react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import DashboardCard from '../DashboardCard';
import PermissionGuard from '../PermissionGuard';

interface Task {
  id: string;
  vendorId: string;
  vendorName: string;
  assignedToUserId: string;
  assignedToName: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  createdByName: string;
}

export default function TasksList() {
  const { backOfficeUser } = useBackOfficeAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'me' | 'others'>('all');

  useEffect(() => {
    loadTasksData();
  }, [backOfficeUser]);

  const loadTasksData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load tasks data - filter based on user role
      // Marketing members only see their own tasks
      // Marketing managers and above see all team tasks
      
      const mockTasks: Task[] = [
        {
          id: '1',
          vendorId: 'vendor1',
          vendorName: 'Adunni Fashions',
          assignedToUserId: 'user1',
          assignedToName: 'Sarah Wilson',
          title: 'Follow up on Q4 collection launch',
          description: 'Discuss timeline and marketing support for the upcoming collection',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'pending',
          priority: 'high',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdByUserId: 'manager1',
          createdByName: 'Mike Johnson',
        },
        {
          id: '2',
          vendorId: 'vendor2',
          vendorName: 'Kente Creations',
          assignedToUserId: 'user2',
          assignedToName: 'David Chen',
          title: 'Review product catalog updates',
          description: 'Check new product listings and ensure quality standards',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'in_progress',
          priority: 'medium',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdByUserId: 'manager1',
          createdByName: 'Mike Johnson',
        },
        {
          id: '3',
          vendorId: 'vendor3',
          vendorName: 'Ankara Artisans',
          assignedToUserId: 'user1',
          assignedToName: 'Sarah Wilson',
          title: 'Onboarding documentation review',
          description: 'Complete vendor onboarding process and documentation',
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'completed',
          priority: 'medium',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdByUserId: 'user1',
          createdByName: 'Sarah Wilson',
        },
        {
          id: '4',
          vendorId: 'vendor4',
          vendorName: 'Batik Designs',
          assignedToUserId: 'user3',
          assignedToName: 'Lisa Rodriguez',
          title: 'Contract negotiation follow-up',
          description: 'Finalize terms and conditions for partnership agreement',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          status: 'pending',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          createdByUserId: 'manager1',
          createdByName: 'Mike Johnson',
        },
      ];

      // Filter tasks based on user role
      let filteredTasks = mockTasks;
      
      if (backOfficeUser?.role === 'marketing_member') {
        // Marketing members only see their own tasks
        filteredTasks = mockTasks.filter(task => task.assignedToUserId === backOfficeUser.uid);
      }
      // Marketing managers and above see all tasks (no additional filtering needed)

      setTasks(filteredTasks);
    } catch (err) {
      console.error('Error loading tasks data:', err);
      setError('Failed to load tasks data');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    const matchesAssignee = assigneeFilter === 'all' ||
                           (assigneeFilter === 'me' && task.assignedToUserId === backOfficeUser?.uid) ||
                           (assigneeFilter === 'others' && task.assignedToUserId !== backOfficeUser?.uid);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'pending':
        return AlertTriangle;
      default:
        return XCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const days = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const isOverdue = (dueDate: Date, status: string) => {
    return status !== 'completed' && dueDate.getTime() < Date.now();
  };

  // Get task statistics
  const taskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    overdue: filteredTasks.filter(t => isOverdue(t.dueDate, t.status)).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tasks</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTasksData}
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
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {backOfficeUser?.role === 'marketing_member' 
              ? 'Manage your assigned tasks'
              : 'Manage team tasks and assignments'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadTasksData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <PermissionGuard department="marketing" permission="write">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <DashboardCard>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or vendor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm rounded-lg capitalize ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map(priority => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-3 py-2 text-sm rounded-lg capitalize ${
                  priorityFilter === priority
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>

          {/* Assignee Filter - Only show for managers */}
          {backOfficeUser?.role !== 'marketing_member' && (
            <div className="flex gap-2">
              {(['all', 'me', 'others'] as const).map(assignee => (
                <button
                  key={assignee}
                  onClick={() => setAssigneeFilter(assignee)}
                  className={`px-3 py-2 text-sm rounded-lg capitalize ${
                    assigneeFilter === assignee
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {assignee}
                </button>
              ))}
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Tasks List */}
      <DashboardCard>
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              const overdue = isOverdue(task.dueDate, task.status);
              
              return (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-5 h-5 ${
                          task.status === 'completed' ? 'text-green-600' :
                          task.status === 'in_progress' ? 'text-blue-600' :
                          overdue ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {task.vendorName}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {task.assignedToName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                            {getDaysUntilDue(task.dueDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Created {formatDate(task.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <TaskActionsDropdown task={task} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No tasks match your current filters'
                  : 'No tasks have been created yet'
                }
              </p>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

// Task Actions Dropdown Component
function TaskActionsDropdown({ task }: { task: Task }) {
  const [isOpen, setIsOpen] = useState(false);
  const { backOfficeUser } = useBackOfficeAuth();

  const canEdit = backOfficeUser?.role !== 'marketing_member' || 
                 task.assignedToUserId === backOfficeUser?.uid;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
          <div className="py-1">
            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            {canEdit && (
              <PermissionGuard department="marketing" permission="write">
                <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </button>
                <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </button>
              </PermissionGuard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
