/**
 * Marketing Dashboard - Invite Page
 * Handles cases where users visit /marketing/invite without a token
 * Requirements: 3.1, 3.2, 5.1, 5.2
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function MarketingInvitePage() {
  const router = useRouter();

  // Redirect to login page since this route should only be accessed with a token
  useEffect(() => {
    // In a real implementation, you might want to show a message
    // about needing an invitation link or provide a way to request one
    const timer = setTimeout(() => {
      router.push('/marketing/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-gray-500" />
          </div>
          <CardTitle>Invitation Required</CardTitle>
          <CardDescription>
            You need a valid invitation link to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            This page requires a valid invitation token. You should have received an email with a link to join the team.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/marketing/auth/login')}
              className="w-full"
            >
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-gray-500">
              Redirecting to login page automatically...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}