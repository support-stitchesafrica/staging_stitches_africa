/**
 * Assignment List View Component
 * Displays vendor assignments with filtering and sorting
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  User,
  Calendar,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  Shuffle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VendorAssignmentService } from '@/lib/marketing/vendor-assignment-service';
import { useMarketingUsersOptimized } from '@/lib/marketing/useMarketingUsersOptimized';
import { AssignVendorDialog } from './AssignVendorDialog';
import type { VendorAssignment, AssignmentStatus } from '@/lib/marketing/types';

type ViewMode = 'by-user' | 'by-vendor' | 'all';
type SortField = 'assignedAt' | 'vendorName' | 'userName' | 'status';
type SortOrder = 'asc' | 'desc';

interface AssignmentListViewProps {
  viewMode?: ViewMode;
  userId?: string;
  vendorId?: string;
  onAssignmentChange?: () => void;
  className?: string;
}

export function AssignmentListView({
  viewMode = 'all',
  userId,
  vendorId,
  onAssignmentChange,
  className = ''
}: AssignmentListViewProps) {
  const { users } = useMarketingUsersOptimized({ autoLoad: true });
  
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('assignedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [selectedAssignment, setSelectedAssignment] = useState<VendorAssignment | null>(null);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

  // Load assignments
  useEffect(() => {
    loadAssignments();
  }, [viewMode, userId, vendorId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: VendorAssignment[];

      if (viewMode === 'by-user' && userId) {
        data = await VendorAssignmentService.getAssignmentsByUser(userId);
      } else if (viewMode === 'by-vendor' && vendorId) {
        data = await VendorAssignmentService.getAssignmentsByVendor(vendorId);
      } else {
        data = await VendorAssignmentService.getAssignments();
      }

      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.vendorName.toLowerCase().includes(term) ||
        a.userName.toLowerCase().includes(term) ||
        a.userEmail.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'assignedAt':
          comparison = a.assignedAt.toMillis() - b.assignedAt.toMillis();
          break;
        case 'vendorName':
          comparison = a.vendorName.localeCompare(b.vendorName);
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [assignments, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleReassign = (assignment: VendorAssignment) => {
    setSelectedAssignment(assignment);
    setIsReassignDialogOpen(true);
  };

  const handleReassignSuccess = () => {
    loadAssignments();
    onAssignmentChange?.();
  };

  // Get status badge color
  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadAssignments} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMode === 'by-user' ? 'User Assignments' :
                 viewMode === 'by-vendor' ? 'Vendor Assignment History' :
                 'All Assignments'}
              </h2>
              <p className="text-sm text-gray-500">
                {filteredAndSortedAssignments.length} assignment{filteredAndSortedAssignments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAssignments}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by vendor or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AssignmentStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Assignment List */}
        <div className="divide-y">
          {filteredAndSortedAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assignments found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No vendor assignments have been created yet'}
              </p>
            </div>
          ) : (
            filteredAndSortedAssignments.map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                onReassign={handleReassign}
                showVendor={viewMode !== 'by-vendor'}
                showUser={viewMode !== 'by-user'}
              />
            ))
          )}
        </div>
      </div>

      {/* Reassignment Dialog */}
      {selectedAssignment && (
        <AssignVendorDialog
          open={isReassignDialogOpen}
          onOpenChange={setIsReassignDialogOpen}
          vendor={{
            id: selectedAssignment.vendorId,
            name: selectedAssignment.vendorName,
            brandName: selectedAssignment.vendorName
          }}
          currentAssignment={{
            id: selectedAssignment.id,
            userId: selectedAssignment.userId,
            userName: selectedAssignment.userName
          }}
          onSuccess={handleReassignSuccess}
        />
      )}
    </>
  );
}

/**
 * Assignment Row Component
 */
interface AssignmentRowProps {
  assignment: VendorAssignment;
  onReassign: (assignment: VendorAssignment) => void;
  showVendor?: boolean;
  showUser?: boolean;
}

function AssignmentRow({
  assignment,
  onReassign,
  showVendor = true,
  showUser = true
}: AssignmentRowProps) {
  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-2">
            {showVendor && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {assignment.vendorName}
                  </p>
                  <p className="text-xs text-gray-500">Vendor</p>
                </div>
              </div>
            )}

            {showUser && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {assignment.userName}
                  </p>
                  <p className="text-xs text-gray-500">{assignment.userEmail}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Assigned {new Date(assignment.assignedAt.toDate()).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>by {assignment.assignedByName}</span>
            </div>
          </div>

          {assignment.notes && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {assignment.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
            {getStatusIcon(assignment.status)}
            {assignment.status}
          </span>

          {assignment.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReassign(assignment)}
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Reassign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
