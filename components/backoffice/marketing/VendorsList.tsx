/**
 * Vendors List Component
 * 
 * Displays and manages vendor assignments for the marketing team.
 * Supports filtering, searching, and assignment management.
 * 
 * Requirements: 6.4, 6.5, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Plus,
} from 'lucide-react';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import DashboardCard from '../DashboardCard';
import PermissionGuard from '../PermissionGuard';

interface Vendor {
  id: string;
  name: string;
  brandName: string;
  email: string;
  phone: string;
  location: string;
  specialization: string;
  status: 'active' | 'inactive' | 'pending';
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  lastInteraction?: Date;
  totalOrders: number;
  totalRevenue: number;
  joinedDate: Date;
  performanceScore: number;
}

interface VendorAssignment {
  id: string;
  vendorId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  teamId?: string;
  status: 'active' | 'inactive';
  assignedAt: Date;
  lastEngagementDate?: Date;
  notes?: string;
}

export default function VendorsList() {
  const { backOfficeUser } = useBackOfficeAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  useEffect(() => {
    loadVendorsData();
  }, []);

  const loadVendorsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load vendor assignments and vendor data
      // This would typically come from your marketing API
      // For now, we'll use mock data that matches the expected structure
      
      const mockVendors: Vendor[] = [
        {
          id: '1',
          name: 'Adunni Fashions',
          brandName: 'Adunni Couture',
          email: 'contact@adunnifashions.com',
          phone: '+234 801 234 5678',
          location: 'Lagos, Nigeria',
          specialization: 'Traditional Wear',
          status: 'active',
          assignedTo: {
            id: 'user1',
            name: 'Sarah Wilson',
            role: 'BDM',
          },
          lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          totalOrders: 45,
          totalRevenue: 125000,
          joinedDate: new Date('2024-01-15'),
          performanceScore: 92.5,
        },
        {
          id: '2',
          name: 'Kente Creations',
          brandName: 'Royal Kente',
          email: 'info@kentecreations.com',
          phone: '+233 24 567 8901',
          location: 'Accra, Ghana',
          specialization: 'Kente & Accessories',
          status: 'active',
          assignedTo: {
            id: 'user2',
            name: 'David Chen',
            role: 'Team Member',
          },
          lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          totalOrders: 32,
          totalRevenue: 89000,
          joinedDate: new Date('2024-02-20'),
          performanceScore: 87.3,
        },
        {
          id: '3',
          name: 'Ankara Artisans',
          brandName: 'Vibrant Ankara',
          email: 'hello@ankaraartisans.com',
          phone: '+234 803 456 7890',
          location: 'Abuja, Nigeria',
          specialization: 'Ankara Designs',
          status: 'pending',
          lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          totalOrders: 12,
          totalRevenue: 28000,
          joinedDate: new Date('2024-03-10'),
          performanceScore: 75.8,
        },
      ];

      const mockAssignments: VendorAssignment[] = [
        {
          id: '1',
          vendorId: '1',
          assignedToUserId: 'user1',
          assignedByUserId: 'admin1',
          teamId: 'team1',
          status: 'active',
          assignedAt: new Date('2024-01-16'),
          lastEngagementDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: 'High-performing vendor, regular communication',
        },
        {
          id: '2',
          vendorId: '2',
          assignedToUserId: 'user2',
          assignedByUserId: 'admin1',
          teamId: 'team1',
          status: 'active',
          assignedAt: new Date('2024-02-21'),
          lastEngagementDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Growing partnership, needs regular follow-up',
        },
      ];

      setVendors(mockVendors);
      setAssignments(mockAssignments);
    } catch (err) {
      console.error('Error loading vendors data:', err);
      setError('Failed to load vendors data');
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on search and filters
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    
    const matchesAssignment = assignmentFilter === 'all' ||
                             (assignmentFilter === 'assigned' && vendor.assignedTo) ||
                             (assignmentFilter === 'unassigned' && !vendor.assignedTo);
    
    return matchesSearch && matchesStatus && matchesAssignment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysAgo = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Vendors</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadVendorsData}
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
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage vendor relationships and assignments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadVendorsData}
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
              Add Vendor
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filters */}
      <DashboardCard>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors by name, brand, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'inactive', 'pending'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm rounded-lg capitalize ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Assignment Filter */}
          <div className="flex gap-2">
            {(['all', 'assigned', 'unassigned'] as const).map(assignment => (
              <button
                key={assignment}
                onClick={() => setAssignmentFilter(assignment)}
                className={`px-3 py-2 text-sm rounded-lg capitalize ${
                  assignmentFilter === assignment
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {assignment}
              </button>
            ))}
          </div>
        </div>
      </DashboardCard>

      {/* Vendors List */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Interaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.brandName}</div>
                          <div className="text-sm text-gray-500">{vendor.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {vendor.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{vendor.specialization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vendor.assignedTo ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{vendor.assignedTo.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{vendor.assignedTo.role.replace('_', ' ')}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${getPerformanceColor(vendor.performanceScore)}`}>
                          {vendor.performanceScore.toFixed(1)}%
                        </span>
                        <TrendingUp className={`w-4 h-4 ${getPerformanceColor(vendor.performanceScore)}`} />
                      </div>
                      <div className="text-xs text-gray-500">
                        {vendor.totalOrders} orders • {formatCurrency(vendor.totalRevenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vendor.lastInteraction ? (
                        <div>
                          <div className="text-sm text-gray-900">{getDaysAgo(vendor.lastInteraction)}</div>
                          <div className="text-xs text-gray-500">{formatDate(vendor.lastInteraction)}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No interactions</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <VendorActionsDropdown vendor={vendor} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No vendors found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

// Vendor Actions Dropdown Component
function VendorActionsDropdown({ vendor }: { vendor: Vendor }) {
  const [isOpen, setIsOpen] = useState(false);

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
            <PermissionGuard department="marketing" permission="write">
              <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                <Edit className="w-4 h-4 mr-2" />
                Edit Vendor
              </button>
              <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                <UserPlus className="w-4 h-4 mr-2" />
                {vendor.assignedTo ? 'Reassign' : 'Assign'} Vendor
              </button>
            </PermissionGuard>
            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
              <Phone className="w-4 h-4 mr-2" />
              Call Vendor
            </button>
            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
