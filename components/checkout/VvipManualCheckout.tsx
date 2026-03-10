'use client';

import { useState } from 'react';
import { Upload, FileText, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface VvipManualCheckoutProps {
  orderData: {
    userId: string;
    items: any[];
    totalAmount: number;
    shippingAddress: any;
    shippingCost: number;
    currency: string;
    measurements?: any;
  };
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

export default function VvipManualCheckout({
  orderData,
  onSuccess,
  onError,
}: VvipManualCheckoutProps) {
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setPaymentProof(file);
      toast.success('Payment proof uploaded successfully');
    }
  };

  const handleSubmitOrder = async () => {
    if (!paymentProof) {
      toast.error('Please upload payment proof');
      return;
    }

    setSubmitting(true);
    try {
      // Upload payment proof file to storage
      const formData = new FormData();
      formData.append('file', paymentProof);
      formData.append('userId', orderData.userId);
      formData.append('type', 'payment_proof');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const uploadData = await uploadResponse.json();
      const paymentProofUrl = uploadData.url;

      // Create VVIP order
      const vvipOrderData = {
        userId: orderData.userId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        shippingAddress: orderData.shippingAddress,
        measurements: orderData.measurements,
        payment_proof_url: paymentProofUrl,
        payment_reference: `VVIP-${orderData.userId.slice(-8).toUpperCase()}`,
        payment_date: new Date(),
        amount_paid: orderData.totalAmount,
        payment_notes: paymentNotes,
      };

      const orderResponse = await fetch('/api/vvip/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vvipOrderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();
      const orderId = orderResult.orderId;

      console.log('VVIP Manual Order Created:', {
        orderId,
        ...vvipOrderData,
        status: 'pending_verification',
        submittedAt: new Date(),
      });

      toast.success('Order submitted successfully! You will receive a confirmation email shortly.');
      onSuccess(orderId);
    } catch (error) {
      console.error('Error submitting VVIP order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit order';
      toast.error(errorMessage);
      onError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* VVIP Status Banner */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-purple-900 text-lg">VVIP Shopper</CardTitle>
              <CardDescription className="text-purple-700">
                You have access to manual payment options
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Manual Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Manual Payment Instructions
          </CardTitle>
          <CardDescription>
            Complete your payment using the details below, then upload proof of payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Bank Transfer Details</Label>
              <div className="mt-1 space-y-1 text-sm text-gray-600">
                <p><strong>Bank:</strong> First Bank of Nigeria</p>
                <p><strong>Account Name:</strong> Stitches Africa Limited</p>
                <p><strong>Account Number:</strong> 2034567890</p>
                <p><strong>Sort Code:</strong> 011-152-632</p>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <Label className="text-sm font-medium text-gray-700">Payment Amount</Label>
              <p className="text-lg font-bold text-gray-900">
                {orderData.currency} {orderData.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="border-t pt-3">
              <Label className="text-sm font-medium text-gray-700">Reference</Label>
              <p className="text-sm text-gray-600 font-mono">
                VVIP-{orderData.userId.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please include this reference in your payment description
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Make payment to the exact amount shown above</li>
                  <li>• Include the reference number in your payment description</li>
                  <li>• Upload clear proof of payment (receipt/screenshot)</li>
                  <li>• Your order will be processed after payment verification</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Payment Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Payment Proof
          </CardTitle>
          <CardDescription>
            Upload a clear image or PDF of your payment receipt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="payment-proof" className="text-sm font-medium">
              Payment Receipt/Screenshot *
            </Label>
            <div className="mt-2">
              <input
                id="payment-proof"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, PDF (max 5MB)
              </p>
            </div>
            {paymentProof && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <FileText className="w-4 h-4" />
                <span>{paymentProof.name}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="payment-notes" className="text-sm font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="payment-notes"
              placeholder="Add any additional information about your payment..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmitOrder}
          disabled={!paymentProof || submitting}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Submitting Order...
            </>
          ) : (
            'Submit Order'
          )}
        </Button>
      </div>
    </div>
  );
}