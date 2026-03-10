'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { SuperAdminGuard } from '@/components/marketing/MarketingAuthGuard';

interface User
{
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
}

export default function UsersPage()
{
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    useEffect(() =>
    {
        // TODO: Fetch users from API
        // Placeholder data
        const mockUsers: User[] = [
            {
                id: '1',
                name: 'John Doe',
                email: 'john.doe@stitchesafrica.com',
                role: 'super_admin',
                isActive: true,
                lastLogin: new Date(),
                createdAt: new Date('2024-01-15')
            },
            {
                id: '2',
                name: 'Jane Smith',
                email: 'jane.smith@stitchesafrica.com',
                role: 'team_lead',
                isActive: true,
                lastLogin: new Date('2024-01-20'),
                createdAt: new Date('2024-01-16')
            },
            {
                id: '3',
                name: 'Mike Johnson',
                email: 'mike.johnson@stitchesafrica.com',
                role: 'bdm',
                isActive: false,
                lastLogin: new Date('2024-01-18'),
                createdAt: new Date('2024-01-17')
            }
        ];

        setTimeout(() =>
        {
            setUsers(mockUsers);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredUsers = users.filter(user =>
    {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (role: string) =>
    {
        switch (role)
        {
            case 'super_admin': return 'bg-red-100 text-red-800';
            case 'team_lead': return 'bg-blue-100 text-blue-800';
            case 'bdm': return 'bg-green-100 text-green-800';
            case 'team_member': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatRole = (role: string) =>
    {
        switch (role)
        {
            case 'super_admin': return 'Super Admin';
            case 'team_lead': return 'Team Lead';
            case 'bdm': return 'BDM';
            case 'team_member': return 'Team Member';
            default: return role;
        }
    };

    if (loading)
    {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SuperAdminGuard>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            User Management
                        </h1>
                        <p className="text-gray-600">Manage team members and their roles</p>
                    </div>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Invite User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All Roles</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="bdm">BDM</option>
                            <option value="team_member">Team Member</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                            {formatRole(user.role)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className={`text-sm ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-500">
                                        {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className={`p-1 ${user.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}>
                                                {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </button>
                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </div>
        </SuperAdminGuard>
    );
}