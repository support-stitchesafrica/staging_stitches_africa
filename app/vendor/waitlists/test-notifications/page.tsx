/**
 * Test Notifications Page
 * Allows vendors to test the notification system
 */

'use client';

import React, { useState } from 'react';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';

export default function TestNotificationsPage() {
  const [email, setEmail] = useState('');
  const [type, setType] = useState('both');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/vendor/waitlists/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, type })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test notification sent successfully!');
        setResult(data);
      } else {
        toast.error(data.error || 'Failed to send test notification');
        setResult(data);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Notification System
          </h1>
          <p className="text-gray-600">
            Send test notifications to verify the email delivery system is working correctly.
          </p>
        </div>

        {/* Test Form */}
        <Card className="border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Send Test Notification
            </CardTitle>
            <CardDescription>
              Enter an email address to receive a test notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <RadioGroup value={type} onValueChange={setType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">
                    Both (Vendor + Subscriber)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vendor" id="vendor" />
                  <Label htmlFor="vendor" className="font-normal cursor-pointer">
                    Vendor Notification Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="subscriber" id="subscriber" />
                  <Label htmlFor="subscriber" className="font-normal cursor-pointer">
                    Subscriber Confirmation Only
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleTest}
              disabled={loading || !email}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={`border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    <span className="text-green-900">Success</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 mr-2 text-red-600" />
                    <span className="text-red-900">Failed</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message || result.error}
                </p>
                {result.type && (
                  <p className="text-sm text-gray-600">
                    Type: {result.type}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-gray-200 bg-blue-50 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-900">About This Test</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              This test sends sample notifications using the production email service (Zoho ZeptoMail).
            </p>
            <p>
              The test uses placeholder data for the collection and subscription details.
            </p>
            <p>
              Check your inbox (and spam folder) for the test email.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
