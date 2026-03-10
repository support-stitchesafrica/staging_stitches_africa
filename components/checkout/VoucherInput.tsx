"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SureGiftsVoucher, VoucherErrorCode } from '@/types/suregifts';
import { SureGiftsService } from '@/lib/suregifts/suregifts-service';
import { toast } from 'sonner';

interface VoucherInputProps {
  onVoucherValidated: (voucher: SureGiftsVoucher | null) => void;
  totalAmount: number;
  currency: string;
  disabled?: boolean;
  className?: string;
}

export function VoucherInput({ 
  onVoucherValidated, 
  totalAmount, 
  currency, 
  disabled = false,
  className = "" 
}: VoucherInputProps) {
  const [voucherCode, setVoucherCode] = useState('');
  const [validatedVoucher, setValidatedVoucher] = useState<SureGiftsVoucher | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) {
      setError('Please enter a voucher code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await SureGiftsService.validateVoucher(voucherCode.trim());

      if (response.success && response.voucher) {
        const voucher = response.voucher;

        // Check if voucher is valid and not expired
        if (!voucher.isValid || voucher.status !== 'active') {
          const errorMsg = voucher.status === 'expired' 
            ? 'This voucher has expired'
            : 'This voucher is not valid';
          setError(errorMsg);
          setValidatedVoucher(null);
          onVoucherValidated(null);
          return;
        }

        // Check if voucher has sufficient balance
        if (voucher.balance <= 0) {
          setError('This voucher has no remaining balance');
          setValidatedVoucher(null);
          onVoucherValidated(null);
          return;
        }

        // Voucher is valid
        setValidatedVoucher(voucher);
        onVoucherValidated(voucher);
        setError(null);

        toast.success(`Voucher validated! Balance: ${currency} ${voucher.balance.toFixed(2)}`, {
          duration: 4000,
        });
      } else {
        const errorMessage = SureGiftsService.formatErrorMessage(
          response.errorCode || VoucherErrorCode.INVALID_CODE,
          response.error || 'Invalid voucher code'
        );
        setError(errorMessage);
        setValidatedVoucher(null);
        onVoucherValidated(null);
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      setError('Failed to validate voucher. Please try again.');
      setValidatedVoucher(null);
      onVoucherValidated(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setValidatedVoucher(null);
    setError(null);
    onVoucherValidated(null);
    toast.info('Voucher removed from payment');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating && voucherCode.trim()) {
      handleValidateVoucher();
    }
  };

  const getVoucherAmount = () => {
    if (!validatedVoucher) return 0;
    return Math.min(validatedVoucher.balance, totalAmount);
  };

  const getRemainingAmount = () => {
    if (!validatedVoucher) return totalAmount;
    return Math.max(0, totalAmount - validatedVoucher.balance);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Gift Voucher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!validatedVoucher ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="voucher-code">Enter Voucher Code</Label>
              <div className="flex gap-2">
                <Input
                  id="voucher-code"
                  type="text"
                  placeholder="Enter your voucher code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  disabled={disabled || isValidating}
                  className="flex-1"
                />
                <Button
                  onClick={handleValidateVoucher}
                  disabled={disabled || isValidating || !voucherCode.trim()}
                  className="px-6"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Enter your SureGifts voucher code to apply it to your order
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Validated Voucher Display */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium text-green-800">
                    Voucher Applied: {validatedVoucher.code}
                  </div>
                  <div className="text-sm text-green-600">
                    Balance: {currency} {validatedVoucher.balance.toFixed(2)}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveVoucher}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700">Payment Breakdown</div>
              
              <div className="flex justify-between text-sm">
                <span>Order Total:</span>
                <span>{currency} {totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-green-600">
                <span>Voucher Amount:</span>
                <span>-{currency} {getVoucherAmount().toFixed(2)}</span>
              </div>
              
              <hr className="my-2" />
              
              <div className="flex justify-between font-medium">
                <span>Remaining to Pay:</span>
                <span>{currency} {getRemainingAmount().toFixed(2)}</span>
              </div>

              {getRemainingAmount() === 0 && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-100 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Order fully covered by voucher!
                  </span>
                </div>
              )}

              {validatedVoucher.balance < totalAmount && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Additional payment method required for remaining amount
                  </span>
                </div>
              )}
            </div>

            {/* Voucher Status */}
            <div className="flex items-center gap-2">
              <Badge variant={validatedVoucher.status === 'active' ? 'default' : 'secondary'}>
                {validatedVoucher.status}
              </Badge>
              {validatedVoucher.expiryDate && (
                <span className="text-xs text-muted-foreground">
                  Expires: {new Date(validatedVoucher.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}