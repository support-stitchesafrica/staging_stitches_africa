/**
 * Tailors List Component
 * 
 * Displays and manages all tailors with filtering, search, and approval actions.
 * Integrates with admin collections for tailor management.
 * 
 * Requirements: 11.5, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useMemo } from 'react';
import { 
  Scissors, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Star,
  Package,
  Users,
  ShoppingCart,
  Download,
  Plus
} from 'lucide-react';
import DashboardCard from '../DashboardCard';
import StatsCard from '../StatsCard';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { useTailors, Tailor } from '@/admin-services/useTailors';

interface TailorsListProps {
  /** Optional filter to apply */
  initialFilter?: 'all' | 'verified' | 'pending' | 'rejected';
  /** Optional search query */
  initialSearch?: string;
}

function TailorsList({ 
  initialFilter = 'all', 
  initialSearch = '' 
}: TailorsListProps) {
  const { hasPermission } = useBackOfficeAuth();
  const { tailors, loading, error } = useTailors();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [selectedTailor, setSelectedTailor] = useState<Tailor | null>(null);
  const [showTailorDetails, setShowTailorDetails] = useState(false);

  // Check permissions
  const canWrite = hasPermission('admin', 'write');
  const canDelete = hasPermission('admin', 'delete');

  // Filter and search tailors
  const filteredTailors = useMemo(() => {
    let filtered = tailors;

    // Apply filter
    if (filter === 'verified') {
      filtered = filtered.filter(tailor => tailor.identity_verification?.status === 'verified');
    } else if (filter === 'pending') {
      filtered = filtered.filter(tailor => tailor.identity_verification?.status === 'pending');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(tailor => tailor.identity_verification?.status === 'rejected');
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tailor => 
        tailor.brand_name?.toLowerCase().includes(query) ||
        tailor.brandName?.toLowerCase().includes(query) ||
        tailor.tailor_registered_info?.email?.toLowerCase().includes(query) ||
        tailor.wear_specialization?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tailors, filter, searchQuery]);

  const handleViewTailor = (tailor: Tailor) => {
    setSelectedTailor(tailor);
    setShowTailorDetails(true);
  };

  const handleExportTailors = () => {
    const csvContent = [
      ['ID', 'Brand Name', 'Email', 'Specialization', 'Status', 'Total Orders', 'Total Products'].join(','),
      ...filteredTailors.map(tailor => [
        tailor.id,
        tailor.brand_name || tailor.brandName || '',
        tailor.tailor_registered_info?.email || '',
        tailor.wear_specialization || '',
        tailor.identity_verification?.status || 'unknown',
        tailor.totalOrders || 0,
        tailor.totalProducts || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailors-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardCard title="Tailors" description="Loading tailors...">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-20"></div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Error" description="Failed to load tailors" icon={Scissors}>
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

  const verifiedTailors = tailors.filter(t => t.identity_verification?.status === 'verified');
  const pendingTailors = tailors.filter(t => t.identity_verification?.status === 'pending');
  const totalOrders = tailors.reduce((sum, t) => sum + (t.totalOrders || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tailors Management</h1>
          <p className="text-gray-600 mt-1">
            Manage tailor profiles, approvals, and performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportTailors}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          {canWrite && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Tailor</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value={tailors.length}
          label="Total Tailors"
          icon={Scissors}
          variant="primary"
        />
        
        <StatsCard
          value={verifiedTailors.length}
          label="Verified Tailors"
          icon={CheckCircle}
          variant="success"
        />
        
        <StatsCard
          value={pendingTailors.length}
          label="Pending Approval"
          icon={Clock}
          variant="warning"
        />
        
        <StatsCard
          value={totalOrders}
          label="Total Orders"
          icon={ShoppingCart}
          variant="purple"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tailors by brand name, email, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Tailors</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tailors List */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tailor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Specialization</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Performance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTailors.map((tailor) => {
                const status = tailor.identity_verification?.status || 'unknown';
                const brandName = tailor.brand_name || tailor.brandName || 'Unknown Brand';
                
                return (
                  <tr key={tailor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          {tailor.brand_logo ? (
                            <img 
                              src={tailor.brand_logo} 
                              alt={brandName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Scissors className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{brandName}</p>
                          <p className="text-sm text-gray-500">
                            {tailor.tailor_registered_info?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">
                        {tailor.wear_specialization || 'Not specified'}
                      </span>
                      {tailor.brand_category && tailor.brand_category.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tailor.brand_category.slice(0, 2).map((category, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {category}
                            </span>
                          ))}
                          {tailor.brand_category.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{tailor.brand_category.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <ShoppingCart className="w-3 h-3 text-gray-400" />
                          <span>{tailor.totalOrders || 0} orders</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span>{tailor.totalProducts || 0} products</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{tailor.totalUsers || 0} customers</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewTailor(tailor)}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWrite && (
                          <button
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Edit Tailor"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Tailor"
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
          
          {filteredTailors.length === 0 && (
            <div className="text-center py-8">
              <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tailors found matching your criteria</p>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Tailor Details Modal */}
      {showTailorDetails && selectedTailor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Tailor Details</h3>
              <button
                onClick={() => setShowTailorDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Brand Name</label>
                  <p className="text-gray-900">{selectedTailor.brand_name || selectedTailor.brandName || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedTailor.tailor_registered_info?.email || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Specialization</label>
                  <p className="text-gray-900">{selectedTailor.wear_specialization || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTailor.brand_category?.map((category, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded"
                      >
                        {category}
                      </span>
                    )) || <span className="text-gray-500">None specified</span>}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Performance</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">Total Orders</p>
                    <p className="text-xl font-bold text-blue-900">{selectedTailor.totalOrders || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600">Products</p>
                    <p className="text-xl font-bold text-green-900">{selectedTailor.totalProducts || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600">Customers</p>
                    <p className="text-xl font-bold text-purple-900">{selectedTailor.totalUsers || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-orange-600">Wallet</p>
                    <p className="text-xl font-bold text-orange-900">
                      ${selectedTailor.wallet?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canWrite && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                {selectedTailor.identity_verification?.status === 'pending' && (
                  <>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Approve Tailor
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Reject Tailor
                    </button>
                  </>
                )}
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit Tailor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TailorsList);