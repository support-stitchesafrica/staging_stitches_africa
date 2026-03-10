/**
 * Vendor Reassignment Modal Component
 * Modal for reassigning a vendor from one team member to another
 */

'use client';

import { useState } from 'react';
import { X, Shuffle, AlertCircle, ArrowRight } from 'lucide-react';
import type { Tailor } from '@/admin-services/useTailors';

interface VendorAssignment {
  id: string;
  vendorId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  assignmentDate: Date;
  status: 'active' | 'inactive';
  notes: string[];
  lastEngagementDate?: Date;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedVendorsCount: number;
}

interface VendorReassignmentModalProps {
  assignment: VendorAssignment;
  teamMembers: TeamMember[];
  teamVendors: Tailor[];
  onReassign: (assignmentId: string, newAssigneeId: string) => Promise<void>;
  onClose: () => void;
}

export default function VendorReassignmentModal({
  assignment,
  teamMembers,
  teamVendors,
  onReassign,
  onClose
}: VendorReassignmentModalProps) {
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendor = teamVendors.find(v => v.id === assignment.vendorId);
  const currentAssignee = teamMembers.find(m => m.id === assignment.assignedToUserId);
  const newAssignee = teamMembers.find(m => m.id === newAssigneeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssigneeId) {
      setError('Please select a new team member');
      return;
    }

    if (newAssigneeId === assignment.assignedToUserId) {
      setError('Please select a different team member');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onReassign(assignment.id, newAssigneeId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shuffle className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Reassign Vendor</h2>
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
              {vendor?.brand_name || vendor?.brandName || 'Unknown Brand'}
            </p>
            <p className="text-sm text-gray-500">
              {vendor?.wear_specialization || 'Fashion'}
            </p>
          </div>

          {/* Current and New Assignee */}
          <div className="flex items-center gap-3">
            {/* Current Assignee */}
            <div className="flex-1 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Current Assignee</p>
              <p className="text-sm font-semibold text-blue-900">
                {currentAssignee?.name || 'Unknown'}
              </p>
              <p className="text-xs text-blue-600">{currentAssignee?.email}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />

            {/* New Assignee Preview */}
            <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-600 font-medium mb-1">New Assignee</p>
              {newAssignee ? (
                <>
                  <p className="text-sm font-semibold text-green-900">{newAssignee.name}</p>
                  <p className="text-xs text-green-600">{newAssignee.email}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Select below</p>
              )}
            </div>
          </div>

          {/* New Team Member Selection */}
          <div>
            <label htmlFor="new-assignee" className="block text-sm font-medium text-gray-700 mb-2">
              Reassign to Team Member *
            </label>
            <select
              id="new-assignee"
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select a team member</option>
              {teamMembers
                .filter(m => m.id !== assignment.assignedToUserId)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.assignedVendorsCount} vendors)
                  </option>
                ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Reassignment (Optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Explain why this vendor is being reassigned..."
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !newAssigneeId}
            >
              {loading ? 'Reassigning...' : 'Reassign Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
