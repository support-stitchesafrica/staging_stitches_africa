/**
 * Vendor Assignment Modal Component
 * Modal for assigning a vendor to a team member
 */

'use client';

import { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import type { Tailor } from '@/admin-services/useTailors';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedVendorsCount: number;
}

interface VendorAssignmentModalProps {
  vendor: Tailor | null;
  teamMembers: TeamMember[];
  onAssign: (vendorId: string, assignedToUserId: string, notes?: string) => Promise<void>;
  onClose: () => void;
}

export default function VendorAssignmentModal({
  vendor,
  teamMembers,
  onAssign,
  onClose
}: VendorAssignmentModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendor || !selectedMemberId) {
      setError('Please select a team member');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onAssign(vendor.id, selectedMemberId, notes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign vendor');
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Vendor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vendor Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Vendor</p>
            <p className="font-semibold text-gray-900">
              {vendor.brand_name || vendor.brandName || 'Unknown Brand'}
            </p>
            <p className="text-sm text-gray-500">
              {vendor.wear_specialization || 'Fashion'}
            </p>
          </div>

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
              placeholder="Add any notes about this assignment..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              disabled={loading || !selectedMemberId}
            >
              {loading ? 'Assigning...' : 'Assign Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
