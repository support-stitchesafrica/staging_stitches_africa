"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import { CreateCouponInput, DiscountType } from '@/types/coupon';
import { useCouponMutations } from '@/hooks/useCouponMutations';
import { toast } from 'sonner';

interface CreateCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCouponCreated: () => void;
}

export function CreateCouponDialog({
  open,
  onOpenChange,
  onCouponCreated
}: CreateCouponDialogProps) {
  const { createCoupon, creating, generateCode, generating } = useCouponMutations();
  
  // Form state
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [assignedEmail, setAssignedEmail] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('1');
  const [sendEmail, setSendEmail] = useState(true);

  const handleGenerateCode = async () => {
    const code = await generateCode();
    if (code) {
      setCouponCode(code);
    }
  };

  const validateForm = (): string | null => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      return 'Please enter a valid discount value';
    }

    if (discountType === 'PERCENTAGE' && parseFloat(discountValue) > 100) {
      return 'Percentage discount cannot exceed 100%';
    }

    if (!assignedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedEmail)) {
      return 'Please enter a valid email address';
    }

    if (minOrderAmount && parseFloat(minOrderAmount) < 0) {
      return 'Minimum order amount cannot be negative';
    }

    if (usageLimit && parseInt(usageLimit) < 1) {
      return 'Usage limit must be at least 1';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const input: CreateCouponInput = {
      couponCode: couponCode || undefined,
      discountType,
      discountValue: parseFloat(discountValue),
      assignedEmail: assignedEmail.trim().toLowerCase(),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
      expiryDate: expiryDate || undefined,
      usageLimit: parseInt(usageLimit),
      sendEmail
    };

    const coupon = await createCoupon(input);
    
    if (coupon) {
      // Reset form
      setCouponCode('');
      setDiscountValue('');
      setAssignedEmail('');
      setMinOrderAmount('');
      setExpiryDate('');
      setUsageLimit('1');
      setSendEmail(true);
      
      onCouponCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Coupon</DialogTitle>
          <DialogDescription>
            Create an email-tied discount coupon for a specific customer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coupon Code */}
          <div className="space-y-2">
            <Label htmlFor="couponCode">
              Coupon Code <span className="text-gray-500 text-sm">(Optional - auto-generated if empty)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="couponCode"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="STIT-XXXXXXXX"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateCode}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <Label>Discount Type *</Label>
            <RadioGroup
              value={discountType}
              onValueChange={(value) => setDiscountType(value as DiscountType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PERCENTAGE" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentage (%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FIXED" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Fixed Amount (₦)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Discount Value */}
          <div className="space-y-2">
            <Label htmlFor="discountValue">
              Discount Value * {discountType === 'PERCENTAGE' ? '(%)' : '(₦)'}
            </Label>
            <Input
              id="discountValue"
              type="number"
              step="0.01"
              min="0"
              max={discountType === 'PERCENTAGE' ? '100' : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 5000'}
              required
            />
            {discountType === 'FIXED' && (
              <p className="text-sm text-amber-600">
                ⓘ Fixed amounts are entered in Naira (₦) and automatically converted to USD at checkout
              </p>
            )}
          </div>

          {/* Assigned Email */}
          <div className="space-y-2">
            <Label htmlFor="assignedEmail">Assigned Email *</Label>
            <Input
              id="assignedEmail"
              type="email"
              value={assignedEmail}
              onChange={(e) => setAssignedEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
            <p className="text-sm text-gray-500">
              Only this email can use the coupon
            </p>
          </div>

          {/* Minimum Order Amount */}
          <div className="space-y-2">
            <Label htmlFor="minOrderAmount">
              Minimum Order Amount <span className="text-gray-500 text-sm">(Optional)</span>
            </Label>
            <Input
              id="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="e.g., 10000"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">
              Expiry Date <span className="text-gray-500 text-sm">(Optional)</span>
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Usage Limit */}
          <div className="space-y-2">
            <Label htmlFor="usageLimit">Usage Limit *</Label>
            <Input
              id="usageLimit"
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              Number of times this coupon can be used
            </p>
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="sendEmail" className="font-normal cursor-pointer">
              Send email notification to customer
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Coupon'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
