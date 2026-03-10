/**
 * My Tasks Page - Team Member Task Management
 */

'use client';

import { useState, useEffect } from 'react';
import
    {
        CheckCircle,
        Clock,
        Plus,
        Edit,
        MoreHorizontal
    } from 'lucide-react';
import { useTailors, type Tailor } from '@/admin-services/useTailors';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';

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

export default function MyTasksPage()
{
    return (
        <MarketingAuthGuard requiredRole="team_member">
            <MyTasksContent />
        </MarketingAuthGuard>
    );
}

function MyTasksContent()
{
    const { tailors } = useTailors();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');

    useEffect(() =>
    {
        loadTasks();
    }, []);

    const loadTasks = async () =>
    {
        try
        {
            setLoading(true);

            // TODO: Replace with actual user ID from auth context
            const currentUserId = 'current-user-id';

            const tasksResponse = await fetch(`/api/marketing/tasks?userId=${currentUserId}`);
            if (tasksResponse.ok)
            {
                const tasksResult = await tasksResponse.json();
                if (tasksResult.success)
                {
                    setTasks(tasksResult.data);
                }
            }

        } catch (error)
        {
            console.error('Error loading tasks:', error);
            setError('Failed to load tasks');
        } finally
        {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task =>
    {
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        return matchesStatus && matchesPriority;
    });

    if (loading)
    {
        return <div className="animate-pulse">Loading tasks...</div>;
    }

    if (error)
    {
        return <div className="text-red-600">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-gray-600">Manage your vendor-related tasks</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            {/* Task Filters */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <button
                    onClick={loadTasks}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Refresh
                </button>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Tasks ({filteredTasks.length})</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredTasks.map((task) =>
                    {
                        const vendor = tailors?.find(v => v.id === task.vendorId);
                        return (
                            <TaskRow key={task.id} task={task} vendor={vendor} />
                        );
                    })}
                </div>
            </div>

            {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first task to get started.
                    </p>
                </div>
            )}
        </div>
    );
}

function TaskRow({ task, vendor }: { task: Task; vendor?: Tailor })
{
    const getPriorityColor = (priority: string) =>
    {
        switch (priority)
        {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) =>
    {
        switch (status)
        {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Vendor: {vendor?.brand_name || vendor?.brandName || 'Unknown'}</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}