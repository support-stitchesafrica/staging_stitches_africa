/**
 * User Role Management Component
 * Allows Super Admins to manage user roles and team assignments
 */

'use client';

import { useState, useEffect } from 'react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { UserService } from '@/lib/marketing/user-service';
import { useMarketingUsersOptimized } from '@/lib/marketing/useMarketingUsersOptimized';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  teamId?: string;
  isActive: boolean;
}

export default function UserRoleManager() {
  const { marketingUser } = useMarketingAuth();
  
  // Use optimized user data hook
  const { users, loading, error, refresh: refreshUsers } = useMarketingUsersOptimized({
    autoLoad: true
  });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'super_admin' | 'team_lead' | 'bdm' | 'team_member'>('team_member');
  const [newTeamId, setNewTeamId] = useState<string>('');

  // Check if current user is super admin
  const isSuperAdmin = marketingUser?.role === 'super_admin';

  const updateUserRole = async () => {
    if (!selectedUser) return;

    try {
      // Get Firebase ID token for authentication
      const { auth } = await import('@/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`/api/marketing/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          role: newRole,
          teamId: newRole === 'team_lead' || newRole === 'team_member' ? newTeamId : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('User role updated successfully!');
          refreshUsers(); // Refresh the user list
          setSelectedUser(null);
        } else {
          throw new Error(result.error || 'Failed to update user role');
        }
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert(`Failed to update user role: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Only Super Admins can access user role management.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={refreshUsers}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">User Role Management</h2>
      
      {selectedUser ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Update Role for {selectedUser.name} ({selectedUser.email})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="super_admin">Super Admin</option>
                <option value="team_lead">Team Lead</option>
                <option value="bdm">BDM</option>
                <option value="team_member">Team Member</option>
              </select>
            </div>
            
            {(newRole === 'team_lead' || newRole === 'team_member') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team ID
                </label>
                <input
                  type="text"
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  placeholder="Enter team ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={updateUserRole}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Update Role
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.teamId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                        setNewTeamId(user.teamId || '');
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}