/**
 * Bulk Assignment Modal Component
 * Modal for assigning multiple vendors to team members at once
 */

'use client';

import { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import type { Tailor } from '@/admin-services/useTailors';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedVendorsCount: number;
}

interface BulkAssignModalProps {
  vendors: Tailor[];
  teamMembers: TeamMember[];
  onClose: () => void;
  onAssign: (vendorIds: string[], assignedToUserId: string, notes?: string) => Promise<void>;
}

export default function BulkAssignModal({
  vendors,
  teamMembers,
  onClose,
  onAssign
}: BulkAssignModalProps) {
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter unassigned vendors
  const unassignedVendors = vendors.filter(v => {
    const matchesSearch = (v.brand_name || v.brandName || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleVendor = (vendorId: string) => {
    setSelectedVendorIds(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const selectAll = () => {
    setSelectedVendorIds(unassignedVendors.map(v => v.id));
  };

  const deselectAll = () => {
    setSelectedVendorIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedVendorIds.length === 0) {
      setError('Please select at least one vendor');
      return;
    }

    if (!selectedMemberId) {
      setError('Please select a team member');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onAssign(selectedVendorIds, selectedMemberId, notes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign vendors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Assign Vendors</h2>
              <p className="text-sm text-gray-500">
                {selectedVendorIds.length} vendor{selectedVendorIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Team Member Selection */}
            <div>
              <label htmlFor="team-member" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Team Member *
              </label>
              <select
                id="team-member"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a team member</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.assignedVendorsCount} vendors)
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Vendors *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              />

              {/* Vendor List */}
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {unassignedVendors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No vendors found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {unassignedVendors.map((vendor) => (
                      <label
                        key={vendor.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor.id)}
                          onChange={() => toggleVendor(vendor.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {vendor.brand_name || vendor.brandName || 'Unknown Brand'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vendor.wear_specialization || 'Fashion'} • {vendor.totalOrders || 0} orders
                          </p>
                        </div>
                        {selectedVendorIds.includes(vendor.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add any notes about these assignments..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || selectedVendorIds.length === 0 || !selectedMemberId}
            >
              {loading ? 'Assigning...' : `Assign ${selectedVendorIds.length} Vendor${selectedVendorIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
