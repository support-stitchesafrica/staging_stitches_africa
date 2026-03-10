/**
 * Marketing Waitlists Dashboard
 * Main page for managing waitlists
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { WaitlistDashboardData } from '@/types/waitlist';
import { Plus, Eye, Edit, Archive, Trash2, Users, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function WaitlistsPage() {
  const { marketingUser, hasPermission } = useMarketingAuth();
  const [dashboardData, setDashboardData] = useState<WaitlistDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/waitlist/dashboard');
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (waitlistId: string) => {
    try {
      const response = await fetch(`/api/waitlist/${waitlistId}/publish`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        await loadDashboardData(); // Refresh data
      } else {
        alert(result.error || 'Failed to publish waitlist');
      }
    } catch (err) {
      alert('Failed to publish waitlist');
      console.error('Publish error:', err);
    }
  };

  const handleArchive = async (waitlistId: string) => {
    if (!confirm('Are you sure you want to archive this waitlist?')) return;

    try {
      const response = await fetch(`/api/waitlist/${waitlistId}/archive`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        await loadDashboardData(); // Refresh data
      } else {
        alert(result.error || 'Failed to archive waitlist');
      }
    } catch (err) {
      alert('Failed to archive waitlist');
      console.error('Archive error:', err);
    }
  };

  const handleDelete = async (waitlistId: string) => {
    if (!confirm('Are you sure you want to delete this waitlist? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/waitlist/${waitlistId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        await loadDashboardData(); // Refresh data
      } else {
        alert(result.error || 'Failed to delete waitlist');
      }
    } catch (err) {
      alert('Failed to delete waitlist');
      console.error('Delete error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waitlists</h1>
          <p className="text-gray-600 mt-1">Manage collection and product waitlists</p>
        </div>
        
        {/* Always show create button for super_admin, team_lead, and bdm */}
        {(marketingUser?.role === 'super_admin' || marketingUser?.role === 'team_lead' || marketingUser?.role === 'bdm' || hasPermission('canCreate')) && (
          <Link
            href="/marketing/waitlists/create"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-black transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Waitlist
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Signups</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalSignups}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Waitlists</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.activeWaitlists}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Launches</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.upcomingLaunches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Archive className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Waitlists</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.waitlists.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waitlists Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">All Waitlists</h2>
        </div>

        {dashboardData && dashboardData.waitlists.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waitlist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Launch Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.waitlists.map((waitlist) => (
                  <tr key={waitlist.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{waitlist.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {waitlist.shortDescription || waitlist.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {waitlist.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(waitlist.status)}`}>
                        {waitlist.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(waitlist.countdownEndAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(waitlist.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/marketing/waitlists/${waitlist.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        {hasPermission('canEdit') && (
                          <Link
                            href={`/marketing/waitlists/${waitlist.id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}

                        {hasPermission('canPublish') && waitlist.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(waitlist.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Publish"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission('canPublish') && waitlist.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleArchive(waitlist.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission('canDelete') && (
                          <button
                            onClick={() => handleDelete(waitlist.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No waitlists yet</h3>
              <p className="mb-4">Create your first waitlist to start collecting signups.</p>
              {hasPermission('canCreate') && (
                <Link
                  href="/marketing/waitlists/create"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-black transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Waitlist
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}