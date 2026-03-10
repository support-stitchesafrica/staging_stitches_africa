"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { auth } from '@/firebase';
import { Coupon, CouponStatus } from '@/types/coupon';
import { cn } from '@/lib/utils';

interface EditCouponDialogProps {
  coupon: Coupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCouponUpdated: () => void;
}

export function EditCouponDialog({
  coupon,
  open,
  onOpenChange,
  onCouponUpdated
}: EditCouponDialogProps) {
  const [status, setStatus] = useState<CouponStatus>('ACTIVE');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [usageLimit, setUsageLimit] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Initialize form when coupon changes
  useEffect(() => {
    if (coupon) {
      setStatus(coupon.status);
      setUsageLimit(coupon.usageLimit);
      
      // Convert Firestore Timestamp to Date
      if (coupon.expiryDate) {
        const date = typeof coupon.expiryDate === 'object' && 'toDate' in coupon.expiryDate
          ? coupon.expiryDate.toDate()
          : new Date(coupon.expiryDate as any);
        setExpiryDate(date);
      } else {
        setExpiryDate(undefined);
      }
    }
  }, [coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coupon) return;

    // Validation
    if (usageLimit < 1) {
      toast.error('Usage limit must be at least 1');
      return;
    }

    if (usageLimit < coupon.timesUsed) {
      toast.error(`Usage limit cannot be less than times already used (${coupon.timesUsed})`);
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const token = await user.getIdToken();

      const updateData: any = {
        status,
        usageLimit
      };

      // Only include expiryDate if it's set
      if (expiryDate) {
        updateData.expiryDate = expiryDate.toISOString();
      }

      const response = await fetch(`/api/atlas/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update coupon');
      }

      toast.success('Coupon updated successfully!');
      onCouponUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast.error(error.message || 'Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  if (!coupon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Immutable Fields Display */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <p className="text-xs text-gray-600">Coupon Code (cannot be changed)</p>
              <p className="font-mono font-semibold text-gray-900">{coupon.couponCode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Assigned Email (cannot be changed)</p>
              <p className="text-sm text-gray-900">{coupon.assignedEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Discount (cannot be changed)</p>
              <p className="text-sm text-gray-900">
                {coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}%`
                  : `₦${coupon.discountValue.toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as CouponStatus)}
                disabled={coupon.status === 'USED'}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  {coupon.status === 'USED' && (
                    <SelectItem value="USED">Used</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {coupon.status === 'USED' && (
                <p className="text-xs text-gray-500">
                  Status cannot be changed for used coupons
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(new Date(expiryDate), "PPP") : "No expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {expiryDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setExpiryDate(undefined)}
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Usage Limit */}
            <div className="space-y-2">
              <Label htmlFor="usageLimit">
                Usage Limit
                <span className="text-xs text-gray-500 ml-2">
                  (Currently used: {coupon.timesUsed})
                </span>
              </Label>
              <Input
                id="usageLimit"
                type="number"
                min={coupon.timesUsed}
                value={usageLimit}
                onChange={(e) => setUsageLimit(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-gray-500">
                Must be at least {coupon.timesUsed} (times already used)
              </p>
            </div>
          </div>

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
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Coupon'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
