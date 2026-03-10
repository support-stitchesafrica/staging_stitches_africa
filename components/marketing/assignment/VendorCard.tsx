/**
 * Vendor Card Component with Assignment Functionality
 * Reusable card for displaying vendor information with assignment actions
 */

'use client';

import { useState } from 'react';
import { 
  Building2, 
  Package, 
  DollarSign, 
  Activity, 
  Clock, 
  Target, 
  Eye, 
  Phone, 
  UserPlus, 
  CheckCircle,
  Shuffle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssignVendorDialog } from './AssignVendorDialog';
import type { Tailor } from '@/admin-services/useTailors';
import type { VendorAssignment } from '@/lib/marketing/types';

interface VendorCardProps {
  vendor: Tailor;
  assignment?: VendorAssignment | null;
  onAssignmentChange?: () => void;
  onView?: (vendor: Tailor) => void;
  onContact?: (vendor: Tailor) => void;
  showActions?: boolean;
  showPerformance?: boolean;
  className?: string;
}

export function VendorCard({
  vendor,
  assignment,
  onAssignmentChange,
  onView,
  onContact,
  showActions = true,
  showPerformance = true,
  className = ''
}: VendorCardProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

  const isAssigned = !!assignment && assignment.status === 'active';
  const performanceScore = Math.min(100, (vendor.totalOrders || 0) * 5);
  const vendorName = vendor.brand_name || vendor.brandName || 'Unknown Brand';

  const handleAssignClick = () => {
    setIsAssignDialogOpen(true);
  };

  const handleReassignClick = () => {
    setIsReassignDialogOpen(true);
  };

  const handleAssignmentSuccess = () => {
    onAssignmentChange?.();
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {vendorName}
                </h3>
                <p className="text-sm text-gray-500">
                  {vendor.wear_specialization || 'Fashion'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              isAssigned 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isAssigned ? 'Assigned' : 'Unassigned'}
            </span>
            
            {vendor.identity_verification?.status === 'verified' && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Assignment Info */}
        {isAssigned && assignment && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Assigned to {assignment.userName}
                  </p>
                  <p className="text-xs text-green-700">
                    {new Date(assignment.assignedAt.toDate()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Package className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{vendor.totalProducts || 0} Products</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{vendor.totalOrders || 0} Orders</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Activity className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              {vendor.identity_verification?.status === 'verified' 
                ? 'Verified' 
                : vendor.identity_verification?.status === 'pending'
                ? 'Pending Verification'
                : 'Not Verified'}
            </span>
          </div>
        </div>

        {/* Performance Bar */}
        {showPerformance && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Performance</span>
              <span>{performanceScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${performanceScore}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(vendor)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            )}
            
            {onContact && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContact(vendor)}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-1" />
                Contact
              </Button>
            )}
            
            {!isAssigned ? (
              <Button
                size="sm"
                onClick={handleAssignClick}
                className="flex-1"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Assign
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <MoreVertical className="w-4 h-4 mr-1" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReassignClick}>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Reassign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <AssignVendorDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        vendor={{
          id: vendor.id,
          name: vendorName,
          brandName: vendorName
        }}
        onSuccess={handleAssignmentSuccess}
      />

      {/* Reassignment Dialog */}
      <AssignVendorDialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
        vendor={{
          id: vendor.id,
          name: vendorName,
          brandName: vendorName
        }}
        currentAssignment={assignment ? {
          id: assignment.id,
          userId: assignment.userId,
          userName: assignment.userName
        } : undefined}
        onSuccess={handleAssignmentSuccess}
      />
    </>
  );
}

/**
 * Compact Vendor Card for list views
 */
export function VendorCardCompact({
  vendor,
  assignment,
  onAssignmentChange,
  onView,
  className = ''
}: Omit<VendorCardProps, 'showActions' | 'showPerformance' | 'onContact'>) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const isAssigned = !!assignment && assignment.status === 'active';
  const vendorName = vendor.brand_name || vendor.brandName || 'Unknown Brand';

  return (
    <>
      <div className={`bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {vendorName}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {vendor.totalOrders || 0} orders • {vendor.totalProducts || 0} products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAssigned && assignment ? (
              <span className="text-xs text-green-600 font-medium">
                {assignment.userName}
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsAssignDialogOpen(true)}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Assign
              </Button>
            )}
            
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(vendor)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AssignVendorDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        vendor={{
          id: vendor.id,
          name: vendorName,
          brandName: vendorName
        }}
        currentAssignment={assignment ? {
          id: assignment.id,
          userId: assignment.userId,
          userName: assignment.userName
        } : undefined}
        onSuccess={onAssignmentChange}
      />
    </>
  );
}
