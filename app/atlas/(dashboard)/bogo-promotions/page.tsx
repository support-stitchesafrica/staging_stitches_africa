"use client";

import { useState, useEffect } from 'react';
import { BogoDashboard } from '@/components/bogo/BogoDashboard';
import { AnalyticsDashboard } from '@/components/bogo/AnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function BogoPromotionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/atlas');
        return;
      }

      // Check if user is authorized (admin or superadmin)
      const storedRole = localStorage.getItem('adminRole');
      const SUPER_ADMIN_EMAIL = "uchinedu@stitchesafrica.com";
      
      if (
        user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
        storedRole === 'admin' ||
        storedRole === 'superadmin'
      ) {
        setIsAuthorized(true);
      } else {
        router.push('/atlas');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">BOGO Promotions</h1>
            <p className="mt-2 text-gray-600">
              Manage Buy One Get One Free promotional campaigns
            </p>
          </div>
          
          <Tabs defaultValue="management" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management">Promotion Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="space-y-6">
              <BogoDashboard />
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}