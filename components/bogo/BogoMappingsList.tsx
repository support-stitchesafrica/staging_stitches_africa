"use client";

import { useState } from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Package, Gift } from 'lucide-react';
import { bogoMappingService } from '@/lib/bogo/mapping-service';
import type { BogoMapping, BogoPromotionStatus } from '@/types/bogo';
import { BogoMappingForm } from './BogoMappingForm';

interface BogoMappingsListProps {
  mappings: BogoMapping[];
  onMappingUpdated: () => void;
  onRefresh: () => void;
}

export function BogoMappingsList({ mappings, onMappingUpdated, onRefresh }: BogoMappingsListProps) {
  const [editingMapping, setEditingMapping] = useState<BogoMapping | null>(null);
  const [deletingMapping, setDeletingMapping] = useState<BogoMapping | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPromotionStatus = (mapping: BogoMapping): BogoPromotionStatus => {
    if (!mapping.active) {
      return 'inactive' as BogoPromotionStatus;
    }

    const now = new Date();
    const startDate = mapping.promotionStartDate.toDate();
    const endDate = mapping.promotionEndDate.toDate();

    if (now < startDate) {
      return 'not_started' as BogoPromotionStatus;
    }
    if (now > endDate) {
      return 'expired' as BogoPromotionStatus;
    }
    return 'active' as BogoPromotionStatus;
  };

  const getStatusBadge = (status: BogoPromotionStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'not_started':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: BogoPromotionStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'not_started':
        return 'Not Started';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const handleToggleStatus = async (mapping: BogoMapping) => {
    try {
      setLoading(mapping.id);
      setError(null);

      const userId = localStorage.getItem('adminUID') || 'admin';
      await bogoMappingService.toggleMappingStatus(mapping.id, !mapping.active, userId);
      
      onMappingUpdated();
    } catch (err) {
      console.error('Failed to toggle mapping status:', err);
      setError('Failed to update mapping status. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteMapping = async (mapping: BogoMapping) => {
    try {
      setLoading(mapping.id);
      setError(null);

      const userId = localStorage.getItem('adminUID') || 'admin';
      await bogoMappingService.deleteMapping(mapping.id, userId);
      
      setDeletingMapping(null);
      onMappingUpdated();
    } catch (err) {
      console.error('Failed to delete mapping:', err);
      setError('Failed to delete mapping. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (editingMapping) {
    return (
      <BogoMappingForm
        mapping={editingMapping}
        onSuccess={() => {
          setEditingMapping(null);
          onMappingUpdated();
        }}
        onCancel={() => setEditingMapping(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOGO mappings found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first BOGO promotion mapping.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {mappings.map((mapping) => {
              const status = getPromotionStatus(mapping);
              const isLoading = loading === mapping.id;
              
              return (
                <li key={mapping.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Package className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {mapping.promotionName || `Mapping ${mapping.id.slice(0, 8)}`}
                            </p>
                            <span className={getStatusBadge(status)}>
                              {getStatusText(status)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              Main: {mapping.mainProductId}
                            </div>
                            <div className="flex items-center">
                              <Gift className="h-4 w-4 mr-1" />
                              Free: {mapping.freeProductIds.length} product{mapping.freeProductIds.length !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(mapping.promotionStartDate)} - {formatDate(mapping.promotionEndDate)}
                            </div>
                          </div>
                          {mapping.description && (
                            <p className="mt-1 text-sm text-gray-600 truncate">
                              {mapping.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Stats */}
                      <div className="text-right text-sm">
                        <div className="text-gray-900 font-medium">
                          {mapping.redemptionCount} redemptions
                        </div>
                        <div className="text-gray-500">
                          ${mapping.totalRevenue.toLocaleString()} revenue
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleStatus(mapping)}
                          disabled={isLoading}
                          className={`p-2 rounded-md transition-colors ${
                            mapping.active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={mapping.active ? 'Deactivate mapping' : 'Activate mapping'}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                          ) : mapping.active ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => setEditingMapping(mapping)}
                          disabled={isLoading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit mapping"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => setDeletingMapping(mapping)}
                          disabled={isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete mapping"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMapping && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete BOGO Mapping</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this BOGO mapping? This action cannot be undone.
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">
                    {deletingMapping.promotionName || `Mapping ${deletingMapping.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    Main: {deletingMapping.mainProductId} → Free: {deletingMapping.freeProductIds.join(', ')}
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeletingMapping(null)}
                    disabled={loading === deletingMapping.id}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteMapping(deletingMapping)}
                    disabled={loading === deletingMapping.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === deletingMapping.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </div>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}