/**
 * Invitations List Component
 * 
 * Displays and manages team invitations with status tracking.
 * Allows superadmins to view, create, resend, and manage invitations.
 * 
 * Requirements: 17.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { BackOfficeInvitation, BackOfficeRole } from '@/types/backoffice';
import { InvitationClientService } from '@/lib/backoffice/client/invitation-client-service';
import { 
  Clock, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Send, 
  Trash2, 
  RefreshCw,
  UserPlus,
  Calendar,
  Filter,
  Search,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface InvitationsListProps {
  className?: string;
}

export default function InvitationsList({ className = '' }: InvitationsListProps) {
  const { backOfficeUser } = useBackOfficeAuth();
  const [invitations, setInvitations] = useState<BackOfficeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
  const [roleFilter, setRoleFilter] = useState<BackOfficeRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingInvitation, setCreatingInvitation] = useState(false);

  // Form state for creating invitations
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'viewer' as BackOfficeRole,
  });

  // Load invitations on component mount
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const allInvitations = await InvitationClientService.getAllInvitations();
      setInvitations(allInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  // Filter invitations based on search and filters
  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = 
      invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.invitedByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    const matchesRole = roleFilter === 'all' || invitation.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Format role name for display
  const formatRoleName = (role: BackOfficeRole): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date for display
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color and icon
  const getStatusBadge = (status: BackOfficeInvitation['status']) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case 'expired':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-3 h-3" />,
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-3 h-3" />,
        };
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: BackOfficeRole): string => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'founder':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bdm':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'marketing_manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle creating new invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backOfficeUser) return;

    try {
      setCreatingInvitation(true);
      
      const result = await InvitationClientService.createInvitation(
        newInvitation.email,
        newInvitation.role,
        backOfficeUser.uid,
        backOfficeUser.fullName
      );

      toast.success(`Invitation sent to ${newInvitation.email}`);
      
      // Reset form and close modal
      setNewInvitation({ email: '', role: 'viewer' });
      setShowCreateModal(false);
      
      // Reload invitations
      await loadInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to create invitation');
    } finally {
      setCreatingInvitation(false);
    }
  };

  // Handle resending invitation
  const handleResendInvitation = async (invitation: BackOfficeInvitation) => {
    if (!backOfficeUser) return;

    try {
      await InvitationClientService.resendInvitation(
        invitation.id,
        backOfficeUser.uid,
        backOfficeUser.fullName
      );
      
      toast.success(`Invitation resent to ${invitation.email}`);
      await loadInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  // Handle expiring invitation
  const handleExpireInvitation = async (invitation: BackOfficeInvitation) => {
    if (!confirm(`Are you sure you want to expire the invitation for ${invitation.email}?`)) {
      return;
    }

    try {
      await InvitationClientService.expireInvitation(invitation.id);
      toast.success(`Invitation for ${invitation.email} has been expired`);
      await loadInvitations();
    } catch (error) {
      console.error('Error expiring invitation:', error);
      toast.error('Failed to expire invitation');
    }
  };

  // Handle deleting invitation
  const handleDeleteInvitation = async (invitation: BackOfficeInvitation) => {
    if (!confirm(`Are you sure you want to permanently delete the invitation for ${invitation.email}?`)) {
      return;
    }

    try {
      await InvitationClientService.deleteInvitation(invitation.id);
      toast.success(`Invitation for ${invitation.email} has been deleted`);
      await loadInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  // Copy invitation link
  const handleCopyInvitationLink = async (invitation: BackOfficeInvitation) => {
    // Note: In a real implementation, you'd need the actual token
    // This is just for demonstration
    const link = `${window.location.origin}/backoffice/accept-invitation/[token]`;
    
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invitation link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Get invitation stats
  const invitationStats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired').length,
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invitations</p>
              <p className="text-2xl font-bold text-gray-900">{invitationStats.total}</p>
            </div>
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{invitationStats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{invitationStats.accepted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">{invitationStats.expired}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, role, or inviter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="founder">Founder</option>
                <option value="bdm">BDM</option>
                <option value="brand_lead">Brand Lead</option>
                <option value="logistics_lead">Logistics Lead</option>
                <option value="marketing_manager">Marketing Manager</option>
                <option value="marketing_member">Marketing Member</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* Create Invitation Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Send Invitation
          </button>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Invitations ({filteredInvitations.length})
          </h3>
        </div>

        {filteredInvitations.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No invitations have been sent yet.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Send First Invitation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invitee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => {
                  const statusBadge = getStatusBadge(invitation.status);
                  const isExpired = invitation.expiresAt.toMillis() < Date.now();

                  return (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                            <div className="text-sm text-gray-500">
                              {invitation.departments.join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(invitation.role)}`}>
                          {formatRoleName(invitation.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          {statusBadge.icon}
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.invitedByName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(invitation.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : ''}`}>
                          <Clock className="w-3 h-3" />
                          {formatDate(invitation.expiresAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleResendInvitation(invitation)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="Resend invitation"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyInvitationLink(invitation)}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                title="Copy invitation link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExpireInvitation(invitation)}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                                title="Expire invitation"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteInvitation(invitation)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete invitation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Team Invitation</h3>
            
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newInvitation.role}
                  onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value as BackOfficeRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="marketing_member">Marketing Member</option>
                  <option value="marketing_manager">Marketing Manager</option>
                  <option value="logistics_lead">Logistics Lead</option>
                  <option value="brand_lead">Brand Lead</option>
                  <option value="bdm">BDM</option>
                  <option value="founder">Founder</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvitation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingInvitation ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
