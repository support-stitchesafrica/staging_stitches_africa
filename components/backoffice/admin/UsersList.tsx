/**
 * Users List Component
 * 
 * Displays and manages all system users with filtering, search, and actions.
 * Integrates with admin collections for user management.
 * 
 * Requirements: 11.5, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import DashboardCard from '../DashboardCard';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { getAllUsers, getUserById, getOrdersByUserId, User, UserOrder } from '@/admin-services/userService';

interface UsersListProps {
  /** Optional filter to apply */
  initialFilter?: 'all' | 'active' | 'inactive';
  /** Optional search query */
  initialSearch?: string;
}

function UsersList({ 
  initialFilter = 'all', 
  initialSearch = '' 
}: UsersListProps) {
  const { hasPermission } = useBackOfficeAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Check permissions
  const canWrite = hasPermission('admin', 'write');
  const canDelete = hasPermission('admin', 'delete');

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply filter
    if (filter === 'active') {
      filtered = filtered.filter(user => !user.is_general_admin && !user.is_sub_tailor && !user.is_tailor);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(user => user.is_general_admin || user.is_sub_tailor || user.is_tailor);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, filter, searchQuery]);

  const handleViewUser = async (user: User) => {
    try {
      setSelectedUser(user);
      const orders = await getOrdersByUserId(user.id);
      setUserOrders(orders);
      setShowUserDetails(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['ID', 'First Name', 'Last Name', 'Email', 'Created At', 'Status'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.first_name,
        user.last_name,
        user.email,
        user.createdAt,
        (!user.is_general_admin && !user.is_sub_tailor && !user.is_tailor) ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardCard title="Users" description="Loading users...">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-16"></div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Error" description="Failed to load users" icon={Users}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all system users and their permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {canWrite && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => !u.is_general_admin && !u.is_sub_tailor && !u.is_tailor).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
            </div>
            <Filter className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Users List */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isActive = !user.is_general_admin && !user.is_sub_tailor && !user.is_tailor;
                
                return (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWrite && (
                          <button
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">First Name</label>
                  <p className="text-gray-900">{selectedUser.first_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Name</label>
                  <p className="text-gray-900">{selectedUser.last_name}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedUser.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Created At</label>
                <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Orders ({userOrders.length})</label>
                {userOrders.length > 0 ? (
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {userOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">{order.title}</p>
                        <p className="text-gray-600">Order ID: {order.order_id}</p>
                        <p className="text-gray-600">Status: {order.order_status}</p>
                      </div>
                    ))}
                    {userOrders.length > 5 && (
                      <p className="text-sm text-gray-500">... and {userOrders.length - 5} more orders</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No orders found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default memo(UsersList);