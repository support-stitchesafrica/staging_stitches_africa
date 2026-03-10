/**
 * Assign Vendor Dialog Component
 * Dialog for assigning vendors to team members
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, User, Building2 } from 'lucide-react';
import { VendorAssignmentService } from '@/lib/marketing/vendor-assignment-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useMarketingUsersOptimized, type MarketingUser } from '@/lib/marketing/useMarketingUsersOptimized';
import { toast } from '@/hooks/use-toast';

interface AssignVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: {
    id: string;
    name: string;
    brandName?: string;
  } | null;
  currentAssignment?: {
    id: string;
    userId: string;
    userName: string;
  } | null;
  onSuccess?: () => void;
}

export function AssignVendorDialog({
  open,
  onOpenChange,
  vendor,
  currentAssignment,
  onSuccess
}: AssignVendorDialogProps) {
  const { user: currentUser } = useMarketingAuth();
  const { users, loading: usersLoading } = useMarketingUsersOptimized({ autoLoad: true });
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userCapacities, setUserCapacities] = useState<Record<string, number>>({});

  const isReassignment = !!currentAssignment;

  // Filter users based on role permissions
  const assignableUsers = users.filter(u => {
    // Don't show inactive users
    if (!u.isActive) return false;
    
    // Don't show current assignee for reassignment
    if (isReassignment && u.id === currentAssignment.userId) return false;
    
    // Super admin can assign to anyone
    if (currentUser?.role === 'super_admin') return true;
    
    // Team lead can assign to team members
    if (currentUser?.role === 'team_lead') {
      return u.role === 'team_member' && u.teamId === currentUser.teamId;
    }
    
    // BDM can assign to team members and team leads
    if (currentUser?.role === 'bdm') {
      return ['team_member', 'team_lead'].includes(u.role);
    }
    
    return false;
  });

  // Load user capacities when dialog opens
  useEffect(() => {
    if (open && assignableUsers.length > 0) {
      loadUserCapacities();
    }
  }, [open, assignableUsers.length]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUserId('');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const loadUserCapacities = async () => {
    const capacities: Record<string, number> = {};
    
    for (const user of assignableUsers) {
      try {
        const capacity = await VendorAssignmentService.getUserRemainingCapacity(user.id);
        capacities[user.id] = capacity;
      } catch (err) {
        console.error(`Failed to load capacity for user ${user.id}:`, err);
        capacities[user.id] = 0;
      }
    }
    
    setUserCapacities(capacities);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendor || !selectedUserId || !currentUser) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isReassignment && currentAssignment) {
        // Reassign vendor
        await VendorAssignmentService.reassignVendor(
          currentAssignment.id,
          selectedUserId,
          currentUser.uid,
          currentUser.displayName || currentUser.email,
          notes || undefined
        );
        
        toast({
          title: 'Vendor Reassigned',
          description: `${vendor.name} has been reassigned successfully.`,
        });
      } else {
        // New assignment
        await VendorAssignmentService.assignVendor(
          {
            vendorId: vendor.id,
            vendorName: vendor.name || vendor.brandName || 'Unknown Vendor',
            userId: selectedUserId,
            assignedBy: currentUser.uid,
            notes: notes || undefined
          },
          currentUser.displayName || currentUser.email
        );
        
        toast({
          title: 'Vendor Assigned',
          description: `${vendor.name} has been assigned successfully.`,
        });
      }

      setSuccess(true);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error assigning vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign vendor');
      
      toast({
        title: 'Assignment Failed',
        description: err instanceof Error ? err.message : 'Failed to assign vendor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = assignableUsers.find(u => u.id === selectedUserId);
  const selectedUserCapacity = selectedUserId ? userCapacities[selectedUserId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isReassignment ? 'Reassign Vendor' : 'Assign Vendor'}
          </DialogTitle>
          <DialogDescription>
            {isReassignment 
              ? `Reassign ${vendor?.name || 'this vendor'} to a different team member.`
              : `Assign ${vendor?.name || 'this vendor'} to a team member.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {vendor?.name || vendor?.brandName || 'Unknown Vendor'}
                </p>
                {isReassignment && currentAssignment && (
                  <p className="text-sm text-gray-500">
                    Currently assigned to: {currentAssignment.userName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select">
              {isReassignment ? 'Reassign to' : 'Assign to'} <span className="text-red-500">*</span>
            </Label>
            
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : assignableUsers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No assignable users found. Please check user permissions.
                </AlertDescription>
              </Alert>
            ) : (
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
                disabled={loading}
              >
                <option value="">Select a user...</option>
                {assignableUsers.map((user) => {
                  const capacity = userCapacities[user.id];
                  const hasCapacity = capacity === undefined || capacity > 0;
                  
                  return (
                    <option 
                      key={user.id} 
                      value={user.id}
                      disabled={!hasCapacity}
                    >
                      {user.name} ({user.role.replace('_', ' ')})
                      {capacity !== undefined && ` - ${capacity} slots available`}
                    </option>
                  );
                })}
              </select>
            )}
            
            {selectedUser && selectedUserCapacity !== null && (
              <p className="text-sm text-gray-500">
                {selectedUserCapacity > 0 
                  ? `${selectedUserCapacity} assignment slots remaining`
                  : 'User has reached maximum capacity'
                }
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Vendor {isReassignment ? 'reassigned' : 'assigned'} successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedUserId || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isReassignment ? 'Reassigning...' : 'Assigning...'}
                </>
              ) : (
                isReassignment ? 'Reassign Vendor' : 'Assign Vendor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
