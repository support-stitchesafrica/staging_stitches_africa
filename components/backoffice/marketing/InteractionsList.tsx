/**
 * Interactions List Component
 * 
 * Displays and manages vendor interactions with filtering based on user role.
 * Marketing members only see their own interactions, while managers see all team interactions.
 * 
 * Requirements: 6.4, 6.5, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  Building2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Download,
  FileText,
  Video,
} from 'lucide-react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import DashboardCard from '../DashboardCard';
import PermissionGuard from '../PermissionGuard';

interface VendorInteraction {
  id: string;
  vendorId: string;
  vendorName: string;
  userId: string;
  userName: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  date: Date;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function InteractionsList() {
  const { backOfficeUser } = useBackOfficeAuth();
  const [interactions, setInteractions] = useState<VendorInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'call' | 'email' | 'meeting' | 'note'>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'me' | 'others'>('all');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'required' | 'not_required'>('all');

  useEffect(() => {
    loadInteractionsData();
  }, [backOfficeUser]);

  const loadInteractionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load interactions data - filter based on user role
      // Marketing members only see their own interactions
      // Marketing managers and above see all team interactions
      
      const mockInteractions: VendorInteraction[] = [
        {
          id: '1',
          vendorId: 'vendor1',
          vendorName: 'Adunni Fashions',
          userId: 'user1',
          userName: 'Sarah Wilson',
          type: 'call',
          description: 'Discussed Q4 collection launch timeline and marketing support requirements',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000),
          outcome: 'Positive response, agreed to provide marketing materials by next week',
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: '2',
          vendorId: 'vendor2',
          vendorName: 'Kente Creations',
          userId: 'user2',
          userName: 'David Chen',
          type: 'email',
          description: 'Sent product catalog review feedback and quality improvement suggestions',
          date: new Date(Date.now() - 4 * 60 * 60 * 1000),
          outcome: 'Vendor acknowledged feedback, will implement changes',
          followUpRequired: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          id: '3',
          vendorId: 'vendor3',
          vendorName: 'Ankara Artisans',
          userId: 'user1',
          userName: 'Sarah Wilson',
          type: 'meeting',
          description: 'In-person meeting to finalize onboarding documentation and partnership terms',
          date: new Date(Date.now() - 6 * 60 * 60 * 1000),
          outcome: 'Successfully completed onboarding, vendor is now active',
          followUpRequired: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          id: '4',
          vendorId: 'vendor4',
          vendorName: 'Batik Designs',
          userId: 'user3',
          userName: 'Lisa Rodriguez',
          type: 'note',
          description: 'Vendor expressed interest in expanding product line to include home decor items',
          date: new Date(Date.now() - 8 * 60 * 60 * 1000),
          outcome: 'Need to discuss with product team about new category',
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        },
        {
          id: '5',
          vendorId: 'vendor5',
          vendorName: 'Wax Print Studio',
          userId: 'user2',
          userName: 'David Chen',
          type: 'call',
          description: 'Weekly check-in call to discuss order fulfillment and delivery schedules',
          date: new Date(Date.now() - 12 * 60 * 60 * 1000),
          outcome: 'All orders on track, no issues reported',
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      ];

      // Filter interactions based on user role
      let filteredInteractions = mockInteractions;
      
      if (backOfficeUser?.role === 'marketing_member') {
        // Marketing members only see their own interactions
        filteredInteractions = mockInteractions.filter(interaction => interaction.userId === backOfficeUser.uid);
      }
      // Marketing managers and above see all interactions (no additional filtering needed)

      setInteractions(filteredInteractions);
    } catch (err) {
      console.error('Error loading interactions data:', err);
      setError('Failed to load interactions data');
    } finally {
      setLoading(false);
    }
  };

  // Filter interactions based on search and filters
  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = interaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interaction.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (interaction.outcome && interaction.outcome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || interaction.type === typeFilter;
    
    const matchesUser = userFilter === 'all' ||
                       (userFilter === 'me' && interaction.userId === backOfficeUser?.uid) ||
                       (userFilter === 'others' && interaction.userId !== backOfficeUser?.uid);
    
    const matchesFollowUp = followUpFilter === 'all' ||
                           (followUpFilter === 'required' && interaction.followUpRequired) ||
                           (followUpFilter === 'not_required' && !interaction.followUpRequired);
    
    return matchesSearch && matchesType && matchesUser && matchesFollowUp;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return Phone;
      case 'email':
        return Mail;
      case 'meeting':
        return Video;
      case 'note':
        return FileText;
      default:
        return MessageSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'note':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Get interaction statistics
  const interactionStats = {
    total: filteredInteractions.length,
    calls: filteredInteractions.filter(i => i.type === 'call').length,
    emails: filteredInteractions.filter(i => i.type === 'email').length,
    meetings: filteredInteractions.filter(i => i.type === 'meeting').length,
    notes: filteredInteractions.filter(i => i.type === 'note').length,
    followUpsRequired: filteredInteractions.filter(i => i.followUpRequired).length,
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
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Interactions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadInteractionsData}
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
          <h1 className="text-2xl font-bold text-gray-900">Interactions</h1>
          <p className="text-gray-600">
            {backOfficeUser?.role === 'marketing_member' 
              ? 'Track your vendor interactions'
              : 'Monitor team vendor interactions'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadInteractionsData}
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
              Log Interaction
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Interaction Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{interactionStats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{interactionStats.calls}</div>
          <div className="text-sm text-gray-500">Calls</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{interactionStats.emails}</div>
          <div className="text-sm text-gray-500">Emails</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-purple-600">{interactionStats.meetings}</div>
          <div className="text-sm text-gray-500">Meetings</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-600">{interactionStats.notes}</div>
          <div className="text-sm text-gray-500">Notes</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-orange-600">{interactionStats.followUpsRequired}</div>
          <div className="text-sm text-gray-500">Follow-ups</div>
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
                placeholder="Search interactions by description, vendor, or outcome..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {(['all', 'call', 'email', 'meeting', 'note'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-2 text-sm rounded-lg capitalize ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* User Filter - Only show for managers */}
          {backOfficeUser?.role !== 'marketing_member' && (
            <div className="flex gap-2">
              {(['all', 'me', 'others'] as const).map(user => (
                <button
                  key={user}
                  onClick={() => setUserFilter(user)}
                  className={`px-3 py-2 text-sm rounded-lg capitalize ${
                    userFilter === user
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {user}
                </button>
              ))}
            </div>
          )}

          {/* Follow-up Filter */}
          <div className="flex gap-2">
            {(['all', 'required', 'not_required'] as const).map(followUp => (
              <button
                key={followUp}
                onClick={() => setFollowUpFilter(followUp)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  followUpFilter === followUp
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {followUp === 'all' ? 'All' : 
                 followUp === 'required' ? 'Follow-up Required' : 'No Follow-up'}
              </button>
            ))}
          </div>
        </div>
      </DashboardCard>

      {/* Interactions List */}
      <DashboardCard>
        <div className="space-y-4">
          {filteredInteractions.length > 0 ? (
            filteredInteractions.map((interaction) => {
              const TypeIcon = getTypeIcon(interaction.type);
              
              return (
                <div
                  key={interaction.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(interaction.type)}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(interaction.type)}`}>
                          {interaction.type}
                        </span>
                        {interaction.followUpRequired && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Follow-up Required
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-900 mb-2 font-medium">{interaction.description}</p>
                      
                      {interaction.outcome && (
                        <p className="text-gray-600 mb-3 text-sm">
                          <strong>Outcome:</strong> {interaction.outcome}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {interaction.vendorName}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {interaction.userName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(interaction.date)} at {formatTime(interaction.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getTimeAgo(interaction.date)}
                        </div>
                        {interaction.followUpDate && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            Follow-up: {formatDate(interaction.followUpDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <InteractionActionsDropdown interaction={interaction} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No interactions found</h3>
              <p className="text-gray-600">
                {searchTerm || typeFilter !== 'all' || userFilter !== 'all' || followUpFilter !== 'all'
                  ? 'No interactions match your current filters'
                  : 'No interactions have been logged yet'
                }
              </p>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

// Interaction Actions Dropdown Component
function InteractionActionsDropdown({ interaction }: { interaction: VendorInteraction }) {
  const [isOpen, setIsOpen] = useState(false);
  const { backOfficeUser } = useBackOfficeAuth();

  const canEdit = backOfficeUser?.role !== 'marketing_member' || 
                 interaction.userId === backOfficeUser?.uid;

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
                  Edit Interaction
                </button>
                <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Interaction
                </button>
              </PermissionGuard>
            )}
            {interaction.followUpRequired && (
              <button className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Follow-up Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
